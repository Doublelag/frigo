import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Puerta de acceso para la beta: si hay un código configurado, quien abra la
 * app tiene que escribirlo una vez. No es un sistema de cuentas, solo evita
 * que el enlace corra por ahí y alguien se gaste el saldo de la API.
 */
export const COOKIE = "frigo_acceso";
export const COOKIE_DAYS = 90;

export const betaCode = () => process.env.FRIGO_BETA_CODE?.trim() || "";
export const accessRequired = () => betaCode().length > 0;

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

/** Lo que se guarda en la cookie: el hash, nunca el código en claro */
export const accessToken = () => hash(betaCode().toLowerCase());

function sameString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Comparación de tiempo constante: no delata el código probando letra a letra
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export const isValidCode = (input: string) => sameString(hash(input.trim().toLowerCase()), accessToken());

export const hasAccess = (cookieValue: string | undefined) =>
  Boolean(cookieValue) && sameString(cookieValue!, accessToken());
