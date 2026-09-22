/**
 * Service worker de Frigo.
 *
 * La nevera, la lista y las recetas guardadas viven en el móvil, así que la app
 * debe abrirse aunque no haya cobertura. Lo que sí necesita internet (analizar
 * fotos y pedir recetas) va siempre a la red y avisa si falla.
 */
const CACHE = "frigo-v3";
const SHELL = ["/", "/escanear", "/recetas", "/receta", "/compra", "/perfil", "/offline"];

/**
 * Guarda la pantalla y, leyendo su HTML, también los ficheros de código y
 * estilos que necesita. Si no, al abrirla sin conexión saldría en blanco.
 */
async function precache(cache, url) {
  const response = await fetch(url, { cache: "reload" });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const html = await response.clone().text();
  await cache.put(url, response);

  const assets = new Set();
  for (const match of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) {
    assets.add(match[1].replace(/&amp;/g, "&"));
  }
  await Promise.allSettled([...assets].map((asset) => cache.add(asset)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Si alguna falla (sin conexión al instalar), no se rompe la instalación
      Promise.allSettled(SHELL.map((url) => precache(cache, url))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
    return response;
  } catch (error) {
    // ignoreSearch: /receta?id=lo-que-sea se sirve con la página guardada
    const hit = await caches.match(request, { ignoreSearch: true });
    if (hit) return hit;

    if (request.mode === "navigate") {
      const offline = await caches.match("/offline");
      if (offline) return offline;
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // Claude siempre por red

  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(networkFirst(request));
});
