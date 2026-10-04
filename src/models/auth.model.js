import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(10).max(128),
  fullName: z.string().trim().min(2).max(120),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(128),
});

const refreshSchema = z.object({ refreshToken: z.string().min(20) });

export { registerSchema, loginSchema, refreshSchema };
