# Preparing 0.1.0

The implementation is staged for its first public release. The package remains `0.0.0` and private until the remaining release gates below are satisfied. No package has been published and no release tag has been created.

## Evidence — 2026-11-06

| Gate | Evidence |
| --- | --- |
| Reproducible install | Bun 1.4.4, committed `bun.lock`, frozen CI installs |
| JavaScript, formatting, types and unit tests | `bun run check` and `bun run verify` |
| Real MapLibre | Local SDK/worker/style, network interception, attribution, keyboard, cleanup and online demo smokes |
| Real Google | User confirmed the demo key works; `bun run test:google` also verifies readiness, keyboard popup/selection, auth-hook handling, retry, custom markers, zoom cap, center-only maps and cleanup |
| Accessibility automation | Keyboard focus flow, dialog focus restoration, forced colors, reduced motion and CSS enlargement on Chromium/Firefox/WebKit |
| Consumer type declarations | Public contracts, `renderMarker`, selection event and element tag types |
| Package contents | Generated declarations/manifest, export targets, stylesheet and transitive source imports |
| Framework-specific fixture | Not required; consumer configuration guidance is in `INTEGRATION.md` |

The Google smoke uses a real remote SDK and simulates invocation of `gm_authFailure` after readiness; it does not deliberately send an invalid key. It starts and stops a local server and writes no browser trace, network log or screenshot. Set `GOOGLE_MAPS_DEMO_KEY` in the environment or an ignored `.env` file, then run:

```sh
bun run test:google
```

## Remaining release gates

- [ ] Manual assistive-technology smoke. Follow `ACCESSIBILITY.md`; automatic focus/layout tests do not establish screen-reader announcements or real browser zoom behavior. Record platform, browser, reader, checks and result.
- [ ] Run CI on the final commit: Ubuntu/Windows verification and all three browsers. This checkout has no Git remote, so no remote CI run can currently be verified here.

## Finalization after the gates pass

1. Set `package.json` version to `0.1.0` and remove `private`. Refresh `bun.lock` with `bun install` and check a frozen install.
2. Rename the planned changelog heading to `0.1.0` with the actual release date; update the README status and roadmap.
3. Run `bun run check`, `bun run verify`, `bun run test:browser:all`, `bun run test:google`, then `bun run check:package` on that exact tree.
4. Create and inspect the actual `npm pack` archive. Confirm the version and exported files; test fixtures, demos, scripts, credentials, caches and SDK dependencies must not be bundled.
5. Commit the release changes and confirm CI on that commit. Tag `v0.1.0` and publish only when explicitly requested. The configured npm access is public; no automatic publication workflow is installed.

## Release scope

The first release includes the browser-only declarative custom element, click/visible/eager activation, cancellation/retry/deadlines, normalized points with optional JSON metadata, Google and MapLibre adapters, marker selection, custom marker DOM, CSS theme variables and generated types/manifest.

Data/options/renderer updates require teardown and reconnect; CSS themes can change live. No SDK objects are exposed. Clustering, geocoding, generalized layers/cameras, external-service defaults and engine failover remain outside 0.1.
