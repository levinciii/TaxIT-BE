import { z } from 'zod';
import { INCOME_TAX_OPTIONS } from '../shared/tax/engine.js';

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  tin: z
    .string()
    .regex(/^\d{3}-?\d{3}-?\d{3}(-?\d{3,5})?$/, 'Invalid TIN format')
    .optional(),
  specialty: z.string().trim().max(120).optional(),
  prcLicenseNo: z.string().trim().max(40).optional(),
  rdoCode: z.string().trim().max(10).optional(),
  businessAddress: z.string().trim().max(300).optional(),
  vatRegistered: z.boolean().default(false),
  incomeTaxOption: z.enum(INCOME_TAX_OPTIONS).default('EIGHT_PERCENT'),
});

export { profileSchema };
