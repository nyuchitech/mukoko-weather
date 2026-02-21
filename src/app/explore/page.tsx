import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ExplorePageClient } from "./ExplorePageClient";
import { getTagCounts, getAllLocationsFromDb, getFeaturedTagsFromDb } from "@/lib/db";
import { logError } from "@/lib/observability";
import type { TagDoc } from "@/lib/db";

// Cache for 1 hour; regenerates in the background after expiry (ISR).
// Location data changes rarely — this eliminates cold-start DB latency for visitors.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Explore Weather | mukoko weather",
  description:
    "Ask Shamwari Explorer about weather, locations, and activities. Get AI-powered weather insights, activity advice, and location comparisons across Africa.",
  openGraph: {
    title: "Explore Weather | mukoko weather",
    description:
      "Ask Shamwari Explorer about weather, locations, and activities. Get AI-powered weather insights, activity advice, and location comparisons across Africa.",
  },
};

export default async function ExplorePage() {
  let tagCounts: { tag: string; count: number }[] = [];
  let totalLocations = 0;
  let featuredTags: TagDoc[] = [];

  try {
    const [tags, locations, dbTags] = await Promise.all([
      getTagCounts(),
      getAllLocationsFromDb(),
      getFeaturedTagsFromDb(),
    ]);
    tagCounts = tags;
    totalLocations = locations.length;
    featuredTags = dbTags;
  } catch (err) {
    logError({
      source: "mongodb",
      severity: "high",
      message: "Failed to load explore page data",
      error: err,
    });
  }

  // Build a lookup map from DB tags for O(1) access
  const tagMeta = new Map(featuredTags.map((t) => [t.slug, t]));

  return (
    <>
      <Header />

      <nav aria-label="Breadcrumb" className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 md:px-8">
        <ol className="flex items-center gap-1 text-xs text-text-tertiary">
          <li>
            <Link href="/" className="hover:text-text-secondary transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">
            <span className="font-medium text-text-primary">Explore</span>
          </li>
        </ol>
      </nav>

      <main id="main-content" className="mx-auto max-w-5xl overflow-x-hidden px-4 py-6 pb-24 sm:px-6 sm:pb-6 md:px-8">
        {/* Chatbot — the spotlight feature */}
        <ExplorePageClient />

        {/* Category browse section — below the chatbot */}
        <section aria-labelledby="browse-heading" className="mt-10">
          <h2 id="browse-heading" className="text-xl font-bold text-text-primary font-heading">
            Browse by Category
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {totalLocations || "90+"} locations across Africa and ASEAN
          </p>

          {tagCounts.length === 0 && (
            <div className="mt-6 rounded-[var(--radius-card)] bg-surface-card p-6 text-center text-text-tertiary">
              <p>Location data is loading. Please run database initialisation first.</p>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tagCounts.map(({ tag, count }) => {
              const meta = tagMeta.get(tag);
              if (!meta) return null;

              return (
                <Link
                  key={tag}
                  href={`/explore/${tag}`}
                  className="group rounded-[var(--radius-card)] bg-surface-card p-4 shadow-sm transition-all hover:shadow-md hover:bg-surface-card/80 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-semibold text-text-primary font-heading group-hover:text-primary transition-colors">
                      {meta.label}
                    </h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {count}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                    {meta.description}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Country browse card */}
          <div className="mt-6 rounded-[var(--radius-card)] bg-surface-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary font-heading">Browse by Country</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Explore weather across Africa and ASEAN — grouped by country and province
                </p>
              </div>
              <Link
                href="/explore/country"
                className="shrink-0 inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-2 focus-visible:outline-primary min-h-[44px]"
              >
                Browse countries
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
