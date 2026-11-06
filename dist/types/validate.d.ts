/** @typedef {import("./contract.js").MapCoordinate} MapCoordinate */
/** @typedef {import("./contract.js").MapPoint} MapPoint */
export type MapCoordinate = import("./contract.js").MapCoordinate;
export type MapPoint = import("./contract.js").MapPoint;
/** @param {unknown} value @param {string} name @returns {MapCoordinate} */
export declare function normalizeCoordinate(value: unknown, name?: string): MapCoordinate;
/** @param {unknown} value @param {string} baseURI @returns {MapPoint[]} */
export declare function normalizePoints(value: unknown, baseURI: string): MapPoint[];
/** @param {unknown} value @returns {MapCoordinate | null} */
export declare function normalizeCenter(value: unknown): MapCoordinate | null;
/** @param {Element | null} script @param {string} name @returns {unknown} */
export declare function readJsonScript(script: Element | null, name: string): unknown;
/** @param {string | null} raw @param {number} fallback @param {string} name @param {number} min @param {number} max */
export declare function numberAttribute(raw: string | null, fallback: number, name: string, min: number, max: number): number;
