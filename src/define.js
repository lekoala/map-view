import { MapViewElement } from "./map-view.js";

export { MapViewElement } from "./map-view.js";

/** Define the custom element once; does not load any map SDK. */
export function defineMapView() {
  if (!customElements.get("map-view")) customElements.define("map-view", MapViewElement);
}
defineMapView();
