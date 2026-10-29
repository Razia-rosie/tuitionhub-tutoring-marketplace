# Contributing

## Setup

You need Node 22 and pnpm 10 (see `.mise.toml`; `mise install` sets both up).

```bash
pnpm install
```

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project's URL and publishable key, apply the migrations (see [docs/DATABASE.md](docs/DATABASE.md)), then start the dev server:

```bash
pnpm dev
```

The app runs at http://localhost:8443. Use the **Prototype** button (bottom corner) to jump to any screen or state.

## Before you open a pull request

```bash
pnpm build
```

```bash
npx tsc --noEmit
```

```bash
pnpm format
```

There is no test suite yet. Check your change in the browser at 1440, 768 and 390 px wide, and sign in with a seeded test account if it touches auth or data.

## Conventions

- **Data access goes through `src/api.ts`.** Screens never import `supabase` directly. Turn Supabase errors into an `ApiError` with a message a user can understand.
- **Permissions belong in the database.** Each new table needs RLS turned on and policies in a new migration. For any write that has to be checked (status changes, anything that crosses users), use a `security definer` RPC with `set search_path = ''` and revoke `execute` from `public` and `anon`.
- **Schema changes are new migration files** named `YYYYMMDDHHMMSS_description.sql`. Never edit one that has already been applied.
- **Styling** uses Tailwind utilities in JSX. Global styles go in `src/index.css`, inside `@layer base` (see `AGENTS.md`).
- **Navigation** uses `go('<route>')` from `useApp()`. A new screen also needs a `case` in `App.tsx` and, ideally, an entry in the Prototype navigator.
- **Commits** are short, in the imperative ("Add tutor review RPC"), one logical change each.
- **Lockfile:** use pnpm and commit `pnpm-lock.yaml`. Don't update `package-lock.json`.

## Secrets

Never commit `.env.local`, Supabase service-role or secret keys, or real user data. The browser only needs the publishable key. See [SECURITY.md](SECURITY.md).
