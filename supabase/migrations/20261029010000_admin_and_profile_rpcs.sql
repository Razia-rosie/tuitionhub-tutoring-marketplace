-- Admin applicant queue and profile completion.

-- Admins need applicant emails, which live in auth.users (not exposed through the Data API).
create or replace function public.admin_list_applicants()
returns table (
  id uuid, role public.user_role, account_status public.account_status, display_name text,
  phone text, email text, status_note text, created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can list applicants' using errcode = '42501';
  end if;
  return query
    select p.id, p.role, p.account_status, p.display_name, p.phone, u.email::text, p.status_note, p.created_at
      from public.profiles p
      join auth.users u on u.id = p.id
     where p.role <> 'admin'
     order by p.created_at desc;
end;
$$;
revoke execute on function public.admin_list_applicants() from public, anon;

-- An approved user finishes the profile wizard; only then does the account become active.
create or replace function public.complete_profile() returns public.account_status
language plpgsql security definer set search_path = '' as $$
declare
  result public.account_status;
begin
  update public.profiles
     set account_status = 'active', profile_pct = 100
   where id = auth.uid() and account_status in ('approved', 'active')
  returning account_status into result;
  if result is null then
    raise exception 'Your account must be approved before you can activate it' using errcode = '42501';
  end if;
  return result;
end;
$$;
revoke execute on function public.complete_profile() from public, anon;

-- Users may adjust their own completion %, but not mark themselves complete (that is complete_profile's job).
alter table public.profiles add constraint profiles_pct_matches_status
  check (profile_pct < 100 or account_status = 'active') not valid;

-- Keep profile_pct consistent with the constraint above when an admin moves an account out of 'active'.
create or replace function public.admin_set_account_status(target uuid, new_status public.account_status, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can change account status' using errcode = '42501';
  end if;
  update public.profiles
     set account_status = new_status,
         status_note = nullif(left(note, 2000), ''),
         profile_pct = case when new_status = 'active' then 100 else least(profile_pct, 95) end
   where id = target and role <> 'admin';
  if not found then
    raise exception 'Applicant not found' using errcode = 'P0002';
  end if;
end;
$$;

-- Applications: apps_update lets both parties update the row, so enforce who may make which status change.
create or replace function public.guard_application_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  guardian uuid;
begin
  if new.post_id <> old.post_id or new.tutor_id <> old.tutor_id or new.created_at <> old.created_at then
    raise exception 'Application ownership cannot change' using errcode = '42501';
  end if;
  -- No JWT (SQL editor, service role) or an admin: trusted maintenance path.
  if new.status = old.status or auth.uid() is null or public.is_admin() then
    return new;
  end if;
  select p.guardian_id into guardian from public.tuition_posts p where p.id = new.post_id;

  if auth.uid() = old.tutor_id and (
       (new.status = 'withdrawn' and old.status in ('applied', 'shortlisted', 'chat_requested', 'chat_accepted'))
    or (new.status in ('chat_accepted', 'declined') and old.status = 'chat_requested')
  ) then
    return new;
  end if;

  if auth.uid() = guardian and (
       (new.status = 'shortlisted' and old.status = 'applied')
    or (new.status = 'chat_requested' and old.status in ('applied', 'shortlisted'))
    or (new.status = 'declined' and old.status in ('applied', 'shortlisted', 'chat_requested', 'chat_accepted'))
    or (new.status = 'hired' and old.status = 'chat_accepted')
  ) then
    return new;
  end if;

  raise exception 'You cannot move this application from % to %', old.status, new.status using errcode = '42501';
end;
$$;

create trigger applications_guard before update on public.applications
  for each row execute function public.guard_application_update();
