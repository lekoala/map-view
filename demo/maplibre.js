import "/src/define.js";
import { setupAppearance } from "./appearance.js";

const map = document.querySelector("#maplibre");
setupAppearance(map);
const form = document.querySelector("#style-form");
const result = document.querySelector("#result");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const style =
    document.querySelector("#style-url").value.trim() || document.querySelector("#style-preset").value;
  map.setAttribute("map-style", style);
  form.querySelector("fieldset").disabled = true;
  result.textContent = "Loading…";
  map.show();
});
map.addEventListener("map-view:ready", () => {
  result.textContent = "Map ready. Select a marker to see its data below.";
  map.querySelector("[data-map-canvas]").focus();
});
map.addEventListener("map-view:error", (event) => {
  result.textContent = "Map failed to load.";
  document.querySelector("#error-message").textContent = event.detail.error.message;
  map.querySelector("[data-map-retry]").focus();
});
const openDetails = document.querySelector("#open-details");
map.addEventListener("map-view:select", (event) => {
  const { point } = event.detail;
  document.querySelector("#details-title").textContent = point.label;
  document.querySelector("#details-description").textContent = point.data?.description ?? "";
  openDetails.disabled = false;
});
openDetails.addEventListener("click", () => document.querySelector("#details").showModal());
