# Roadmap

What runs on Supabase today, what is still demo data, and the work needed to finish each piece. [ARCHITECTURE.md](ARCHITECTURE.md#live-vs-demo-data) has the current split.

## Done

- Supabase Auth: sign-up (tutor, center, guardian), email confirmation, login, logout, session restore, password reset
- `profiles` with role and account status, created by a database trigger
- Admin applicant queue: list, approve, reject, request correction, invite to interview (status and note only)
- The applicant sees their real status and the admin's note
- Profile activation through `complete_profile()`
- Row-level security on every table; the application status-transition guard

## Next

Ordered so each step builds on the one before it.

1. **Hide the Prototype navigator in production.** Render it only when `import.meta.env.DEV` is true, or behind a flag.
2. **Persist profile wizard data.** Add role-specific profile columns or tables (subjects, areas, rates, institution details). Today only the completion state is saved.
3. **Document uploads.** Create a private Supabase Storage bucket for verification photos. Store paths on the profile, and add storage policies so only the owner and admins can read them. Replace the `DocUpload` mock in `src/ui.tsx`.
4. **Interviews.** Add an `interviews` table (type, time, link or address, status), and have the admin console and pending screen read from it instead of local state.
5. **Guardian-added students.** Add an Edge Function that uses the service role to create the student's auth user, insert the profile with role `student`, and link it in `guardian_students`. The browser can't do this, because the sign-up trigger rejects the `student` role on purpose.
6. **Marketplace.** Connect the feed, apply, shortlist, chat request and hire screens (`src/Learn.tsx`) to `tuition_posts`, `applications` and `messages`. The RLS policies and the transition guard already exist. Use Supabase Realtime for chat.
7. **Rooms.** On hire, create a `rooms` row in a security-definer RPC (there's no insert policy on purpose). Then connect sessions, attendance (`student_check_in`), assignments (`submit_assignment`) and reviews.
8. **Coaching-center batches and school results.** These need new tables; design them with RLS from the start.
9. **URL routing.** Swap the route state in `App.tsx` for a router, so deep links and the browser's back button work. `vercel.json` already rewrites every path to `index.html`.

## Engineering debt

- Remove the dependencies left from the PHP/MySQL backend (`express`, `mysql2`, `bcryptjs`, `cookie-parser`, `dotenv` and their `@types`), and delete `backend-patches/`.
- `package-lock.json` is stale next to `pnpm-lock.yaml`. Delete it and use pnpm only.
- Wrap `auth.uid()` as `(select auth.uid())` in RLS policies, so Postgres evaluates it once per query instead of once per row (Supabase's performance advisor flags this).
- Add automated tests: unit tests for `landingFor()` and the API error mapping, and SQL tests for the RLS policies and the transition guard (for example with pgTAP).
- The main JavaScript chunk is over 600 kB. Code-split the large screens (`Learn`, `Admin`, `DesignSystem`) with `React.lazy`.
