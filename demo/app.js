import { MapViewElement } from "/src/index.js";

MapViewElement.registerProvider("demo", () => import("/demo/mock-provider.js"));
await import("/src/define.js");
