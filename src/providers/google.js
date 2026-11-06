import { renderLinks } from "../popup.js";

/** @typedef {import("../contract.js").ProviderContext} ProviderContext */
/** @type {{key: string, language: string | undefined, region: string | undefined} | null} */
let loaderConfig = null;
/** @type {Set<(error: Error) => void>} */
const activeAuthHandlers = new Set();

/** @param {{key: string, language: string | undefined, region: string | undefined}} requested @param {typeof import("@googlemaps/js-api-loader")} loader */
function configureLoader(requested, loader) {
  if (loaderConfig) {
    if (JSON.stringify(loaderConfig) !== JSON.stringify(requested)) {
      throw new Error("Google loader already configured with a different key/language/region");
    }
    return;
  }
  loader.setOptions({ ...requested, v: "quarterly", authReferrerPolicy: "origin" });
  const host = /** @type {typeof globalThis & {gm_authFailure?: () => void}} */ (globalThis);
  const previous = host.gm_authFailure;
  host.gm_authFailure = () => {
    for (const handler of activeAuthHandlers) handler(new Error("Google Maps authentication failed"));
    if (typeof previous === "function") previous();
  };
  loaderConfig = requested;
}

/** @param {ProviderContext} context */
export async function mount({ canvas, points, center, options, signal, onError }) {
  if (!options.apiKey || !options.mapId) throw new Error("Google requires api-key and map-id");
  const loader = await import("@googlemaps/js-api-loader");
  if (signal.aborted) return () => {};
  configureLoader({ key: options.apiKey, language: options.language, region: options.region }, loader);
  const authFailed = (/** @type {Error} */ error) => onError(error);
  activeAuthHandlers.add(authFailed);
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
    activeAuthHandlers.delete(authFailed);
    listeners.abort();
    popup?.close();
    for (const marker of markers) {
      google.maps.event.clearInstanceListeners(marker);
      marker.map = null;
    }
    if (map) google.maps.event.clearInstanceListeners(map);
    canvas.replaceChildren();
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
    for (const point of points) {
      const position = { lat: point.latitude, lng: point.longitude };
      bounds.extend(position);
      const marker = new markerLibrary.AdvancedMarkerElement({
        map,
        position,
        title: point.label,
        gmpClickable: Boolean(point.links.length),
      });
      if (point.links.length) {
        marker.addEventListener(
          "gmp-click",
          () => {
            const content = renderLinks(point);
            if (!content || !map || !popup) return;
            popup.setContent(content);
            popup.open({ map, anchor: marker, shouldFocus: true });
          },
          { signal: listeners.signal },
        );
      }
      markers.push(marker);
    }
    if (!center && points.length > 1) map.fitBounds(bounds, 32);
    // Import resolution is not first paint. Wait for the initial idle event.
    const idle = () =>
      new Promise((resolve) => {
        if (!map || signal.aborted) return resolve(undefined);
        google.maps.event.addListenerOnce(map, "idle", () => resolve(undefined));
        signal.addEventListener("abort", () => resolve(undefined), { once: true });
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
