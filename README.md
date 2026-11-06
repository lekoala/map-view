# @lekoala/map-view

**In development — 0.0.0, not published.** Small declarative point maps with interchangeable **engines** (Google Maps, MapLibre, future custom adapters), explicit lazy activation, and no universal map API.


## Install for development

Requires Bun 1.4.4 (the setup validation version). Run `bun install --frozen-lockfile` and `bun run check`. Then `bun run dev` and visit http://127.0.0.1:4867/demo/index.html. Browser tests require `bunx playwright install` (or a suitable Playwright container).

The package is deliberately `private: true` until implementation and verification are complete. **Publish 0.1 only after all release gates pass.** See [docs/ROADMAP.md](docs/ROADMAP.md).

## Declarative usage

```html
<link rel="stylesheet" href="/assets/map-view.css">
<!-- MapLibre needs its own CSS too when using that provider. -->
<map-view provider="maplibre" activation="click"
          map-style="/assets/my-map-style.json" worker-url="/assets/maplibre-worker.js"
          zoom="12" max-zoom="15" timeout="15000">
  <button type="button" data-map-open hidden>Show map</button>
  <p role="status" data-map-loading hidden>Loading map…</p>
  <div data-map-error hidden>
    <p role="alert">Cannot display the map.</p>
    <button type="button" data-map-retry>Retry</button>
  </div>
  <div data-map-canvas role="region" aria-label="Locations" hidden></div>
  <script type="application/json" data-map-points>
    [{"latitude":50.85,"longitude":4.35,"label":"Office","links":[{"label":"Details","href":"/office"}]}]
  </script>
  <script type="application/json" data-map-center>
    {"latitude":50.85,"longitude":4.35}
  </script>
</map-view>
<script type="module" src="/assets/map-entry.js"></script>
```

`map-entry.js`:

```js
import "@lekoala/map-view/define";
import "@lekoala/map-view/map-view.css";
// And when using MapLibre, import "maplibre-gl/dist/maplibre-gl.css"
// through your asset pipeline (or add a stylesheet link).
```

The consuming app **must give `[data-map-canvas]` a block-size** (for example `24rem`). The component does not choose a map height or a tile service. HTML labels remain app-owned for localization.

`activation` modes:

- `click` (default): absolutely no provider import, SDK, style or tile request before a click or `mapView.show()`.
- `visible`: `IntersectionObserver` starts when the element approaches the viewport (200px margin). The **canvas is a visible reserved placeholder before activation**; it must have a nonzero height. Hidden layout ancestors will not intersect.
- `eager`: starts at connection. No click needed.

`visible` falls back to eager if `IntersectionObserver` is unavailable. A page-level import of a SDK by the application is outside the component's zero-network guarantee.

## Google provider

```html
<map-view provider="google" activation="click" api-key="..." map-id="..." region="BE" lang="fr">…</map-view>
```

The key is not a secret (browser keys require referrer/API restrictions). Google loader configuration is global per page; the first key/language/region wins and a conflicting later map reports an error. No silent fallback between engines.

## Custom adapters

```js
import { MapViewElement } from "@lekoala/map-view";
MapViewElement.registerProvider("custom", () => import("./custom-provider.js"));
```

The provider module exports `mount({canvas, points, center, options, signal, onError})` resolving to an idempotent `dispose()` function. It should stop work on abort and must release all SDK resources. Late resolution after abort is disposed by the element. Do not leak any map engine objects into this public contract. An app may override a built-in name intentionally; do it before activating maps.

See [docs/API.md](docs/API.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DECISIONS.md](docs/DECISIONS.md), [docs/TESTING.md](docs/TESTING.md), and [docs/INTEGRATION.md](docs/INTEGRATION.md).

## Check/build

```bash
bun run check            # syntax, Biome, typecheck, unit
bun run verify           # check + declarations/manifest + package
bun run test:browser     # Chromium
bun run test:browser:all # Chromium, Firefox, WebKit
bun run check:all        # release gate
```

The lockfile is included and CI uses frozen installs. See [docs/ROADMAP.md](docs/ROADMAP.md) for the remaining release validations.

## Not in scope

No geocoding, clustering, location selection, automatic provider failover, global camera API, multiple layers, arbitrary HTML popups or fetch-by-URL data source. Leaflet is a future *adapter*, not an underlying engine required by this package.

