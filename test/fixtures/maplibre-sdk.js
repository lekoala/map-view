// Test-only access to SDK state, never part of the component's public API.
import { Map as LibreMap } from "/node_modules/maplibre-gl/dist/maplibre-gl.mjs";

export * from "/node_modules/maplibre-gl/dist/maplibre-gl.mjs";

class ObservedMap extends LibreMap {
  constructor(options) {
    super(options);
    window.__map = this;
  }
}

export { ObservedMap as Map };
