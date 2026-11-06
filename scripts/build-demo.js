// The upstream ESM loader expects bundlers to replace process.env.NODE_ENV.
// Prepare a local browser entry; importing it remains deferred until activation.
const result = await Bun.build({
  entrypoints: ["./node_modules/@googlemaps/js-api-loader/dist/index.js"],
  outdir: "./demo/vendor",
  naming: "google-loader.js",
  target: "browser",
  format: "esm",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
});
if (!result.success) {
  console.error(...result.logs);
  process.exitCode = 1;
}
