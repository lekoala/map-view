import { expect, test } from "@playwright/test";
import { requireWebGL2 } from "./webgl.js";

test("selection carries normalized snapshot data and ignores loading, invalid and stale callbacks", async ({
  page,
}) => {
  await page.goto("/test/fixtures/map.html");
  await page.waitForFunction(() => window.__ready);
  await page.evaluate(async () => {
    const { MapViewElement } = await import("/src/index.js");
    window.__selections = [];
    MapViewElement.registerProvider("selectable", async () => ({
      mount: async ({ onSelect }) => {
        window.__select = onSelect;
        onSelect?.(0); // Not ready yet.
        return () => {};
      },
    }));
    document.body.addEventListener("map-view:select", (event) => {
      window.__selections.push({
        ...structuredClone(event.detail),
        bubbles: event.bubbles,
        composed: event.composed,
        cancelable: event.cancelable,
      });
      // Consumer edits must not modify the activation snapshot or future events.
      event.detail.point.links[0].label = "Changed by application";
      if (event.detail.point.data) event.detail.point.data.nested.title = "Changed by application";
    });
    const el = document.querySelector("#click");
    el.setAttribute("provider", "selectable");
    el.querySelector("[data-map-points]").textContent = JSON.stringify([
      {
        latitude: 1,
        longitude: 2,
        data: { id: 42, nested: { title: "Original" } },
        links: [{ label: "Office", href: "/office" }],
      },
    ]);
    el.show();
  });
  await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
  expect(await page.evaluate(() => window.__selections)).toEqual([]);
  await page.evaluate(() => {
    for (const index of [-1, 1, 0.5, NaN]) window.__select(index);
    document.querySelector("#click [data-map-points]").textContent = "[]";
    window.__select(0);
    window.__select(0);
    window.__staleSelect = window.__select;
  });
  const selection = {
    index: 0,
    point: {
      latitude: 1,
      longitude: 2,
      label: "Office",
      data: { id: 42, nested: { title: "Original" } },
      links: [{ label: "Office", href: "http://127.0.0.1:4867/office" }],
    },
    bubbles: true,
    composed: true,
    cancelable: false,
  };
  expect(await page.evaluate(() => window.__selections)).toEqual([selection, selection]);
  await page.evaluate(() => {
    const el = document.querySelector("#click");
    el.remove();
    window.__staleSelect(0);
    el.querySelector("[data-map-points]").textContent =
      '[{"latitude":1,"longitude":2,"label":"New","links":[{"label":"New","href":"/new"}]}]';
    document.body.append(el);
    el.show();
  });
  await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
  await page.evaluate(() => window.__staleSelect(0));
  expect(await page.evaluate(() => window.__selections.length)).toBe(2);
});

test("real MapLibre markers emit exactly one selection for click, Enter and Space", async ({ page }) => {
  await requireWebGL2(page);
  await page.route("**/local-style.json", (route) =>
    route.fulfill({
      path: "demo/local-maplibre-style.json",
      contentType: "application/json",
    }),
  );
  await page.goto("/test/fixtures/maplibre.html");
  await page.waitForFunction(() => customElements.get("map-view"));
  await page.evaluate(() => {
    window.__selections = [];
    document.querySelector("[data-map-points]").textContent = JSON.stringify([
      { latitude: 0, longitude: -10, label: "Office", links: [{ label: "Details", href: "/office" }] },
      { latitude: 0, longitude: 10, label: "Park", links: [] },
    ]);
    document.body.addEventListener("map-view:select", (event) =>
      window.__selections.push(event.detail.index),
    );
  });
  await page.getByRole("button", { name: "Open map" }).click();
  await expect(page.locator("map-view")).toHaveAttribute("data-state", "ready", { timeout: 15_000 });
  const office = page.getByRole("button", { name: "Office", exact: true });
  await office.click();
  await expect(page.getByRole("link", { name: "Details" })).toBeVisible();
  expect(await page.evaluate(() => window.__selections)).toEqual([0]);
  await office.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: "Details" })).toHaveCount(0);
  await page.keyboard.press("Space");
  await expect(page.getByRole("link", { name: "Details" })).toBeVisible();
  const park = page.getByRole("button", { name: "Park", exact: true });
  await park.click();
  await park.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  expect(await page.evaluate(() => window.__selections)).toEqual([0, 0, 0, 1, 1, 1]);
  await page.evaluate(() => {
    window.__marker = document.querySelectorAll(".maplibregl-marker")[1];
    document.querySelector("map-view").remove();
    window.__marker.click();
  });
  expect(await page.evaluate(() => window.__selections.length)).toBe(6);
});
