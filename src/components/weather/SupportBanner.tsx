"use client";

import { CoffeeIcon } from "lucide-react";

/**
 * SupportBanner — Buy Me a Coffee inline support card.
 * Placed as a LazySection between weather sections on the location page.
 * Uses the official BMC brand yellow (#FFDD00) via --color-bmc CSS token.
 */
export function SupportBanner() {
  return (
    <section aria-labelledby="support-banner-heading">
      <a
        href="https://www.buymeacoffee.com/bryany"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-bmc/40 bg-bmc/10 px-5 py-4 shadow-sm transition-colors hover:bg-bmc/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bmc"
        aria-label="Support mukoko weather — Buy Me a Coffee"
      >
        {/* Coffee icon in BMC yellow circle */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bmc"
          aria-hidden="true"
        >
          <CoffeeIcon className="h-5 w-5 text-bmc-fg" strokeWidth={2.5} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            id="support-banner-heading"
            className="text-base font-semibold text-text-primary group-hover:text-bmc-fg"
          >
            Love the weather updates?
          </p>
          <p className="text-base text-text-secondary">
            Help keep the AI behind it running — every coffee counts!
          </p>
        </div>

        {/* BMC badge */}
        <span
          className="hidden shrink-0 items-center gap-1.5 rounded-[var(--radius-badge)] bg-bmc px-3 py-1.5 text-base font-bold text-bmc-fg sm:flex"
          aria-hidden="true"
        >
          <CoffeeIcon className="h-4 w-4" strokeWidth={2.5} />
          Buy me a coffee
        </span>
      </a>
    </section>
  );
}
