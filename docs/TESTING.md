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
- `google-demo.spec.js`: real installed loader in the demo, without Node globals. The remote SDK request is intercepted to verify deferred loading and the authentication error UI without sending a real key.
- `select.spec.js`: normalized selection data, event flags, defensive metadata copies, stale callback rejection and real MapLibre click/Enter/Space activation.
- `maplibre-demo.spec.js`: real MapLibre demo remains local/lazy and renders selected metadata in an application-owned dialog.
- `custom-marker.spec.js`: real MapLibre custom DOM, keyboard/popup preservation, invalid returns/cleanup, renderer snapshots and stale cancellation, live CSS-variable overrides and demo themes. Google custom DOM and activation are covered by the API-double suite.

## MapLibre demo

Open `http://127.0.0.1:4867/demo/maplibre.html` after `bun run dev`. Load the local background, activate either marker and inspect the `map-view:select` payload. The details button opens a dialog using `point.data`. Entering a custom style URL explicitly opts into that style and any configured services.

The Background selector also offers [OpenFreeMap Liberty](https://openfreemap.org/quick_start/) and [LFMaps Bright](https://lfmaps.fr/en/), both documented as usable without an API key. These online styles are requested only after choosing them and selecting Load map. Keep the SDK attribution control visible. Automated tests intercept those remote styles so CI does not depend on third-party availability.

## Manual Google demo

For a repeatable real-SDK smoke, put `GOOGLE_MAPS_DEMO_KEY` in an ignored `.env` file or the environment and run `bun run test:google`. It starts its own server and checks default/custom markers, keyboard, auth-hook handling, retry, zoom cap, center-only rendering and teardown. This command intentionally uses Google's remote SDK and is separate from credential-free CI.

Run `bun run dev`, open `http://127.0.0.1:4867/demo/google.html`, paste your own Maps Demo Key and keep `DEMO_MAP_ID` for testing. Select Load map. The dev command first builds the installed loader into `demo/vendor/google-loader.js` with its `process.env.NODE_ENV` constant replaced for browsers. The local importmap resolves this generated file; the adapter loads it and Google's remote SDK only after activation. Reload to change credentials because loader configuration is page-global.

If serving the demo with another local web server, run `bun run build:demo` first. The generated vendor directory is ignored by Git and excluded from the published package. Consuming applications must also process the loader's environment constant through their asset pipeline; pointing an importmap directly at the upstream file does not work without that preparation.

[Google's Maps Demo Key guide](https://developers.google.com/maps/documentation/javascript/demo-key) explains how to obtain a key using an eligible personal Google Account without billing information. Demo keys support maps, markers and info windows, with daily usage limits; they are for prototyping. `DEMO_MAP_ID` is a test Map ID, not an API key.

Check marker keyboard behavior (linked and label-only), popup links, initial framing, visible attribution and error reporting. Record real-SDK results separately from the API-double suite. The demo does not store credentials in browser storage or URLs.

## CI/release

CI runs verification on Ubuntu and Windows, then browser tests on Chromium, Firefox and WebKit in a Playwright container. Both jobs use Bun 1.4.4 and frozen lockfile installs.

Release gate: check:all, real Google integration and manual assistive-technology checks. Framework-specific integration fixtures are outside this package's release gate; see INTEGRATION.md for consumer configuration guidance.
