import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";

if (existsSync(".env")) process.loadEnvFile(".env");
const key = process.env.GOOGLE_MAPS_DEMO_KEY;
if (!key) throw new Error("Set GOOGLE_MAPS_DEMO_KEY in the environment or ignored .env file");

// Separate from CI: this intentionally exercises the remote Google SDK.
// No traces, network logs or screenshots are written when a real key is used.
const server = spawn(process.execPath, ["test/server.js"], {
  env: { ...process.env, PORT: "4891" },
  stdio: "ignore",
});
let browser;
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch("http://127.0.0.1:4891/demo/google.html")).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:4891/demo/google.html");
  await page.evaluate((value) => {
    document.querySelector("#api-key").value = value;
  }, key);
  await page.getByRole("button", { name: "Load map", exact: true }).click();
  const ready = async () => {
    await page.waitForFunction(
      () => ["ready", "error"].includes(document.querySelector("map-view").state),
      null,
      { timeout: 25_000 },
    );
    assert.equal(
      await page.locator("map-view").getAttribute("data-state"),
      "ready",
      "Google activation failed",
    );
  };
  await ready();
  await page.getByRole("button", { name: "Office", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("link", { name: "Office details" }).waitFor();
  await page.getByRole("button", { name: "Park", exact: true }).focus();
  await page.keyboard.press("Enter");
  assert.match(await page.locator("#selection").textContent(), /Park/);

  await page.evaluate(() => globalThis.gm_authFailure());
  assert.equal(await page.locator("map-view").getAttribute("data-state"), "error");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await ready();

  await page.evaluate(async () => {
    const originalImport = google.maps.importLibrary;
    google.maps.importLibrary = async (name) => {
      const library = await originalImport(name);
      if (name !== "maps") return library;
      return {
        ...library,
        Map: class extends library.Map {
          constructor(...args) {
            super(...args);
            window.__observedMap = this;
          }
        },
      };
    };
    const map = document.querySelector("map-view");
    map.remove();
    window.__customNodes = [];
    map.querySelector("[data-map-points]").textContent = JSON.stringify([
      {
        latitude: 50.85,
        longitude: 4.35,
        label: "Office",
        links: [{ label: "Office details", href: "/demo/index.html" }],
      },
      { latitude: 50.850001, longitude: 4.350001, label: "Park" },
    ]);
    map.renderMarker = (_point, index) => {
      const marker = document.createElement("span");
      marker.className = "real-google-custom";
      marker.textContent = String(index + 1);
      window.__customNodes.push(marker);
      return marker;
    };
    document.body.append(map);
    map.show();
  });
  await ready();
  await page.waitForFunction(
    () => window.__customNodes.every((node) => node.isConnected && node.getBoundingClientRect().width > 0),
    null,
    { timeout: 5_000 },
  );
  const customState = await page.evaluate(() =>
    window.__customNodes.map((node) => ({
      connected: node.isConnected,
      width: node.getBoundingClientRect().width,
      root: node.getRootNode().nodeName,
    })),
  );
  assert.equal(customState.length, 2);
  assert.ok(customState.every((state) => state.connected && state.width > 0));
  assert.equal(await page.evaluate(() => window.__observedMap.getZoom()), 15, "Google bounds zoom cap");
  await page.getByRole("button", { name: "Office", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("link", { name: "Office details" }).waitFor();
  await page.evaluate(() => {
    const map = document.querySelector("map-view");
    map.remove();
    map.querySelector("[data-map-points]").textContent = "[]";
    const center = document.createElement("script");
    center.type = "application/json";
    center.dataset.mapCenter = "";
    center.textContent = '{"latitude":20,"longitude":10}';
    map.append(center);
    map.setAttribute("zoom", "5");
    document.body.append(map);
    map.show();
  });
  await ready();
  assert.deepEqual(
    await page.evaluate(() => [
      window.__observedMap.getCenter().lat(),
      window.__observedMap.getCenter().lng(),
      window.__observedMap.getZoom(),
    ]),
    [20, 10, 5],
  );
  await page.evaluate(() => {
    const map = document.querySelector("map-view");
    map.remove();
    window.__removed = map;
  });
  assert.equal(
    await page.evaluate(() => window.__removed.querySelector("[data-map-canvas]").childElementCount),
    0,
  );
  console.log(
    "Google SDK smoke passed: readiness, keyboard, selection, auth hook, retry, custom markers, zoom cap, center-only map and teardown.",
  );
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error).replaceAll(key, "[redacted]"));
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill();
}
