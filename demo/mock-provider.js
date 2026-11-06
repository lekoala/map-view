/** A demo-only adapter: never shipped in the npm package. */
export async function mount({ canvas, points, signal, onSelect, renderMarker }) {
  if (signal.aborted) return () => {};
  canvas.style.backgroundImage =
    "linear-gradient(45deg,transparent 49%,#b5c9b0 50%,transparent 51%),linear-gradient(145deg,transparent 49%,#b5c9b0 50%,transparent 51%)";
  canvas.style.backgroundSize = "110px 92px,180px 155px";
  const pinEls = [];
  const listeners = new AbortController();
  points.forEach((point, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "demo-pin";
    const visual = renderMarker?.(point, i);
    if (visual) button.append(visual);
    else button.textContent = point.label;
    button.setAttribute("aria-label", point.label);
    button.style.left = `${30 + (i % 4) * 25}%`;
    button.style.top = `${35 + (i % 2) * 30}%`;
    const popup = document.createElement("div");
    popup.className = "demo-links";
    popup.hidden = true;
    if (point.links.length) {
      for (const link of point.links) {
        const a = document.createElement("a");
        a.textContent = link.label;
        a.href = link.href;
        popup.append(a);
      }
    }
    button.addEventListener(
      "click",
      () => {
        if (signal.aborted) return;
        if (point.links.length) popup.hidden = !popup.hidden;
        onSelect?.(i);
      },
      { signal: listeners.signal },
    );
    canvas.append(button, popup);
    pinEls.push(button, popup);
  });
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    listeners.abort();
    for (const e of pinEls) e.remove();
    canvas.style.backgroundImage = "";
  };
}
