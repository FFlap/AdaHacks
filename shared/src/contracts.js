import { z } from 'zod';

export const skillSchema = z
  .string()
  .trim()
  .min(1, 'Skills cannot be empty.')
  .max(32, 'Each skill must be 32 characters or fewer.');

const optionalUrlSchema = z
  .url()
  .max(280, 'Links must be 280 characters or fewer.');

export const contactLinksSchema = z.object({
  linkedin: optionalUrlSchema.optional(),
  instagram: optionalUrlSchema.optional(),
  twitter: optionalUrlSchema.optional(),
  github: optionalUrlSchema.optional(),
  email: z.email().max(120, 'Email must be 120 characters or fewer.').optional(),
  phone: z.string().trim().min(1).max(32, 'Phone number must be 32 characters or fewer.').optional()
});

export const swipeDecisionSchema = z.enum(['pass', 'like']);
export const swipeTargetTypeSchema = z.enum(['profile', 'project']);

export const projectSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, 'Project name is required.').max(80),
  theme: z.string().trim().max(48),
  description: z.string().trim().max(480),
  techStack: z.array(skillSchema).max(16)
});

export const projectInputSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, 'Project name is required.').max(80),
  theme: z.string().trim().max(48),
  description: z.string().trim().max(480),
  techStack: z.array(skillSchema).max(16, 'Add 16 tech stack items or fewer.')
});

export const projectFeedItemSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80),
  theme: z.string().trim().max(48),
  description: z.string().trim().max(480),
  techStack: z.array(skillSchema).max(16),
  owner: z.object({
    id: z.uuid(),
    fullName: z.string().trim().min(1).max(80),
    avatarUrl: z.url().nullable()
  })
});

export const projectFeedSchema = z.array(projectFeedItemSchema);

export const projectAnalysisSchema = z.object({
  projectId: z.uuid(),
  matchingSkills: z.array(skillSchema).max(16),
  missingSkills: z.array(skillSchema).max(16),
  contributionSummary: z.string().trim().min(1).max(600)
});

export const personProjectSummarySchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80),
  theme: z.string().trim().max(48)
});

export const personFeedItemSchema = z.object({
  id: z.uuid(),
  fullName: z.string().trim().min(1).max(80),
  avatarUrl: z.url().nullable(),
  bio: z.string().trim().max(280),
  skills: z.array(skillSchema).max(16),
  createdAt: z.string().datetime({ offset: true }),
  projects: z.array(personProjectSummarySchema)
});

export const peopleFeedSchema = z.array(personFeedItemSchema);

export const notificationActorSchema = z.object({
  id: z.uuid(),
  fullName: z.string().trim().min(1).max(80),
  avatarUrl: z.url().nullable(),
  bio: z.string().trim().max(280),
  skills: z.array(skillSchema).max(16),
  projects: z.array(projectSchema),
  contactLinks: contactLinksSchema.default({})
});

export const notificationSchema = z.object({
  id: z.uuid(),
  decision: swipeDecisionSchema,
  targetType: swipeTargetTypeSchema,
  createdAt: z.string().datetime({ offset: true }),
  readAt: z.string().datetime({ offset: true }).nullable(),
  actor: notificationActorSchema,
  target: z.object({
    id: z.uuid(),
    name: z.string().trim().max(80).nullable()
  })
});

export const notificationsSchema = z.array(notificationSchema);

export const swipeInputSchema = z.object({
  targetType: swipeTargetTypeSchema,
  targetId: z.uuid(),
  decision: swipeDecisionSchema
});

export const swipeResponseSchema = z.object({
  id: z.uuid(),
  targetType: swipeTargetTypeSchema,
  targetId: z.uuid(),
  decision: swipeDecisionSchema
});

export const notificationReadResponseSchema = z.object({
  id: z.uuid(),
  readAt: z.string().datetime({ offset: true })
});

export const chatThreadSchema = z.object({
  id: z.uuid(),
  counterpart: z.object({
    id: z.uuid(),
    fullName: z.string().trim().min(1).max(80),
    avatarUrl: z.url().nullable()
  }),
  initiatedByUserId: z.uuid(),
  sourceNotificationId: z.uuid(),
  sourceTargetType: swipeTargetTypeSchema,
  sourceTargetId: z.uuid(),
  sourceTargetName: z.string().trim().max(80).nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  lastMessageAt: z.string().datetime({ offset: true }),
  latestMessagePreview: z.string().trim().max(2000).nullable(),
  latestMessageSenderId: z.uuid().nullable()
});

export const chatThreadsSchema = z.array(chatThreadSchema);

export const chatMessageSchema = z.object({
  id: z.uuid(),
  threadId: z.uuid(),
  senderUserId: z.uuid(),
  body: z.string().trim().min(1).max(2000),
  createdAt: z.string().datetime({ offset: true })
});

export const chatMessagesResponseSchema = z.object({
  thread: chatThreadSchema,
  messages: z.array(chatMessageSchema)
});

export const sendChatMessageInputSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Message is required.')
    .max(2000, 'Messages must be 2000 characters or fewer.')
});

export const startChatResponseSchema = chatThreadSchema;
export const sendChatMessageResponseSchema = chatMessageSchema;

export const profileSchema = z.object({
  id: z.uuid(),
  fullName: z.string().trim().max(80),
  bio: z.string().trim().max(280),
  avatarUrl: z.url().nullable(),
  contactLinks: contactLinksSchema.default({}),
  skills: z.array(skillSchema).max(16),
  projects: z.array(projectSchema),
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
  contactLinks: contactLinksSchema.default({}),
  skills: z.array(skillSchema).max(16, 'Add 16 skills or fewer.'),
  projects: z.array(projectInputSchema)
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
