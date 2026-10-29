# TuitionHub

React + Vite + Tailwind CSS tutoring marketplace backed by Supabase.

## Development Server

Start it with `pnpm dev` (or the "vite" entry in `.claude/launch.json`). It serves on port 8443, which must match the Supabase Auth Site URL. Hot reload is on.

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Primary application component and the usual starting point for UI work
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Vite configuration with React and Tailwind CSS v4 plugins, the `@` alias for `src`, and the fixed dev port
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

Tailwind emits utility classes in `@layer utilities`, and CSS outside any cascade layer overrides every layer regardless of specificity. Put global element styles, such as resets and defaults for `body`, headings, `button`, or `input`, inside `@layer base { ... }` so utility classes on those elements still apply. Tailwind's Preflight already applies `box-sizing: border-box`, removes default margins, and sets `font: inherit` on form controls, so do not repeat those rules.

## Backend (Supabase)

- Client: `src/supabase.ts` (reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env.local`; see `.env.example`).
- Data access: `src/api.ts` — auth (`login`, `signUp`, `me`, `logout`, `requestPasswordReset`, `updatePassword`) and profile loading. Screens call these, never `supabase` directly.
- Schema: `supabase/migrations/*.sql` (Postgres enums, tables, RLS policies, signup trigger, RPCs). Every table has row-level security; users cannot change their own `role` or `account_status`.
- Admin accounts are created by SQL only: `update public.profiles set role = 'admin', account_status = 'active' where id = '<auth user id>';`
- Live with a real session: auth, display name, pending status and admin note, profile activation (`complete_profile`), and the admin applicant queue (`admin_list_applicants`, `admin_set_account_status`). Without a session (prototype navigator) those screens fall back to demo data.
- Still demo-only (`src/store.ts`): marketplace, rooms, batches, interviews, document uploads, guardian-added students (these need an Edge Function with the service role).
- Supabase Auth → URL Configuration must list the app origin (e.g. `http://localhost:8443`) or confirmation/reset emails redirect to the Site URL.
