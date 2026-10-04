/** Today's date in Asia/Manila as YYYY-MM-DD. */
function todayManila(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(now);
}

function daysBetween(fromIso, toIso) {
  const ms = Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Prisma @db.Date <-> 'YYYY-MM-DD' (always UTC midnight, so no timezone drift). */
const toDateOnly = (d) => d.toISOString().slice(0, 10);
const fromDateOnly = (s) => new Date(`${s}T00:00:00Z`);

export { todayManila, daysBetween, toDateOnly, fromDateOnly };
