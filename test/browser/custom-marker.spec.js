import { expect, test } from "@playwright/test";

test("custom MapLibre markers keep popup, keyboard selection and theme variables", async ({ page }) => {
  await page.goto("/demo/maplibre.html");
  await page.waitForFunction(() => customElements.get("map-view"));
  await page.evaluate(() => {
    const map = document.querySelector("map-view");
    window.__renderCalls = [];
    window.__selected = [];
    map.addEventListener("map-view:select", (event) => window.__selected.push(event.detail));
    map.renderMarker = (point, index) => {
      window.__renderCalls.push([point.label, index]);
      const el = document.createElement("span");
      el.className = "custom-marker";
      el.textContent = String(index + 1);
      el.style.cssText = "display:block;width:32px;height:32px;background:purple;color:white";
      point.data.id = -1; // Renderer inputs must be independent copies.
      return el;
    };
    map.style.setProperty("--map-view-popup-background", "rgb(20, 30, 40)");
    map.style.setProperty("--map-view-popup-color", "rgb(240, 240, 240)");
    map.style.setProperty("--map-view-popup-radius", "20px");
    map.style.setProperty("--map-view-popup-link-background", "rgb(30, 60, 90)");
    map.style.setProperty("--map-view-focus-color", "rgb(255, 160, 0)");
  });
  expect(await page.evaluate(() => window.__renderCalls)).toEqual([]);
  await page.getByRole("button", { name: "Load map", exact: true }).click();
  await expect(page.locator("map-view")).toHaveAttribute("data-state", "ready");
  await expect(page.locator(".custom-marker")).toHaveCount(2);
  expect(await page.evaluate(() => window.__renderCalls)).toEqual([
    ["Office", 0],
    ["Park", 1],
  ]);
  const office = page.getByRole("button", { name: "Office", exact: true });
  await office.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: "Office details" })).toBeVisible();
  await expect(page.locator(".maplibregl-popup-content")).toHaveCSS("background-color", "rgb(20, 30, 40)");
  await expect(page.locator(".maplibregl-popup-content")).toHaveCSS("border-radius", "20px");
  const link = page.getByRole("link", { name: "Office details" });
  await expect(link).toHaveCSS("background-color", "rgb(30, 60, 90)");
  await link.focus();
  await expect(link).toHaveCSS("outline-color", "rgb(255, 160, 0)");
  expect(await page.evaluate(() => window.__selected[0].point.data.id)).toBe(42);
  await page.evaluate(() =>
    document.querySelector("map-view").style.setProperty("--map-view-popup-background", "rgb(50, 60, 70)"),
  );
  await expect(page.locator(".maplibregl-popup-content")).toHaveCSS("background-color", "rgb(50, 60, 70)");
  expect(await page.evaluate(() => window.__renderCalls.length)).toBe(2);
  await page.evaluate(() => document.querySelector("map-view").remove());
  await expect(page.locator(".custom-marker")).toHaveCount(0);
});

test("demo offers numbered markers and a live theme without remounting", async ({ page }) => {
  await page.goto("/demo/maplibre.html");
  await page.waitForFunction(() => customElements.get("map-view"));
  await page.getByLabel("Markers", { exact: true }).selectOption("numbered");
  await page.getByRole("button", { name: "Load map", exact: true }).click();
  await expect(page.locator("map-view")).toHaveAttribute("data-state", "ready");
  await expect(page.locator(".demo-numbered-marker")).toHaveText(["1", "2"]);
  const office = page.getByRole("button", { name: "Office", exact: true });
  await office.focus();
  await page.keyboard.press("Enter");
  await page.locator("#theme").selectOption("dark");
  await expect(page.locator(".maplibregl-popup-content")).toHaveCSS("background-color", "rgb(32, 41, 56)");
  await expect(page.locator("map-view")).toHaveAttribute("data-state", "ready");
  await expect(page.locator("#selection")).toContainText('"id": 42');
});

for (const invalid of ["string", "connected", "reused", "throws"]) {
  test(`invalid custom marker ${invalid} fails with SDK teardown`, async ({ page }) => {
    await page.goto("/demo/maplibre.html");
    await page.waitForFunction(() => customElements.get("map-view"));
    await page.evaluate((mode) => {
      const reused = document.createElement("div");
      document.querySelector("map-view").renderMarker = () => {
        if (mode === "throws") throw new Error("Renderer failed");
        if (mode === "string") return "<div>marker</div>";
        if (mode === "connected") return document.body;
        return reused;
      };
    }, invalid);
    await page.getByRole("button", { name: "Load map", exact: true }).click();
    await expect(page.locator("map-view")).toHaveAttribute("data-state", "error");
    await expect(page.locator(".maplibregl-canvas, .maplibregl-marker")).toHaveCount(0);
  });
}

test("renderer is snapshotted before import and stale renderers cannot execute", async ({ page }) => {
  await page.goto("/test/fixtures/map.html");
  await page.waitForFunction(() => window.__ready);
  await page.evaluate(async () => {
    const { MapViewElement } = await import("/src/index.js");
    window.__rendererCalls = [];
    MapViewElement.registerProvider(
      "custom",
      () =>
        new Promise((resolve) => {
          window.__release = () =>
            resolve({
              mount: async ({ renderMarker, points }) => {
                window.__render = renderMarker;
                window.__point = points[0];
                renderMarker(points[0], 0);
                return () => {};
              },
            });
        }),
    );
    const el = document.querySelector("#click");
    el.setAttribute("provider", "custom");
    el.renderMarker = () => {
      window.__rendererCalls.push("initial");
      return document.createElement("div");
    };
    el.show();
    el.renderMarker = () => {
      window.__rendererCalls.push("new");
      return document.createElement("div");
    };
    window.__release();
  });
  await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
  expect(await page.evaluate(() => window.__rendererCalls)).toEqual(["initial"]);
  const cancelled = await page.evaluate(() => {
    document.querySelector("#click").remove();
    try {
      window.__render(window.__point, 0);
    } catch (error) {
      return error.name;
    }
  });
  expect(cancelled).toBe("AbortError");
  expect(await page.evaluate(() => window.__rendererCalls)).toEqual(["initial"]);
});
