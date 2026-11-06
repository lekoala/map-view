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
  {"latitude":50.85,"longitude":4.35,"label":"Office"},
  {"latitude":50.9,"longitude":4.4,"links":[{"label":"Profile","href":"/doctors/a"}]}
]
```

`label` may be omitted if nonempty `links` are present. Empty links are valid if label exists. Link `label` and URL must be strings with nonempty content. Relative links are resolved from `document.baseURI`; only HTTP(S) URLs accepted, including cross-origin. Popups are rendered with DOM/textContent. Invalid entries reject the entire activation before invoking the provider.

## JS public surface

- `MapViewElement.registerProvider(name, () => import("./adapter.js"))` — register lazy loader, optionally overriding a built-in.
- `element.show()` — request activation programmatically (also works with `activation="click"`).
- `element.state` — read-only `idle|loading|ready|error`.

Events bubble and are composed: `map-view:ready` (`detail.provider`) and `map-view:error` (`detail.error` as Error). They are not cancellation events. There is no `open` event in 0.1.

Provider contract:

Provider-specific settings are validated inside the adapter, including replacements registered under a built-in name. `mount()` must resolve to a function; any other result fails activation. Cleanup functions must be idempotent. Cleanup exceptions are logged to the console and cannot block error reporting, teardown or later sessions.

```js
export async function mount({ canvas, points, center, options, signal, onError }) {
  // Create SDK resources and return when first paint is usable.
  // Respect signal, and report only fatal asynchronous errors via onError(error).
  return () => { /* release everything, idempotently */ };
}
```

API omissions are intentional: there are no public setters to mutate points, map camera APIs, clustering options, free-form HTML bubbles, geolocation, geocoding or remote `src` loading.
