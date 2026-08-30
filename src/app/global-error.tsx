"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          background: "#000",
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ color: "#8a8a8a", maxWidth: 420 }}>
          A critical error occurred. Please reload the application.
        </p>
        <button
          onClick={reset}
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            background: "linear-gradient(135deg,#255468,#16303d)",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 12,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
