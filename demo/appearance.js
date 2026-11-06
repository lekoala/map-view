/** Demo-owned appearance: marker DOM and host CSS variables stay independent of SDKs. */
export function setupAppearance(map) {
  document.querySelector("#marker-appearance").addEventListener("change", (event) => {
    map.renderMarker =
      event.target.value === "numbered"
        ? (_point, index) => {
            const marker = document.createElement("span");
            marker.className = "demo-numbered-marker";
            marker.textContent = String(index + 1);
            return marker;
          }
        : null;
  });
  document.querySelector("#theme").addEventListener("change", (event) => {
    map.dataset.theme = event.target.value;
  });
}
