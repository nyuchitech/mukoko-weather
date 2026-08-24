/**
 * Smart slugs — `{name}--{geohash}` URLs that carry their own coordinates.
 *
 * The problem they solve: location pages used to require a `places.placesGeo`
 * document to exist *before* a URL could mean anything, because the slug's
 * `-a1b2c3` suffix was random hex. A place the platform geography hadn't mapped
 * yet had no renderable URL at all, so browsing or searching to it produced
 * "Location not found". The database was a gate.
 *
 * A smart slug inverts that. The geohash segment decodes to a coordinate box
 * locally — no database, no network — so the page can always render, and the
 * database becomes an *enrichment* that adds a better name, province, elevation
 * and tags when it happens to have them.
 *
 *   /harare--ksy4dd7        → -17.8288, 31.0522   (Harare, 153 m box)
 *   /singapore--w21zdqp     →   1.3520, 103.8201
 *   /mbare-musika--ksy4d6r  → a POI-level spot inside Harare
 *
 * ## Why the delimiter is `--` and not `-`
 *
 * The geohash alphabet excludes a/i/l/o, but plenty of ordinary words survive
 * that filter. Six of the app's own existing seed slugs are *themselves* valid
 * geohash strings — `gweru`, `kwekwe`, `chegutu`, `guruve`, `gutu`, `ngundu`.
 * Read as a geohash, `gweru` decodes to 82.95° N in the Arctic Ocean. With a
 * single-dash delimiter, a trailing name segment of the right length and
 * alphabet would be silently mistaken for a coordinate and render weather for
 * the wrong hemisphere.
 *
 * Slugification collapses every run of non-alphanumerics to one `-`, so `--`
 * cannot occur in a generated name. Requiring it makes the parse unambiguous,
 * and it is why there is deliberately no bare-geohash URL form.
 */

import {
  DEFAULT_GEOHASH_PRECISION,
  decodeGeohash,
  encodeGeohash,
  isGeohash,
  type GeohashBounds,
} from "./geohash";

/** Separator between the human name and the geohash. Never occurs in a slugified name. */
export const SMART_SLUG_DELIMITER = "--";

/** Longest geohash we accept in a URL. Beyond ~9 the extra precision is noise. */
const MAX_GEOHASH_LENGTH = 12;

/** Maximum length of the name portion, so the whole slug stays a sane URL. */
const MAX_NAME_LENGTH = 60;

export interface ParsedSmartSlug {
  /** The slugified name portion, e.g. "mbare-musika". Empty when the slug is geohash-only. */
  nameSlug: string;
  /** Human-readable name recovered from `nameSlug`, e.g. "Mbare Musika". */
  name: string;
  /** The geohash segment, e.g. "ksy4dd7". */
  geohash: string;
  /** Centre of the geohash cell. */
  lat: number;
  lon: number;
  /** The cell — the coordinate is known only to within these bounds. */
  bounds: GeohashBounds;
  /** Half the cell diagonal in km; a natural radius for "enrich from near here". */
  errorKm: number;
}

/**
 * Slugify a place name: strip diacritics, lowercase, collapse everything
 * non-alphanumeric to single dashes.
 *
 * Mirrors `_generate_slug` in `api/py/_locations.py` minus its country suffix —
 * with smart slugs the coordinate carries the geography, so the country code no
 * longer has to be smuggled into the name.
 */
export function slugifyName(name: string): string {
  if (!name) return "";
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_NAME_LENGTH)
    .replace(/-+$/g, "");
}

/**
 * Recover a display name from a slugified name segment.
 * "mbare-musika" → "Mbare Musika".
 */
export function nameFromSlugSegment(nameSlug: string): string {
  if (!nameSlug) return "";
  return nameSlug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Build a smart slug for a named coordinate.
 *
 * Deterministic: the same name and coordinate always produce the same slug, so
 * two independent requests for the same place converge on one URL instead of
 * minting rivals the way a random suffix did.
 *
 * Returns "" when the coordinate is unusable — callers should fall back to a
 * legacy slug rather than emit a URL that decodes to nowhere.
 */
export function buildSmartSlug(
  name: string,
  lat: number,
  lon: number,
  precision: number = DEFAULT_GEOHASH_PRECISION,
): string {
  const geohash = encodeGeohash(lat, lon, precision);
  if (!geohash) return "";
  const nameSlug = slugifyName(name);
  // A nameless place still gets a usable URL; "place" beats a bare "--hash",
  // which would look broken and is not a form the parser accepts.
  const prefix = nameSlug || "place";
  return `${prefix}${SMART_SLUG_DELIMITER}${geohash}`;
}

/**
 * Parse a smart slug into its name and decoded coordinate.
 *
 * Returns null for anything that isn't a smart slug — including every legacy
 * slug (`harare`, `nairobi-ke`), which by design contains no `--` and must keep
 * resolving through the existing catalog/placesGeo path.
 */
export function parseSmartSlug(slug: string): ParsedSmartSlug | null {
  if (!slug || !slug.includes(SMART_SLUG_DELIMITER)) return null;

  // Split on the LAST delimiter: a name may legitimately contain one (rare, but
  // "foo--bar--ksy4dd7" should treat "foo--bar" as the name).
  const idx = slug.lastIndexOf(SMART_SLUG_DELIMITER);
  const nameSlug = slug.slice(0, idx);
  const geohash = slug.slice(idx + SMART_SLUG_DELIMITER.length).toLowerCase();

  if (!geohash || geohash.length > MAX_GEOHASH_LENGTH) return null;
  if (!isGeohash(geohash)) return null;

  const decoded = decodeGeohash(geohash);
  if (!decoded) return null;

  return {
    nameSlug,
    name: nameFromSlugSegment(nameSlug),
    geohash,
    lat: decoded.lat,
    lon: decoded.lon,
    bounds: decoded.bounds,
    errorKm: decoded.errorKm,
  };
}

/** True when `slug` is a parseable smart slug. */
export function isSmartSlug(slug: string): boolean {
  return parseSmartSlug(slug) !== null;
}

/**
 * True when `slug` uses the legacy form (no coordinate embedded) and must be
 * resolved through the static catalog / placesGeo chain.
 */
export function isLegacySlug(slug: string): boolean {
  return !!slug && !isSmartSlug(slug);
}
