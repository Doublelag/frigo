import type { MetadataRoute } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} · ${APP_TAGLINE}`,
    short_name: APP_NAME,
    description: "Escanea tu nevera y cocina con lo que tienes antes de que caduque.",
    lang: "es",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f2ea",
    theme_color: "#1d7a4c",
    categories: ["food", "lifestyle"],
    // Accesos directos al mantener pulsado el icono de la app
    shortcuts: [
      { name: "Escanear la nevera", short_name: "Escanear", url: "/escanear" },
      { name: "Ver recetas", short_name: "Recetas", url: "/recetas" },
      { name: "Lista de la compra", short_name: "Compra", url: "/compra" },
    ],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
