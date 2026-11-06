import type {
  MapOptions,
  MapPoint,
  MapSelectDetail,
  ProviderContext,
  ProviderLoader,
  ProviderMount,
} from "@lekoala/map-view";
import { MapViewElement, normalizePoints } from "@lekoala/map-view";

const places = normalizePoints([{ latitude: 50, longitude: 4, label: "Here" }], "https://example.test/");
const klass: typeof HTMLElement = MapViewElement;
void klass;
void places;
MapViewElement.registerProvider("fake", async () => ({ mount: async () => () => {} }));

const point: MapPoint = { ...places[0], data: { id: 42, tags: ["office"] } };
const adapter: ProviderMount = async (context: ProviderContext) => {
  const options: MapOptions = context.options;
  void options;
  return () => {};
};
const loader: ProviderLoader = async () => ({ mount: adapter });
MapViewElement.registerProvider("typed", loader);
document.createElement("map-view").show();
document.createElement("map-view").addEventListener("map-view:select", (event) => {
  const detail: MapSelectDetail = event.detail;
  const selected: MapPoint = detail.point;
  const index: number = detail.index;
  void detail.point.data;
  void selected;
  void index;
});
void point;
