import { z } from 'zod';
import { isoDate, moneyAmount } from './common.model.js';

const transactionInputSchema = z.object({
  kind: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().uuid().optional(),
  date: isoDate,
  amount: moneyAmount,
  /** Creditable withholding tax (BIR 2307) - income only. */
  withheldTax: moneyAmount.default('0'),
  description: z.string().trim().max(300).optional(),
  counterparty: z.string().trim().max(160).optional(),
  receiptKey: z.string().max(300).optional(),
});

const transactionQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  kind: z.enum(['INCOME', 'EXPENSE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export { transactionInputSchema, transactionQuerySchema };
