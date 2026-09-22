/**
 * Recalcula las cantidades de una receta al cambiar las raciones.
 * Las cantidades vienen en texto libre ("2 filetes", "1/2 cebolla",
 * "250 g", "al gusto"), así que solo se tocan los números.
 */
const NUMBER = /(\d+(?:[.,]\d+)?)(?:\s*\/\s*(\d+))?/g;

function format(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 10) return String(Math.round(value));
  const rounded = Math.round(value * 4) / 4; // cuartos: 0,25 · 0,5 · 0,75
  const fractions: Record<number, string> = { 0.25: "1/4", 0.5: "1/2", 0.75: "3/4" };
  const whole = Math.floor(rounded);
  const rest = Number((rounded - whole).toFixed(2));
  if (rest === 0) return String(whole);
  const fraction = fractions[rest];
  if (!fraction) return String(rounded).replace(".", ",");
  return whole ? `${whole} y ${fraction}` : fraction;
}

export function scaleAmount(amount: string, factor: number): string {
  if (factor === 1 || !amount) return amount;
  return amount.replace(NUMBER, (match, num: string, denom?: string) => {
    const value = Number(num.replace(",", ".")) / (denom ? Number(denom) : 1);
    if (!Number.isFinite(value)) return match;
    return format(value * factor);
  });
}
