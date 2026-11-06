import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeCenter, normalizePoints, numberAttribute } from "../../src/validate.js";

const base = "https://example.test/";
describe("generic point contract", () => {
  it("accepts label-only and cross-origin HTTP(S) links", () => {
    assert.deepEqual(normalizePoints([{ latitude: 50.8, longitude: 4.3, label: "City" }], base)[0].links, []);
    const [point] = normalizePoints(
      [{ latitude: 50.8, longitude: 4.3, links: [{ label: "Office", href: "https://other.test/office" }] }],
      base,
    );
    assert.equal(point.label, "Office");
    assert.equal(point.links[0].href, "https://other.test/office");
  });
  it("resolves local links and rejects unsafe protocols", () => {
    assert.equal(
      normalizePoints([{ latitude: 0, longitude: 0, links: [{ label: "A", href: "/a" }] }], base)[0].links[0]
        .href,
      "https://example.test/a",
    );
    for (const href of ["javascript:alert(1)", "data:text/html,hello", "ftp://example.com"])
      assert.throws(
        () => normalizePoints([{ latitude: 0, longitude: 0, links: [{ label: "Bad", href }] }], base),
        /protocol/,
      );
  });
  it("rejects out-of-range coordinates, missing point labels and malformed links", () => {
    for (const point of [
      { latitude: 91, longitude: 0, label: "bad" },
      { latitude: 0, longitude: 181, label: "bad" },
      { latitude: NaN, longitude: 0, label: "bad" },
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0, links: [{ label: "", href: "/" }] },
    ])
      assert.throws(() => normalizePoints([point], base));
  });
  it("supports nullable center and validates numeric attributes", () => {
    assert.equal(normalizeCenter(null), null);
    assert.deepEqual(normalizeCenter({ latitude: 0, longitude: 180 }), { latitude: 0, longitude: 180 });
    assert.throws(() => normalizeCenter({ latitude: Infinity, longitude: 0 }));
    assert.equal(numberAttribute(null, 12, "zoom", 0, 22), 12);
    assert.throws(() => numberAttribute("", 12, "zoom", 0, 22));
    assert.throws(() => numberAttribute("23", 12, "zoom", 0, 22));
  });
});
