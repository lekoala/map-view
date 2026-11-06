import { MapViewElement, normalizePoints } from "@lekoala/map-view";

const places = normalizePoints([{ latitude: 50, longitude: 4, label: "Here" }], "https://example.test/");
const klass: typeof HTMLElement = MapViewElement;
void klass;
void places;
MapViewElement.registerProvider("fake", async () => ({ mount: async () => () => {} }));
