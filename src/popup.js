/** @param {import("./contract.js").MapPoint} point @returns {HTMLElement | null} */
export function renderLinks(point) {
  if (!point.links.length) return null;
  const list = document.createElement("ul");
  for (const link of point.links) {
    const item = document.createElement("li");
    const anchor = document.createElement("a");
    anchor.href = link.href;
    anchor.textContent = link.label;
    item.append(anchor);
    list.append(item);
  }
  return list;
}
