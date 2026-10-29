# TuitionHub — Tutoring Marketplace

React 19 + Vite 8 + Tailwind CSS v4 app for a tutoring marketplace (tutors, coaching centers, guardians, students, admins), backed by Supabase.

## Getting started

```bash
pnpm install   # or npm install
cp .env.example .env.local   # then fill in the Supabase URL and publishable key
pnpm dev       # http://localhost:8443
```

Other scripts: `pnpm build`, `pnpm preview`, `pnpm format`.

## Documentation

- [Getting started](docs/GETTING_STARTED.md): set up the app and a Supabase project from scratch
- [Architecture](docs/ARCHITECTURE.md): how the app is put together, routing, auth flow, and which data is live and which is still demo
- [Database](docs/DATABASE.md): schema, account statuses, RLS policies and RPCs
- [Testing](docs/TESTING.md): test accounts, manual scenarios, and SQL access checks
- [Troubleshooting](docs/TROUBLESHOOTING.md): fixes for startup, sign-in, email and SQL editor problems
- [Deployment](docs/DEPLOYMENT.md): deploying to Vercel and configuring Supabase for it
- [Roadmap](docs/ROADMAP.md): what's left to build and known engineering debt
- [Contributing](CONTRIBUTING.md) and [Security](SECURITY.md)

## Deploy

| | Link |
| --- | --- |
| Source code | <https://github.com/Razia-rosie/tuitionhub-tutoring-marketplace> |
| Live app | <https://tuitionhub-tutoring-marketplace.vercel.app> |
| Vercel project | [rosie-e9ad/tuitionhub-tutoring-marketplace](https://vercel.com/rosie-e9ad/tuitionhub-tutoring-marketplace) (team access only) |
| One-click deploy | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FRazia-rosie%2Ftuitionhub-tutoring-marketplace&env=VITE_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY&envDescription=Supabase%20project%20URL%20and%20publishable%20key&envLink=https%3A%2F%2Fgithub.com%2FRazia-rosie%2Ftuitionhub-tutoring-marketplace%2Fblob%2Fmain%2Fdocs%2FDEPLOYMENT.md) |
| Deployment guide | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |

Every push to `main` deploys to production automatically, and other branches get preview URLs. The Vercel project has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` set, and Supabase Auth allows the production URL as its Site URL and as a redirect URL. To deploy a fork, use the button above and follow the deployment guide.

## Backend (Supabase)

- `src/supabase.ts` creates the browser client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `src/api.ts` wraps all auth and data calls (login, sign-up, profile, admin review).
- `supabase/migrations/` holds the schema: tables, row-level security, the sign-up trigger and RPCs. Run new files in order in the Supabase SQL editor.
- `supabase/seed.sql` is a template for the synthetic test accounts below (no real passwords).
- Auth → URL Configuration must allow the app's origin (`http://localhost:8443` in development), or confirmation and reset emails redirect to the wrong place.

The old PHP/XAMPP backend is retired; `backend-patches/` is kept only for reference.

## Test accounts

> **Development only.** Synthetic accounts on the reserved `.test` domain. This repository is public, so their passwords are never committed.

To create them:

1. Copy `supabase/seed.sql` to `supabase/seed.local.sql`. That file is git-ignored.
2. In the copy, replace each `CHANGE_ME` with a password. Keep these passwords out of the repo, issues and chat.
3. Paste the copy into the Supabase SQL editor and click **Run**. Supabase warns about a destructive operation, which is the cleanup of earlier `@tuitionhub.test` users; choose **Run query**. The last result lists all 7 accounts.

The unedited template refuses to run, so placeholder passwords never reach the database. Re-running resets the accounts. Admins sign in at **Admin? Log in here** on the login screen; everyone else uses the normal login.

| Role | Email | Status | What you'll see |
| --- | --- | --- | --- |
| Admin | `admin@tuitionhub.test` | active | Admin console with the live applicant queue |
| Private tutor | `tutor@tuitionhub.test` | active | Full tutor dashboard |
| Coaching center | `center@tuitionhub.test` | active | Full center dashboard |
| Guardian | `guardian@tuitionhub.test` | active | Guardian dashboard, linked to the test student |
| Student | `student@tuitionhub.test` | active | Student dashboard, linked to the test guardian |
| Tutor (in review) | `tutor.pending@tuitionhub.test` | pending | Pending screen; the admin can approve, reject or request a correction |
| Center (approved) | `center.approved@tuitionhub.test` | approved | Profile-incomplete dashboard; finish the wizard to activate |

Suggested walkthrough: sign in as the admin and approve `tutor.pending`. Then sign in as that tutor and click **Check for updates**; you should move on to profile setup.

To remove every test account:

```sql
delete from auth.users where email like '%@tuitionhub.test';
```

## Project layout

- `src/App.tsx` — app entry, routing, auth state and the Prototype navigator
- `src/api.ts` — Supabase data access; `src/supabase.ts` — client
- `src/store.ts` — in-memory demo data for screens not yet on Supabase (marketplace, rooms, batches)
- `src/*.tsx` — feature screens (Public, Onboarding, Profile, Dash, Admin, Rooms, Learn…)
- `supabase/` — migrations and seed data
- `docs/` — project documentation; `vercel.json` — Vercel build and hosting config
