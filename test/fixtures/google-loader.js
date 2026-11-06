// Deterministic API double. This does not validate Google's remote renderer.
window.__maps = [];
window.__configurations = [];
const events = new Map();
export function setOptions(options) {
  window.__configurations.push(options);
  window.google = {
    maps: {
      event: {
        addListenerOnce(map, type, callback) {
          const listener = {
            map,
            type,
            callback,
            remove() {
              events.delete(listener);
            },
          };
          events.set(listener, listener);
          return listener;
        },
        clearInstanceListeners(map) {
          for (const listener of events.values()) if (listener.map === map) listener.remove();
        },
      },
      LatLngBounds: class {
        extend() {}
      },
      InfoWindow: class {
        close() {}
      },
    },
  };
  window.__idle = () => {
    for (const listener of [...events.values()]) {
      listener.remove();
      listener.callback();
    }
  };
}
export async function importLibrary(name) {
  if (name === "maps")
    return {
      Map: class {
        constructor(canvas) {
          canvas.style.position = "relative";
          window.__maps.push(this);
        }
      },
    };
  return { AdvancedMarkerElement: class {} };
}
