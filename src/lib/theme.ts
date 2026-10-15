export const THEMES = ["oscuro", "claro", "sistema"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "oscuro";

export const THEME_COLOR = { dark: "#111412", light: "#f5f2ea" } as const;

/**
 * Clave de zustand persist; la usa también el script que evita el parpadeo.
 * Se queda como "frigo-v1" aunque la app se llame Salvacenas: cambiarla haría
 * que quien ya tiene datos guardados los perdiera al actualizar.
 */
export const STORAGE_KEY = "frigo-v1";

/**
 * Se ejecuta antes de pintar nada: lee el tema guardado y lo aplica al <html>.
 * Va como texto porque se inyecta tal cual en la página.
 */
export const THEME_SCRIPT = `
try {
  var saved = JSON.parse(localStorage.getItem('${STORAGE_KEY}') || '{}');
  var theme = (saved.state && saved.state.theme) || '${DEFAULT_THEME}';
  var dark = theme === 'sistema' ? matchMedia('(prefers-color-scheme: dark)').matches : theme !== 'claro';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
} catch (e) {
  document.documentElement.dataset.theme = 'dark';
}`.trim();

export function resolveTheme(theme: Theme): "dark" | "light" {
  if (theme === "sistema") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme === "claro" ? "light" : "dark";
}

export function applyTheme(theme: Theme): void {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[resolved]);
}
