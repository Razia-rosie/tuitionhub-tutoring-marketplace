-- TuitionHub initial schema for Supabase (Postgres + Auth + RLS).
-- Roles and account states mirror src/ui.tsx (Role, Status).

-- ---------- enums ----------
create type public.user_role as enum ('tutor', 'center', 'guardian', 'student', 'admin');
create type public.account_status as enum (
  'draft', 'documents', 'pending', 'correction', 'invited', 'scheduled',
  'completed', 'approved', 'rejected', 'incomplete', 'active'
);
create type public.post_status as enum ('open', 'closed', 'filled');
create type public.application_status as enum ('applied', 'shortlisted', 'chat_requested', 'chat_accepted', 'declined', 'withdrawn', 'hired');
create type public.room_status as enum ('Active', 'Completed', 'Cancelled');
create type public.attendance_mark as enum ('Present', 'Absent', 'Late');
create type public.task_status as enum ('Assigned', 'In Progress', 'Submitted', 'Under Review', 'Accepted', 'Correction Requested');
create type public.review_status as enum ('Pending moderation', 'Published', 'Rejected');

-- ---------- profiles (1:1 with auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  account_status public.account_status not null default 'pending',
  display_name text not null default '' check (char_length(display_name) <= 120),
  phone text check (char_length(phone) <= 32),
  profile_pct smallint not null default 20 check (profile_pct between 0 and 100),
  status_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Guardian ↔ student links (students are added by an approved guardian).
create table public.guardian_students (
  guardian_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (guardian_id, student_id)
);

-- ---------- marketplace ----------
create table public.tuition_posts (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid references public.profiles (id) on delete set null,
  subject text not null check (char_length(subject) between 1 and 80),
  class_level text not null check (char_length(class_level) between 1 and 40),
  area text not null default '' check (char_length(area) <= 120),
  days text not null default '' check (char_length(days) <= 120),
  salary_bdt integer check (salary_bdt >= 0),
  details text not null default '' check (char_length(details) <= 2000),
  status public.post_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.tuition_posts (id) on delete cascade,
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  note text not null default '' check (char_length(note) <= 1000),
  status public.application_status not null default 'applied',
  created_at timestamptz not null default now(),
  unique (post_id, tutor_id)
);

create table public.messages (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- ---------- learning rooms ----------
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles (id) on delete restrict,
  student_id uuid not null references public.profiles (id) on delete restrict,
  guardian_id uuid references public.profiles (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  title text not null check (char_length(title) between 1 and 80),
  class_level text not null default '',
  days text not null default '',
  status public.room_status not null default 'Active',
  created_at timestamptz not null default now()
);

create table public.room_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  starts_at timestamptz not null,
  open boolean not null default false,
  self_marked boolean not null default false,
  tutor_mark public.attendance_mark
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  due_on date,
  status public.task_status not null default 'Assigned',
  student_note text,
  file_path text,
  tutor_comment text,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  body text not null default '' check (char_length(body) <= 1000),
  status public.review_status not null default 'Pending moderation',
  created_at timestamptz not null default now(),
  unique (room_id, author_id)
);

create index on public.tuition_posts (status, created_at desc);
create index on public.applications (tutor_id);
create index on public.messages (application_id, created_at);
create index on public.rooms (tutor_id);
create index on public.rooms (student_id);
create index on public.rooms (guardian_id);
create index on public.room_sessions (room_id, starts_at);
create index on public.assignments (room_id);
create index on public.guardian_students (student_id);

-- ---------- helpers (security definer so RLS policies can call them without recursion) ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and account_status in ('approved', 'active'))
$$;

create or replace function public.is_room_member(rid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rooms r
    where r.id = rid and auth.uid() in (r.tutor_id, r.student_id, r.guardian_id)
  )
$$;

create or replace function public.is_room_tutor(rid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.rooms r where r.id = rid and r.tutor_id = auth.uid())
$$;

create or replace function public.is_application_party(aid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.applications a join public.tuition_posts p on p.id = a.post_id
    where a.id = aid and auth.uid() in (a.tutor_id, p.guardian_id)
  )
$$;

-- ---------- signup: create the profile from auth metadata ----------
-- Only tutor/center/guardian may self-register; students are added by guardians, admins by SQL.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', '');
begin
  if requested not in ('tutor', 'center', 'guardian') then
    raise exception 'Unsupported signup role: %', requested;
  end if;
  insert into public.profiles (id, role, display_name, phone)
  values (
    new.id,
    requested::public.user_role,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 120),
    left(new.raw_user_meta_data ->> 'phone', 32)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Admin-only status change (users can never set their own role/status).
