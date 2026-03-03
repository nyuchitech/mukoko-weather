import type { Season } from "@/lib/weather";
import { Badge } from "@/components/ui/badge";

interface SeasonBadgeProps {
  season: Season;
}

export function SeasonBadge({ season }: SeasonBadgeProps) {
  return (
    <Badge className="max-w-full gap-2 px-3 py-1">
      <span className="shrink-0 text-base font-semibold">{season.localName}</span>
      <span className="truncate text-base font-normal text-text-secondary">
        {season.name} — {season.description}
      </span>
    </Badge>
  );
}
