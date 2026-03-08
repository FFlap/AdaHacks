import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { getSeedEnv } from '../src/env.js';
import { seedDemoProfiles } from '../src/demoSeed.js';
import { createAdminClient } from '../src/supabase.js';

dotenv.config({
  path: fileURLToPath(new URL('../../.env', import.meta.url))
});

async function main() {
  const env = getSeedEnv();
  const adminClient = createAdminClient(env);
  const result = await seedDemoProfiles({
    adminClient,
    logger: console
  });

  process.stdout.write(`Seeded ${result.count} demo builders.\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
