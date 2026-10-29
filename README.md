# TuitionHub — Tutoring Marketplace

React 19 + Vite 8 + Tailwind CSS v4 prototype of a tutoring marketplace (students, tutors, admins).

## Getting started

```bash
pnpm install   # or npm install
pnpm dev       # http://localhost:8443
```

Other scripts: `pnpm build`, `pnpm preview`, `pnpm format`.

## Backend

In development, Vite proxies `/api` to `http://localhost/tuitionhub` — a PHP 8 + MySQL backend served by XAMPP. Its private config (database credentials) lives outside this repo. `backend-patches/` holds patched backend files; `supabase/migrations/` holds the database schema.

## Project layout

- `src/App.tsx` — app entry and routing
- `src/api.ts` — API client for `/api`
- `src/store.ts` — mock data store
- `src/*.tsx` — feature screens (Public, Dash, Admin, Rooms, Learn, Profile, Onboarding…)
