import { expect, test } from "@playwright/test";
import { requireWebGL2 } from "./webgl.js";

test("real MapLibre stays lazy, tolerates missing tiles, supports keyboard and cleans up", async ({
  page,
}) => {
  await requireWebGL2(page);
  const requests = [];
  const external = [];
  const workers = [];
  page.on("worker", (worker) => workers.push(worker.url()));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== "http://127.0.0.1:4867") {
      external.push(url.href);
      return route.abort();
    }
    requests.push(url.pathname);
    if (url.pathname.includes("/tiles/")) return route.fulfill({ status: 500, body: "Tile unavailable" });
    return route.continue();
  });
  await page.goto("/test/fixtures/maplibre.html");
  await page.waitForFunction(() => customElements.get("map-view"));
  await expect(page.locator("map-view")).toHaveAttribute("data-state", "idle");
  // Shell CSS may load eagerly. Executable SDK/provider code, style and tiles may not.
  expect(
    requests.filter(
      (path) =>
        path.endsWith(".mjs") ||
        path.endsWith("maplibre-sdk.js") ||
        path.includes("/providers/") ||
        path.endsWith("local-style.json") ||
        path.includes("/tiles/"),
    ),
  ).toEqual([]);
  await page.getByRole("button", { name: "Open map" }).click();
  await expect(page.locator("map-view")).toHaveAttribute("data-state", "ready", { timeout: 15_000 });
  expect(requests).toContain("/src/providers/maplibre.js");
  expect(requests).toContain("/node_modules/maplibre-gl/dist/maplibre-gl.mjs");
  expect(requests.some((path) => path.includes("/tiles/"))).toBe(true);
  expect(await page.evaluate(() => window.__map.getZoom())).toBeLessThanOrEqual(8);
  expect(workers.some((url) => url.endsWith("/maplibre-gl-worker.mjs"))).toBe(true);
  await expect(page.locator(".maplibregl-ctrl-attrib")).toBeVisible();
  await expect(page.locator(".maplibregl-ctrl-attrib")).toContainText("Local test attribution");
  await expect(page.locator(".maplibregl-marker").first()).toHaveCSS("position", "absolute");
  const marker = page.getByRole("button", { name: "Office", exact: true });
  await marker.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: "Details" })).toBeVisible();
  await page.getByRole("link", { name: "Details" }).focus();
  await expect(page.getByRole("link", { name: "Details" })).toBeFocused();
  const label = page.getByRole("button", { name: "Park", exact: true });
  await label.focus();
  await expect(label).toBeFocused();
  expect(external).toEqual([]);
  await page.evaluate(() => {
    const el = document.querySelector("map-view");
    el.remove();
    window.__removed = el;
  });
  expect(
    await page.evaluate(
      () =>
        window.__removed.querySelectorAll(".maplibregl-canvas, .maplibregl-marker, .maplibregl-popup").length,
    ),
  ).toBe(0);
});

for (const empty of [false, true]) {
  test(`explicit center keeps its zoom without fitting (${empty ? "zero" : "multiple"} points)`, async ({
    page,
  }) => {
    await requireWebGL2(page);
    await page.route("**/local-style.json", (route) =>
      route.fulfill({
        json: {
          version: 8,
          sources: {},
          layers: [{ id: "background", type: "background", paint: { "background-color": "#edf1e8" } }],
        },
      }),
    );
    await page.goto("/test/fixtures/maplibre.html");
    await page.waitForFunction(() => customElements.get("map-view"));
    await page.evaluate((noPoints) => {
      const el = document.querySelector("map-view");
      const script = document.createElement("script");
      script.type = "application/json";
      script.dataset.mapCenter = "";
      script.textContent = '{"latitude":20,"longitude":10}';
      el.append(script);
      el.setAttribute("zoom", "5");
      if (noPoints) el.querySelector("[data-map-points]").textContent = "[]";
      el.show();
    }, empty);
    await expect(page.locator("map-view")).toHaveAttribute("data-state", "ready");
    expect(
      await page.evaluate(() => [
        window.__map.getCenter().lng,
        window.__map.getCenter().lat,
        window.__map.getZoom(),
      ]),
    ).toEqual([10, 20, 5]);
  });
}

test("initial style failure is fatal", async ({ page }) => {
  await page.route("**/local-style.json", (route) => route.fulfill({ status: 404, body: "Missing style" }));
  await page.goto("/test/fixtures/maplibre.html");
  await page.getByRole("button", { name: "Open map" }).click();
  await expect(page.locator("map-view")).toHaveAttribute("data-state", "error");
});
