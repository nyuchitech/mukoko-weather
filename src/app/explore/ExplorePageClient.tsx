"use client";

import { ExploreChatbot } from "@/components/explore/ExploreChatbot";

export function ExplorePageClient() {
  return (
    <section aria-labelledby="explore-heading">
      <h1 id="explore-heading" className="text-2xl font-bold text-text-primary font-heading sm:text-3xl">
        Explore
      </h1>
      <p className="mt-2 text-text-secondary">
        Ask Shamwari Explorer about weather, locations, and activities across Africa.
      </p>

      {/* Chatbot container — fills available height on mobile, fixed height on desktop */}
      <div className="mt-6 flex flex-col rounded-[var(--radius-card)] border border-border bg-surface-base/50 shadow-sm overflow-hidden h-[60vh] min-h-[400px] max-h-[700px]">
        <ExploreChatbot />
      </div>
    </section>
  );
}
