/**
 * Tests for `resolveLocationSlug` — the render path behind every `/{slug}`
 * weather page.
 *
 * These live in their own file because they mock the `placesGeo` collection at
 * the `./db` boundary, which the pure-logic tests in `places.test.ts`
 * deliberately avoid.
 *
 * The invariant under test: a slug the app SHIPS and ADVERTISES (sitemap,
 * /explore, search, the 404 page's own suggestions) must never 404, whatever
 * `places.placesGeo` happens to contain. Before this, the two sources could
 * disagree — the catalog offered 265 slugs while only those with a matching
 * placesGeo city/town/village document could render, so browsing or searching
 * to a location returned "Location not found".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

/** Mutable stand-in for the placesGeo collection, swapped per test. */
let findOneImpl: (filter: unknown) => Promise<unknown>;
let findArrayImpl: () => Promise<unknown[]>;

vi.mock("./db", () => ({
  placesGeoCollection: () => ({
    findOne: (filter: unknown) => findOneImpl(filter),
    find: () => ({
      limit: () => ({ toArray: () => findArrayImpl() }),
      // `ensureCountryCache` iterates a cursor directly.
      [Symbol.asyncIterator]: async function* () {},
    }),
  }),
  placesCollection: () => ({}),
}));

const { resolveLocationSlug } = await import("./places");

describe("resolveLocationSlug — seed fallback", () => {
  beforeEach(() => {
    findOneImpl = async () => null;
    findArrayImpl = async () => [];
  });

  it("renders a shipped slug when placesGeo has NO matching document", async () => {
    const loc = await resolveLocationSlug("singapore-sg");
    expect(loc).not.toBeNull();
    expect(loc?.name).toBe("Singapore");
    expect(loc?.slug).toBe("singapore-sg");
    // Real coordinates, so the weather fetch downstream actually works.
    expect(loc?.lat).toBeCloseTo(1.35, 1);
    expect(loc?.lon).toBeCloseTo(103.82, 1);
  });

  it("renders a shipped ZW slug when placesGeo has no matching document", async () => {
    const loc = await resolveLocationSlug("harare");
    expect(loc?.name).toBe("Harare");
    expect(loc?.country).toBe("ZW");
  });

  it("renders a shipped slug when the placesGeo lookup THROWS (DB outage)", async () => {
    // A transient Mongo failure used to surface as a permanent
    // "Location not found" — an outage must degrade, not 404.
    findOneImpl = async () => {
      throw new Error("connection timed out");
    };
    findArrayImpl = async () => {
      throw new Error("connection timed out");
    };
    const loc = await resolveLocationSlug("bulawayo");
    expect(loc?.name).toBe("Bulawayo");
  });

  it("still returns null for a slug the app does NOT ship", async () => {
    // Genuine 404s must stay 404s — the fallback is scoped to the catalog.
    expect(await resolveLocationSlug("not-a-real-place-xyz")).toBeNull();
    expect(await resolveLocationSlug("")).toBeNull();
  });

  it("prefers a real placesGeo document over the seed when one exists", async () => {
    findOneImpl = async () => ({
      _id: "platform-uuid",
      name: "Harare",
      slug: "harare-a1b2c3",
      geoType: "city",
      geo: { type: "Point", coordinates: [31.05, -17.83] },
      isoCode: "ZW",
      sourceProvenance: { mukokoSlug: "harare", mukokoProvince: "Harare Metropolitan" },
    });
    const loc = await resolveLocationSlug("harare");
    expect(loc?._id).toBe("platform-uuid");
    expect(loc?.platformSlug).toBe("harare-a1b2c3");
    expect(loc?.province).toBe("Harare Metropolitan");
  });

  it("accepts a country-level document for a city-state whose seed name matches", async () => {
    // Singapore exists in placesGeo only as a `country`. Excluding country
    // documents unconditionally made every city-state slug unresolvable.
    findArrayImpl = async () => [
      {
        _id: "sg-country",
        name: "Singapore",
        geoType: "country",
        geo: { type: "Point", coordinates: [103.82, 1.35] },
        isoCode: "SG",
      },
    ];
    const loc = await resolveLocationSlug("singapore-sg");
    expect(loc?.name).toBe("Singapore");
    expect(loc?.country).toBe("SG");
  });

  it("does NOT let a country document hijack a slug whose name differs from it", async () => {
    // `/harare` must never resolve to the Zimbabwe country entry.
    findArrayImpl = async () => [
      {
        _id: "zw-country",
        name: "Harare",
        geoType: "country",
        geo: { type: "Point", coordinates: [0, 0] },
      },
    ];
    const loc = await resolveLocationSlug("harare");
    // Falls back to the seed's real coordinates, not the country document.
    expect(loc?._id).toBe("seed:harare");
    expect(loc?.lat).toBeCloseTo(-17.83, 1);
  });
});

describe("CITY_STATE_COUNTRIES", () => {
  it("mirrors the _CITY_STATES set in api/py/_locations.py", async () => {
    const { CITY_STATE_COUNTRIES } = await import("./places");
    expect([...CITY_STATE_COUNTRIES].sort()).toEqual(
      ["SG", "MC", "VA", "GI", "SM", "AD", "LI", "MT", "BN", "DJ", "BH", "QA", "KW"].sort(),
    );
  });
});
