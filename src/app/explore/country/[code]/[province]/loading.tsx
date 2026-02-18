import { CardSkeleton } from "@/components/ui/skeleton";

export default function ProvinceDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:px-8" aria-label="Loading province" role="status">
      <div className="h-8 w-56 rounded-[var(--radius-sm)] bg-surface-card animate-pulse mb-2" />
      <div className="h-4 w-40 rounded-[var(--radius-sm)] bg-surface-card animate-pulse mb-8" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <span className="sr-only">Loading province details&hellip;</span>
    </div>
  );
}
