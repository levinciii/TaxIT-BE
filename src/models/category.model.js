import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(['INCOME', 'EXPENSE']),
});

export { createCategorySchema };
