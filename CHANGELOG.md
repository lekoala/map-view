# Changelog

## Unreleased

- Extract generic point normalizer and native `<map-view>` with three activation modes.
- Add initial lazy MapLibre / Google adapters, demo-only fake provider, tests and tooling.
- Harden provider cleanup, validate disposer returns and keep provider configuration checks inside adapters.
- Accept empty point labels when safe links supply the accessible label.
- Add real local MapLibre smoke, network interception, lifecycle regressions and Google API-double tests.
- Clean up Google idle listeners, authentication hooks and SDK canvas styles; reject unknown external loader configuration.
- Export adapter contract types and declare the custom element in `HTMLElementTagNameMap`.
- Test MapLibre 6.16+ and limit its peer range to the verified major; add Windows verification to CI.
- Remains private until real Google, consumer integration and manual accessibility release gates pass.

