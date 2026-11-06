import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/test/fixtures/map.html");
  await page.waitForFunction(() => window.__ready === true);
});

for (const shape of ["mount", "default", "function"]) {
  test(`provider module shape ${shape} emits ready exactly once`, async ({ page }) => {
    await page.evaluate(async (moduleShape) => {
      const { MapViewElement } = await import("/src/index.js");
      const mount = async () => () => {};
      MapViewElement.registerProvider("shape", async () =>
        moduleShape === "function" ? mount : { [moduleShape]: mount },
      );
      window.__events = [];
      document.body.addEventListener("map-view:ready", (event) => {
        window.__events.push([event.detail.provider, event.bubbles, event.composed]);
      });
      const el = document.querySelector("#click");
      el.setAttribute("provider", "shape");
      el.show();
      el.show();
    }, shape);
    await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
    expect(await page.evaluate(() => window.__events)).toEqual([["shape", true, true]]);
  });
}

test("stale completion and fatal callbacks cannot mutate a newer attempt", async ({ page }) => {
  await page.evaluate(async () => {
    const { MapViewElement } = await import("/src/index.js");
    window.__disposals = 0;
    MapViewElement.registerProvider("slow", async () => ({
      mount: ({ onError }) => {
        window.__staleError = onError;
        return new Promise((resolve) => {
          window.__releaseMount = () =>
            resolve(() => {
              window.__disposals++;
            });
        });
      },
    }));
    const el = document.querySelector("#click");
    el.setAttribute("provider", "slow");
    el.setAttribute("timeout", "50");
    el.show();
  });
  await expect(page.locator("#click")).toHaveAttribute("data-state", "error");
  await page.evaluate(() => {
    const el = document.querySelector("#click");
    el.setAttribute("provider", "fake");
    el.show();
  });
  await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
  await page.evaluate(async () => {
    window.__staleError(new Error("old attempt"));
    window.__releaseMount();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(await page.evaluate(() => window.__disposals)).toBe(1);
  await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
});

for (const provider of ["google", "maplibre"]) {
  test(`custom override of ${provider} owns its configuration`, async ({ page }) => {
    await page.evaluate(async (name) => {
      const { MapViewElement } = await import("/src/index.js");
      MapViewElement.registerProvider(name, async () => async () => () => {});
      const el = document.querySelector("#click");
      el.setAttribute("provider", name);
      el.show();
    }, provider);
    await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
  });
}

test("invalid disposer reports an error instead of ready", async ({ page }) => {
  await page.evaluate(async () => {
    const { MapViewElement } = await import("/src/index.js");
    MapViewElement.registerProvider("broken", async () => ({ mount: async () => undefined }));
    const el = document.querySelector("#click");
    window.__errors = [];
    el.addEventListener("map-view:error", (event) => window.__errors.push(event.detail.error.message));
    el.setAttribute("provider", "broken");
    el.show();
  });
  await expect(page.locator("#click")).toHaveAttribute("data-state", "error");
  expect(await page.evaluate(() => window.__errors)).toEqual([
    "Provider broken must return a dispose function",
  ]);
});

test("throwing cleanup cannot prevent fatal-error reporting or reconnection", async ({ page }) => {
  await page.evaluate(async () => {
    const { MapViewElement } = await import("/src/index.js");
    MapViewElement.registerProvider("broken", async () => ({
      mount: async ({ onError }) => {
        window.__fatal = onError;
        return () => {
          throw new Error("cleanup failed");
        };
      },
    }));
    const el = document.querySelector("#click");
    window.__errors = [];
    document.body.addEventListener("map-view:error", (event) => {
      window.__errors.push([event.detail.error.message, event.bubbles, event.composed]);
    });
    el.setAttribute("provider", "broken");
    el.show();
  });
  await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
  await page.evaluate(() => {
    try {
      window.__fatal(new Error("fatal"));
    } catch {}
  });
  await expect(page.locator("#click")).toHaveAttribute("data-state", "error");
  expect(await page.evaluate(() => window.__errors)).toEqual([["fatal", true, true]]);
  await page.evaluate(() => document.querySelector("#click").show());
  await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
  await page.evaluate(() => {
    const el = document.querySelector("#click");
    el.remove();
    window.__removed = el;
  });
  expect(await page.evaluate(() => window.__removed.state)).toBe("idle");
  await page.evaluate(() => document.body.append(window.__removed));
  await expect(page.locator("#click")).toHaveAttribute("data-state", "idle");
});

test("deadline covers provider import and late imports never mount", async ({ page }) => {
  await page.evaluate(async () => {
    const { MapViewElement } = await import("/src/index.js");
    window.__mounts = 0;
    MapViewElement.registerProvider(
      "slow",
      () =>
        new Promise((resolve) => {
          window.__releaseImport = () =>
            resolve({
              mount: async () => {
                window.__mounts++;
                return () => {};
              },
            });
        }),
    );
    const el = document.querySelector("#click");
    el.setAttribute("provider", "slow");
    el.setAttribute("timeout", "50");
    el.show();
  });
  await expect(page.locator("#click")).toHaveAttribute("data-state", "error");
  await page.evaluate(async () => {
    window.__releaseImport();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(await page.evaluate(() => window.__mounts)).toBe(0);
});

test("zero points needs a center and activation snapshots inputs", async ({ page }) => {
  await page.evaluate(async () => {
    const { MapViewElement } = await import("/src/index.js");
    MapViewElement.registerProvider(
      "snapshot",
      () =>
        new Promise((resolve) => {
          window.__releaseImport = () =>
            resolve({
              mount: async ({ points, center, options }) => {
                window.__snapshot = { points, center, zoom: options.zoom };
                return () => {};
              },
            });
        }),
    );
    const el = document.querySelector("#click");
    el.querySelector("[data-map-points]").textContent = "[]";
    el.show();
  });
  await expect(page.locator("#click")).toHaveAttribute("data-state", "error");
  await page.evaluate(() => {
    const el = document.querySelector("#click");
    const center = document.createElement("script");
    center.type = "application/json";
    center.dataset.mapCenter = "";
    center.textContent = '{"latitude":1,"longitude":2}';
    el.append(center);
    el.setAttribute("provider", "snapshot");
    el.show();
    center.textContent = '{"latitude":3,"longitude":4}';
    el.setAttribute("zoom", "20");
    window.__releaseImport();
  });
  await expect(page.locator("#click")).toHaveAttribute("data-state", "ready");
  expect(await page.evaluate(() => window.__snapshot)).toEqual({
    points: [],
    center: { latitude: 1, longitude: 2 },
    zoom: 12,
  });
});

test("hidden visible maps stay idle and reserve height when shown", async ({ page }) => {
  await page.evaluate(() => {
    const el = document.querySelector("#visible");
    el.remove();
    el.hidden = true;
    document.body.prepend(el);
  });
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await expect(page.locator("#visible")).toHaveAttribute("data-state", "idle");
  await page.evaluate(() => {
    document.querySelector("#visible").hidden = false;
  });
  await expect(page.locator("#visible [data-map-canvas]")).toHaveCSS("height", "240px");
  await expect(page.locator("#visible")).toHaveAttribute("data-state", "ready");
});
