# Testing

There is no automated test suite yet. Changes are checked with the type-checker, a production build, and the manual scenarios below, run against a Supabase project with the seeded test accounts.

## Automated checks

```bash
npx tsc --noEmit -p .
```

```bash
pnpm build
```

Both should finish without errors. Then open the app and check the browser console: a clean load logs nothing.

## Test accounts

Create them with `supabase/seed.sql` (see [GETTING_STARTED.md](GETTING_STARTED.md#4-add-test-accounts-optional)). Their emails are in the [README](../README.md#test-accounts), and their passwords are in your git-ignored `supabase/seed.local.sql`. They are confirmed already, so no email is needed.

| Account | Role | Status | Expected landing screen |
| --- | --- | --- | --- |
| `admin@` | admin | active | Admin console (via **Admin? Log in here**) |
| `tutor@` | tutor | active | Tutor dashboard |
| `center@` | center | active | Coaching-center dashboard |
| `guardian@` | guardian | active | Guardian dashboard (linked to the test student) |
| `student@` | student | active | Student dashboard |
| `tutor.pending@` | tutor | pending | Pending / account-verification screen |
| `center.approved@` | center | approved | Profile-incomplete dashboard |

All addresses end in `@tuitionhub.test`. Re-run the seed to reset every account to these states.

## Manual scenarios

### Sign-in and routing

1. Log in with each account above and confirm the landing screen matches the table.
2. Log in as `admin@` on the normal login, and expect "Please use the administrator sign-in page". Log in as `tutor@` on the admin login, and expect "not authorized for administrator access".
3. Enter a wrong password and expect "Email or password is incorrect".
4. Refresh the page while signed in. You return to your landing screen, because the session is restored.
5. Log out from the sidebar. You land on the login screen, not the "signed out" timeout screen.

### Admin review flow

1. As `admin@`, open **Applications**. The list shows the seeded non-admin accounts with their emails.
2. Request a correction for `tutor.pending@` with a message.
3. Log in as `tutor.pending@`. The status is **correction**, and the admin's exact message is shown.
4. As admin, approve the tutor. As the tutor, click **Check for updates**; you move to the profile-incomplete dashboard.
5. Finish the profile wizard (**Fill required (demo)** helps) and click **Confirm and activate**. The account becomes active.
6. Reject an account with a reason, and check that the applicant sees that reason.

### Profile activation guard

1. As `tutor.pending@` (status `pending`), the activation call must fail. You can only reach the wizard through the Prototype navigator in this state; clicking **Confirm and activate** shows "Your account must be approved before you can activate it".

### Sign-up and email

1. Sign up a new tutor with an address you control. Expect the "Confirm your email" screen.
2. Click the link in the email. It should open `http://localhost:8443`. If it opens `localhost:3000`, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
3. Log in: the new account is `pending`.

### Password reset

1. Use **Forgot password?** with a real address, and open the link from the email.
2. You land on **Choose a new password**, not a dashboard. Set a new one, and you are signed out and sent to the login screen.

### Display name

1. Signed in, open **Settings**, change the display name and click **Save**. The header and dashboard greeting update, and you stay on Settings.

## Checking access rules in SQL

Run these in the SQL editor to check row-level security from a user's point of view. `set local role` and the JWT claim only last until the transaction ends, and the `rollback` undoes everything.

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'tutor@tuitionhub.test'), 'role', 'authenticated')::text, true);
select id, role, account_status from public.profiles;   -- expect exactly one row: the tutor's own
select * from public.admin_list_applicants();           -- expect an error: only administrators
rollback;
```

The same check as the anonymous role should return no profile rows:

```sql
begin;
set local role anon;
select count(*) from public.profiles;   -- expect 0
rollback;
```

## What isn't covered

The marketplace, rooms, batches, interviews and document uploads still run on demo data (`src/store.ts`). Testing those screens only checks the UI, not persistence. See [ROADMAP.md](ROADMAP.md).
