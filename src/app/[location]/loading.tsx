"use client";

import { usePathname } from "next/navigation";
import { WeatherLoadingScene } from "@/components/weather/WeatherLoadingScene";

export default function LocationLoading() {
  const pathname = usePathname();
  const slug = pathname ? pathname.split("/").filter(Boolean)[0] : undefined;
  return <WeatherLoadingScene slug={slug} />;
}
