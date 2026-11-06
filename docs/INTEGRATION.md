# Consumer integration

1. Resolve `@lekoala/map-view/define` and relative dynamic `./providers/*.js` imports through the bundler or importmap. Map optional bare SDK specifiers explicitly.
2. Load `map-view.css` and the MapLibre SDK stylesheet when applicable. Give the canvas a nonzero block size. Keep responsive layout in the application.
3. Emit points and optional center as JSON data scripts. Put scalar provider settings in attributes. Apply application-specific link restrictions before emitting data.
4. Supply an explicit MapLibre style and optional worker URL, or a restricted Google browser key and map ID. Preserve lazy SDK imports.
5. Test partial navigation, hidden layouts, retry and zero SDK/style/tile requests before activation in the consuming application.

For Symfony AssetMapper/importmap, preserve literal dynamic relative imports and map optional package specifiers to browser-ready assets. This repository does not include or claim a framework-specific integration test. Consumer applications should validate their own asset configuration; these fixtures are outside the package release gate. Application migrations belong in their own repositories.
