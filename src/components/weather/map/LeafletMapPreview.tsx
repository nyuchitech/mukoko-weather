"use client";

import { useEffect, useState } from "react";
import "./leaflet-css";
import "./leaflet-icon-fix";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useAppStore } from "@/lib/store";

interface LeafletMapPreviewProps {
  lat: number;
  lon: number;
}

export default function LeafletMapPreview({
  lat,
  lon,
}: LeafletMapPreviewProps) {
  const theme = useAppStore((s) => s.theme);
  // Track OS dark mode changes for "system" theme
  const [osDark, setOsDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setOsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const isDark = theme === "dark" || (theme === "system" && osDark);
  const mapStyle = isDark ? "dark-v11" : "streets-v12";

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={7}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      attributionControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      {/* Base map — Mapbox (proxied to keep API key server-side) */}
      <TileLayer
        url={`/api/py/map-tiles/base?z={z}&x={x}&y={y}&style=${mapStyle}`}
        tileSize={512}
        zoomOffset={-1}
      />
      <Marker position={[lat, lon]} />
    </MapContainer>
  );
}
