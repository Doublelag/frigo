import type { Metadata, Viewport } from "next";
import { Geist, Silkscreen } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { THEME_COLOR, THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Tipografía de pixel art para títulos y marca
const pixel = Silkscreen({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} · ${APP_TAGLINE}`,
  description: `Haz una foto a tu nevera, ${APP_NAME} apunta lo que tienes y cuándo caduca, y te propone recetas para aprovecharlo.`,
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // El tema lo maneja la app (por defecto oscuro); este color se actualiza al cambiarlo
  themeColor: THEME_COLOR.dark,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: el script de arriba añade data-theme antes de que React arranque
    <html lang="es" className={`${geistSans.variable} ${pixel.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        {/* Aplica el tema guardado antes de pintar, para que no dé un fogonazo blanco */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
