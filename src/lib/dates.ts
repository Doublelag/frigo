const DAY = 24 * 60 * 60 * 1000;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Fecha local yyyy-mm-dd (sin líos de zona horaria de toISOString) */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(days: number): string {
  const d = startOfToday();
  d.setDate(d.getDate() + Math.round(days));
  return toISODate(d);
}

export function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const [y, m, d] = expiresAt.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - startOfToday().getTime()) / DAY);
}

export type Urgency = "caducado" | "urgente" | "pronto" | "ok" | "sin-fecha";

export function urgency(days: number | null): Urgency {
  if (days === null) return "sin-fecha";
  if (days < 0) return "caducado";
  if (days <= 2) return "urgente";
  if (days <= 5) return "pronto";
  return "ok";
}

export function expiryLabel(days: number | null): string {
  if (days === null) return "Sin fecha";
  if (days < -1) return `Caducó hace ${-days} días`;
  if (days === -1) return "Caducó ayer";
  if (days === 0) return "Caduca hoy";
  if (days === 1) return "Caduca mañana";
  if (days <= 30) return `${days} días`;
  if (days <= 60) return "+1 mes";
  return `+${Math.floor(days / 30)} meses`;
}
