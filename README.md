# Escent

Escent is a social learning journal — a place to document what you study, solve, question, and discover. Think of it as a personal learning space with a social layer: you organize posts by subject, publish findings in a structured Q&A format, and follow other learners to see their work in your feed.

## What you can do

- **Create a profile** with a display name and avatar on your own learning space (`/@username`).
- **Organize by subjects** — tag posts with colored subjects like Physics, Poetry, or LeetCode.
- **Publish journal posts** with a title, optional photo, and one or more question-and-answer sections.
- **Ask and answer questions** on posts — others can ask follow-up questions; post owners can answer them.
- **Comment on posts** to share thoughts, corrections, or encouragement.
- **Follow people** with request/accept flow — once accepted, their posts appear on your feed.
- **Discover learners** via search and manage incoming follow requests.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **State & data:** Zustand, TanStack Query
- **Backend:** Supabase (Auth, Postgres, Row Level Security)
- **Deployment:** Netlify (SPA)

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (LTS recommended)
- npm (comes with Node)
- A [Supabase](https://supabase.com/) project for auth and database

## Local setup

### 1. Clone and install

```bash
git clone <repository-url>
cd Escent
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root. This file is gitignored and should never be committed.

You will need two values from your Supabase project dashboard (**Project Settings → API**):

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key |

Add them to `.env` in this format (replace with your own values):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note:** Only the anon key belongs in the frontend. Never put service-role or other secret keys in `.env` for this app.

### 3. Set up the database

Run the SQL schema in your Supabase project:

1. Open the Supabase dashboard → **SQL Editor**
2. Copy the contents of [`supabase_schema.sql`](./supabase_schema.sql)
3. Paste and run the script

This creates the tables, policies, and relationships for profiles, subjects, posts, sections, comments, and follows.

### 4. Run the app

Start the development server:

```bash
npm run dev
```

Vite will print a local URL (typically `http://localhost:5173`). Open it in your browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |

## Project structure

```
src/
├── components/
│   ├── journal/     # Posts, subjects, composer, discussion
│   ├── layout/      # Navbar, bottom nav, page shell
│   └── social/      # Follow button and related UI
├── lib/             # Supabase clients, auth, journal, social logic
├── pages/           # Route-level pages (Feed, Profile, Auth, …)
└── store/           # Zustand auth session state
```

## Routes

| Path | Page |
| --- | --- |
| `/` | Landing |
| `/auth` | Log in |
| `/auth?signup=true` | Sign up |
| `/feed` | Feed from people you follow |
| `/people` | Find people and manage follow requests |
| `/:username` | User profile and journal |

## Deployment

The app is configured for Netlify (`netlify.toml` builds `dist/`). Set the same environment variables in your Netlify site settings under **Site configuration → Environment variables** before deploying.

## License

Private project — all rights reserved unless otherwise specified by the repository owner.
