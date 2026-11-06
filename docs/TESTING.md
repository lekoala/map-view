# Testing

## Local commands

```sh
bun install --frozen-lockfile
bun run check
bun run verify
bunx playwright install chromium firefox webkit
bun run test:browser:all
bun run check:package
```

`bun run dev` serves `/demo/index.html` on port 4867. The test server serves local dependencies for integration fixtures; it is a development server.

## Unit and type tests

`test/unit/validate.test.js` covers bounded coordinates, safe external/relative links, label fallback, malformed data and numeric attributes. Consumer type tests check public adapter types and `document.createElement("map-view")` after declaration generation.

## Browser tests

- `map-view.spec.js`: fake-provider activation, retry, timeout, reconnect and late disposal.
- `contracts.spec.js`: built-in overrides, invalid/throwing disposers, fatal errors, import deadlines, center-only maps, snapshots and hidden visible layouts.
- `maplibre.spec.js`: real installed MapLibre SDK and worker served locally through a native importmap; no provider/SDK/style/tile requests before click, missing-style failure, recoverable HTTP 500 tiles, CSS, attribution, keyboard popups, static markers, zoom framing and cleanup. Test-only SDK observation is not a component API.
- `google.spec.js`: local API double for loader ownership, idle listener cleanup, authentication-hook chaining/restoration and canvas style restoration. This does not replace real Google integration with a controlled key.

## CI/release

CI runs verification on Ubuntu and Windows, then browser tests on Chromium, Firefox and WebKit in a Playwright container. Both jobs use Bun 1.4.4 and frozen lockfile installs.

Release gate: check:all, real Google integration, manual assistive-technology checks and a standalone AssetMapper/importmap fixture. See ROADMAP.md for outstanding coverage.
