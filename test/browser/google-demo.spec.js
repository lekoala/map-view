import { expect, test } from "@playwright/test";

test("Google demo imports the real loader without Node globals and reaches the SDK only after submit", async ({
  page,
}) => {
  const requests = [];
  const errors = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  // Exercise the installed loader, but intercept the remote SDK before any key is sent.
  await page.route(/^https:\/\/maps\.googleapis\.com\/maps\/api\/js\?/, (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "globalThis.gm_authFailure();",
    }),
  );
  await page.goto("/demo/google.html");
  await page.waitForFunction(() => customElements.get("map-view"));
  expect(
    requests.filter(
      (url) =>
        url.includes("/src/providers/google.js") ||
        url.includes("google-loader") ||
        url.includes("maps.googleapis.com"),
    ),
  ).toEqual([]);
  await page.locator("#api-key").fill("browser-regression-test");
  await page.locator("#map-id").fill("");
  await page.getByRole("button", { name: "Load map" }).click();
  await expect(page.locator("#error-message")).toHaveText("Google Maps authentication failed");
  expect(requests.filter((url) => url.startsWith("https://maps.googleapis.com/maps/api/js?"))).toHaveLength(
    1,
  );
  await expect(page.locator("map-view")).toHaveAttribute("map-id", "DEMO_MAP_ID");
  await expect(page.getByRole("button", { name: "Retry" })).toBeFocused();
  expect(await page.evaluate(() => typeof process)).toBe("undefined");
  expect(errors).toEqual([]);
});
