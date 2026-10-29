# Deploying to Vercel

**Production:** <https://tuitionhub-tutoring-marketplace.vercel.app>. The Vercel project is `tuitionhub-tutoring-marketplace` in the `rosie-e9ad` team, linked to `main`.

TuitionHub is a static single-page app: Vercel builds it with Vite and serves `dist/`. All data and auth go straight from the browser to Supabase, so there are no Vercel functions to configure.

## What `vercel.json` does

| Setting | Value | Why |
| --- | --- | --- |
| `framework` | `vite` | Vercel's Vite preset |
| `installCommand` | `pnpm install --frozen-lockfile` | `pnpm-lock.yaml` is the source of truth. `package-lock.json` is out of date, so don't let Vercel pick npm. |
| `buildCommand` | `pnpm build` | Runs `vite build` |
| `outputDirectory` | `dist` | Vite's output folder |
| `rewrites` | everything → `/index.html` | Any deep link or refresh loads the app instead of a 404. Real files such as `/assets/*` and `/favicon.svg` are served first. |
| `headers` | long cache for `/assets/*`, plus security headers | Asset filenames are content-hashed, so they can be cached forever. The security headers block MIME sniffing and framing. |

`package.json` sets `"engines": { "node": "22.x" }` to match `.mise.toml`.

## One-time setup

1. **Import the repo.** In the Vercel dashboard, choose **Add New → Project**, pick `Razia-rosie/tuitionhub-tutoring-marketplace`, and keep the root directory as `./`. The settings in `vercel.json` override the dashboard's build settings.
2. **Add environment variables** (Project → Settings → Environment Variables) for Production, Preview and Development:

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (Supabase → Settings → API Keys) |

   Vite bakes these into the JavaScript bundle at build time. If they are missing, the build still succeeds, but the deployed page shows a blank screen with `Missing VITE_SUPABASE_URL…` in the console. Redeploy after changing them. Only use the **publishable** key here; never the `service_role` or secret key.
3. **Allow the Vercel URLs in Supabase** (Authentication → URL Configuration):
   - **Site URL:** your production URL, currently `https://tuitionhub-tutoring-marketplace.vercel.app`
   - **Redirect URLs:** add the production URL, `https://*-<your-team>.vercel.app/**` for preview deployments, and `http://localhost:8443/**` for local development

   Confirmation and password-reset emails redirect to `window.location.origin`. If that origin isn't on the list, Supabase sends users to the Site URL instead.
4. **Deploy.** Every push to `main` deploys to production; every other branch and pull request gets a preview URL.

## Deploying from the CLI (optional)

```bash
npm i -g vercel
```

```bash
vercel link
```

```bash
vercel env pull .env.local
```

```bash
vercel --prod
```

`vercel link` creates a `.vercel/` folder, which is git-ignored.

## Checklist before a public launch

- Delete the seeded test accounts (`delete from auth.users where email like '%@tuitionhub.test';`). Their passwords live in local files, and production shouldn't have shared test logins.
- Hide the **Prototype** navigator button in `src/App.tsx`. It lets anyone jump to any screen with demo data.
- Turn on email confirmation and set up a custom SMTP sender in Supabase Auth; the built-in sender is heavily rate-limited.
- Add a custom domain in Vercel, then update the Supabase Site URL and redirect URLs to match.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Blank page; console shows `Missing VITE_SUPABASE_URL…` | Environment variables weren't set when the build ran. Set them and redeploy. |
| `ERR_PNPM_OUTDATED_LOCKFILE` during install | `package.json` changed without updating `pnpm-lock.yaml`. Run `pnpm install` locally and commit the lockfile. |
| Email links open the wrong site | The deployment URL is missing from Supabase redirect URLs. |
| Login says it can't reach TuitionHub | Wrong `VITE_SUPABASE_URL`, or the Supabase project is paused. |
