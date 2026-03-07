import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { getEnv } from './env.js';

dotenv.config({
  path: fileURLToPath(new URL('../../.env', import.meta.url))
});

const env = getEnv();
const app = createApp({ env });

app.listen(env.port, () => {
  process.stdout.write(`API listening on http://localhost:${env.port}\n`);
});
