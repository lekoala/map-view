/** @typedef {import("./contract.js").MapCoordinate} MapCoordinate */
/** @typedef {import("./contract.js").MapPoint} MapPoint */
/** @typedef {import("./contract.js").JsonValue} JsonValue */

/** Validate and copy application metadata without silently losing non-JSON values.
 * @param {unknown} value @param {Set<object>} ancestors @returns {JsonValue} */
function normalizeData(value, ancestors = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object" || !value || ancestors.has(value)) {
    throw new TypeError("Invalid point data: expected JSON values");
  }
  ancestors.add(value);
  try {
    if (Array.isArray(value)) return Array.from(value, (item) => normalizeData(item, ancestors));
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Invalid point data: expected JSON values");
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeData(item, ancestors)]),
    );
  } finally {
    ancestors.delete(value);
  }
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** @param {unknown} value @param {string} name @returns {MapCoordinate} */
export function normalizeCoordinate(value, name = "coordinate") {
  if (
    !isRecord(value) ||
    typeof value.latitude !== "number" ||
    !Number.isFinite(value.latitude) ||
    Math.abs(value.latitude) > 90 ||
    typeof value.longitude !== "number" ||
    !Number.isFinite(value.longitude) ||
    Math.abs(value.longitude) > 180
  ) {
    throw new TypeError(`Invalid ${name}`);
  }
  return { latitude: value.latitude, longitude: value.longitude };
}

/**
 * All links are HTTP(S) and are rendered with textContent. Cross-origin links
 * are valid here; individual applications may reject them before rendering.
 * @param {unknown} value
 * @param {string} baseURI
 */
function normalizeLink(value, baseURI) {
  if (
    !isRecord(value) ||
    typeof value.label !== "string" ||
    !value.label.trim() ||
    typeof value.href !== "string" ||
    !value.href.trim()
  ) {
    throw new TypeError("Invalid map link");
  }
  let url;
  try {
    url = new URL(value.href, baseURI);
  } catch {
    throw new TypeError("Invalid map link URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new TypeError("Invalid map link protocol");
  }
  return { label: value.label.trim(), href: url.href };
}

/** @param {unknown} value @param {string} baseURI @returns {MapPoint[]} */
export function normalizePoints(value, baseURI) {
  if (!Array.isArray(value)) throw new TypeError("Invalid map points");
  return value.map((raw) => {
    const coordinate = normalizeCoordinate(raw, "map point");
    if (!isRecord(raw)) throw new TypeError("Invalid map point");
    if (raw.links !== undefined && !Array.isArray(raw.links)) throw new TypeError("Invalid map links");
    const links = (raw.links ?? []).map((link) => normalizeLink(link, baseURI));
    if (raw.label !== undefined && typeof raw.label !== "string") throw new TypeError("Invalid map label");
    const label =
      (typeof raw.label === "string" ? raw.label.trim() : "") || links.map((l) => l.label).join(", ");
    if (!label) throw new TypeError("A map point needs a label or a link");
    return {
      ...coordinate,
      label,
      links,
      ...(raw.data === undefined ? {} : { data: normalizeData(raw.data) }),
    };
  });
}

/** @param {unknown} value @returns {MapCoordinate | null} */
export function normalizeCenter(value) {
  return value == null ? null : normalizeCoordinate(value, "map center");
}

/** @param {Element | null} script @param {string} name @returns {unknown} */
export function readJsonScript(script, name) {
  if (!(script instanceof HTMLScriptElement) || script.type !== "application/json") {
    throw new TypeError(`Missing ${name} JSON script`);
  }
  try {
    return JSON.parse(script.textContent ?? "");
  } catch {
    throw new TypeError(`Invalid ${name} JSON`);
  }
}

/** @param {string | null} raw @param {number} fallback @param {string} name @param {number} min @param {number} max */
export function numberAttribute(raw, fallback, name, min, max) {
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!raw.trim() || !Number.isFinite(value) || value < min || value > max) {
    throw new TypeError(`Invalid ${name}`);
  }
  return value;
}
