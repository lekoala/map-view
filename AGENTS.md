# AGENTS.md — @lekoala/map-view

This repository implements a small provider-neutral HTML point map. Keep it small. Start by reading `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` and `docs/ROADMAP.md`.

## Non-negotiable boundary

- This is NOT Leaflet, a general map abstraction or a geocoder.
- The core owns activation, normalized points, errors, deadlines, session identity and teardown; adapters own all SDK objects, marker rendering, popups and framing.
- Do not expose engine-specific maps/markers/layers/cameras through the shared API.
- Changing the tile provider/style and changing the map engine are independent operations.
- No automatic failover to Google/MapLibre/third-party tiles. No implicit external service.

## Loading invariants

1. `click` by default, plus `visible` / `eager`. Provider modules + SDKs are **not imported before activation**.
2. In `visible` mode, reserve nonzero canvas dimensions while idle; an IntersectionObserver on a zero-height host is unreliable. Hidden responsive layouts should not load.
3. The timeout starts **before the dynamic provider import**, and covers initial SDK/style readiness.
4. One fresh AbortController **per attempt** and one session controller per connection. An older operation can never mutate a newer session/attempt or report success.
5. A stale successful `mount()` MUST call its returned `dispose` immediately; abort alone is not teardown.
6. `disconnect` aborts everything, disconnects observer, destroys SDK state; reconnect starts from the live DOM with a fresh session.
7. No automatic replay of point changes while mounted: structure/options/points are snapshotted at activation. Disconnect/reconnect for unsupported mutations.

## Data/security

- Coordinates are finite and bounded. Points need a nonempty label OR a nonempty list of safe HTTP(S) links. The component accepts external links; consuming applications may disallow them separately.
- JSON scripts are data, not HTML; links are DOM anchors with `textContent`. Never trust popup HTML.
- `center` may exist without points; no points and no center is a configuration error.
- A map with an explicit center does not auto-fit points. No center + one point => `max-zoom`; more => fit all, capped by `max-zoom`.
- User-facing messages remain light DOM owned by the app; no invented translations.

## Provider contracts

`mount({canvas, points, center, options, signal, onError})` -> Promise<dispose>. `onError` is for fatal failures only. An ordinary tile failure after ready should not destroy the whole map.

The core also supplies optional `onSelect(index)` for marker activation. Report the snapshot index, never SDK objects. The core emits copied normalized point data only for the live ready attempt. Application metadata belongs in optional JSON `point.data`; it is not popup HTML.

Optional `renderMarker(point, index)` returns application-owned visual DOM. The core snapshots/validates the callback and its fresh detached elements; adapters own accessible interaction wrappers, SDK placement and teardown. Themeable package CSS values use host `--map-view-*` custom properties.

- Google: `setOptions()` and `gm_authFailure` are page-global; first loader config must be stable. Wait for meaningful first render, not only `importLibrary`.
- MapLibre: `worker-url` is global if set, map style is required; do not imply a tile provider. Initial style load is a readiness barrier. Keep attribution visible and marker popups keyboard-usable.
- Optional peers must not enter the core bundle/import graph until activation.

## Code and workflow

- JavaScript + JSDoc; TypeScript `checkJs`, Biome and Bun.
- Documentation, code comments and demo use English.
- Add a failing regression test for each bug before a fix. Use `test/unit` for pure normalizers and Playwright for DOM/timing/keyboard behavior.
- CI covers Chromium/Firefox/WebKit. A real MapLibre local-style smoke is required before publishing, not just the fake provider.
- Tests must cover no-network-before-click, visible/eager, timeout during import, failure/retry, focus, reconnect, late mount cleanup, zero points with center, zoom cap and stylesheet/attribution.
- Run `bun run check`, `bun run verify`, `bun run test:browser:all`, then package validation. No release while any is red.

## Release requirements

1. Keep `bun.lock` committed and use `bun install --frozen-lockfile` in CI.
2. Fix any Biome/TypeScript diagnostics for installed optional SDKs; validate `package.json` peer ranges against actual upstream versions.
3. Review `src/providers/` against installed SDK APIs and validate behavior with real SDK integration tests.
4. Add real MapLibre integration smoke with local style and locally served SDK/worker; independently test Google behind a controlled environment/API key.
5. Prove true click-lazy behavior by intercepting network requests in the browser.
6. Document importmap and asset-pipeline requirements for consumers. Framework-specific integration fixtures are not a package release requirement.
7. Confirm no package assets missing via npm pack. Set version `0.1.0` and remove `private` only after the release gate is green.

Consumer application migrations belong in their own repositories.

