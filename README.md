# Salvacenas · cocina con lo que tienes

**Haz una foto a tu nevera (o al ticket del súper) y Salvacenas te dice qué tienes, cuándo caduca cada cosa y qué
puedes cocinar hoy para no tirar nada.** Es una web app pensada para el móvil, se instala en la pantalla de inicio
como una app normal y funciona sin conexión salvo para analizar fotos y pedir recetas.

> 📸 CAPTURA AQUÍ — pantalla de la nevera y de una receta en el móvil

> El nombre de la app se cambia en `src/lib/brand.ts` (el repositorio se llama `frigo`, el nombre provisional).

## Funcionalidades

| Pantalla | Qué hace                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Nevera   | Alimentos por caducidad (úsalo ya / esta semana / con margen) o por tipo. Buscador, añadido rápido de lo típico y a mano.             |
| Escanear | Hasta 4 fotos de la nevera **o del ticket de compra** → detecta alimentos, cantidades y caducidad. Revisas y guardas.                 |
| Recetas  | Propuestas con lo que tienes, priorizando lo que caduca. Filtros de momento, tiempo, raciones y "sin comprar nada". Guardadas.        |
| Receta   | Ingredientes (tienes / despensa / falta), raciones ajustables, **modo cocina** (pantalla encendida), añadir lo que falta, compartir. |
| Compra   | Lista agrupada por secciones del súper, compartir por WhatsApp y pasar lo comprado a la nevera.                                       |
| Perfil   | Tema claro/oscuro, dieta, alergias, gustos, despensa, estadísticas de aprovechamiento y copia de seguridad.                           |

Detalles que marcan la diferencia:

- **Caducidades reales**: si se ve la fecha en el envase, se lee; si no, se estima por tipo de producto y aspecto.
- **Deshacer** en todo lo que borra algo.
- **Lo que aprovechas**: al gastar o tirar algo lo marcas, y el perfil te dice qué porcentaje acaba en la mesa.
- **Sin cuentas**: los datos viven en el móvil; hay copia de seguridad en archivo para cambiar de dispositivo.
- **Modo demo**: sin ninguna API key la app funciona con datos de ejemplo, ideal para probarla.
- **Código de beta opcional**: con `FRIGO_BETA_CODE` hay que escribir un código una vez para entrar.
- **Tema oscuro por defecto**, con opción de claro o automático.

## Tecnología

