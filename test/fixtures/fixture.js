import { MapViewElement } from "/src/index.js";

window.__calls = [];
window.__gate = false;
window.__pending = [];
window.__fail = false;
MapViewElement.registerProvider("fake", async () => ({
  async mount({ canvas, points, signal }) {
    window.__calls.push(["mount", canvas.closest("map-view").id, points.length]);
    if (window.__gate) await new Promise((resolve) => window.__pending.push(resolve));
    if (window.__fail) throw new Error("Fake provider failed");
    canvas.textContent = "FAKE MAP";
    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      window.__calls.push(["dispose", canvas.closest("map-view")?.id, signal.aborted]);
      canvas.replaceChildren();
    };
  },
}));
await import("/src/define.js");
window.__ready = true;
