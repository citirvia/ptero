import { ImageResponse } from "next/og";

export const alt = "Ptero — Modern infrastructure for bots & runtimes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Og() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "radial-gradient(900px circle at 50% -10%, rgba(37,84,104,0.45), transparent 60%), #000000",
          color: "#f5f5f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "linear-gradient(135deg,#255468,#16303d)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            P
          </div>
          <div style={{ fontSize: 34, fontWeight: 600 }}>Ptero</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 900,
            }}
          >
            Ship Discord bots & apps on bare-metal in seconds
          </div>
          <div style={{ fontSize: 30, color: "#8a8a8a", maxWidth: 820 }}>
            Discord bots · Node.js · Python — git push to deploy, monitor in realtime.
          </div>
        </div>

        <div style={{ display: "flex", gap: 28, fontSize: 24, color: "#2f6b85" }}>
          <span>99.99% uptime</span>
          <span style={{ color: "#444" }}>•</span>
          <span>EU · US · TR regions</span>
          <span style={{ color: "#444" }}>•</span>
          <span>Ryzen · DDR5 · NVMe</span>
        </div>
      </div>
    ),
    size,
  );
}