- **[Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript**
- **Tailwind CSS 4** para los estilos e iconos de [lucide-react](https://lucide.dev)
- **[Claude](https://www.anthropic.com) vía `@anthropic-ai/sdk`** para leer fotos y proponer recetas, con
  **Google Gemini** como alternativa gratuita
- **Zod** para validar todo lo que entra y sale de la IA
- **Zustand** para el estado del usuario, guardado en `localStorage`
- **Service worker** propio (`public/sw.js`) para que la app abra sin conexión
- **Cloudflare Workers** mediante [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) para publicarla
- Tests con el runner nativo de Node (`node --test`), sin dependencias extra

## Arrancar en local

Necesitas Node.js 20 o superior.

```bash
npm ci
npm run dev
```

Abre http://localhost:3000. **Sin API key funciona en modo demo** con datos de ejemplo.

Para usar la IA de verdad, copia `.env.example` como `.env.local` y rellena lo que necesites:

| Variable                                             | Para qué sirve                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`                                  | Clave de Claude (mejor calidad, de pago). Se crea en https://console.anthropic.com/settings/keys      |
| `GOOGLE_API_KEY`                                     | Alternativa con nivel gratuito: https://aistudio.google.com/apikey. Si están las dos, manda Claude.  |
| `GOOGLE_MODEL`                                       | Opcional. Modelo de Gemini a usar.                                                                   |
| `CLAUDE_MODEL`                                       | Opcional. Modelo de Claude (por defecto `claude-opus-5`).                                            |
| `FRIGO_DEMO`                                         | Opcional. `1` fuerza el modo demo aunque haya clave.                                                 |
| `FRIGO_BETA_CODE`                                    | Opcional. Código que hay que escribir una vez para entrar. Vacío = app abierta.                      |
| `RATE_DETECT_PER_HOUR` / `RATE_RECIPES_PER_HOUR`     | Opcional. Límite de peticiones por IP y hora (por defecto 20 y 30).                                  |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Opcional. Límite de uso compartido entre instancias (Redis gratuito en https://upstash.com).        |

Después reinicia `npm run dev`. Nunca subas `.env.local` al repositorio (ya está en `.gitignore`).

## Comprobaciones

```bash
npm run check   # tipos de rutas (next typegen) + TypeScript + ESLint + tests
npm run lint    # solo ESLint
npm run build   # build de producción
```

Los tests (`tests/*.test.mts`) cubren caducidades, nevera, deshacer, estadísticas, escalado de cantidades, secciones
del súper, validaciones de la API, el esquema JSON que se manda a Claude, el saneado de respuestas, el código de beta y
la copia de seguridad.

En cada push y pull request, GitHub Actions (`.github/workflows/ci.yml`) ejecuta `npm ci`, `npm run check` y
`npm run build`.

## Publicar en Cloudflare

La app se publica como un Worker de Cloudflare con el adaptador de OpenNext (configurado en `wrangler.jsonc` y
`open-next.config.ts`).

1. Inicia sesión en Cloudflare: `npx wrangler login`
2. Sube las claves como **secretos** (nunca en `wrangler.jsonc` ni en el código):

   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put FRIGO_BETA_CODE        # opcional
   npx wrangler secret put UPSTASH_REDIS_REST_URL  # opcional, muy recomendable
   npx wrangler secret put UPSTASH_REDIS_REST_TOKEN
   ```

   También se pueden poner desde el panel de Cloudflare: _Workers → frigo → Settings → Variables and Secrets_.

3. Publica:

   ```bash
   npm run deploy
   ```

   Para probar el Worker en local antes de publicar: `npm run preview:cf`.

4. Desde el móvil: menú del navegador → "Añadir a pantalla de inicio".

## Estructura del proyecto

```
src/
├── app/                 # Rutas (App Router)
│   ├── page.tsx         # Nevera (inicio)
│   ├── escanear/        # Fotos de nevera o ticket
│   ├── recetas/ receta/ # Propuestas y detalle de receta
│   ├── compra/          # Lista de la compra
│   ├── perfil/          # Preferencias, estadísticas y copia de seguridad
│   ├── entrar/          # Pantalla del código de beta
│   ├── legal/ offline/  # Aviso legal (borrador) y pantalla sin conexión
│   ├── icons/ icon.tsx  # Iconos de la app generados en código
│   └── api/             # Únicas partes de servidor: detect, recipes, acceso, estado
├── components/          # Interfaz: navegación, tarjetas, modo cocina, editor...
├── lib/                 # Lógica: IA (claude.ts, gemini.ts, ai.ts), prompts, esquemas Zod,
│                        # store, fechas, cantidades, límite de uso, acceso, copia de seguridad
└── proxy.ts             # Puerta del código de beta (el antiguo "middleware" de Next 16)
public/sw.js             # Service worker para funcionar sin conexión
tests/                   # Tests con node --test
wrangler.jsonc           # Configuración del Worker de Cloudflare
```

## Cómo funciona por dentro

- **Todo es cliente salvo `src/app/api/*`.**
- **La IA solo se llama desde el servidor** (`src/lib/claude.ts`, `src/lib/gemini.ts`): la API key nunca llega al
  móvil. `src/lib/ai.ts` elige proveedor: Claude si hay clave, si no Google, y si no hay ninguna, modo demo.
  - Modelo `claude-opus-5` (cambiable con `CLAUDE_MODEL`), pensamiento adaptativo, esfuerzo `medium`.
  - Salida estructurada con JSON Schema generado desde Zod (`src/lib/schemas.ts`) y validada otra vez al recibirla.
    Ojo: **no se usa el helper `betaZodOutputFormat` del SDK** porque convierte los `enum` en descripciones y la API
    deja de obligarlos; hay un test que lo vigila.
  - `fallbacks: "default"`: si Claude rechazara una petición, la API la reintenta sola con el modelo de respaldo.
- **Prompts** en `src/lib/prompts.ts`: uno para fotos de nevera y otro para tickets (traduce las abreviaturas del súper).
- **Fotos**: se reducen en el móvil a 1568 px y se comprimen hasta caber en el límite de petición (`src/lib/image.ts`),
  con alternativa para navegadores antiguos. No se guardan.
- **Datos del usuario**: en el dispositivo (localStorage, `src/lib/store.ts` con zustand).
- **Sin conexión**: `public/sw.js` guarda las pantallas y su código al instalarse, así que la app abre igual; lo que
  necesita internet avisa.
- **Límite de uso** por IP y hora; con `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` pasa a ser compartido
  entre instancias (necesario en producción para que no se pueda saltar).

### Coste estimado por uso (Opus 5: 5 $ / 25 $ por millón de tokens entrada / salida)

| Acción               | Estimación     |
| -------------------- | -------------- |
| Escanear (1-2 fotos) | ~0,05 - 0,13 $ |
| Pedir 4 recetas      | ~0,08 - 0,15 $ |

Son estimaciones: el servidor escribe en el log los tokens reales de cada llamada (`[claude] ... in= out=`). Si hace
falta abaratar, `CLAUDE_MODEL=claude-sonnet-5` cuesta 2,5 veces menos, pero hay que comprobar antes que la detección
sigue siendo buena. Con `GOOGLE_API_KEY` se puede usar el nivel gratuito de Gemini.

## Cómo se hizo

Salvacenas la ha construido **Doublelag** programando con IA ("vibe coding"): las ideas, el diseño y las decisiones
son suyas, y el código se ha escrito en conversación con **[Claude Code](https://claude.com/claude-code)**, el agente
de programación de Anthropic. La propia app también usa Claude por dentro para entender las fotos y proponer recetas.

## Pendiente antes de lanzar al público

- [ ] **Cuentas de usuario** (p. ej. Supabase Auth) y datos en la nube. Mientras tanto, la copia de seguridad del perfil.
- [ ] **Límite de uso compartido**: crear el Redis en Upstash y poner las dos variables. Sin eso, cualquiera puede
      gastar tu saldo de la API.
- [ ] **Modelo de negocio**: plan gratis con X escaneos/mes + premium, o afiliación con supermercados en la compra.
- [ ] **Privacidad y aviso legal**: `/legal` es un borrador con huecos `[PENDIENTE]`; hay que completarlo y revisarlo.
- [ ] Probar la detección con fotos reales de neveras y tickets, y ajustar los prompts.
- [ ] Avisos de caducidad (notificaciones push) y lectura de códigos de barras.
- [ ] Nombre definitivo, dominio e icono.
