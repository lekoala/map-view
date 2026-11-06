const output = document.querySelector("#selection");
for (const map of document.querySelectorAll("map-view")) {
  map.addEventListener("map-view:select", (event) => {
    output.textContent = JSON.stringify(event.detail, null, 2);
  });
}
