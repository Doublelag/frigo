import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, accessRequired, hasAccess } from "@/lib/access";

/**
 * Si hay código de beta configurado (FRIGO_BETA_CODE), todo pasa por aquí:
 * sin la cookie correcta, a la pantalla de entrada. Sin código configurado
 * la app queda abierta, como en local.
 */
export function proxy(request: NextRequest) {
  if (!accessRequired()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const libre = pathname === "/entrar" || pathname === "/api/acceso";
  if (libre || hasAccess(request.cookies.get(COOKIE)?.value)) return NextResponse.next();

  // Las llamadas a la API no redirigen: responden que hace falta el código
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Necesitas el código de la beta." }, { status: 401 });
  }

  const entrar = new URL("/entrar", request.url);
  if (pathname !== "/") entrar.searchParams.set("volver", pathname + request.nextUrl.search);
  return NextResponse.redirect(entrar);
}

export const config = {
  // Se deja fuera lo que tiene que cargar sí o sí (iconos, manifiesto,
  // service worker y ficheros estáticos)
  matcher: [
    "/((?!_next/static|_next/image|icons/|icon|apple-icon|manifest.webmanifest|sw.js|favicon.ico).*)",
  ],
};
