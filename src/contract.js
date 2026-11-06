/**
 * Public, engine-independent data contract. There is no universal map API.
 * @typedef {{latitude: number, longitude: number}} MapCoordinate
 * @typedef {{href: string, label: string}} MapLink
 * @typedef {null | boolean | number | string | JsonValue[] | {[key: string]: JsonValue}} JsonValue
 * @typedef {MapCoordinate & {label: string, links: MapLink[], data?: JsonValue}} MapPoint
 * @typedef {{point: MapPoint, index: number}} MapSelectDetail
 * @typedef {{mapStyle: string | undefined, workerUrl: string | undefined, apiKey: string | undefined, mapId: string | undefined, zoom: number, maxZoom: number, language: string | undefined, region: string | undefined}} MapOptions
 * @typedef {{canvas: HTMLElement, points: MapPoint[], center: MapCoordinate | null, options: MapOptions, signal: AbortSignal, onError: (error: unknown) => void, onSelect?: (index: number) => void}} ProviderContext
 * @typedef {(context: ProviderContext) => Promise<() => void>} ProviderMount
 * @typedef {() => Promise<{mount: ProviderMount} | {default: ProviderMount} | ProviderMount>} ProviderLoader
 */
export {};
