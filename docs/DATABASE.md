# Database

The schema lives in `supabase/migrations/` and runs on Supabase Postgres. Every table has row-level security (RLS) turned on, so the browser can safely use the publishable key: each query only sees the rows its signed-in user is allowed to see.

## Applying migrations

Run the files in filename order, either in the Supabase SQL editor or with the Supabase CLI:

```bash
supabase db push
```

| File | Contents |
| --- | --- |
| `20261029000000_init.sql` | Enums, tables, indexes, helper functions, sign-up trigger, RLS policies, student RPCs |
| `20261029010000_admin_and_profile_rpcs.sql` | Admin applicant queue, `complete_profile`, stricter `admin_set_account_status`, application status guard |

To change the schema, add a new timestamped file. Don't edit a migration that has already run on a shared project.

`supabase/seed.sql` creates synthetic test accounts for development only (see the README).

## Roles and account statuses

`user_role`: `tutor`, `center`, `guardian`, `student`, `admin`

`account_status`, in the order an applicant usually moves through it:

| Status | Meaning |
| --- | --- |
| `draft` | Registration started |
| `documents` | Documents requested |
| `pending` | Waiting for admin review (default after sign-up) |
| `correction` | Admin asked for changes (see `status_note`) |
| `invited` / `scheduled` / `completed` | Interview stages |
| `approved` | Approved; the user must finish the profile wizard |
| `rejected` | Application rejected |
| `incomplete` | Profile incomplete |
| `active` | Fully active (`profile_pct` = 100) |

Users can't change their own `role` or `account_status`. Only admins can, through `admin_set_account_status`. Users activate their own approved account only through `complete_profile`.

**Creating an admin.** Admins are created only in SQL:

```sql
update public.profiles set role = 'admin', account_status = 'active' where id = '<auth user id>';
```

## Tables

| Table | Purpose | Who can read | Who can write |
| --- | --- | --- | --- |
| `profiles` | One row per auth user: role, status, name, phone, completion % | Self, linked guardian or student, room partners, admins | Self (only `display_name`, `phone`, `profile_pct`) |
| `guardian_students` | Guardian ↔ student links | Either party, admins | Server side only |
| `tuition_posts` | A guardian's request for a tutor | Active users (open posts), the owner, admins | The owning guardian (who must be active) |
| `applications` | A tutor's application to a post | The tutor, the post's guardian, admins | The tutor creates; both parties change status (see below) |
| `messages` | Chat on an application | The application's parties | Either party, once the chat is `chat_accepted` or `hired` |
| `rooms` | A tutor–student learning room | Room members, admins | The tutor (updates) |
| `room_sessions` | Scheduled classes and attendance | Room members | The tutor |
| `assignments` | Homework in a room | Room members | The tutor; students submit with `submit_assignment` |
| `reviews` | Ratings of a room | Signed-in users (published ones), the author, admins | Non-tutor room members create; admins moderate |

### Application status rules

The `applications_guard` trigger limits who may change an application's status, and to what:

- **Tutor:** withdraw (from `applied`, `shortlisted`, `chat_requested` or `chat_accepted`); accept or decline a chat request.
- **Guardian:** shortlist; request a chat; decline; hire (from `chat_accepted`).
- Admins and SQL run without a user (service role, SQL editor) may make any change.
- Nobody can change an application's post, tutor or creation time.

## Functions

| Function | Who can call it | What it does |
| --- | --- | --- |
| `handle_new_user()` | Trigger on `auth.users` | Creates the profile from sign-up metadata; rejects roles other than tutor, center and guardian |
| `is_admin()`, `is_active_user()`, `is_room_member(id)`, `is_room_tutor(id)`, `is_application_party(id)` | RLS policies | Permission checks (security definer, so policies don't recurse) |
| `admin_list_applicants()` | Admins | Every non-admin profile with its email, newest first |
| `admin_set_account_status(target, new_status, note)` | Admins | Sets status and note; sets `profile_pct` to 100 for active, or caps it at 95 otherwise |
| `complete_profile()` | Approved or active users | Activates the caller's own account |
| `student_check_in(session_id)` | Room students | Marks self-attendance on an open session |
| `submit_assignment(assignment_id, note, file)` | Room students | Submits an assignment |

A constraint, `profiles_pct_matches_status`, allows `profile_pct` = 100 only on active accounts.
