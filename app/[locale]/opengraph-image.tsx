import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getTranslations } from "next-intl/server";

/**
 * Картинка для шарингу посилань (Telegram, Facebook, Viber, LinkedIn): 1200×630.
 * Генерується на сервері; шрифт DejaVu (кирилиця) — з assets/fonts, без мережі.
 */
export const alt = "Центр Енергоефективності — Ладижин";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const [bold, regular] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/fonts/DejaVuSans-Bold.ttf")),
    readFile(path.join(process.cwd(), "assets/fonts/DejaVuSans.ttf")),
  ]);
  const title = t("titleDefault");
  const description = t("description");
  const tagline = locale === "uk" ? "Технічний експертний центр з оптимізації енергоспоживання" : "Technical expert centre for energy optimisation";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #07111a 0%, #0b1f2a 55%, #0f2f2a 100%)",
          color: "#f5f7f7",
          fontFamily: "DejaVu",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 64 64">
              <path d="M36 10 18 36h12l-4 18 20-28H34l2-16z" fill="#fff" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 700 }}>ЦЕЕ</div>
            <div style={{ fontSize: 22, color: "#9fb3ad" }}>cee.energy</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.15, maxWidth: 1000 }}>{tagline}</div>
          <div style={{ fontSize: 28, color: "#c3d1cc", lineHeight: 1.35, maxWidth: 1000 }}>{description}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#9fb3ad" }}>
          <div>{title}</div>
          <div style={{ color: "#34d399" }}>{locale === "uk" ? "Ладижин, Вінницька область" : "Ladyzhyn, Vinnytsia Oblast"}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "DejaVu", data: bold, weight: 700, style: "normal" },
        { name: "DejaVu", data: regular, weight: 400, style: "normal" },
      ],
    }
  );
}
