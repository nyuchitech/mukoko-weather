"use client";

import { WeatherLoadingScene } from "@/components/weather/WeatherLoadingScene";

export default function Loading() {
  return <WeatherLoadingScene statusText="Finding your location..." />;
}
