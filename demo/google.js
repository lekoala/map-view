import "/src/define.js";

const map = document.querySelector("#google");
const form = document.querySelector("#credentials");
const result = document.querySelector("#result");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const key = document.querySelector("#api-key").value.trim();
  const mapId = document.querySelector("#map-id").value.trim() || "DEMO_MAP_ID";
  if (!key) return;
  map.setAttribute("api-key", key);
  map.setAttribute("map-id", mapId);
  form.querySelector("fieldset").disabled = true;
  result.textContent = "Loading…";
  map.show();
});

map.addEventListener("map-view:ready", () => {
  result.textContent = "Map ready.";
  map.querySelector("[data-map-canvas]").focus();
});
map.addEventListener("map-view:error", (event) => {
  result.textContent = "Map failed to load.";
  document.querySelector("#error-message").textContent = event.detail.error.message;
  map.querySelector("[data-map-retry]").focus();
});
