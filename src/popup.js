/** @param {import("./contract.js").MapPoint} point @returns {HTMLElement | null} */
export function renderLinks(point) {
  if (!point.links.length) return null;
  const content = document.createElement("div");
  content.className = "map-view-popup";
  const title = document.createElement("p");
  title.className = "map-view-popup-title";
  title.textContent = point.label;
  const list = document.createElement("ul");
  list.className = "map-view-popup-links";
  for (const link of point.links) {
    const item = document.createElement("li");
    const anchor = document.createElement("a");
    anchor.href = link.href;
    anchor.textContent = link.label;
    item.append(anchor);
    list.append(item);
  }
  content.append(title, list);
  return content;
}
