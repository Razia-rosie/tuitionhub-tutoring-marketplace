# Architecture

TuitionHub is a React single-page app that talks directly to Supabase (Auth plus Postgres with row-level security). There is no app server: every permission rule lives in the database.

```
Browser (React 19 + Vite)
  ├─ src/App.tsx        route state, auth state, Prototype navigator
  ├─ screens (*.tsx)    read AppCtx, call src/api.ts
  ├─ src/api.ts         the only module that calls Supabase
  └─ src/store.ts       in-memory demo data for features not yet on Supabase
            │  HTTPS (publishable key + user JWT)
            ▼
Supabase
  ├─ Auth               email/password, confirmation and reset emails
  └─ Postgres           tables + RLS policies + security-definer RPCs
                        (supabase/migrations/*.sql)
```

## Source map

| File | Responsibility |
| --- | --- |
| `src/main.tsx` | Mounts `<App />` and imports global CSS |
| `src/App.tsx` | Holds the current route, role, status and user; restores the session on load; listens for sign-out and password recovery; renders the matching screen; contains the Prototype navigator |
| `src/ui.tsx` | Shared UI kit (buttons, fields, cards, toasts), the `AppCtx` context, and the `Role` and `Status` types |
| `src/supabase.ts` | Creates the Supabase browser client from the `VITE_SUPABASE_*` env vars |
| `src/api.ts` | Auth (`login`, `signUp`, `me`, `logout`, password reset), profile loading, admin RPCs, and `landingFor()`, which picks a user's first screen |
| `src/Public.tsx` | Landing page, login (user and admin), forgot/reset password, role select, session timeout |
| `src/Onboarding.tsx` | Registration forms, email-confirmation screen, pending/review status screen, guardian–student link |
| `src/Profile.tsx` | Role-specific profile wizard and the "account active" screen |
| `src/Dash.tsx` | Role dashboards, sidebar navigation (`navFor`), profile-incomplete and access-denied screens |
| `src/Learn.tsx`, `src/Rooms.tsx` | Marketplace (feed, apply, chat, demo class, agreement), learning rooms, batches, results, feedback |
| `src/Admin.tsx` | Admin console: applicant queue and status changes |
| `src/Shell.tsx` | Signed-in page layout (sidebar, header, banner) |
| `src/store.ts` | `useSyncExternalStore` demo store; reset from the Prototype navigator |
| `src/DesignSystem.tsx`, `src/QAReport.tsx` | Internal reference pages |

## Routing

There's no URL router. `App.tsx` keeps a `route` string in state and switches on it. Screens move between routes with `go(route)` from `AppCtx`. `go` guards protected routes: `admin` requires an admin user, and the dashboards require a signed-in user. Routes starting with `learn:` or `dash:` open `Learn` or `Dashboard` at a sub-view (e.g. `learn:rooms`).

Because the URL never changes, refreshing returns to the landing page. If a session exists, it then routes to `landingFor(user)`.

## Auth flow

1. **Sign-up.** `signUp()` passes `role`, `display_name` and `phone` as user metadata. The `on_auth_user_created` trigger creates a `profiles` row with status `pending`. Only tutor, center and guardian can sign themselves up.
2. **Email confirmation.** With confirmation on, there's no session until the user clicks the link, which returns to the app origin.
3. **Login.** `login()` signs in, then loads the user's profile. `landingFor()` sends admins to `admin`, active users to `dashboard`, approved users to `dashboard-incomplete`, and everyone else to `pending`.
4. **Review.** An admin changes the status with `admin_set_account_status`. Once approved, the user completes the profile wizard and `complete_profile()` makes the account `active`.
5. **Session end.** A `SIGNED_OUT` event that the user didn't trigger (token expiry, sign-out in another tab) routes to the `timeout` screen.
6. **Password reset.** The reset email link sets `type=recovery` in the URL hash, and the app opens `reset-password` instead of a dashboard.

See [DATABASE.md](DATABASE.md) for the account statuses and the server-side rules.

## Live vs demo data

| On Supabase now | Still demo data (`src/store.ts`) |
| --- | --- |
| Auth, sign-up, password reset | Marketplace posts, applications, chat |
| Display name, account status, admin note | Learning rooms, sessions, assignments |
| Profile activation | Coaching-center batches, school results |
| Admin applicant queue | Reviews, interviews, document uploads, guardian-added students |

The database already has tables and policies for posts, applications, messages, rooms, sessions, assignments and reviews; the screens aren't wired to them yet. Guardian-added students need a server-side step (an Edge Function using the service role), because the sign-up trigger rejects the `student` role.

## Styling

Tailwind CSS v4 via `@tailwindcss/vite`. Theme tokens and global styles live in `src/index.css`. See `AGENTS.md` for the layering rules.

## Leftovers

- `backend-patches/` and the `express`, `mysql2`, `bcryptjs`, `cookie-parser` and `dotenv` dependencies come from the retired PHP/MySQL backend. The frontend doesn't use them.
- The Figma Make scaffolding (its Vite plugins and `.figma/`) has been removed. `index.html` now holds the title and meta tags directly, and `public/robots.txt` blocks indexing.
