"use client";

import { Suspense, lazy } from "react";
import { ChartErrorBoundary } from "@/components/weather/ChartErrorBoundary";
import { ChatSkeleton } from "@/components/ui/skeleton";

const ExploreChatbot = lazy(() =>
  import("@/components/explore/ExploreChatbot").then((m) => ({ default: m.ExploreChatbot }))
);

export function ExplorePageClient() {
  return (
    <section aria-labelledby="explore-heading">
      <h1 id="explore-heading" className="text-2xl font-bold text-text-primary font-heading sm:text-3xl">
        Explore
      </h1>
      <p className="mt-2 text-text-secondary">
        Ask Shamwari Explorer about weather, locations, and activities across Africa.
      </p>

      {/* Chatbot container — fills available height on mobile, fixed height on desktop.
          NOTE: Intentionally NOT wrapped in LazySection. As the primary above-the-fold
          content of the Explore page, the chatbot must load eagerly. It uses React.lazy
          + Suspense with ChatSkeleton for code-splitting instead. */}
      <div className="mt-6 flex flex-col rounded-[var(--radius-card)] border border-border bg-surface-base/50 shadow-sm overflow-hidden h-[60vh] min-h-[400px] max-h-[700px]">
        <ChartErrorBoundary name="Explore Chatbot">
          <Suspense fallback={<ChatSkeleton />}>
            <ExploreChatbot />
          </Suspense>
        </ChartErrorBoundary>
      </div>
    </section>
  );
}
