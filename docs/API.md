# API — 0.1 proposal

## Element

`<map-view>`: custom element, light DOM; imported via `@lekoala/map-view/define` or registered by `defineMapView()`.

| Attribute | Default | Meaning |
| --- | --- | --- |
| `provider` | `maplibre` | Built-ins: `maplibre`, `google`; or a registered name |
| `activation` | `click` | `click` / `visible` / `eager` |
| `map-style` | required for MapLibre | URL to a map style JSON (may be local) |
| `worker-url` | unspecified | Optional URL for MapLibre worker (global setting) |
| `api-key` / `map-id` | required for Google | Google API/browser map ID |
| `zoom` | `12` | Explicit-center zoom, number 0..22 |
| `max-zoom` | `15` | Single-point zoom and fitBounds cap, number 0..22 |
| `timeout` | `15000` | Activation deadline in milliseconds, 1..120000 |
| `lang` | nearest inherited HTML lang | SDK language (Google loader is page-global) |
| `region` | unspecified | Google region hint |

Mandatory `[data-map-canvas]` element with an application-owned fixed/minimum block size. Required `[data-map-points]` `script[type=application/json]` array, even if empty. Optional `[data-map-center]` JSON coordinate. In click mode, provide `[data-map-open]` or call `show()` from application-owned controls. `[data-map-loading]`, `[data-map-error]`, `[data-map-retry]` are app-owned optional UI hooks.

Controls must exist before connection: open/retry listeners are bound once per connection. Replacing controls requires disconnect/reconnect. Points and options are read at activation and remain a snapshot until teardown.

## Points

```json
[
  {"latitude":50.85,"longitude":4.35,"label":"Office","data":{"id":42,"type":"office"}},
  {"latitude":50.9,"longitude":4.4,"links":[{"label":"Profile","href":"/doctors/a"}]}
]
```

`label` may be omitted if nonempty `links` are present. Empty links are valid if label exists. Link `label` and URL must be strings with nonempty content. Relative links are resolved from `document.baseURI`; only HTTP(S) URLs accepted, including cross-origin. Popups are rendered with DOM/textContent. Invalid entries reject the entire activation before invoking the provider.

Optional `data` carries arbitrary JSON metadata for the consuming application: objects, arrays, strings, finite numbers, booleans or null. It is copied during normalization and included in selection events. It does not provide a label or automatically become popup content. Functions, cycles, class instances and non-JSON nested values are rejected by the public normalizer. Applications own how they render metadata and must treat its strings as untrusted text.

## JS public surface

- `MapViewElement.registerProvider(name, () => import("./adapter.js"))` — register lazy loader, optionally overriding a built-in.
- `element.show()` — request activation programmatically (also works with `activation="click"`).
- `element.state` — read-only `idle|loading|ready|error`.
- `element.renderMarker` — synchronous `(point, index) => HTMLElement` callback or `null` for default SDK markers. Assign after definition and before activation; the callback is snapshotted per attempt. See [THEMING.md](THEMING.md) for fresh-node requirements and host CSS variables.

Events bubble, are composed and are not cancelable:

- `map-view:ready`: `detail.provider`.
- `map-view:error`: `detail.error` as Error.
- `map-view:select`: `detail.point` (a fresh copy of the normalized point, including `data`) and `detail.index` (zero-based position in the activation snapshot).

Each marker activation emits one selection, by click or keyboard (Enter/Space), including label-only markers. Repeated activations of the same marker emit again. Linked markers keep their normal popup behavior; label-only markers select without an empty popup. Following a popup link is ordinary navigation and does not select the marker again. Selection is ignored before readiness and after cancellation, teardown or a newer attempt. There is no persistent selected-state property and no programmatic selection method.

```js
mapView.addEventListener("map-view:select", ({ detail: { point, index } }) => {
  title.textContent = point.label;
  // Application metadata can identify a record or supply content for a dialog.
  console.log(point.data, index);
});
```

For an application-owned dialog without the built-in link popup, provide a label and `data`, and omit `links`. See `/demo/maplibre.html` for an example.

Provider contract:

Provider-specific settings are validated inside the adapter, including replacements registered under a built-in name. `mount()` must resolve to a function; any other result fails activation. Cleanup functions must be idempotent. Cleanup exceptions are logged to the console and cannot block error reporting, teardown or later sessions.

```js
export async function mount({ canvas, points, center, options, signal, onError, onSelect, renderMarker }) {
  // Create SDK resources and return when first paint is usable.
  // Respect signal, and report only fatal asynchronous errors via onError(error).
  // On marker activation, call onSelect?.(index) with its index in points.
  // For custom visuals, use renderMarker?.(point, index) inside your SDK marker.
  return () => { /* release everything, idempotently */ };
}
```

`onSelect` is an optional callback for adapter interoperability. The core supplies it and validates the index/session before emitting the public event. Adapters own pointer/keyboard activation and must remove their listeners on disposal. Never pass SDK markers or raw SDK events into this callback.

Optional `renderMarker` supplies application-owned marker content, validated by the core. Adapters still own positioning, accessible interaction containers, popups and cleanup. The public `RenderMarker` type is exported from the package root.

API omissions are intentional: there are no public setters to mutate points, map camera APIs, clustering options, free-form HTML bubbles, geolocation, geocoding or remote `src` loading.
