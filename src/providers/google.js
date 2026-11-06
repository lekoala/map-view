import { renderLinks } from "../popup.js";

/** @typedef {import("../contract.js").ProviderContext} ProviderContext */
/** @type {{key: string, language: string | undefined, region: string | undefined} | null} */
let loaderConfig = null;
/** @type {Set<(error: Error) => void>} */
const activeAuthHandlers = new Set();

/** @type {(() => void) | undefined} */
let previousAuthHandler;
/** @type {(() => void) | null} */
let authHook = null;

/** @param {(error: Error) => void} handler */
function subscribeAuth(handler) {
  const host = /** @type {typeof globalThis & {gm_authFailure?: () => void}} */ (globalThis);
  if (!authHook) {
    previousAuthHandler = host.gm_authFailure;
    authHook = () => {
      const previous = previousAuthHandler;
      for (const callback of [...activeAuthHandlers])
        callback(new Error("Google Maps authentication failed"));
      previous?.();
    };
    host.gm_authFailure = authHook;
  }
  activeAuthHandlers.add(handler);
  return () => {
    activeAuthHandlers.delete(handler);
    if (activeAuthHandlers.size || !authHook) return;
    // Do not overwrite a hook installed by another application in the meantime.
    if (host.gm_authFailure === authHook) {
      if (previousAuthHandler) host.gm_authFailure = previousAuthHandler;
      else delete host.gm_authFailure;
    }
    authHook = null;
    previousAuthHandler = undefined;
  };
}

/** @param {{key: string, language: string | undefined, region: string | undefined}} requested @param {typeof import("@googlemaps/js-api-loader")} loader */
function configureLoader(requested, loader) {
  if (loaderConfig) {
    if (JSON.stringify(loaderConfig) !== JSON.stringify(requested)) {
      throw new Error("Google loader already configured with a different key/language/region");
    }
    return;
  }
  const existing = /** @type {{google?: {maps?: {importLibrary?: unknown, Map?: unknown}}}} */ (globalThis);
  if (
    existing.google?.maps?.importLibrary ||
    existing.google?.maps?.Map ||
    [...document.scripts].some((script) =>
      /^https:\/\/(maps\.googleapis\.com|maps\.google\.com)\/maps\/api\/js(?:\?|$)/.test(script.src),
    )
  ) {
    throw new Error("Google Maps was configured outside this adapter");
  }
  loader.setOptions({ ...requested, v: "quarterly", authReferrerPolicy: "origin" });
  loaderConfig = requested;
}

/** @param {ProviderContext} context */
export async function mount({ canvas, points, center, options, signal, onError, onSelect }) {
  if (!options.apiKey || !options.mapId) throw new Error("Google requires api-key and map-id");
  const loader = await import("@googlemaps/js-api-loader");
  if (signal.aborted) return () => {};
  configureLoader({ key: options.apiKey, language: options.language, region: options.region }, loader);
  const authFailed = (/** @type {Error} */ error) => onError(error);
  const unsubscribeAuth = subscribeAuth(authFailed);
  const canvasStyle = canvas.getAttribute("style");
  /** @type {google.maps.Map | null} */
  let map = null;
  /** @type {google.maps.marker.AdvancedMarkerElement[]} */
  const markers = [];
  /** @type {google.maps.InfoWindow | null} */
  let popup = null;
  const listeners = new AbortController();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    signal.removeEventListener("abort", abort);
    unsubscribeAuth();
    listeners.abort();
    popup?.close();
    for (const marker of markers) {
      google.maps.event.clearInstanceListeners(marker);
      marker.map = null;
    }
    if (map) google.maps.event.clearInstanceListeners(map);
    canvas.replaceChildren();
    if (canvasStyle === null) canvas.removeAttribute("style");
    else canvas.setAttribute("style", canvasStyle);
  };
  const abort = () => dispose();
  signal.addEventListener("abort", abort, { once: true });
  try {
    const [mapsLibrary, markerLibrary] = await Promise.all([
      loader.importLibrary("maps"),
      loader.importLibrary("marker"),
    ]);
    if (signal.aborted) return dispose;
    map = new mapsLibrary.Map(canvas, {
      mapId: options.mapId,
      center: center
        ? { lat: center.latitude, lng: center.longitude }
        : { lat: points[0].latitude, lng: points[0].longitude },
      zoom: center ? options.zoom : options.maxZoom,
      gestureHandling: "cooperative",
      streetViewControl: false,
      mapTypeControl: false,
    });
    const bounds = new google.maps.LatLngBounds();
    popup = new google.maps.InfoWindow();
    for (const [index, point] of points.entries()) {
      const position = { lat: point.latitude, lng: point.longitude };
      bounds.extend(position);
      const marker = new markerLibrary.AdvancedMarkerElement({
        map,
        position,
        title: point.label,
        gmpClickable: true,
      });
      marker.addEventListener(
        "gmp-click",
        () => {
          if (disposed || signal.aborted) return;
          const content = renderLinks(point);
          if (content && map && popup) {
            popup.setContent(content);
            popup.open({ map, anchor: marker, shouldFocus: true });
          }
          onSelect?.(index);
        },
        { signal: listeners.signal },
      );
      markers.push(marker);
    }
    if (!center && points.length > 1) map.fitBounds(bounds, 32);
    // Import resolution is not first paint. Wait for the initial idle event.
    const idle = () =>
      new Promise((resolve) => {
        if (!map || signal.aborted) return resolve(undefined);
        const done = () => {
          listener.remove();
          signal.removeEventListener("abort", done);
          resolve(undefined);
        };
        const listener = google.maps.event.addListenerOnce(map, "idle", done);
        signal.addEventListener("abort", done, { once: true });
      });
    await idle();
    if (!signal.aborted && !center && points.length > 1 && (map.getZoom() ?? 0) > options.maxZoom) {
      map.setZoom(options.maxZoom);
      await idle();
    }
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
