# Changelog

## Unreleased

- Add snapshotted `renderMarker(point, index)` DOM callbacks for both adapters, preserving accessible selection and popups.
- Expose host CSS variables for popup colors, fonts, spacing, sizing, corners, shadows and focus; add live theme and numbered-marker demo examples.

- Restyle linked-marker popups with a title, compact link cards, rounded MapLibre chrome and visible keyboard focus.
- Offer explicit OpenFreeMap and LFMaps backgrounds in the MapLibre demo.

- Add `map-view:select` with copied point data and snapshot index across Google, MapLibre and the offline demo.
- Preserve optional JSON point metadata in `data` for consumer-owned details views and dialogs.
- Add a real MapLibre demo with a local background, explicit custom style input and a selection/details example.

- Prepare the Google demo loader for browsers and exercise the real loader with an intercepted remote SDK request.

- Extract generic point normalizer and native `<map-view>` with three activation modes.
- Add initial lazy MapLibre / Google adapters, demo-only fake provider, tests and tooling.
- Harden provider cleanup, validate disposer returns and keep provider configuration checks inside adapters.
- Accept empty point labels when safe links supply the accessible label.
- Add real local MapLibre smoke, network interception, lifecycle regressions and Google API-double tests.
- Clean up Google idle listeners, authentication hooks and SDK canvas styles; reject unknown external loader configuration.
- Export adapter contract types and declare the custom element in `HTMLElementTagNameMap`.
- Test MapLibre 6.16+ and limit its peer range to the verified major; add Windows verification to CI.
- Remains private until real Google, consumer integration and manual accessibility release gates pass.

