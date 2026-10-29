# Security

## Reporting a vulnerability

Please don't open a public issue. Report it privately through GitHub's **Security → Report a vulnerability** form on this repository. Include steps to reproduce it and what an attacker could do with it. We aim to reply within a week.

## How the app is secured

- The browser uses only the Supabase **publishable** key. Every table has row-level security, and the policies in `supabase/migrations/` decide what each signed-in user can read or write (summary in [docs/DATABASE.md](docs/DATABASE.md)).
- Users can't change their own role or account status. Only admins can, through checked RPCs, and admin accounts are created only in SQL.
- Privileged functions are `security definer` with an empty `search_path`, and `execute` is revoked from `anon`.
- Sessions are managed by Supabase Auth (JWTs that refresh automatically).
- Vercel sends `X-Content-Type-Options`, `X-Frame-Options` and `Referrer-Policy` headers (see `vercel.json`).

## Things to know

- **Seeded test accounts.** `supabase/seed.sql` and the README publish passwords for the `@tuitionhub.test` accounts. Never run the seed on a project with real users, and delete those accounts before launch.
- **Prototype navigator.** The Prototype button shows any screen with demo data. It doesn't bypass RLS (no real data appears without a session), but remove it before a public launch.
- **Never commit** `.env.local`, the service-role key, database passwords, or exports of real user data.
