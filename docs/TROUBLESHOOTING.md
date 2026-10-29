# Troubleshooting (local development)

For problems with a Vercel deployment, see [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting).

## The app won't start

| Symptom | Fix |
| --- | --- |
| `Port 8443 is already in use` | Another process holds the port; find it with `lsof -nP -iTCP:8443 -sTCP:LISTEN` and stop it. Don't change the port: Supabase's redirect URLs point at 8443. |
| Blank page; console shows `Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY` | `.env.local` is missing or incomplete. Copy `.env.example` and fill it in, then restart `pnpm dev`, because Vite reads env files only at startup. |
| Changes to `.env.local` or `vite.config.ts` have no effect | Restart the dev server. |

## Signing in

| Symptom | Cause and fix |
| --- | --- |
| "Email or password is incorrect" for a seeded account | The seed didn't run, or it was cancelled at the warning dialog. Check with `select email from auth.users where email like '%@tuitionhub.test';`, and re-run your `supabase/seed.local.sql`, confirming the warning. The committed `seed.sql` is a template that refuses to run. |
| "Confirm your email first" | The account signed up but never opened its confirmation link. Resend the link from Supabase → Authentication → Users, or mark the user confirmed there. |
| "Please use the administrator sign-in page" | Admin accounts must use **Admin? Log in here**. |
| "Your account profile is missing" | An auth user exists without a `profiles` row (for example, one created in the dashboard before the migrations ran). Delete the user and sign up again, or insert the profile in SQL. |
| "Unable to reach TuitionHub" | Wrong `VITE_SUPABASE_URL`, no network, or the Supabase project is paused (free projects pause after a week of inactivity; restore it in the dashboard). |
| Logged in, but always sent to the "signed out" screen | The session expired or was revoked. Log in again. If it keeps happening, check the device clock, since JWT expiry is time-based. |

## Emails

| Symptom | Fix |
| --- | --- |
| Confirmation or reset links open `localhost:3000` | Set the Site URL and redirect URLs in Supabase → Authentication → URL Configuration ([GETTING_STARTED.md](GETTING_STARTED.md#3-configure-auth-urls)). |
| No email arrives | Supabase's built-in sender allows only a few emails per hour, and only to addresses on your team. Wait, or set up custom SMTP under Authentication → Emails. |
| A reset link opens a dashboard instead of "Choose a new password" | Open the link in the same browser that runs the app, and make sure the URL still contains `#access_token=…&type=recovery`. Some mail clients' link scanners use up one-time links; request a new one. |

## SQL editor

| Symptom | Fix |
| --- | --- |
| "Potential issues detected" dialog | Supabase flags destructive statements, such as the seed's cleanup `delete`. Choose **Run query** to continue; **Cancel** runs nothing. |
| A migration fails part-way | Each migration runs in one transaction, so nothing was applied. Fix the cause and run the whole file again. |
| `type "user_role" already exists` | That migration already ran. Run only the newer files. |
| `permission denied` when calling an `admin_*` function from the app | The signed-in user isn't an admin. Check `select role from public.profiles where id = auth.uid();`. |

## Legacy backend

Older versions of this project used a PHP API on XAMPP with MySQL, and a Vite `/api` proxy. All of that is gone. If you find an old note about `http://localhost/tuitionhub/api` or MySQL error 1045, it no longer applies. A Docker MySQL container on port 3306 from that setup isn't used by this app and can be stopped.
