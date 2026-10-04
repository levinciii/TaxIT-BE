import { z } from 'zod';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
  }, 'Not a real calendar date');

/** Accepts 1234.5 or "1234.50"; always yields a string with at most 2 decimals. */
const moneyAmount = z.preprocess(
  (v) => (typeof v === 'number' ? String(v) : v),
  z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, 'Invalid amount (max 2 decimal places)'),
);

const yearQuery = z.object({ year: z.coerce.number().int().min(2023).max(2100) });
const idParam = z.object({ id: z.string().uuid() });

export { isoDate, moneyAmount, yearQuery, idParam };
