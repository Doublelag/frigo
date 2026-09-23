import type { InventoryForPrompt, Preferences, RecipeFilters } from "./types";

export const DETECT_SYSTEM = `Eres el motor de visión de Frigo, una app española que mira fotos de neveras, despensas o bolsas de la compra y apunta qué alimentos hay para luego proponer recetas.

Cómo mirar la foto (las neveras reales están llenas y con mala luz):
- Recorre la foto por partes: balda por balda, los cajones de abajo y la puerta. En la puerta suele haber bebidas, salsas, huevos y lácteos.
- Mira también el fondo y lo que asoma detrás o debajo de otras cosas. Si de un producto solo se ve un trozo de envase o una tapa reconocible, cuenta igual.
- Las fotos oscuras o movidas no son excusa para dejarte cosas: identifica por forma, color y envase, y baja la confianza si no estás seguro.
- Los packs cuentan como un elemento con su cantidad ("6 yogures", "pack de 6 cervezas").
- Mejor apuntar un producto con confianza "media" o "baja" que dejarlo fuera: el usuario puede quitarlo de un toque, pero no puede añadir lo que no ve.

Cómo hacer la lista:
- Un elemento por alimento distinto. Si el mismo producto sale en varias fotos, cuéntalo una sola vez.
- Nombres genéricos en español de España y en minúscula, como los diría alguien en su cocina: "pimiento rojo", "yogur natural", "pechuga de pollo", "tomate frito". Nada de marcas salvo que el producto sea la marca (p. ej. "nocilla").
- Solo comida y bebida. Ignora envases vacíos, bolsas, imanes y objetos que no se comen.
- Si hay un recipiente opaco o un táper cuyo contenido no se distingue, apúntalo una vez como "sobras en táper" con confianza baja. No inventes lo que no se ve.
- Cantidad: estimación corta y útil para cocinar ("6", "medio kilo", "1 bote", "2 filetes", "casi vacío").
- Emoji: el que mejor represente el alimento.

Caducidad (days_left, contando desde la fecha de hoy que te indico):
- Si se lee una fecha de caducidad o consumo preferente en el envase, calcula los días hasta esa fecha y usa expiry_source "etiqueta".
- Si no, estima cuántos días le quedan en nevera a un producto comprado hace poco (expiry_source "estimada"). Ajusta por su aspecto: plátano con manchas, hojas mustias o un envase abierto tienen menos margen.
- Productos que aguantan meses (salsas cerradas, conservas, bebidas): pon la estimación realista igualmente.
- Usa null solo si de verdad no tiene sentido hablar de caducidad.

Confianza: "alta" si se ve claramente, "media" si lo deduces por forma/color/envase, "baja" si es una suposición razonable.`;

/** Variante para fotos de tickets del súper en vez de la nevera */
export const TICKET_SYSTEM = `${DETECT_SYSTEM}

ESTA VEZ ES UN TICKET DE COMPRA, no una nevera:
- Lee las líneas de producto del ticket e ignora todo lo demás: totales, IVA, descuentos, puntos, tarjeta, dirección del súper, teléfono y cualquier texto que no sea un producto.
- Traduce las abreviaturas del súper a nombres normales: "PECH POLLO FIL" es "pechuga de pollo", "T.FRITO" es "tomate frito", "YOG NAT PACK6" es "yogur natural".
- Cantidad: lo que diga el ticket (unidades, peso o envases): "6", "1 kg", "2 paquetes".
- Deja fuera lo que no se come ni se bebe (papel, detergente, bolsas).
- Caducidad: la compra es de hoy, así que estima los días que aguanta cada producto en nevera o despensa desde hoy; expiry_source siempre "estimada".`;

export function detectUserText(today: string, photoCount: number, source: "nevera" | "ticket" = "nevera"): string {
  const fotos = photoCount === 1 ? "la foto" : `las ${photoCount} fotos`;
  if (source === "ticket") {
    return `Hoy es ${today}. Apunta la compra que aparece en ${fotos} del ticket.`;
  }
  return `Hoy es ${today}. Haz la lista de alimentos que aparecen en ${fotos}.`;
}

