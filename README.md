# gym-tracker

Gym workout tracker built with React + Vite + TypeScript, with optional Supabase persistence.

## Requirements

- Node.js (recommended: latest LTS)

## Setup

Install dependencies:

```bash
npm install
```

Create `.env` (or `.env.local`) in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the app:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Supabase (optional)

If you want profiles and history stored in Supabase, run the SQL migrations from `supabase/migrations/` in the Supabase Dashboard SQL Editor.

Notes:

- Profiles are created via `supabase/migrations/001_profiles.sql` (table + RLS + trigger that inserts a profile row from signup metadata).
- Other tables/migrations live in `supabase/migrations/` (exercises, trainings, templates-related fields, kinematics fields).

See `supabase/README.md` for more details.

