import { z } from 'zod';

export const skillSchema = z
  .string()
  .trim()
  .min(1, 'Skills cannot be empty.')
  .max(32, 'Each skill must be 32 characters or fewer.');

export const profileSchema = z.object({
  id: z.uuid(),
  fullName: z.string().trim().max(80),
  bio: z.string().trim().max(280),
  avatarUrl: z.url().nullable(),
  skills: z.array(skillSchema).max(16),
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
    .max(280, 'Bio must be 280 characters or fewer.'),
  avatarPath: z
    .string()
    .trim()
    .min(1, 'Avatar path is required when provided.')
    .max(256, 'Avatar path must be 256 characters or fewer.')
    .optional(),
  skills: z.array(skillSchema).max(16, 'Add 16 skills or fewer.')
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
