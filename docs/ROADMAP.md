# Roadmap

## Implemented foundation

- [x] Native custom element, ESM exports, generated declarations and manifest.
- [x] Click, visible and eager activation with lazy provider imports.
- [x] Session cancellation, retry, deadline and stale mount disposal.
- [x] Point validation, safe links and center/zoom options.
- [x] Initial Google and MapLibre adapters, fake-provider tests and offline demo.

## Setup audit — 2026-11-06

- [x] Dependencies installed with Bun 1.4.4 and lockfile generated.
- [x] CI uses frozen installs and pins Bun 1.4.4.
- [x] Formatting and explicit Google ambient types corrected for TypeScript 7.
- [x] Windows package-check invocation and test-server path normalization corrected.
- [x] Application-specific reference files removed; integration guidance is generic.
- [x] `bun run check` and `bun run verify`: passed (4 unit tests, generated types/manifest and package check).
- [x] Browser suite: 21 passed across Chromium, Firefox and WebKit (2 workers, outside the restricted sandbox).
- [x] Package dry-run: all 28 expected files and declared exports present.
- [ ] Commit the lockfile and source tree (no Git repository present during setup).

Installed SDKs: Google loader 2.1.3, Google types 3.66.9 and MapLibre 6.16.0. Existing peer ranges accept these versions. MapLibre 5 compatibility remains untested: test both supported major versions or narrow the range before release.

## Required before 0.1.0

- [ ] Add real MapLibre smoke with local style, SDK/worker, stylesheet, attribution, keyboard popups and teardown assertions.
- [ ] Validate Google with a controlled key: configuration, authentication failure, first idle, bounds zoom cap and cleanup.
- [ ] Intercept browser requests to prove no provider module, SDK, style or tile loads before click. Existing tests only count fake-provider mount calls.
- [ ] Cover timeout during provider import; existing timeout test gates mount only.
- [ ] Cover hidden responsive visible activation and nonzero idle placeholder dimensions.
- [ ] Cover zero points with/without center and explicit-center versus fitted bounds.
- [ ] Cover fatal errors after readiness, overlapping stale attempts and activation snapshots.
- [ ] Add focus/keyboard tests and record manual screen-reader, zoom and forced-colors checks in `ACCESSIBILITY.md`.
- [ ] Prove Symfony AssetMapper/importmap resolution in a standalone fixture; see `INTEGRATION.md`.
- [ ] Pass check, verify, all three browsers and package validation on the final tree.
- [ ] Set version 0.1.0 and remove private only after all release gates pass.

## Out of scope

Clustering, geocoding, arbitrary HTML popups, dynamic fetching, location picking, routing, feature/layer APIs, universal cameras, automatic failover and bundled SDKs.
