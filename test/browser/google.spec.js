import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/test/fixtures/google.html");
});

test("Google uses custom DOM while preserving marker activation and cleanup", async ({ page }) => {
  await page.evaluate(async () => {
    const { mount } = await import("/src/providers/google.js");
    window.__selected = [];
    window.__mounted = mount({
      canvas: document.querySelector("#canvas"),
      points: [{ latitude: 0, longitude: 0, label: "Office", links: [] }],
      center: { latitude: 0, longitude: 0 },
      options: { apiKey: "test", mapId: "test", zoom: 12, maxZoom: 15 },
      signal: new AbortController().signal,
      onError() {},
      onSelect: (index) => window.__selected.push(index),
      renderMarker: (point, index) => {
        const marker = document.createElement("span");
        marker.className = "google-custom-marker";
        marker.textContent = `${point.label} ${index}`;
        return marker;
      },
    });
  });
  await expect.poll(() => page.evaluate(() => window.__markers?.length)).toBe(1);
  await page.evaluate(async () => {
    window.__idle();
    window.__dispose = await window.__mounted;
  });
  await expect(page.locator(".google-custom-marker")).toHaveText("Office 0");
  await page.evaluate(() => window.__markers[0].dispatchEvent(new Event("gmp-click")));
  expect(await page.evaluate(() => window.__selected)).toEqual([0]);
  expect(await page.evaluate(() => [window.__markers[0].title, window.__markers[0].gmpClickable])).toEqual([
    "Office",
    true,
  ]);
  await page.evaluate(() => window.__dispose());
  await expect(page.locator(".google-custom-marker")).toHaveCount(0);
});

test("Google selects linked and label-only markers and removes selection listeners on dispose", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const { mount } = await import("/src/providers/google.js");
    window.__selected = [];
    window.__mounted = mount({
      canvas: document.querySelector("#canvas"),
      points: [
        { latitude: 0, longitude: 0, label: "Office", links: [{ label: "Details", href: "/office" }] },
        { latitude: 1, longitude: 1, label: "Park", links: [] },
      ],
      center: { latitude: 0, longitude: 0 },
      options: { apiKey: "test", mapId: "test", zoom: 12, maxZoom: 15 },
      signal: new AbortController().signal,
      onError() {},
      onSelect: (index) => window.__selected.push(index),
    });
  });
  await expect.poll(() => page.evaluate(() => window.__markers?.length)).toBe(2);
  await page.evaluate(async () => {
    window.__idle();
    window.__dispose = await window.__mounted;
    window.__markers.forEach((marker) => {
      marker.dispatchEvent(new Event("gmp-click"));
    });
  });
  expect(await page.evaluate(() => window.__selected)).toEqual([0, 1]);
  expect(await page.evaluate(() => window.__markers.map((marker) => marker.gmpClickable))).toEqual([
    true,
    true,
  ]);
  expect(await page.evaluate(() => window.__popupContent.querySelector("a").textContent)).toBe("Details");
  await page.evaluate(() => {
    window.__dispose();
    window.__markers[0].dispatchEvent(new Event("gmp-click"));
  });
  expect(await page.evaluate(() => window.__selected)).toEqual([0, 1]);
});

test("Google shares one stable loader and keeps the hook until the last map is disposed", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const { mount } = await import("/src/providers/google.js");
    window.__authErrors = [];
    window.__controllers = [new AbortController(), new AbortController()];
    window.__mountGoogle = (index, key = "test") =>
      mount({
        canvas: document.body.appendChild(document.createElement("div")),
        points: [],
        center: { latitude: 0, longitude: 0 },
        options: { apiKey: key, mapId: "test", zoom: 12, maxZoom: 15 },
        signal: window.__controllers[index].signal,
        onError: () => window.__authErrors.push(index),
      });
    window.__mounts = [window.__mountGoogle(0), window.__mountGoogle(1)];
  });
  await expect.poll(() => page.evaluate(() => window.__maps?.length)).toBe(2);
  await page.evaluate(async () => {
    window.__idle();
    window.__disposers = await Promise.all(window.__mounts);
    window.__disposers[0]();
    window.gm_authFailure();
  });
  expect(await page.evaluate(() => window.__authErrors)).toEqual([1]);
  expect(await page.evaluate(() => window.__configurations.length)).toBe(1);
  expect(
    await page.evaluate(async () => {
      try {
        await window.__mountGoogle(0, "different");
      } catch (error) {
        return error.message;
      }
    }),
  ).toMatch(/different key/);
  await page.evaluate(() => {
    window.__replacementHook = () => {};
    window.gm_authFailure = window.__replacementHook;
    window.__disposers[1]();
  });
  expect(await page.evaluate(() => window.gm_authFailure === window.__replacementHook)).toBe(true);
});

test("Google idle removes its abort listener and last dispose restores the auth hook and canvas style", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.__previousAuth = () => {
      window.__previousCalls = (window.__previousCalls ?? 0) + 1;
    };
    window.gm_authFailure = window.__previousAuth;
    window.__abortListeners = new Set();
    window.__controller = new AbortController();
    const signal = window.__controller.signal;
    const add = signal.addEventListener.bind(signal);
    const remove = signal.removeEventListener.bind(signal);
    signal.addEventListener = (name, listener, options) => {
      if (name === "abort") window.__abortListeners.add(listener);
      add(name, listener, options);
    };
    signal.removeEventListener = (name, listener, options) => {
      if (name === "abort") window.__abortListeners.delete(listener);
      remove(name, listener, options);
    };
    window.__mounted = import("/src/providers/google.js").then(({ mount }) =>
      mount({
        canvas: document.querySelector("#canvas"),
        points: [],
        center: { latitude: 0, longitude: 0 },
        options: { apiKey: "test", mapId: "test", zoom: 12, maxZoom: 15 },
        signal,
        onError: () => {},
      }),
    );
  });
  await expect.poll(() => page.evaluate(() => window.__maps?.length)).toBe(1);
  await page.evaluate(async () => {
    window.__idle();
    window.__dispose = await window.__mounted;
  });
  expect(await page.evaluate(() => window.__abortListeners.size)).toBe(1);
  await page.evaluate(() => window.gm_authFailure());
  expect(await page.evaluate(() => window.__previousCalls)).toBe(1);
  await page.evaluate(() => window.__dispose());
  expect(await page.evaluate(() => window.gm_authFailure === window.__previousAuth)).toBe(true);
  await expect(page.locator("#canvas")).toHaveAttribute("style", "height: 320px");
  expect(await page.evaluate(() => window.__abortListeners.size)).toBe(0);
});

test("Google rejects unknown pre-existing loader configuration before calling setOptions", async ({
  page,
}) => {
  const message = await page.evaluate(async () => {
    window.google = { maps: { importLibrary() {} } };
    const { mount } = await import("/src/providers/google.js");
    try {
      await mount({
        canvas: document.querySelector("#canvas"),
        points: [],
        center: { latitude: 0, longitude: 0 },
        options: { apiKey: "test", mapId: "test" },
        signal: new AbortController().signal,
        onError() {},
      });
    } catch (error) {
      return error.message;
    }
  });
  expect(message).toBe("Google Maps was configured outside this adapter");
  expect(await page.evaluate(() => window.__configurations.length)).toBe(0);
});
