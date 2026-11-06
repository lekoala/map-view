import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/test/fixtures/map.html");
  await page.waitForFunction(() => window.__ready === true);
});
test("click does not import/mount the provider before activation", async ({ page }) => {
  await expect(page.locator("#click")).toHaveAttribute("data-state", "idle");
  expect(await page.evaluate(() => window.__calls.filter((c) => c[1] === "click").length)).toBe(0);
  await page.locator("#click [data-map-open]").click();
  await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
  expect(
    await page.evaluate(() => window.__calls.filter((c) => c[1] === "click" && c[0] === "mount").length),
  ).toBe(1);
});
test("visible activates after entering the viewport", async ({ page }) => {
  await expect(page.locator("#visible")).toHaveAttribute("data-state", "idle");
  await page.locator("#visible").scrollIntoViewIfNeeded();
  await expect(page.locator("#visible")).toHaveAttribute("data-state", "ready");
});
test("eager activates without a click", async ({ page }) => {
  await expect(page.locator("#eager")).toHaveAttribute("data-state", "ready");
});
test("failed activation can retry", async ({ page }) => {
  await page.evaluate(() => (window.__fail = true));
  await page.locator("#click [data-map-open]").click();
  await expect(page.locator("#click")).toHaveAttribute("data-state", "error");
  await page.evaluate(() => (window.__fail = false));
  await page.locator("#click [data-map-retry]").click();
  await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
});
test("disconnect/reconnect disposes, late completion cannot become ready", async ({ page }) => {
  await page.evaluate(() => (window.__gate = true));
  await page.locator("#click [data-map-open]").click();
  await expect(page.locator("#click")).toHaveAttribute("data-state", "loading");
  await page.evaluate(() => {
    const el = document.querySelector("#click");
    el.remove();
    window.__removed = el;
  });
  await page.evaluate(() => {
    window.__gate = false;
    window.__pending.splice(0).forEach((resolve) => {
      resolve();
    });
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.__calls.filter((c) => c[0] === "dispose" && c[1] === "click").length),
    )
    .toBe(1);
  await page.evaluate(() => document.body.append(window.__removed));
  await expect(page.locator("#click")).toHaveAttribute("data-state", "idle");
  await page.locator("#click [data-map-open]").click();
  await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
});
test("timeout aborts a pending mount, then disposes its late success", async ({ page }) => {
  await page.evaluate(() => {
    window.__gate = true;
    document.getElementById("click").setAttribute("timeout", "50");
  });
  await page.locator("#click [data-map-open]").click();
  await expect(page.locator("#click")).toHaveAttribute("data-state", "error");
  await page.evaluate(() => {
    window.__gate = false;
    window.__pending.splice(0).forEach((resolve) => {
      resolve();
    });
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.__calls.filter((c) => c[0] === "dispose" && c[1] === "click").length),
    )
    .toBe(1);
  await page.locator("#click [data-map-retry]").click();
  await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
});
test("invalid JSON data never reaches the renderer", async ({ page }) => {
  await page.evaluate(() => {
    document.querySelector("#click [data-map-points]").textContent =
      '[{"latitude":95,"longitude":4,"label":"Invalid"}]';
  });
  await page.locator("#click [data-map-open]").click();
  await expect(page.locator("#click")).toHaveAttribute("data-state", "error");
  expect(
    await page.evaluate(() => window.__calls.filter((c) => c[0] === "mount" && c[1] === "click").length),
  ).toBe(0);
});
