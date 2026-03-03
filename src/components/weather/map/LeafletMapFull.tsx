"use client";

import { useEffect, useState } from "react";
import "./leaflet-css";
import "./leaflet-icon-fix";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useAppStore } from "@/lib/store";

interface LeafletMapFullProps {
  lat: number;
  lon: number;
  layer: string;
}

export default function LeafletMapFull({
  lat,
  lon,
  layer,
}: LeafletMapFullProps) {
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
      zoom={8}
      scrollWheelZoom={true}
      zoomControl={true}
      style={{ height: "100%", width: "100%" }}
    >
      {/* Base map — Mapbox (proxied to keep API key server-side) */}
      <TileLayer
        url={`/api/py/map-tiles/base?z={z}&x={x}&y={y}&style=${mapStyle}`}
        attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        tileSize={512}
        zoomOffset={-1}
      />
      {/* Weather overlay via tile proxy */}
      <TileLayer
        url={`/api/py/map-tiles?z={z}&x={x}&y={y}&layer=${layer}`}
        opacity={0.6}
      />
      <Marker position={[lat, lon]} />
    </MapContainer>
  );
}
