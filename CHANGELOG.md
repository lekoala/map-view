# Changelog

## 0.1.0 — planned, unreleased

- Add a browser-only native `<map-view>` with ESM entries, generated declarations and a custom-elements manifest.
- Load providers only on click, visibility or eager activation; support deadlines, retry, reconnect and stale-operation cleanup.
- Validate coordinates and HTTP(S) links; support explicit centers, zoom caps, label-only points and optional JSON `data`.
- Add optional Google Maps and MapLibre adapters with explicit configuration and no automatic failover or external tile defaults.
- Emit `map-view:ready`, `map-view:error` and `map-view:select` with normalized point data and snapshot index.
- Support `renderMarker(point, index)` for application-owned marker DOM while preserving SDK positioning, keyboard activation, popups and teardown.
- Theme popup content and MapLibre popup chrome through CSS variables declared on `map-view`.
- Provide offline, MapLibre and Google demos with custom markers, live themes, explicit OpenFreeMap/LFMaps choices and a metadata-driven details dialog.
- Add lifecycle/security/type regressions, real MapLibre tests, real Google smoke, keyboard/focus/layout checks and package-content validation.
- Configure reproducible Bun checks on Ubuntu/Windows and Chromium/Firefox/WebKit in CI.

The release remains private pending the manual accessibility smoke and CI confirmation described in `docs/RELEASE.md`.
