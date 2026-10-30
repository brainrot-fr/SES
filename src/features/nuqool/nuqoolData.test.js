import test from "node:test";
import assert from "node:assert/strict";
import { nuqoolData, nuqoolScript } from "./nuqool.data.js";

test("Nuqool data contains 55 ordered records with supported part types", () => {
  assert.equal(nuqoolScript, "roman-urdu");
  assert.equal(nuqoolData.length, 55);
  assert.deepEqual(nuqoolData.map((entry) => entry.id), Array.from({ length: 55 }, (_, i) => i + 1));
  for (const entry of nuqoolData) {
    assert.ok(Array.isArray(entry.parts));
    assert.ok(Array.isArray(entry.sources));
    for (const part of entry.parts) {
      assert.ok(["text", "quote", "ayah", "hadith"].includes(part.type));
      assert.equal(typeof part.text, "string");
    }
  }
});

test("quotation marks are carried inside quote content and sources remain separate", () => {
  assert.equal(nuqoolData[1].parts[1].text.startsWith('"'), true);
  assert.equal(nuqoolData[1].parts[1].text.endsWith('"'), true);
  assert.deepEqual(nuqoolData[1].sources, ["Aqeeda Sharifa pgno. 4"]);
  assert.ok(nuqoolData[17].parts.some((part) => part.type === "ayah"));
  assert.ok(nuqoolData[25].parts.some((part) => part.type === "hadith"));
});
