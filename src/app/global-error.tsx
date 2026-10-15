"use client";

/** Último recinto de seguridad: falla hasta el layout, así que va sin estilos de la app */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error("[salvacenas] error grave:", error);

  return (
    <html lang="es">
      <body
        style={{
          display: "flex",
          minHeight: "100dvh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#111412",
          color: "#edf0eb",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Salvacenas se ha caído</h1>
        <p style={{ color: "#9ba49c", maxWidth: "20rem" }}>
          Tus datos siguen guardados en el móvil. Vuelve a abrir la app.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#57c088",
            color: "#0b1a11",
            border: 0,
            borderRadius: "999px",
            padding: "0.85rem 1.5rem",
            fontWeight: 600,
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
