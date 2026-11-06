import { renderLinks } from "../popup.js";

/** @typedef {import("../contract.js").ProviderContext} ProviderContext */
/** @type {string | null} */
let assignedWorkerUrl = null;

/** @param {ProviderContext} context */
export async function mount({ canvas, points, center, options, signal, onSelect, renderMarker }) {
  if (!options.mapStyle) throw new Error("map-style is required for MapLibre");
  const {
    Map: LibreMap,
    Marker,
    Popup,
    LngLatBounds,
    NavigationControl,
    setWorkerUrl,
  } = await import("maplibre-gl");
  if (signal.aborted) return () => {};
  // setWorkerUrl is global, not a per-map setting.
  if (options.workerUrl) {
    if (assignedWorkerUrl && assignedWorkerUrl !== options.workerUrl) {
      throw new Error("MapLibre worker-url cannot change within one page");
    }
    if (!assignedWorkerUrl) {
      setWorkerUrl(options.workerUrl);
      assignedWorkerUrl = options.workerUrl;
    }
  }
  const start = center ?? points[0];
  const map = new LibreMap({
    container: canvas,
    style: options.mapStyle,
    center: [start.longitude, start.latitude],
    zoom: center ? options.zoom : options.maxZoom,
    cooperativeGestures: true,
    attributionControl: { compact: false },
  });
  /** @type {import("maplibre-gl").Marker[]} */
  const markers = [];
  const listeners = new AbortController();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    signal.removeEventListener("abort", abort);
    listeners.abort();
    for (const marker of markers) marker.remove();
    map.remove();
  };
  const abort = () => dispose();
  signal.addEventListener("abort", abort, { once: true });
  try {
    map.addControl(new NavigationControl({ showCompass: false }));
    const bounds = new LngLatBounds();
    for (const [index, point] of points.entries()) {
      const position = /** @type {[number, number]} */ ([point.longitude, point.latitude]);
      bounds.extend(position);
      const visual = renderMarker?.(point, index);
      const container = visual ? document.createElement("div") : undefined;
      if (container && visual) container.append(visual);
      const marker = new Marker(container ? { element: container, anchor: "bottom" } : {})
        .setLngLat(position)
        .addTo(map);
      const element = marker.getElement();
      element.setAttribute("aria-label", point.label);
      const content = renderLinks(point);
      if (content)
        marker.setPopup(
          new Popup({
            className: "map-view-popup-shell",
            maxWidth: "var(--map-view-popup-max-width, 280px)",
          }).setDOMContent(content),
        );
      element.setAttribute("role", "button");
      element.tabIndex = 0;
      element.addEventListener(
        "click",
        () => {
          if (!disposed && !signal.aborted) onSelect?.(index);
        },
        { signal: listeners.signal },
      );
      element.addEventListener(
        "keydown",
        (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          // Own keyboard activation: preventing keypress avoids the SDK toggling twice.
          event.preventDefault();
          if (event.repeat || disposed || signal.aborted) return;
          if (content) marker.togglePopup();
          onSelect?.(index);
        },
        { signal: listeners.signal },
      );
      markers.push(marker);
    }
    if (!center && points.length > 1) {
      map.fitBounds(bounds, { padding: 32, maxZoom: options.maxZoom, duration: 0 });
    }
    // Fail initial loading; recoverable tile errors after load do not destroy the map.
    await new Promise((resolve, reject) => {
      const loaded = () => {
        cleanup();
        resolve(undefined);
      };
      const failed = (/** @type {import("maplibre-gl").ErrorEvent} */ event) => {
        // Tile errors carry a tile on the SDK event; the style may still render.
        if ("tile" in event) return;
        cleanup();
        reject(event.error ?? new Error("MapLibre failed to load"));
      };
      const cancelled = () => {
        cleanup();
        resolve(undefined);
      };
      const cleanup = () => {
        map.off("load", loaded);
        map.off("error", failed);
        signal.removeEventListener("abort", cancelled);
      };
      map.on("load", loaded);
      map.on("error", failed);
      signal.addEventListener("abort", cancelled, { once: true });
    });
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
