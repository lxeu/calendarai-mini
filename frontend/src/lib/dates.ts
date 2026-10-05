// Deadlines store dates as "YYYY-MM-DD" strings. These helpers never throw,
// even if the AI hands back something that isn't a real date.

const DAY_MS = 86_400_000;

// Today's date as YYYY-MM-DD in your local time zone
export function todayISO() {
  return new Date().toLocaleDateString("en-CA");
}

function parts(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  return date.getMonth() === mo - 1 ? { y, mo, d, date } : null;
}

export function isValidISO(iso: string) {
  return parts(iso) !== null;
}

export function addDays(iso: string, n: number) {
  const p = parts(iso);
  if (!p) return iso;
  return new Date(p.y, p.mo - 1, p.d + n).toLocaleDateString("en-CA");
}

// Whole days from `from` to `to` (negative if `to` is earlier)
export function daysBetween(from: string, to: string) {
  const a = parts(from);
  const b = parts(to);
  if (!a || !b) return NaN;
  return Math.round((Date.UTC(b.y, b.mo - 1, b.d) - Date.UTC(a.y, a.mo - 1, a.d)) / DAY_MS);
}

export function relativeLabel(days: number) {
  if (Number.isNaN(days)) return "";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

// End of the due date (11:59:59 PM local), which is what countdowns aim at
export function endOfDay(iso: string) {
  const p = parts(iso);
  return p ? new Date(p.y, p.mo - 1, p.d, 23, 59, 59).getTime() : null;
}

export function formatLong(iso: string) {
  const p = parts(iso);
  if (!p) return iso;
  const sameYear = p.y === new Date().getFullYear();
  return p.date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}

export function formatShort(iso: string) {
  const p = parts(iso);
  if (!p) return { weekday: "", month: "", day: iso, label: iso };
  return {
    weekday: p.date.toLocaleDateString(undefined, { weekday: "short" }),
    month: p.date.toLocaleDateString(undefined, { month: "short" }),
    day: String(p.d),
    label: p.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
  };
}
