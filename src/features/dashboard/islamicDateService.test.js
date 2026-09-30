import assert from "node:assert/strict";
import test from "node:test";
import {
  getIslamicDate,
  getIslamicDateCountryOffset,
} from "./islamicDateService.js";

const mockHijriResponse = {
  code: 200,
  data: {
    hijri: {
      day: "12",
      month: { number: 3, en: "Rabi al-awwal" },
      year: "1448",
    },
  },
};

test("selected countries use the intended Saudi-relative calendar offset", () => {
  for (const country of ["IN", "PK", "BD", "AF"]) {
    assert.equal(getIslamicDateCountryOffset(country), -1, country);
    assert.equal(getIslamicDateCountryOffset(country.toLowerCase()), -1, country);
  }
  assert.equal(getIslamicDateCountryOffset("SA"), 0);
  assert.equal(getIslamicDateCountryOffset("US"), 0);
  assert.equal(getIslamicDateCountryOffset(null), 0);
});

test("requests AlAdhan with the selected country's adjusted Saudi date", async () => {
  const requests = [];
  const fetcher = async (url, options) => {
    requests.push({ url, options });
    return {
      ok: true,
      json: async () => mockHijriResponse,
    };
  };
  const now = new Date("2026-09-29T20:59:00.000Z");

  const indiaDate = await getIslamicDate({
    countryCode: "IN",
    now,
    fetcher,
  });
  const saudiDate = await getIslamicDate({
    countryCode: "SA",
    now,
    fetcher,
  });

  assert.equal(indiaDate.apiDate, "28-09-2026");
  assert.equal(saudiDate.apiDate, "29-09-2026");
  assert.equal(indiaDate.day, 12);
  assert.equal(indiaDate.month, 3);
  assert.equal(indiaDate.year, 1448);
  assert.match(indiaDate.text, /Rabi/);
  assert.equal(
    requests[0].url,
    "https://api.aladhan.com/v1/gToH/28-09-2026",
  );
  assert.equal(requests[0].options.headers.Accept, "application/json");
});

test("rejects failed or malformed public API responses", async () => {
  await assert.rejects(
    getIslamicDate({
      now: new Date("2026-09-29T20:59:00.000Z"),
      fetcher: async () => ({ ok: false, status: 503 }),
    }),
    /returned 503/,
  );
  await assert.rejects(
    getIslamicDate({
      now: new Date("2026-09-29T20:59:00.000Z"),
      fetcher: async () => ({
        ok: true,
        json: async () => ({ code: 200, data: { hijri: { day: "x" } } }),
      }),
    }),
    /unreadable date/,
  );
});
