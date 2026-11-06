export type ProviderContext = import("../contract.js").ProviderContext;
/** @param {ProviderContext} context */
export declare function mount({ canvas, points, center, options, signal, onError, onSelect, renderMarker }: ProviderContext): Promise<() => void>;
