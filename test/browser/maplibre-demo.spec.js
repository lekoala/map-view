import { expect, test } from "@playwright/test";
import { requireWebGL2 } from "./webgl.js";

for (const style of [
  "https://tiles.openfreemap.org/styles/liberty",
  "https://data.lfmaps.fr/styles/bright",
]) {
  test(`online background is an explicit lazy choice: ${style}`, async ({ page }) => {
    await requireWebGL2(page);
    const requested = [];
    await page.route(/^https:\/\//, (route) => {
      requested.push(route.request().url());
      if (route.request().url() !== style) return route.abort();
      return route.fulfill({
        json: {
          version: 8,
          sources: {},
          layers: [{ id: "background", type: "background", paint: { "background-color": "#edf1e8" } }],
        },
      });
    });
    await page.goto("/demo/maplibre.html");
    await page.waitForFunction(() => customElements.get("map-view"));
    await page.getByLabel("Background", { exact: true }).selectOption(style);
    expect(requested).toEqual([]);
    await page.getByRole("button", { name: "Load map", exact: true }).click();
    await expect(page.locator("map-view")).toHaveAttribute("data-state", "ready");
    await expect(page.locator("map-view")).toHaveAttribute("map-style", style);
    expect(requested).toEqual([style]);
  });
}

test("MapLibre demo stays local and lazy and uses selected metadata in an application dialog", async ({
  page,
}) => {
  await requireWebGL2(page);
  const requests = [];
  const external = [];
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    requests.push(url.pathname);
    if (url.origin !== "http://127.0.0.1:4867") {
      external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto("/demo/maplibre.html");
  await page.waitForFunction(() => customElements.get("map-view"));
  expect(
    requests.filter(
      (path) =>
        path.includes("/providers/") || path.endsWith(".mjs") || path.endsWith("local-maplibre-style.json"),
    ),
  ).toEqual([]);
  await page.getByRole("button", { name: "Load map", exact: true }).click();
  await expect(page.locator("map-view")).toHaveAttribute("data-state", "ready");
  await page.getByRole("button", { name: "Park", exact: true }).click();
  await expect(page.locator("#selection")).toContainText('"id": 43');
  await expect(page.locator(".maplibregl-popup")).toHaveCount(0);
  await page.getByRole("button", { name: "Open selected details" }).click();
  await expect(page.getByRole("dialog", { name: "Park" })).toBeVisible();
  await expect(page.locator("#details-description")).toHaveText("Open daily.");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Office", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#selection")).toContainText('"id": 42');
  await expect(page.getByRole("link", { name: "Office details" })).toBeVisible();
  expect(external).toEqual([]);
});
