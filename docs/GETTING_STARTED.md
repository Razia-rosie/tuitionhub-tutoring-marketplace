# Getting started

This guide takes you from a fresh clone to a running app with a working Supabase backend.

## Prerequisites

- Node.js 22 and pnpm 10 (versions pinned in `.mise.toml`; `mise install` sets both up)
- A Supabase project (the free plan is enough)

## 1. Install and configure

```bash
pnpm install
```

```bash
cp .env.example .env.local
```

Fill in `.env.local` from Supabase → **Settings → API Keys**:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the `sb_publishable_…` key |

Use only the publishable key. It's safe in the browser because every table has row-level security. Never put the `service_role` or secret key in a `VITE_` variable, because Vite bundles every `VITE_` variable into the JavaScript.

## 2. Create the database

In the Supabase dashboard, open **SQL Editor → New query** and run each file in `supabase/migrations/` in filename order:

1. `20261029000000_init.sql`
2. `20261029010000_admin_and_profile_rpcs.sql`

Each file runs as one transaction: it either applies completely or not at all. To check that the schema is in place:

```sql
select relname, relrowsecurity from pg_class
 where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1;
```

You should see 9 tables, all with `relrowsecurity = true`. [DATABASE.md](DATABASE.md) describes them.

## 3. Configure Auth URLs

In **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:8443`
- **Redirect URLs:** `http://localhost:8443` and `http://localhost:8443/**`

Without these, confirmation and password-reset emails link to the default `http://localhost:3000`, where nothing is running.

## 4. Add test accounts (optional)

Copy `supabase/seed.sql` to the git-ignored `supabase/seed.local.sql` and replace each `CHANGE_ME` with a password. Then paste the copy into the SQL editor and click **Run**. Supabase warns about a destructive operation, which is the script's cleanup of earlier `@tuitionhub.test` users; confirm it. The last result lists 7 accounts, one per role plus a pending tutor and an approved center ([README](../README.md#test-accounts)). The unedited template refuses to run.

## 5. Run the app

```bash
pnpm dev
```

Open <http://localhost:8443>. The port is fixed (`strictPort`) because the Supabase redirect URLs point at it. If something else is using 8443, stop that process; don't change the port.

Other scripts:

| Command | What it does |
| --- | --- |
| `pnpm build` | Production build into `dist/` |
| `pnpm preview` | Serve `dist/` on port 8443 |
| `pnpm format` | Format with oxfmt |
| `npx tsc --noEmit -p .` | Type-check (there is no separate lint step) |

## 6. Make an admin

Admins can't sign up. Either use the seeded `admin@tuitionhub.test`, or sign up normally and promote that account in SQL:

```sql
update public.profiles set role = 'admin', account_status = 'active'
 where id = (select id from auth.users where email = 'you@example.com');
```

Admins sign in through **Admin? Log in here** on the login screen. The normal login rejects admin accounts, and the admin login rejects everyone else.

## The Prototype navigator

The floating **Prototype** button (bottom-left on mobile, bottom-right on desktop) jumps to any screen in any state. Without a signed-in user, those screens show demo data from `src/store.ts`, which is handy for reviewing designs. With a session, the live screens (pending, profile wizard, admin) use Supabase instead. Hide this button before a public launch (see [DEPLOYMENT.md](DEPLOYMENT.md#checklist-before-a-public-launch)).
