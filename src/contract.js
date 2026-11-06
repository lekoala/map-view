/**
 * Public, engine-independent data contract. There is no universal map API.
 * @typedef {{latitude: number, longitude: number}} MapCoordinate
 * @typedef {{href: string, label: string}} MapLink
 * @typedef {MapCoordinate & {label: string, links: MapLink[]}} MapPoint
 * @typedef {{mapStyle: string | undefined, workerUrl: string | undefined, apiKey: string | undefined, mapId: string | undefined, zoom: number, maxZoom: number, language: string | undefined, region: string | undefined}} MapOptions
 * @typedef {{canvas: HTMLElement, points: MapPoint[], center: MapCoordinate | null, options: MapOptions, signal: AbortSignal, onError: (error: unknown) => void}} ProviderContext
 * @typedef {(context: ProviderContext) => Promise<() => void>} ProviderMount
 * @typedef {() => Promise<{mount: ProviderMount} | {default: ProviderMount} | ProviderMount>} ProviderLoader
 */
export {};
