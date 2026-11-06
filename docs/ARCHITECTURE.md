# Architecture

## Responsibility split

```text
server / application (points, links, translations, map style, credentials)
       ↓ light DOM & JSON
<map-view> (validation, state, activation, timeout, lifecycle)
       ↓ lazy import after activation
registered provider module (MapLibre | Google | custom)
       ↓
SDK + sources/tiles + markers + popups + map interactions
```

The core is deliberately agnostic to markers implementations. It passes normalized values and a `signal`, waits for an adapter to resolve to `dispose`, then emits `map-view:ready`.

## State machine

`idle` -> `loading` -> `ready` or `error`. `error` -> `loading` through retry. `disconnect` -> teardown + `idle` (fresh session after reconnect).

The authoritative identity is `(connection AbortController, attempt AbortController)`. Every asynchronous boundary checks both; stale resolutions dispose themselves and emit no events. The timer belongs to the current attempt and must never survive success or cancellation.

`click` is the default; applications provide an open button or call `show()` from their own controls. `visible` uses IntersectionObserver to activate near viewport and reserves a canvas box before intersection. `eager` begins automatically. All share the same `#start` path. Applications own the content and CSS of loading/error/open controls.

DOM shape is read at connection; point JSON/options/center are snapshotted per attempt. Mutation during active map is not a supported data-sync mechanism in 0.1. If the entire element is replaced by partial navigation, `disconnectedCallback` destroys it.

## Spatial semantics

`latitude` and `longitude` are WGS84 degrees. `center` is optional. With a center, use specified `zoom` and do not fit. Without center, one point opens at `max-zoom`, multiple points use bounds fitting with `max-zoom` cap. No center + no points is invalid. Center + zero points is supported.

## Error policy

Invalid JSON/data/options, SDK import failure, auth failure, fatal initial style/map failure and timeout => error UI + `map-view:error` with `detail.error` (`Error`). A single recoverable tile error after initial ready must not hide a working map.

Never automatically fall back to another provider (potential key/privacy/billing implications).

## Global SDK state

The current Google loader config and MapLibre worker URL affect the page, not one element. Adapter modules own these rules, never the core. Different Google keys/languages in one document are unsupported. MapLibre uses the default worker unless `worker-url` is set; a configured worker URL cannot then be changed by another component.

## Loading/bundling

- The package ships ESM source + generated types, no IIFE/standalone entry for 0.1.
- `src/map-view.js` contains only lazy callbacks to provider modules; adapter SDK imports are lazy too.
- Importmaps must resolve the optional peers `maplibre-gl` or `@googlemaps/js-api-loader` and the package's relative dynamic imports.
- `maplibre-gl` CSS must be explicitly loaded by the consuming app; `map-view.css` only covers the shell.
- No default map style, tiles, or API key. `map-style` is required for MapLibre.

## SDK verification requirements

Real SDK integration remains a release requirement. Verify Google `gm_authFailure` hook, load readiness, worker configuration, edge-case marker keyboard behavior and Google fitBounds maxZoom against installed SDK versions. The fake adapter suite exercises lifecycle contracts but does not validate SDK behavior.

