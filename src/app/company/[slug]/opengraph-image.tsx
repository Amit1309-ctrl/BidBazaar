import { ImageResponse } from "next/og";
import { getListingBySlug } from "@/lib/data";
import { formatPaise } from "@/lib/format";
import { CATEGORY_LABELS } from "@/types";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: { slug: string } }) {
  const listing = await getListingBySlug(params.slug);

  if (!listing) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", background: "#0B0D10" }} />
      ),
      size
    );
  }

  const isChampion = listing.current_rank === 1;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#0B0D10",
          backgroundImage: isChampion
            ? "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(232,181,74,0.25), transparent)"
            : "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(23,166,115,0.20), transparent)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10, background: "rgba(23,166,115,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#22C68C", fontSize: 22, fontWeight: 700,
            }}
          >
            ₹
          </div>
          <div style={{ color: "#F4F5F7", fontSize: 26, fontWeight: 700 }}>hotbid</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              display: "flex", alignSelf: "flex-start", alignItems: "center", gap: 8,
              padding: "8px 18px", borderRadius: 999,
              background: isChampion ? "rgba(232,181,74,0.18)" : "rgba(23,166,115,0.15)",
              color: isChampion ? "#E8B54A" : "#22C68C",
              fontSize: 24, fontWeight: 700,
            }}
          >
            {isChampion ? "👑 #1 on the board" : `#${listing.current_rank} on the board`}
          </div>

          <div style={{ display: "flex", color: "#F4F5F7", fontSize: 64, fontWeight: 700 }}>
            {listing.company_name}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", color: "#6B7280", fontSize: 22 }}>
            {CATEGORY_LABELS[listing.category]} · {listing.city}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", color: "#6B7280", fontSize: 18 }}>WINNING BID</div>
            <div style={{ display: "flex", color: "#F4F5F7", fontSize: 40, fontWeight: 700 }}>
              {formatPaise(listing.current_bid_paise)}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
