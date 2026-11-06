# Marker appearance and themes

## Custom markers

After the element is defined and before activation, assign a synchronous `renderMarker(point, index)` callback. It receives an independent copy of the normalized point, including optional `data`, and the zero-based activation index. Return a new detached `HTMLElement` for each point. A span/div can contain your SVG, image, avatar or numbered badge. Use non-interactive content: the adapter supplies the focusable, named interaction container.

```js
await customElements.whenDefined("map-view");
const map = document.querySelector("map-view");
map.renderMarker = (point, index) => {
  const badge = document.createElement("span");
  badge.className = "location-badge";
  badge.textContent = String(index + 1);
  return badge;
};
```

```css
.location-badge {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #6b247a;
  color: white;
}
```

`null` uses the SDK's default markers. The callback is snapshotted with points/options at activation, including across asynchronous provider imports. Changing it while loading or mounted does not update existing markers; disconnect/reconnect to apply a replacement. Strings, promises, connected nodes and reused elements fail activation and trigger SDK cleanup. Throwing callbacks also fail activation. Old attempts cannot invoke a callback after cancellation. Application callback code owns its own external resources and listeners.

MapLibre anchors custom visuals at bottom-center; Google uses its default bottom-center marker anchor. Adapters retain the label, pointer/keyboard activation, popups, selection and teardown. The callback never receives SDK objects. Custom providers can opt into the same optional `renderMarker(point, index)` provider-context function. Their caller validates the return before it reaches the SDK.

The demo has a **Markers** selector on `/demo/maplibre.html` and `/demo/google.html`. Choose **Custom numbered markers** before loading.

## CSS variables

`map-view.css` declares its theme defaults on `map-view`. Override them on a host class, inline style or another more specific host selector. They inherit into popup content. CSS changes take effect while mounted, independently of the activation snapshot.

```css
map-view.brand-map {
  --map-view-popup-background: #202938;
  --map-view-popup-color: #eef2f7;
  --map-view-popup-link-background: #31425b;
  --map-view-popup-link-hover-background: #415776;
  --map-view-popup-link-color: #cee5ff;
  --map-view-focus-color: #ffc76b;
  --map-view-popup-radius: 18px;
}
```

| Variable | Default |
| --- | --- |
| `--map-view-font-family` | `system-ui, sans-serif` |
| `--map-view-focus-color` | `#1754a3` |
| `--map-view-focus-width` | `2px` |
| `--map-view-focus-offset` | `2px` |
| `--map-view-popup-background` | `#fff` |
| `--map-view-popup-color` | `#203047` |
| `--map-view-popup-min-width` | `160px` |
| `--map-view-popup-max-width` | `280px` |
| `--map-view-popup-font-size` | `14px` |
| `--map-view-popup-line-height` | `1.5` |
| `--map-view-popup-padding` | `16px` |
| `--map-view-popup-radius` | `12px` |
| `--map-view-popup-shadow` | `0 8px 28px #152b4930` |
| `--map-view-popup-title-size` | `15px` |
| `--map-view-popup-title-weight` | `650` |
| `--map-view-popup-title-gap` | `10px` |
| `--map-view-popup-link-gap` | `6px` |
| `--map-view-popup-link-padding` | `8px 10px` |
| `--map-view-popup-link-radius` | `6px` |
| `--map-view-popup-link-background` | `#edf4ff` |
| `--map-view-popup-link-hover-background` | `#deebff` |
| `--map-view-popup-link-color` | `#1754a3` |
| `--map-view-popup-link-weight` | `500` |
| `--map-view-popup-close-size` | `24px` |
| `--map-view-popup-close-inset` | `5px` |
| `--map-view-popup-close-radius` | `50%` |
| `--map-view-popup-close-color` | `#526174` |
| `--map-view-popup-close-hover-background` | `#edf4ff` |
| `--map-view-popup-close-font-size` | `20px` |

Content variables work across both adapters. Chrome variables (padding, radius, shadow, close button and tip) style the MapLibre popup; Google's outer InfoWindow and SDK controls retain SDK styling. Custom marker visuals use application CSS rather than these popup variables. Preserve visible focus and adequate contrast when overriding colors.

Use the demo's **Popup and marker theme** selector to change themes without reloading the map. The theme presets and marker badge CSS are application examples in `demo/appearance.css`, not additional package defaults.
