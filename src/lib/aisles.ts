import { foodKey } from "./store";

/**
 * Agrupa la lista de la compra por secciones del súper, en el orden en que se
 * recorren normalmente. Es una aproximación por palabras clave: si no se
 * reconoce, va a "Otros".
 */
export const AISLES = [
  "Frutería y verdura",
  "Carnicería",
  "Pescadería",
  "Lácteos y huevos",
  "Panadería",
  "Despensa",
  "Congelados",
  "Bebidas",
  "Droguería",
  "Otros",
] as const;

export type Aisle = (typeof AISLES)[number];

const KEYWORDS: [Aisle, string[]][] = [
  [
    "Frutería y verdura",
    [
      "tomate",
      "lechuga",
      "cebolla",
      "ajo",
      "pimiento",
      "calabacin",
      "berenjena",
      "zanahoria",
      "patata",
      "champiñon",
      "champiñone",
      "seta",
      "brocoli",
      "coliflor",
      "espinaca",
      "canonigo",
      "rucula",
      "pepino",
      "puerro",
      "apio",
      "calabaza",
      "judia",
      "guisante",
      "manzana",
      "platano",
      "naranja",
      "limon",
      "lima",
      "fresa",
      "uva",
      "pera",
      "melon",
      "sandia",
      "kiwi",
      "aguacate",
      "mango",
      "pina",
      "melocoton",
      "ciruela",
      "cereza",
      "arandano",
      "frambuesa",
      "jengibre",
      "perejil",
      "cilantro",
      "albahaca",
      "menta",
    ],
  ],
  [
    "Carnicería",
    [
      "pollo",
      "pavo",
      "ternera",
      "cerdo",
      "cordero",
      "carne",
      "filete",
      "pechuga",
      "muslo",
      "costilla",
      "chuleta",
      "salchicha",
      "chorizo",
      "jamon",
      "bacon",
      "panceta",
      "lomo",
      "hamburguesa",
      "albondiga",
      "conejo",
      "solomillo",
      "secreto",
      "morcilla",
      "fuet",
      "salchichon",
      "mortadela",
      "pavo",
    ],
  ],
  [
    "Pescadería",
    [
      "salmon",
      "merluza",
      "bacalao",
      "atun",
      "sardina",
      "boqueron",
      "dorada",
      "lubina",
      "gamba",
      "langostino",
      "mejillon",
      "almeja",
      "calamar",
      "pulpo",
      "sepia",
      "marisco",
      "pescado",
      "trucha",
      "rape",
      "anchoa",
      "surimi",
    ],
  ],
  [
    "Lácteos y huevos",
    [
      "leche",
      "yogur",
      "queso",
      "mantequilla",
      "nata",
      "huevo",
      "kefir",
      "cuajada",
      "requeson",
      "mascarpone",
      "burgos",
      "flan",
      "natilla",
      "margarina",
      "batido",
    ],
  ],
  [
    "Panadería",
    [
      "pan",
      "barra",
      "chapata",
      "molde",
      "bollo",
      "croissant",
      "magdalena",
      "bizcocho",
      "tostada",
      "pita",
      "wrap",
      "tortilla de trigo",
      "base de pizza",
      "galleta",
      "donut",
      "empanada",
    ],
  ],
  [
    "Despensa",
    [
      "arroz",
      "pasta",
      "espagueti",
      "macarron",
      "fideo",
      "harina",
      "azucar",
      "sal",
      "aceite",
      "vinagre",
      "especia",
      "pimenton",
      "comino",
      "oregano",
      "curry",
      "canela",
      "levadura",
      "lenteja",
      "garbanzo",
      "alubia",
      "conserva",
      "lata",
      "tomate frito",
      "tomate triturado",
      "caldo",
      "mayonesa",
      "ketchup",
      "mostaza",
      "soja",
      "miel",
      "mermelada",
      "cacao",
      "cafe",
      "te",
      "cereale",
      "muesli",
      "avena",
      "fruto seco",
      "almendra",
      "nuez",
      "aceituna",
      "pepinillo",
      "atun en lata",
      "chocolate",
      "azucar moreno",
      "maizena",
      "gelatina",
      "pan rallado",
      "hummus",
    ],
  ],
  ["Congelados", ["congelado", "helado", "pizza", "verdura congelada", "nugget", "varita", "hielo"]],
  [
    "Bebidas",
    [
      "agua",
      "cerveza",
      "vino",
      "refresco",
      "cola",
      "zumo",
      "tonica",
      "sidra",
      "horchata",
      "bebida",
      "kombucha",
      "gaseosa",
    ],
  ],
  [
    "Droguería",
    [
      "papel",
      "servilleta",
      "detergente",
      "lavavajilla",
      "suavizante",
      "lejia",
      "limpiador",
      "bolsa de basura",
      "estropajo",
      "papel de aluminio",
      "film",
      "jabon",
      "champu",
      "pasta de dientes",
      "desodorante",
      "pañal",
    ],
  ],
];

export function guessAisle(name: string): Aisle {
  const tokens = foodKey(name).split(" ").filter(Boolean);
  if (!tokens.length) return "Otros";

  const key = foodKey(name);

  // Primero las expresiones de varias palabras: "tomate frito" es despensa,
  // no frutería, aunque contenga "tomate"
  for (const [aisle, words] of KEYWORDS) {
    for (const word of words) {
      const keyword = foodKey(word);
      if (keyword.includes(" ") && key.includes(keyword)) return aisle;
    }
  }

  // Luego palabra a palabra y en orden: en "zumo de naranja" manda "zumo",
  // igual que en "pan de molde" manda "pan"
  for (const token of tokens) {
    for (const [aisle, words] of KEYWORDS) {
      for (const word of words) {
        const keyword = foodKey(word);
        if (keyword.includes(" ")) continue;
        if (token === keyword || (keyword.length >= 4 && token.startsWith(keyword))) return aisle;
      }
    }
  }
  return "Otros";
}

/** Agrupa manteniendo el orden del súper y sin secciones vacías */
export function groupByAisle<T>(list: T[], name: (item: T) => string): [Aisle, T[]][] {
  const groups = new Map<Aisle, T[]>();
  for (const item of list) {
    const aisle = guessAisle(name(item));
    groups.set(aisle, [...(groups.get(aisle) ?? []), item]);
  }
  return AISLES.filter((a) => groups.has(a)).map((a) => [a, groups.get(a)!]);
}
