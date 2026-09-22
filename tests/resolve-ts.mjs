/**
 * Node exige la extensión al importar; el código de la app usa el estilo de
 * Next (sin extensión). Este enganche prueba .ts/.tsx antes de rendirse.
 */
const CANDIDATES = [".ts", ".tsx", "/index.ts", "/index.tsx"];

export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (specifier.startsWith(".") || specifier.startsWith("@/")) {
      for (const ext of CANDIDATES) {
        try {
          return await next(specifier + ext, context);
        } catch {
          // Probamos la siguiente extensión
        }
      }
    }
    throw error;
  }
}