create or replace function public.admin_set_account_status(target uuid, new_status public.account_status, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can change account status' using errcode = '42501';
  end if;
  update public.profiles
     set account_status = new_status,
         status_note = note,
         profile_pct = case when new_status = 'active' then 100 else profile_pct end
   where id = target;
end;
$$;
revoke execute on function public.admin_set_account_status(uuid, public.account_status, text) from public, anon;

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.guardian_students enable row level security;
alter table public.tuition_posts enable row level security;
alter table public.applications enable row level security;
alter table public.messages enable row level security;
alter table public.rooms enable row level security;
alter table public.room_sessions enable row level security;
alter table public.assignments enable row level security;
alter table public.reviews enable row level security;

-- profiles: read self, linked guardian/student, room partners; admins read all.
create policy profiles_read on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.guardian_students g where (g.guardian_id = auth.uid() and g.student_id = profiles.id) or (g.student_id = auth.uid() and g.guardian_id = profiles.id))
  or exists (select 1 from public.rooms r where auth.uid() in (r.tutor_id, r.student_id, r.guardian_id) and profiles.id in (r.tutor_id, r.student_id, r.guardian_id))
);
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Column-level guard: users may edit only these fields of their own row.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, phone, profile_pct) on public.profiles to authenticated;

create policy gs_read on public.guardian_students for select to authenticated
  using (guardian_id = auth.uid() or student_id = auth.uid() or public.is_admin());

-- tuition posts: active users browse open posts; guardians manage their own.
create policy posts_read on public.tuition_posts for select to authenticated
  using ((status = 'open' and public.is_active_user()) or guardian_id = auth.uid() or public.is_admin());
create policy posts_insert on public.tuition_posts for insert to authenticated
  with check (guardian_id = auth.uid() and public.is_active_user()
              and exists (select 1 from public.profiles where id = auth.uid() and role = 'guardian'));
create policy posts_update on public.tuition_posts for update to authenticated
  using (guardian_id = auth.uid()) with check (guardian_id = auth.uid());

-- applications: the tutor and the post's guardian.
create policy apps_read on public.applications for select to authenticated
  using (public.is_application_party(id) or public.is_admin());
create policy apps_insert on public.applications for insert to authenticated
  with check (tutor_id = auth.uid() and status = 'applied' and public.is_active_user()
              and exists (select 1 from public.profiles where id = auth.uid() and role = 'tutor')
              and exists (select 1 from public.tuition_posts p where p.id = post_id and p.status = 'open'));
create policy apps_update on public.applications for update to authenticated
  using (public.is_application_party(id)) with check (public.is_application_party(id));

-- messages: only once the chat request was accepted.
create policy msgs_read on public.messages for select to authenticated
  using (public.is_application_party(application_id));
create policy msgs_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_application_party(application_id)
              and exists (select 1 from public.applications a where a.id = application_id and a.status in ('chat_accepted', 'hired')));

-- rooms and their content: members read; the tutor manages.
create policy rooms_read on public.rooms for select to authenticated
  using (public.is_room_member(id) or public.is_admin());
create policy rooms_tutor_update on public.rooms for update to authenticated
  using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());

create policy sessions_read on public.room_sessions for select to authenticated
  using (public.is_room_member(room_id));
create policy sessions_tutor_all on public.room_sessions for all to authenticated
  using (public.is_room_tutor(room_id)) with check (public.is_room_tutor(room_id));

create policy assignments_read on public.assignments for select to authenticated
  using (public.is_room_member(room_id));
create policy assignments_tutor_all on public.assignments for all to authenticated
  using (public.is_room_tutor(room_id)) with check (public.is_room_tutor(room_id));

-- reviews: published ones are public to signed-in users; authors see their own.
create policy reviews_read on public.reviews for select to authenticated
  using (status = 'Published' or author_id = auth.uid() or public.is_admin());
create policy reviews_insert on public.reviews for insert to authenticated
  with check (author_id = auth.uid() and status = 'Pending moderation' and public.is_room_member(room_id)
              and not public.is_room_tutor(room_id));

create policy reviews_admin_update on public.reviews for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- student actions (narrow RPCs instead of broad update rights) ----------
create or replace function public.student_check_in(session_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.room_sessions s
     set self_marked = true
    from public.rooms r
   where s.id = session_id and r.id = s.room_id and r.student_id = auth.uid()
     and r.status = 'Active' and s.open;
  if not found then
    raise exception 'This session is not open for your check-in' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.submit_assignment(assignment_id uuid, note text, file text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.assignments a
     set status = 'Submitted', student_note = left(note, 1000), file_path = file
    from public.rooms r
   where a.id = assignment_id and r.id = a.room_id and r.student_id = auth.uid()
     and r.status = 'Active' and a.status in ('Assigned', 'In Progress', 'Correction Requested');
  if not found then
    raise exception 'This assignment cannot be submitted' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.student_check_in(uuid) from public, anon;
revoke execute on function public.submit_assignment(uuid, text, text) from public, anon;
