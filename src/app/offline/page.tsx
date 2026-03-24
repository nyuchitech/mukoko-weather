import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline — mukoko weather",
  description: "You appear to be offline. Connect to the internet to get the latest weather data.",
};

export default function OfflinePage() {
  return (
    <main
      id="main-content"
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-6xl" aria-hidden="true">
          ☁️
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          You&apos;re offline
        </h1>
        <p className="text-muted-foreground">
          mukoko weather needs an internet connection to fetch the latest data.
          Previously viewed locations may still be available from cache.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Try again
          </Link>
        </div>
        <p className="text-xs text-muted-foreground/60">
          Tip: Save your favourite locations for offline access
        </p>
      </div>
    </main>
  );
}
