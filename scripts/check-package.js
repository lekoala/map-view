import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const result = execFileSync(
  process.platform === "win32" ? process.execPath : "npm",
  [
    ...(process.platform === "win32"
      ? [join(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js")]
      : []),
    "pack",
    "--dry-run",
    "--json",
    "--ignore-scripts",
  ],
  { encoding: "utf8" },
);
const files = JSON.parse(result)
  .at(0)
  .files.map((file) => file.path);
const required = [
  "src/index.js",
  "src/define.js",
  "src/map-view.js",
  "src/providers/google.js",
  "src/providers/maplibre.js",
  "src/map-view.css",
  "dist/types/index.d.ts",
  "custom-elements.json",
  "README.md",
  "LICENSE",
];
const problems = [];
for (const path of required) if (!files.includes(path)) problems.push(`missing ${path}`);
for (const path of files)
  if (["test/", "demo/", "scripts/", "references/"].some((prefix) => path.startsWith(prefix)))
    problems.push(`dev file shipped: ${path}`);
function targets(entry) {
  return typeof entry === "string"
    ? [entry]
    : entry && typeof entry === "object"
      ? Object.values(entry).flatMap(targets)
      : [];
}
for (const target of [...Object.values(pkg.exports).flatMap(targets), ...pkg.sideEffects])
  if (!files.includes(target.slice(2))) problems.push(`unresolved export/sideEffect: ${target}`);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else console.log(`package OK (${files.length} files)`);
