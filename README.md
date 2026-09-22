# Frigo · cocina con lo que tienes

Web app para móvil: haces una foto a la nevera (o al ticket del súper), Claude apunta qué tienes y cuándo caduca cada
cosa, y te propone recetas para aprovecharlo antes de tirarlo. Se instala en la pantalla de inicio como una app normal y
funciona sin conexión salvo para analizar fotos y pedir recetas.

> "Frigo" es un nombre provisional. Se cambia en `src/lib/brand.ts`.

## Qué hace

| Pantalla | Qué hace                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Nevera   | Alimentos por caducidad (úsalo ya / esta semana / con margen) o por tipo. Buscador, añadido rápido de lo típico y a mano.        |
| Escanear | Hasta 4 fotos de la nevera **o del ticket de compra** → detecta alimentos, cantidades y caducidad. Revisas y guardas.            |
| Recetas  | Propuestas con lo que tienes, priorizando lo que caduca. Filtros de momento, tiempo, raciones y "sin comprar nada". Guardadas.   |
| Receta   | Ingredientes (tienes / despensa / falta), raciones ajustables, **modo cocina** (pantalla encendida), añadir lo que falta, compartir. |
| Compra   | Lista agrupada por secciones del súper, compartir por WhatsApp y pasar lo comprado a la nevera.                                  |
| Perfil   | Tema claro/oscuro, dieta, alergias, gustos, despensa, estadísticas de aprovechamiento y copia de seguridad.                      |

Detalles que marcan la diferencia:

- **Caducidades reales**: si se ve la fecha en el envase, se lee; si no, se estima por tipo de producto y aspecto.
- **Deshacer** en todo lo que borra algo.
- **Lo que aprovechas**: al gastar o tirar algo lo marcas, y el perfil te dice qué porcentaje acaba en la mesa.
- **Sin cuentas**: los datos viven en el móvil; hay copia de seguridad en archivo para cambiar de dispositivo.
- **Tema oscuro por defecto**, con opción de claro o automático.

## Arrancar en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000. **Sin API key funciona en modo demo** con datos de ejemplo.

Para usar Claude de verdad:

1. Crea una clave en https://console.anthropic.com/settings/keys
2. Copia `.env.example` como `.env.local` y pon `ANTHROPIC_API_KEY=...`
3. Reinicia `npm run dev`

## Comprobaciones

```bash
npm run check
```

Ejecuta TypeScript, ESLint y los tests (`node --test`, sin dependencias extra). Cubren caducidades, nevera,
deshacer, estadísticas, escalado de cantidades, secciones del súper, validaciones de la API, el esquema JSON que se
manda a Claude y la copia de seguridad.

## Publicar (Vercel)

1. Sube el proyecto a GitHub e impórtalo en https://vercel.com/new
2. En _Settings → Environment Variables_ añade `ANTHROPIC_API_KEY` (y, muy recomendable, las dos de Upstash).
3. Deploy. Desde el móvil: menú del navegador → "Añadir a pantalla de inicio".

## Cómo funciona por dentro

- **Next.js 16 + TypeScript + Tailwind 4.** Todo es cliente salvo `src/app/api/*`.
- **Claude solo se llama desde el servidor** (`src/lib/claude.ts`): la API key nunca llega al móvil.
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
  entre instancias (necesario en Vercel).

## Coste estimado por uso (Opus 5: 5 $ / 25 $ por millón de tokens entrada / salida)

| Acción               | Estimación     |
| -------------------- | -------------- |
| Escanear (1-2 fotos) | ~0,05 - 0,13 $ |
| Pedir 4 recetas      | ~0,08 - 0,15 $ |

Son estimaciones: el servidor escribe en el log los tokens reales de cada llamada (`[claude] ... in= out=`). Si hace
falta abaratar, `CLAUDE_MODEL=claude-sonnet-5` cuesta 2,5 veces menos, pero hay que comprobar antes que la detección
sigue siendo buena.

## Antes de lanzar al público

- [ ] **Cuentas de usuario** (p. ej. Supabase Auth) y datos en la nube. Mientras tanto, la copia de seguridad del perfil.
- [ ] **Límite de uso compartido**: crear el Redis en Upstash y poner las dos variables. Sin eso, cualquiera puede
      gastar tu saldo de la API.
- [ ] **Modelo de negocio**: plan gratis con X escaneos/mes + premium, o afiliación con supermercados en la compra.
- [ ] **Privacidad y aviso legal**: `/legal` es un borrador con huecos `[PENDIENTE]`; hay que completarlo y revisarlo.
- [ ] Probar la detección con fotos reales de neveras y tickets, y ajustar los prompts.
- [ ] Avisos de caducidad (notificaciones push) y lectura de códigos de barras.
- [ ] Nombre definitivo, dominio e icono.
