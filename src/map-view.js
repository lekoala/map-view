import { normalizeCenter, normalizePoints, numberAttribute, readJsonScript } from "./validate.js";

/** @typedef {import("./contract.js").ProviderLoader} ProviderLoader */
/** @typedef {import("./contract.js").ProviderMount} ProviderMount */
/** @typedef {import("./contract.js").MapOptions} MapOptions */

/** @type {Map<string, ProviderLoader>} */
const providerLoaders = new Map();
// Imports remain inside callbacks: importing map-view NEVER imports a provider.
providerLoaders.set("maplibre", () => import("./providers/maplibre.js"));
providerLoaders.set("google", () => import("./providers/google.js"));

/** A small declarative, provider-neutral point map. Not a map engine. */
export class MapViewElement extends HTMLElement {
  /** @type {AbortController | null} */
  #session = null;
  /** @type {AbortController | null} */
  #attempt = null;
  /** @type {(() => void) | null} */
  #dispose = null;
  /** @type {IntersectionObserver | null} */
  #observer = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #timer = null;
  /** @type {"idle" | "loading" | "ready" | "error"} */
  #state = "idle";

  /** @public Register a lazy provider loader. A registered name may override a built-in provider.
   * @param {string} name @param {ProviderLoader} loader */
  static registerProvider(name, loader) {
    if (!/^[a-z][a-z0-9-]*$/.test(name) || typeof loader !== "function") {
      throw new TypeError("Invalid map provider registration");
    }
    providerLoaders.set(name, loader);
  }

  /** @public Read-only state of the current activation attempt. */
  get state() {
    return this.#state;
  }

  connectedCallback() {
    // Reconnection after a previous disconnectedCallback starts a fresh session.
    if (this.#session) return;
    const session = new AbortController();
    this.#session = session;
    this.#setState("idle");
    const open = this.querySelector("[data-map-open]");
    const retry = this.querySelector("[data-map-retry]");
    open?.addEventListener(
      "click",
      () => {
        if (this.#state === "idle") this.#start();
      },
      { signal: session.signal },
    );
    retry?.addEventListener(
      "click",
      () => {
        if (this.#state === "error") this.#start();
      },
      { signal: session.signal },
    );

    const activation = this.getAttribute("activation") ?? "click";
    if (activation === "eager") {
      queueMicrotask(() => {
        if (!session.signal.aborted) this.#start();
      });
    } else if (activation === "visible") {
      if (typeof IntersectionObserver === "undefined") {
        // Explicit fallback for engines without IntersectionObserver.
        queueMicrotask(() => {
          if (!session.signal.aborted) this.#start();
        });
      } else {
        this.#observer = new IntersectionObserver(
          (entries) => {
            if (!session.signal.aborted && entries.some((entry) => entry.isIntersecting)) {
              this.#observer?.disconnect();
              this.#observer = null;
              this.#start();
            }
          },
          { rootMargin: "200px" },
        );
        this.#observer.observe(this);
      }
    } else if (activation !== "click") {
      // Bad configuration must not trigger an implicit network request.
      this.#reportError(new TypeError(`Unknown activation: ${activation}`));
    }
  }

  disconnectedCallback() {
    this.#session?.abort();
    this.#session = null;
    this.#observer?.disconnect();
    this.#observer = null;
    this.#cancelAttempt();
    this.#setState("idle");
  }

  /** @public Explicit activation, e.g. from application-owned controls. */
  show() {
    this.#start();
  }

  /** @param {"idle" | "loading" | "ready" | "error"} state */
  #setState(state) {
    this.#state = state;
    this.dataset.state = state;
    const open = this.querySelector("[data-map-open]");
    const loading = this.querySelector("[data-map-loading]");
    const error = this.querySelector("[data-map-error]");
    const canvas = this.querySelector("[data-map-canvas]");
    if (open instanceof HTMLElement) open.hidden = state !== "idle";
    if (loading instanceof HTMLElement) loading.hidden = state !== "loading";
    if (error instanceof HTMLElement) error.hidden = state !== "error";
    if (canvas instanceof HTMLElement) {
      // Visible activation must retain a measurable placeholder BEFORE intersection.
      const reserved = state === "idle" && this.getAttribute("activation") === "visible";
      canvas.hidden = state !== "loading" && state !== "ready" && !reserved;
    }
  }

  #cancelAttempt() {
    this.#attempt?.abort();
    this.#attempt = null;
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = null;
    const dispose = this.#dispose;
    this.#dispose = null;
    dispose?.();
  }

