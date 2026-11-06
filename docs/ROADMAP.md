# Roadmap

## Implemented foundation

- [x] Native custom element, ESM exports, generated declarations and manifest.
- [x] Click, visible and eager activation with lazy provider imports.
- [x] Session cancellation, retry, deadline and stale mount disposal.
- [x] Point validation, safe links and center/zoom options.
- [x] Google and MapLibre adapters, fake-provider tests and offline demo.
- [x] Frozen lockfile installs and Bun 1.4.4 in CI; verification on Ubuntu and Windows.

## Review corrections — 2026-11-06

- [x] Contain cleanup exceptions, validate disposer returns and let adapters own provider-specific validation.
- [x] Use safe link labels when the explicit point label is empty.
- [x] Restore Google auth hooks and canvas styles; remove idle abort listeners; reject unknown external loader configuration.
- [x] Export contract types and declare the custom element in `HTMLElementTagNameMap`.
- [x] Document browser-only imports, connection-time control binding and application-owned focus policy.
- [x] Real MapLibre local-style smoke: local SDK/worker, stylesheet, attribution, keyboard popups, static marker focus, zoom framing and teardown.
- [x] Intercept network requests to prove lazy provider/SDK/style/tile loading. No external map service is used by the smoke.
- [x] Verify HTTP 500 tile errors during initial loading remain recoverable while missing styles fail activation.
- [x] Cover import deadlines, hidden visible layouts, center-only maps, activation snapshots and fatal errors after readiness.
- [x] Cover supported provider module shapes, ready-event flags and old callbacks/completions after a newer attempt succeeds.
- [x] Local validation: 5 unit tests, public type tests, generated files, 75 browser tests across Chromium/Firefox/WebKit and package validation.

Installed SDKs: Google loader 2.1.3, Google types 3.66.9 and MapLibre 6.16.0. MapLibre support is deliberately limited to `^6.16.0`; version 5 is not claimed as supported. Google API-double tests exercise lifecycle behavior but do not validate the remote SDK.

## Required before 0.1.0

- [ ] Validate real Google with a controlled key: authentication, first render, markers including label-only keyboard access, bounds zoom cap and cleanup.
- [ ] Verify application-owned loading/error focus transitions and manual screen-reader, zoom and forced-colors behavior; see `ACCESSIBILITY.md`.
- [ ] Prove Symfony AssetMapper/importmap resolution in a standalone fixture; see `INTEGRATION.md`. The native importmap smoke does not prove AssetMapper rewriting.
- [ ] Confirm CI results on Ubuntu and Windows; local results are not a CI run.
- [ ] Set version 0.1.0 and remove private only after all release gates pass.

## Out of scope

Clustering, geocoding, arbitrary HTML popups, dynamic fetching, location picking, routing, feature/layer APIs, universal cameras, automatic failover and bundled SDKs.
