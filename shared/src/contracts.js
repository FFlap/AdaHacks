import { z } from 'zod';

export const profileSchema = z.object({
  id: z.uuid(),
  fullName: z.string().trim().max(80),
  bio: z.string().trim().max(280),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true })
});

export const updateProfileInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required.')
    .max(80, 'Full name must be 80 characters or fewer.'),
  bio: z
    .string()
    .trim()
    .max(280, 'Bio must be 280 characters or fewer.')
});

export const userSchema = z.object({
  id: z.uuid(),
  email: z.email()
});

export const meResponseSchema = z.object({
  user: userSchema,
  profile: profileSchema
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string()
  })
});
