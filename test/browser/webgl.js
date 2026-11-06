import { test } from "@playwright/test";

/**
 * Skip a real MapLibre test when the browser cannot create a WebGL2 context.
 * Headless Firefox in the GPU-less CI container refuses WebGL2, so MapLibre
 * cannot render there; Chromium and WebKit still run these tests.
 * @param {import("@playwright/test").Page} page
 */
export async function requireWebGL2(page) {
  const supported = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")));
  test.skip(!supported, "WebGL2 is unavailable in this browser environment");
}
