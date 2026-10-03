import assert from "node:assert/strict";
import test from "node:test";
import {
  getIslamicDate,
  getIslamicDateCacheKey,
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

test("uses the keyed Hijri cache first and refreshes it in the background", async () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  });
  const now = new Date("2026-09-29T20:59:00.000Z");
  const key = getIslamicDateCacheKey("29-09-2026", "sa", "en");
  let requests = 0;
  let refreshed;

  try {
    const first = await getIslamicDate({
      countryCode: "SA",
      locale: "en",
      now,
      fetcher: async () => {
        requests += 1;
        return { ok: true, json: async () => mockHijriResponse };
      },
    });
    assert.equal(first.day, 12);
    assert.ok(values.has(key));

    const cached = await getIslamicDate({
      countryCode: "SA",
      locale: "en",
      now,
      onRefresh: (value) => { refreshed = value; },
      fetcher: async () => {
        requests += 1;
        return {
          ok: true,
          json: async () => ({
            ...mockHijriResponse,
            data: { hijri: { ...mockHijriResponse.data.hijri, day: "13" } },
          }),
        };
      },
    });
    assert.equal(cached.day, 12);
    assert.equal(requests, 2);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(refreshed.day, 13);
    assert.equal(JSON.parse(values.get(key)).day, 13);
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else delete globalThis.localStorage;
  }
});
