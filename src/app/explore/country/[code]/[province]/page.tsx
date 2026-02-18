import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCountryByCode, getLocationsByProvince } from "@/lib/db";
import { getFlagEmoji } from "@/lib/countries";
import { logError } from "@/lib/observability";

export const revalidate = 3600;

interface Props {
  params: Promise<{ code: string; province: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code, province } = await params;
  const country = await getCountryByCode(code.toUpperCase()).catch(() => null);
  const countryName = country?.name ?? code.toUpperCase();
  const flag = getFlagEmoji(code.toUpperCase());
  // Pretty-print the province slug
  const provinceName = province.replace(new RegExp(`-${code.toLowerCase()}$`), "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${flag} ${provinceName}, ${countryName} Weather | mukoko weather`,
    description: `Browse weather forecasts for locations in ${provinceName}, ${countryName}.`,
  };
}

export default async function ProvinceDetailPage({ params }: Props) {
  const { code, province: provinceSlug } = await params;
  const upperCode = code.toUpperCase();

  let locations: Awaited<ReturnType<typeof getLocationsByProvince>> = [];
  let countryName = upperCode;
  let provinceName = provinceSlug;

  try {
    const [locs, country] = await Promise.all([
      getLocationsByProvince(provinceSlug),
      getCountryByCode(upperCode),
    ]);
    locations = locs;
    countryName = country?.name ?? upperCode;
    // Derive a human-readable province name from the slug
    provinceName = provinceSlug
      .replace(new RegExp(`-${code.toLowerCase()}$`), "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch (err) {
    logError({
      source: "mongodb",
      severity: "high",
      message: "Failed to load province detail page",
      error: err,
      meta: { code: upperCode, provinceSlug },
    });
  }

  if (locations.length === 0) notFound();

  const flag = getFlagEmoji(upperCode);

  return (
    <>
      <Header />

      <nav aria-label="Breadcrumb" className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 md:px-8">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-text-tertiary">
          <li>
            <Link href="/" className="hover:text-text-secondary transition-colors">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/explore" className="hover:text-text-secondary transition-colors">Explore</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/explore/country" className="hover:text-text-secondary transition-colors">Countries</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/explore/country/${code.toLowerCase()}`} className="hover:text-text-secondary transition-colors">
              {countryName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">
            <span className="font-medium text-text-primary">{provinceName}</span>
          </li>
        </ol>
      </nav>

      <main
        id="main-content"
        className="mx-auto max-w-5xl overflow-x-hidden px-4 py-6 pb-24 sm:px-6 sm:pb-6 md:px-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl" aria-hidden="true">{flag}</span>
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-heading sm:text-3xl">
              {provinceName}
            </h1>
            <p className="text-sm text-text-secondary">
              {countryName} &bull; {locations.length} location{locations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Link
              key={loc.slug}
              href={`/${loc.slug}`}
              className="group rounded-[var(--radius-card)] bg-surface-card p-4 shadow-sm transition-all hover:shadow-md hover:bg-surface-card/80 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <h2 className="font-medium text-text-primary group-hover:text-primary transition-colors">
                {loc.name}
              </h2>
              {loc.elevation > 0 && (
                <p className="mt-0.5 text-xs text-text-tertiary">
                  {loc.elevation.toLocaleString()} m elevation
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {loc.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
