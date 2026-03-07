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

   That push now creates:
   - the `profiles` columns for `avatar_path` and `skills`
   - the `projects` table used by the profile page project cards
   - the authenticated project-discovery feed function used by `/projects`
   - the authenticated people-discovery feed function used by `/people`
   - the public `profile-images` storage bucket
   - storage policies so each user can upload only their own avatar file

5. In the Supabase dashboard, enable Email auth under Authentication if it is not already enabled.

6. Start the app:

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

## AI Project Match

- The project card info button on `/projects` calls `POST /api/v1/projects/:projectId/analysis`.
- The server sends the signed-in user’s skills plus their own saved projects to OpenRouter and returns:
  - matching skills
  - missing skills
  - a contribution summary
- If you rotate the OpenRouter key, update the root `.env` and restart `npm run dev`.

## Commands

```bash
npm run lint
npm run test
npm run test:e2e
```

`npm run test:e2e` expects `E2E_EMAIL` and `E2E_PASSWORD` to be set for a verified Supabase test user.
