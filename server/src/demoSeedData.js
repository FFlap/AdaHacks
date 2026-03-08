import { z } from 'zod';
import {
  contactLinksSchema,
  projectInputSchema,
  skillSchema
} from '@adahacks/shared/contracts';

function addDuplicateIssue(values, label, ctx) {
  const seen = new Set();

  values.forEach((value, index) => {
    const normalizedValue = value.trim().toLowerCase();

    if (seen.has(normalizedValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate ${label}: ${value}`,
        path: [index]
      });
      return;
    }

    seen.add(normalizedValue);
  });
}

const demoContactLinksSchema = contactLinksSchema.refine(
  (links) => Object.keys(links).length >= 1,
  'Each seeded person must have at least one contact method.'
);

const demoProjectSchema = projectInputSchema.extend({
  id: z.uuid()
});

const demoSeedPersonSchema = z.object({
  email: z.email(),
  fullName: z.string().trim().min(1).max(80),
  bio: z.string().trim().min(1).max(280),
  skills: z.array(skillSchema).min(1).max(16),
  contactLinks: demoContactLinksSchema,
  avatarSourceUrl: z.url(),
  project: demoProjectSchema
});

export const demoSeedSchema = z.array(demoSeedPersonSchema)
  .length(20, 'Seed dataset must contain exactly 20 demo builders.')
  .superRefine((entries, ctx) => {
    addDuplicateIssue(entries.map((entry) => entry.email), 'email', ctx);
    addDuplicateIssue(entries.map((entry) => entry.fullName), 'full name', ctx);
    addDuplicateIssue(entries.map((entry) => entry.project.name), 'project name', ctx);
  });

export const demoSeedPeople = demoSeedSchema.parse([
  {
    email: 'amara.okafor-rossi@demo.adahacks.local',
    fullName: 'Amara Okafor-Rossi',
    bio: 'Product-minded frontend engineer building calm financial tools for first-time founders and community lenders.',
    skills: ['React', 'TypeScript', 'GraphQL', 'Apollo', 'Tailwind CSS'],
    contactLinks: {
      github: 'https://github.com/amaraokafor'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/women/11.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c01',
      name: 'Neon Ledger',
      theme: 'Fintech',
      description: 'A lightweight cooperative budgeting workspace that helps micro-teams forecast runway, manage reimbursements, and explain cash decisions in plain language.',
      techStack: ['React', 'TypeScript', 'Apollo', 'PostgreSQL', 'Tailwind CSS']
    }
  },
  {
    email: 'kenji.watanabe-silva@demo.adahacks.local',
    fullName: 'Kenji Watanabe-Silva',
    bio: 'Full-stack builder focused on resilient civic software, bilingual UX, and fast deployment pipelines for volunteer-run teams.',
    skills: ['Vue', 'Nuxt', 'Firebase', 'Cloud Functions', 'Playwright'],
    contactLinks: {
      linkedin: 'https://www.linkedin.com/in/kenjiwatanabesilva'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/men/12.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c02',
      name: 'Harbor Whisper',
      theme: 'Civic Tech',
      description: 'A neighborhood alert board that turns city updates into readable summaries and routes the right tasks to volunteers during local disruptions.',
      techStack: ['Nuxt', 'Vue', 'Firebase', 'Cloud Functions', 'Playwright']
    }
  },
  {
    email: 'sofia.martinez-kline@demo.adahacks.local',
    fullName: 'Sofia Martinez-Kline',
    bio: 'Backend-heavy hacker who enjoys turning messy healthcare intake workflows into dependable tools that still feel human.',
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'HTMX'],
    contactLinks: {
      email: 'sofia.demo@adahacks.local'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/women/13.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c03',
      name: 'Clinic Atlas',
      theme: 'Health Access',
      description: 'A care-navigation dashboard that helps community clinics triage referrals, track appointments, and flag transportation barriers earlier.',
      techStack: ['FastAPI', 'Python', 'PostgreSQL', 'Docker', 'HTMX']
    }
  },
  {
    email: 'elias.haddad-mercer@demo.adahacks.local',
    fullName: 'Elias Haddad-Mercer',
    bio: 'Realtime systems engineer drawn to hackathon products that blend live collaboration, AI summarization, and low-friction onboarding.',
    skills: ['SvelteKit', 'Supabase', 'Drizzle', 'OpenAI', 'WebRTC'],
    contactLinks: {
      twitter: 'https://x.com/eliashmercer'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/men/14.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c04',
      name: 'Signal Grove',
      theme: 'Team Collaboration',
      description: 'A hack-team signal board that captures standups, clusters blockers, and generates role-specific action summaries after every sync.',
      techStack: ['SvelteKit', 'Supabase', 'Drizzle', 'OpenAI', 'WebRTC']
    }
  },
  {
    email: 'priya.raman-vasquez@demo.adahacks.local',
    fullName: 'Priya Raman-Vasquez',
    bio: 'Startup operator turned engineer, happiest when stitching together payments, auth, and opinionated onboarding flows for commerce tools.',
    skills: ['Next.js', 'Prisma', 'tRPC', 'PlanetScale', 'Clerk'],
    contactLinks: {
      github: 'https://github.com/priyaramanv'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/women/15.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c05',
      name: 'QuiltCart',
      theme: 'Creator Commerce',
      description: 'A pre-order studio for small makers that bundles waitlists, tiered drops, and fulfillment checklists into one guided flow.',
      techStack: ['Next.js', 'Prisma', 'tRPC', 'PlanetScale', 'Clerk']
    }
  },
  {
    email: 'matteo.deluca-byrne@demo.adahacks.local',
    fullName: 'Matteo DeLuca-Byrne',
    bio: 'Infrastructure-first engineer who enjoys building event-driven backends for logistics, marketplaces, and real-world ops dashboards.',
    skills: ['Go', 'Gin', 'Redis', 'Kafka', 'gRPC'],
    contactLinks: {
      linkedin: 'https://www.linkedin.com/in/matteodelucabyrne'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/men/16.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c06',
      name: 'Pulse Dock',
      theme: 'Logistics',
      description: 'A dock-operations planner that predicts congestion, reorders loading tasks, and gives dispatch teams one shared live timeline.',
      techStack: ['Go', 'Gin', 'Redis', 'Kafka', 'gRPC']
    }
  },
  {
    email: 'aisha.khan-belmont@demo.adahacks.local',
    fullName: 'Aisha Khan-Belmont',
    bio: 'Mobile engineer with a strong bias for offline-first UX, field data collection, and polished onboarding for distributed teams.',
    skills: ['React Native', 'Expo', 'SQLite', 'TanStack Query', 'NativeWind'],
    contactLinks: {
      instagram: 'https://instagram.com/aishakhanbuilds'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/women/17.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c07',
      name: 'TrailMint',
      theme: 'Field Ops',
      description: 'A mobile field-kit app for volunteer crews to capture tasks offline, sync later, and keep shift handoffs clear across teams.',
      techStack: ['React Native', 'Expo', 'SQLite', 'TanStack Query', 'NativeWind']
    }
  },
  {
    email: 'jonah.lee-campbell@demo.adahacks.local',
    fullName: 'Jonah Lee-Campbell',
    bio: 'Systems programmer who likes safe concurrency, clean APIs, and turning gnarly service integrations into maintainable internal tools.',
    skills: ['Rust', 'Actix Web', 'Postgres', 'Docker', 'NATS'],
    contactLinks: {
      github: 'https://github.com/jonahleecampbell'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/men/18.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c08',
      name: 'Foundry Map',
      theme: 'Industrial Data',
      description: 'A sensor-topology explorer that maps machine events to floor plans so operators can spot cascading failures faster.',
      techStack: ['Rust', 'Actix Web', 'Postgres', 'Docker', 'NATS']
    }
  },
  {
    email: 'nia.boateng-reyes@demo.adahacks.local',
    fullName: 'Nia Boateng-Reyes',
    bio: 'Platform engineer who enjoys structured monorepos, admin tooling, and building clear workflows for overstretched nonprofit teams.',
    skills: ['Angular', 'NestJS', 'Nx', 'MongoDB', 'Jest'],
    contactLinks: {
      email: 'nia.collab@adahacks.local'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/women/19.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c09',
      name: 'Civic Bloom',
      theme: 'Nonprofit Ops',
      description: 'A volunteer-program command center that automates intake triage, assigns mentors, and surfaces quiet drop-off risks.',
      techStack: ['Angular', 'NestJS', 'Nx', 'MongoDB', 'Jest']
    }
  },
  {
    email: 'luka.petrovic-hale@demo.adahacks.local',
    fullName: 'Luka Petrovic-Hale',
    bio: 'Design-engineer hybrid building consumer products with fast checkout paths, expressive interfaces, and strong experiment loops.',
    skills: ['Remix', 'Node.js', 'PostgreSQL', 'Stripe', 'Radix UI'],
    contactLinks: {
      phone: '+1-555-410-1024'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/men/20.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c10',
      name: 'Tempo Pantry',
      theme: 'Food Access',
      description: 'A lightweight pantry platform that coordinates pickup windows, donation inventory, and recurring family preferences without spreadsheets.',
      techStack: ['Remix', 'Node.js', 'PostgreSQL', 'Stripe', 'Radix UI']
    }
  },
  {
    email: 'miriam.goldberg-ibarra@demo.adahacks.local',
    fullName: 'Miriam Goldberg-Ibarra',
    bio: 'Data-focused full-stack engineer who likes practical dashboards, async jobs, and products that help teams explain impact clearly.',
    skills: ['Django', 'Celery', 'Redis', 'Bootstrap', 'Chart.js'],
    contactLinks: {
      linkedin: 'https://www.linkedin.com/in/miriamgoldbergibarra'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/women/21.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c11',
      name: 'Orchard Lens',
      theme: 'Impact Reporting',
      description: 'A reporting workspace that turns operational metrics into grant-ready charts and plain-language impact notes for small organizations.',
      techStack: ['Django', 'Celery', 'Redis', 'Bootstrap', 'Chart.js']
    }
  },
  {
    email: 'ximena.duarte-cho@demo.adahacks.local',
    fullName: 'Ximena Duarte-Cho',
    bio: 'Edge-platform enthusiast building fast content systems, durable workflows, and surprisingly delightful interfaces for distributed communities.',
    skills: ['Astro', 'SolidJS', 'Cloudflare Workers', 'KV', 'UnoCSS'],
    contactLinks: {
      github: 'https://github.com/ximenaduartecho'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c12',
      name: 'Tide Scribe',
      theme: 'Knowledge Sharing',
      description: 'A fast edge-published publishing tool that helps communities capture event learnings and turn them into searchable playbooks.',
      techStack: ['Astro', 'SolidJS', 'Cloudflare Workers', 'KV', 'UnoCSS']
    }
  },
  {
    email: 'owen.fraser-nguyen@demo.adahacks.local',
    fullName: 'Owen Fraser-Nguyen',
    bio: 'Scrappy product engineer who likes server-rendered apps, clean CRUD, and admin experiences that reduce support load quickly.',
    skills: ['Laravel', 'MySQL', 'Livewire', 'Alpine.js', 'Pest'],
    contactLinks: {
      twitter: 'https://x.com/owenfraserng'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/men/23.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c13',
      name: 'Lantern Grid',
      theme: 'Community Services',
      description: 'A service-referral console that tracks intake, suggests next steps, and keeps neighborhood support partners aligned in one queue.',
      techStack: ['Laravel', 'MySQL', 'Livewire', 'Alpine.js', 'Pest']
    }
  },
  {
    email: 'zahra.hosseini-price@demo.adahacks.local',
    fullName: 'Zahra Hosseini-Price',
    bio: 'Mobile-first builder interested in travel, routing, and map-based experiences that remain useful in low-connectivity environments.',
    skills: ['Flutter', 'Dart', 'Firebase', 'Riverpod', 'Maps SDK'],
    contactLinks: {
      linkedin: 'https://www.linkedin.com/in/zahrahosseiniprice'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/women/24.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c14',
      name: 'Wayfare Note',
      theme: 'Transit',
      description: 'A transit companion that builds accessible trip notes, crowdsources route friction, and shares safe alternatives in real time.',
      techStack: ['Flutter', 'Dart', 'Firebase', 'Riverpod', 'Maps SDK']
    }
  },
  {
    email: 'thiago.santos-wu@demo.adahacks.local',
    fullName: 'Thiago Santos-Wu',
    bio: 'Realtime web engineer shipping marketplace communication tools, queueing systems, and collaborative dashboards under tight deadlines.',
    skills: ['Node.js', 'Express', 'Socket.IO', 'RabbitMQ', 'Vue'],
    contactLinks: {
      github: 'https://github.com/thiagosantoswu'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/men/25.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c15',
      name: 'Rally Harbor',
      theme: 'Marketplace Ops',
      description: 'A live escalation hub that helps support teams coordinate seller incidents, assign owners, and keep stakeholders updated.',
      techStack: ['Node.js', 'Express', 'Socket.IO', 'RabbitMQ', 'Vue']
    }
  },
  {
    email: 'elodie.martin-patel@demo.adahacks.local',
    fullName: 'Elodie Martin-Patel',
    bio: 'Frontend specialist who loves motion, state orchestration, and building crisp interfaces that make complex work feel manageable.',
    skills: ['React', 'Vite', 'Zustand', 'Framer Motion', 'Vitest'],
    contactLinks: {
      instagram: 'https://instagram.com/elodiemakes'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/women/26.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c16',
      name: 'Prism Pantry',
      theme: 'Mutual Aid',
      description: 'A colorful coordination app for community fridges that tracks stock health, volunteer shifts, and neighborhood request patterns.',
      techStack: ['React', 'Vite', 'Zustand', 'Framer Motion', 'Vitest']
    }
  },
  {
    email: 'hassan.elamin-ford@demo.adahacks.local',
    fullName: 'Hassan Elamin-Ford',
    bio: 'Backend engineer interested in dependable JVM services, strong schema discipline, and operational tools with clear failure modes.',
    skills: ['Kotlin', 'Ktor', 'PostgreSQL', 'Exposed', 'Flyway'],
    contactLinks: {
      email: 'hassan.ford.demo@adahacks.local'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/men/27.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c17',
      name: 'Beacon Batch',
      theme: 'Operations',
      description: 'A batch-visibility tool that shows job health, isolates slow tenants, and writes actionable recovery notes for on-call teams.',
      techStack: ['Kotlin', 'Ktor', 'PostgreSQL', 'Exposed', 'Flyway']
    }
  },
  {
    email: 'ingrid.solberg-molina@demo.adahacks.local',
    fullName: 'Ingrid Solberg-Molina',
    bio: 'Realtime product engineer who prefers highly interactive dashboards, strong defaults, and backend processes that stay observable.',
    skills: ['Phoenix', 'Elixir', 'LiveView', 'Oban', 'Ecto'],
    contactLinks: {
      github: 'https://github.com/ingridsm'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/women/28.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c18',
      name: 'Hearth Signal',
      theme: 'Housing Support',
      description: 'A live casework board that helps housing advocates coordinate appointments, deadlines, and document follow-ups without email chaos.',
      techStack: ['Phoenix', 'Elixir', 'LiveView', 'Oban', 'Ecto']
    }
  },
  {
    email: 'rafael.costa-adebayo@demo.adahacks.local',
    fullName: 'Rafael Costa-Adebayo',
    bio: 'Pragmatic enterprise engineer who likes boring reliability, thoughtful reporting flows, and fast ways to expose decision-critical data.',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'JUnit', 'Thymeleaf'],
    contactLinks: {
      linkedin: 'https://www.linkedin.com/in/rafaelcostaadebayo'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/men/29.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c19',
      name: 'Summit Canvas',
      theme: 'Program Planning',
      description: 'A planning board for accelerator cohorts that aligns milestones, mentor notes, and risk flags around each founder team.',
      techStack: ['Java', 'Spring Boot', 'PostgreSQL', 'JUnit', 'Thymeleaf']
    }
  },
  {
    email: 'mei.tanaka-rivera@demo.adahacks.local',
    fullName: 'Mei Tanaka-Rivera',
    bio: 'Performance-oriented full-stack engineer exploring resumable apps, edge runtimes, and developer tooling that shortens feedback loops.',
    skills: ['Qwik', 'TypeScript', 'Supabase', 'Deno', 'Cypress'],
    contactLinks: {
      github: 'https://github.com/meitanakarivera'
    },
    avatarSourceUrl: 'https://randomuser.me/api/portraits/women/30.jpg',
    project: {
      id: '810f2a41-2c97-42c7-b68c-f652ee3f3c20',
      name: 'Echo Current',
      theme: 'Developer Experience',
      description: 'A release companion that summarizes deploy changes, links failing checks to ownership, and gives faster confidence during launches.',
      techStack: ['Qwik', 'TypeScript', 'Supabase', 'Deno', 'Cypress']
    }
  }
]);
