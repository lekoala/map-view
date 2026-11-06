import { readFileSync, writeFileSync } from "node:fs";

const path = "custom-elements.json";
const cssProperties = Array.from(
  readFileSync("src/map-view.css", "utf8").matchAll(/^\s*(--map-view-[\w-]+):\s*([^;]+);/gm),
  ([, name, value]) => ({ name, default: value.trim() }),
);
const attributes = [
  "provider",
  "activation",
  "zoom",
  "max-zoom",
  "timeout",
  "lang",
  "region",
  "api-key",
  "map-id",
  "map-style",
  "worker-url",
];
const manifest = {
  schemaVersion: "2.1.0",
  readme: "README.md",
  modules: [
    {
      kind: "javascript-module",
      path: "src/map-view.js",
      declarations: [
        {
          kind: "class",
          name: "MapViewElement",
          tagName: "map-view",
          attributes: attributes.map((name) => ({ name })),
          cssProperties,
          members: [
            {
              kind: "method",
              name: "registerProvider",
              static: true,
              description: "Register lazy provider loader",
            },
            { kind: "method", name: "show", description: "Explicitly activate a map" },
            { kind: "getter", name: "state", description: "Current activation status" },
            {
              kind: "field",
              name: "renderMarker",
              type: { text: "RenderMarker | null" },
              description: "Application marker appearance, snapshotted at activation",
            },
          ],
          events: [{ name: "map-view:ready" }, { name: "map-view:error" }, { name: "map-view:select" }],
        },
      ],
      exports: [
        {
          kind: "js",
          name: "MapViewElement",
          declaration: { name: "MapViewElement", module: "src/map-view.js" },
        },
      ],
    },
  ],
};
const output = `${JSON.stringify(manifest, null, 2)}\n`;
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8") !== output) {
    console.error("custom-elements.json is stale; run bun run build:manifest");
    process.exitCode = 1;
  } else console.log("custom-elements manifest current");
} else {
  writeFileSync(path, output);
  console.log("wrote custom-elements.json");
}
