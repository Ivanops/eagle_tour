# Supabase setup

Use two separate Supabase projects:

- `TennisApp Dev`: local development, demo data, and feature testing.
- `TennisApp Prod`: real users and data only.

## 1. Create the databases

Run `supabase/schema.sql` in the SQL editor for both Supabase projects.
Apply changes to Dev first, test the app, and then run the same SQL in Prod.

## 2. Configure local development

Create `.env.local` from `.env.example`:

```env
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
```

Do not commit `.env.local`. It is ignored by git.

## 3. Configure production

In the hosting provider, add the production project values:

```env
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
```

Keep the service role key out of the frontend app. The browser should only use the anon key.

## 4. Current app status

The app still uses the local provider in `lib/tennis-store.ts`, so the UI keeps working while Supabase is prepared.
The next migration step is to replace mock auth and localStorage reads/writes with Supabase Auth and database calls.
