export type ProviderLoader = import("./contract.js").ProviderLoader;
export type ProviderMount = import("./contract.js").ProviderMount;
export type MapOptions = import("./contract.js").MapOptions;
/** A small declarative, provider-neutral point map. Not a map engine. */
export declare class MapViewElement extends HTMLElement {
    #private;
    /** @public Register a lazy provider loader. A registered name may override a built-in provider.
     * @param {string} name @param {ProviderLoader} loader */
    static registerProvider(name: string, loader: ProviderLoader): void;
    /** @public Read-only state of the current activation attempt. */
    get state(): "error" | "idle" | "loading" | "ready";
    connectedCallback(): void;
    disconnectedCallback(): void;
    /** @public Explicit activation, e.g. from application-owned controls. */
    show(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "map-view": MapViewElement;
  }
}
