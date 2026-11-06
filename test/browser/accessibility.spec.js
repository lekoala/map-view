import { expect, test } from "@playwright/test";

test("demo keyboard flow preserves map, popup and dialog focus", async ({ page }) => {
  await page.goto("/demo/maplibre.html");
  const load = page.getByRole("button", { name: "Load map", exact: true });
  await load.focus();
  await page.keyboard.press("Enter");
  const region = page.getByRole("region", { name: "Example locations" });
  await expect(region).toBeFocused();
  await page.getByRole("button", { name: "Office", exact: true }).focus();
  await page.keyboard.press("Enter");
  const link = page.getByRole("link", { name: "Office details" });
  await expect(link).toBeVisible();
  await link.focus();
  await expect(link).toBeFocused();
  const details = page.getByRole("button", { name: "Open selected details" });
  await details.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Office" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(details).toBeFocused();
});

test("forced colors, reduced motion and enlarged layout retain named controls", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto("/demo/maplibre.html");
  // CSS enlargement is a layout check, not a manual browser zoom/AT audit.
  await page.addStyleTag({ content: "body { zoom: 2; }" });
  await page.getByRole("button", { name: "Load map", exact: true }).click();
  await expect(page.locator("map-view")).toHaveAttribute("data-state", "ready");
  const marker = page.getByRole("button", { name: "Office", exact: true });
  await marker.focus();
  await page.keyboard.press("Enter");
  const link = page.getByRole("link", { name: "Office details" });
  await link.focus();
  await expect(link).toBeFocused();
  expect(await link.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await expect(page.getByRole("button", { name: "Close popup" })).toBeVisible();
});
