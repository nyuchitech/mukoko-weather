import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

// ─── Brand Tokens ────────────────────────────────────────────────────────────
// NOTE: next/og (Satori) does not support CSS custom properties — inline hex
// values are required here. Keep in sync with globals.css brand tokens.
const brand = {
  tanzanite: "#4B0082",
  cobalt: "#0047AB",
  malachite: "#004D40",
  gold: "#F9A825",
  flagGreen: "#00A651",
  flagYellow: "#FDD116",
  flagRed: "#D4634A",
};

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = {
  home: {
    emoji: "🌤️",
    badge: "Weather Intelligence",
    gradient: `linear-gradient(135deg, ${brand.tanzanite} 0%, #2D0057 60%, #1A0033 100%)`,
  },
  location: {
    emoji: "📍",
    badge: "Live Forecast",
    gradient: `linear-gradient(135deg, ${brand.cobalt} 0%, #002A6E 60%, #001A45 100%)`,
  },
  explore: {
    emoji: "🧭",
    badge: "Explore Locations",
    gradient: `linear-gradient(135deg, #4A148C 0%, #2D0057 60%, ${brand.tanzanite} 100%)`,
  },
  history: {
    emoji: "📊",
    badge: "Weather History",
    gradient: `linear-gradient(135deg, #1A237E 0%, #0D1B6E 60%, #080F4A 100%)`,
  },
  season: {
    emoji: "🌾",
    badge: "Seasonal Outlook",
    gradient: `linear-gradient(135deg, ${brand.malachite} 0%, #003330 60%, #001F1C 100%)`,
  },
  shamwari: {
    emoji: "🤝",
    badge: "Shamwari Weather",
    gradient: `linear-gradient(135deg, #4A148C 0%, #2D0057 60%, ${brand.tanzanite} 100%)`,
  },
} as const;

type TemplateKey = keyof typeof TEMPLATES;

// ─── OG Image Component ───────────────────────────────────────────────────────
function OGImage({
  title,
  subtitle,
  location,
  province,
  temperature,
  condition,
  season,
  template,
}: {
  title: string;
  subtitle?: string;
  location?: string;
  province?: string;
  temperature?: string;
  condition?: string;
  season?: string;
  template: TemplateKey;
}) {
  const tmpl = TEMPLATES[template];

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: tmpl.gradient,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Georgia, serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative geometry */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -140,
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: "rgba(249,168,37,0.06)",
          border: "1px solid rgba(249,168,37,0.10)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 80,
          right: 80,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      />
      {/* Zimbabwe flag accent stripe */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 5,
          background: `linear-gradient(90deg, ${brand.flagGreen} 0%, ${brand.flagGreen} 33%, ${brand.flagYellow} 33%, ${brand.flagYellow} 66%, ${brand.flagRed} 66%, ${brand.flagRed} 100%)`,
          opacity: 0.65,
        }}
      />
      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "200px 210px",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: "52px 72px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand lockup */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(249,168,37,0.15)",
                border: "1px solid rgba(249,168,37,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              🌤️
            </div>
            <div>
              <div
                style={{
                  color: "#FFFFFF",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  fontFamily: "sans-serif",
                }}
              >
                mukoko weather
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  fontFamily: "sans-serif",
                }}
              >
                weather.mukoko.com
              </div>
            </div>
          </div>

          {/* Template badge */}
          <div
            style={{
              background: "rgba(249,168,37,0.12)",
              border: "1px solid rgba(249,168,37,0.35)",
              borderRadius: 9999,
              padding: "8px 20px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>{tmpl.emoji}</span>
            <span
              style={{
                color: brand.gold,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.04em",
                fontFamily: "sans-serif",
              }}
            >
              {tmpl.badge}
            </span>
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: 220,
          }}
        >
          {/* Season pill */}
          {season && (
            <div
              style={{
                display: "inline-flex",
                marginBottom: 20,
                background: "rgba(0,165,81,0.15)",
                border: "1px solid rgba(0,165,81,0.35)",
                borderRadius: 9999,
                padding: "5px 16px",
                width: "fit-content",
              }}
            >
              <span
                style={{
                  color: brand.flagGreen,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                  fontFamily: "sans-serif",
                }}
              >
                {season}
              </span>
            </div>
          )}

          {/* Title */}
          <div
            style={{
              color: "#FFFFFF",
              fontSize: title.length > 50 ? 42 : title.length > 30 ? 50 : 60,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: subtitle ? 16 : 24,
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 20,
                lineHeight: 1.5,
                marginBottom: 24,
                fontFamily: "sans-serif",
              }}
            >
              {subtitle}
            </div>
          )}

          {/* Meta row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {temperature && (
              <div
                style={{
                  background: "rgba(249,168,37,0.12)",
                  border: "1px solid rgba(249,168,37,0.3)",
                  borderRadius: 10,
                  padding: "8px 20px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    color: brand.gold,
                    fontSize: 32,
                    fontWeight: 700,
                    fontFamily: "sans-serif",
                  }}
                >
                  {temperature}
                </span>
                <span
                  style={{
                    color: "rgba(249,168,37,0.7)",
                    fontSize: 16,
                    fontFamily: "sans-serif",
                  }}
                >
                  °C
                </span>
              </div>
            )}
            {condition && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 16,
                    fontFamily: "sans-serif",
                  }}
                >
                  {condition}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {location && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>📍</span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 15,
                    fontFamily: "sans-serif",
                  }}
                >
                  {location}
                  {province ? `, ${province}` : ""}
                </span>
              </div>
            )}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.28)",
              fontSize: 12,
              fontStyle: "italic",
              letterSpacing: "0.02em",
            }}
          >
            &ldquo;Mvura yemvura inobatanidza vanhu&rdquo; · Rain unites people
          </div>
        </div>
      </div>

      {/* Large decorative emoji */}
      <div
        style={{
          position: "absolute",
          right: 72,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 150,
          opacity: 0.12,
        }}
      >
        {tmpl.emoji}
      </div>
    </div>
  );
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Truncate inputs to prevent visual overflow on the fixed-size canvas
  const title = (searchParams.get("title") ?? "AI Weather Intelligence").slice(0, 80);
  const subtitle = (searchParams.get("subtitle") ?? "").slice(0, 120);
  const location = (searchParams.get("location") ?? "").slice(0, 60);
  const province = (searchParams.get("province") ?? "").slice(0, 60);
  const temperature = (searchParams.get("temp") ?? "").slice(0, 6);
  const condition = (searchParams.get("condition") ?? "").slice(0, 40);
  const season = (searchParams.get("season") ?? "").slice(0, 40);
  const templateParam = searchParams.get("template") ?? "home";

  const template: TemplateKey = templateParam in TEMPLATES
    ? (templateParam as TemplateKey)
    : "home";

  return new ImageResponse(
    <OGImage
      title={title}
      subtitle={subtitle}
      location={location}
      province={province}
      temperature={temperature}
      condition={condition}
      season={season}
      template={template}
    />,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    },
  );
}
