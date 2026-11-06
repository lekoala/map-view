# Testing

## Local commands

```sh
bun install
bun run check
bun run verify
bunx playwright install chromium firefox webkit
bun run test:browser:all
bun run check:package
```

`bun run dev` serves `/demo/index.html` on port 4867.

## Unit tests

`test/unit/validate.test.js` covers coordinates, safe external/relative links, label-only points, malformed input and numeric attributes. Tests use `node:test`, which is also compatible with Bun's runner.

## Browser tests

Fake providers are registered **before** importing `/src/define.js` so `eager` does not race provider registration. Playwright covers click / visible / eager activation, retry, disconnection, stale mount disposal. More tests before release: timeout across dynamic import, request interception/no-network, Google auth failure, focus/keyboard, zoom bounding, real MapLibre style-local + attribution and responsive hidden behavior.

For MapLibre integration smoke, serve a style such as `{ "version": 8, "sources": {}, "layers": [{ "id":"background", "type":"background", "paint":{"background-color":"#edf1e8"}}] }` locally and serve SDK + worker locally. A background-only style exercises the renderer but not real source/tile errors; add separate coverage for style failures and attribution.

## CI/release

GitHub Actions runs Bun checks first, then Chromium, Firefox and WebKit in a Playwright container. Both jobs use Bun 1.4.4 and frozen lockfile installs.

Release gate: check:all, real SDK integration, manual assistive-technology checks and a standalone AssetMapper/importmap fixture. See ROADMAP.md for outstanding coverage.

