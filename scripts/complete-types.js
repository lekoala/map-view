import { appendFileSync } from "node:fs";

// JavaScript cannot declare global TypeScript interfaces. Augment the class module
// so importing either the root entry or ./define registers the element type.
appendFileSync(
  "dist/types/map-view.d.ts",
  `
declare global {
  interface HTMLElementTagNameMap {
    "map-view": MapViewElement;
  }
}
`,
);
