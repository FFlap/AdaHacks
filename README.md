# AdaHacks Starter

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a single root env file:

   ```bash
   cp .env.example .env
   ```

3. Fill `.env` with your Supabase project values:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   VITE_API_URL=http://localhost:4010

   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   CLIENT_ORIGIN=http://localhost:5173
   PORT=4010
   OPENROUTER_API_KEY=your-openrouter-api-key
   OPENROUTER_MODEL=arcee-ai/trinity-large-preview:free
   ```

   `OPENROUTER_API_KEY` is server-only. Do not expose it via a `VITE_*` variable.

4. Link your hosted Supabase project and push the repo migration:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

5. Optionally seed 20 demo builders plus projects into your hosted Supabase project:

   ```bash
   npm run seed:demo -w server
   ```

6. In the Supabase dashboard, enable Email auth under Authentication if it is not already enabled.

7. Start the app:

   ```bash
   npm run dev
   ```

## Local Development

Run both services from the repo root:

```bash
npm run dev
```

- Client: `http://localhost:5173`
- API: `http://localhost:4010`

If Vite starts on a different port such as `5174`, update `CLIENT_ORIGIN` in the root `.env` to match it before testing profile saves.

## Commands

```bash
npm run lint
npm run test
npm run test:e2e
```

`npm run test:e2e` expects `E2E_EMAIL` and `E2E_PASSWORD` to be set for a verified Supabase test user.