  /** @param {unknown} error */
  #reportError(error) {
    this.#setState("error");
    this.dispatchEvent(
      new CustomEvent("map-view:error", {
        bubbles: true,
        composed: true,
        detail: { error: error instanceof Error ? error : new Error(String(error)) },
      }),
    );
  }

  #start() {
    if (!this.#session || this.#session.signal.aborted || this.#attempt || this.#state === "ready") return;
    const session = this.#session;
    const attempt = new AbortController();
    this.#attempt = attempt;
    this.#setState("loading");
    /** @param {unknown} reason */
    const fail = (reason) => {
      if (this.#session !== session || this.#attempt !== attempt || attempt.signal.aborted) return;
      this.#cancelAttempt();
      this.#reportError(reason);
    };

    const work = async () => {
      const canvas = this.querySelector("[data-map-canvas]");
      if (!(canvas instanceof HTMLElement)) throw new TypeError("Missing [data-map-canvas]");
      const points = normalizePoints(
        readJsonScript(this.querySelector("[data-map-points]"), "points"),
        document.baseURI,
      );
      const centerScript = this.querySelector("[data-map-center]");
      const center = centerScript ? normalizeCenter(readJsonScript(centerScript, "center")) : null;
      if (!center && points.length === 0) throw new TypeError("Map requires points or a center");
      const provider = this.getAttribute("provider") || "maplibre";
      const loader = providerLoaders.get(provider);
      if (!loader) throw new TypeError(`Unknown map provider: ${provider}`);
      const zoom = numberAttribute(this.getAttribute("zoom"), 12, "zoom", 0, 22);
      const maxZoom = numberAttribute(this.getAttribute("max-zoom"), 15, "max-zoom", 0, 22);
      const timeout = numberAttribute(this.getAttribute("timeout"), 15_000, "timeout", 1, 120_000);
      /** @type {MapOptions} */
      const options = {
        mapStyle: this.getAttribute("map-style") ?? undefined,
        workerUrl: this.getAttribute("worker-url") ?? undefined,
        apiKey: this.getAttribute("api-key") ?? undefined,
        mapId: this.getAttribute("map-id") ?? undefined,
        zoom,
        maxZoom,
        language: this.closest("[lang]")?.getAttribute("lang") || document.documentElement.lang || undefined,
        region: this.getAttribute("region") ?? undefined,
      };
      if (provider === "maplibre" && !options.mapStyle)
        throw new TypeError("map-style is required for MapLibre");
      if (provider === "google" && (!options.apiKey || !options.mapId))
        throw new TypeError("Google requires api-key and map-id");
      // Timeout starts before the first dynamic import, not inside the SDK.
      this.#timer = setTimeout(() => fail(new Error("Map activation timed out")), timeout);
      const module = await loader();
      if (attempt.signal.aborted || this.#session !== session) return;
      /** @type {ProviderMount | undefined} */
      const mount = typeof module === "function" ? module : "mount" in module ? module.mount : module.default;
      if (typeof mount !== "function") throw new TypeError(`Provider ${provider} has no mount()`);
      const dispose = await mount({ canvas, points, center, options, signal: attempt.signal, onError: fail });
      if (attempt.signal.aborted || this.#session !== session || this.#attempt !== attempt) {
        dispose(); // Late resolver owns cleanup even after abort.
        return;
      }
      this.#dispose = dispose;
      if (this.#timer !== null) clearTimeout(this.#timer);
      this.#timer = null;
      this.#setState("ready");
      this.dispatchEvent(
        new CustomEvent("map-view:ready", {
          bubbles: true,
          composed: true,
          detail: { provider },
        }),
      );
    };
    void work().catch(fail);
  }
}
