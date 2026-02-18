import { CardSkeleton } from "@/components/ui/skeleton";

export default function ExploreCountryLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:px-8" aria-label="Loading countries" role="status">
      <div className="h-8 w-48 rounded-[var(--radius-sm)] bg-surface-card animate-pulse mb-2" />
      <div className="h-4 w-64 rounded-[var(--radius-sm)] bg-surface-card animate-pulse mb-8" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <span className="sr-only">Loading countries&hellip;</span>
    </div>
  );
}