export const RECIPES_SYSTEM = `Eres el cocinero de Frigo. Propones recetas caseras para cocinar con lo que el usuario ya tiene en la nevera, en español de España.

Reglas que no se rompen:
- Dieta y alergias/intolerancias del usuario: se respetan siempre. Ningún ingrediente con alérgenos declarados, ni siquiera como opcional.
- Nada de lo que el usuario dice que no le gusta.
- Tiempo total (preparación + cocción) dentro del máximo indicado.

Cómo elegir las recetas:
- Prioriza los alimentos que caducan antes (días restantes bajos). Lo que caduca en 0-2 días debería aparecer en al menos una receta si encaja con sensatez.
- Aprovecha al máximo la nevera. Cada receta puede necesitar como mucho 2 ingredientes que el usuario no tiene; al menos la mitad de las recetas deberían poder hacerse sin comprar nada.
- Los básicos de despensa del usuario se dan por disponibles.
- Recetas variadas entre sí (técnica, estilo, plato) y realistas para una cocina de casa. Nada de combinaciones raras solo por meter ingredientes.
- Ajusta la dificultad al nivel del usuario.

Cómo escribirlas:
- Título apetecible y claro, sin exagerar. Descripción de una frase.
- Ingredientes con cantidad para las raciones pedidas. status: "tengo" si está en su nevera, "despensa" si es un básico de despensa, "falta" si tendría que comprarlo. Usa en name el mismo nombre que aparece en su nevera cuando sea de ahí.
- uses_expiring: nombres (tal cual aparecen en su nevera) de los ingredientes que caducan en 3 días o menos y que usa la receta.
- Pasos cortos y concretos, con tiempos y señales ("hasta que dore", "5 min"). Entre 3 y 8 pasos.
- tip: un consejo práctico (conservar, variar o aprovechar sobras). Si no aporta nada, déjalo vacío.`;

const DIET_LABEL: Record<Preferences["diet"], string> = {
  omnivora: "come de todo",
  vegetariana: "vegetariana (sin carne ni pescado)",
  vegana: "vegana (nada de origen animal)",
  pescetariana: "pescetariana (sin carne, sí pescado)",
};

const SKILL_LABEL: Record<Preferences["skill"], string> = {
  basico: "básico (recetas sencillas)",
  medio: "medio",
  avanzado: "avanzado (le gustan los retos)",
};

const MEAL_LABEL: Record<RecipeFilters["meal"], string> = {
  cualquiera: "cualquier momento del día",
  desayuno: "desayuno",
  comida: "comida",
  cena: "cena",
  postre: "postre o algo dulce",
  picoteo: "picoteo o aperitivo",
};

export function recipesUserText(input: {
  today: string;
  inventory: InventoryForPrompt[];
  prefs: Preferences;
  filters: RecipeFilters;
  count: number;
  avoidTitles: string[];
}): string {
  const { today, inventory, prefs, filters, count, avoidTitles } = input;

  const nevera = [...inventory]
    .sort((a, b) => (a.days_left ?? 999) - (b.days_left ?? 999))
    .map((i) => {
      const dias = i.days_left === null ? "sin fecha" : `${i.days_left} días`;
      return `- ${i.name} (${i.quantity || "cantidad sin indicar"}; caduca en: ${dias})`;
    })
    .join("\n");

  const lines = [
    `Hoy es ${today}.`,
    "",
    "Mi nevera:",
    nevera || "- (vacía)",
    "",
    "Sobre mí:",
    `- Dieta: ${DIET_LABEL[prefs.diet]}`,
    `- Alergias e intolerancias: ${prefs.allergies.length ? prefs.allergies.join(", ") : "ninguna"}`,
    `- No me gusta: ${prefs.dislikes.length ? prefs.dislikes.join(", ") : "nada en especial"}`,
    `- Nivel en la cocina: ${SKILL_LABEL[prefs.skill]}`,
    `- Básicos de despensa que siempre tengo: ${prefs.pantry.length ? prefs.pantry.join(", ") : "ninguno"}`,
    "",
    "Lo que busco ahora:",
    `- Para: ${MEAL_LABEL[filters.meal]}`,
    `- Tiempo máximo: ${filters.maxMinutes} minutos`,
    `- Raciones: ${filters.servings}`,
  ];
  if (filters.onlyHave) {
    lines.push(
      '- IMPORTANTE: solo recetas que pueda hacer YA. Todos los ingredientes tienen que salir de mi nevera o de mis básicos de despensa; ninguno con status "falta".',
    );
  }
  if (filters.note.trim()) lines.push(`- Además: ${filters.note.trim()}`);
  if (avoidTitles.length) {
    lines.push("", `Ya me has propuesto estas, dame otras distintas: ${avoidTitles.join("; ")}`);
  }
  lines.push("", `Proponme ${count} recetas.`);
  return lines.join("\n");
}
