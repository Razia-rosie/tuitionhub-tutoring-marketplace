-- Synthetic TuitionHub test accounts, one per role plus two review states.
-- DEVELOPMENT/TESTING ONLY. Every account uses the reserved .test domain and the
-- This is a template: every password is CHANGE_ME and the script refuses to run until
-- they are replaced. Copy it to supabase/seed.local.sql (git-ignored), set a password per
-- account there, and run that copy. Never commit real passwords: this repository is public.
--
-- Run in the Supabase SQL editor (runs as postgres). It warns about a destructive
-- operation (the cleanup delete below); confirm it to continue. Re-running is safe:
-- it first deletes every *@tuitionhub.test user (their profiles cascade) and recreates them.

begin;

delete from auth.users where email like '%@tuitionhub.test';

-- Create confirmed email/password users. The handle_new_user trigger only accepts
-- self-signup roles, so every user is created as 'guardian' and corrected below.
do $$
declare
  a record;
  uid uuid;
begin
  for a in
    select * from (values
      ('admin@tuitionhub.test',           'CHANGE_ME', 'Test Admin',           null,             'admin'::public.user_role,    'active'::public.account_status,   20::smallint),
      ('tutor@tuitionhub.test',           'CHANGE_ME', 'Test Tutor',           '+8801700000001', 'tutor',    'active',   100),
      ('center@tuitionhub.test',          'CHANGE_ME', 'Test Coaching Center', '+8801700000002', 'center',   'active',   100),
      ('guardian@tuitionhub.test',        'CHANGE_ME', 'Test Guardian',        '+8801700000003', 'guardian', 'active',   100),
      ('student@tuitionhub.test',         'CHANGE_ME', 'Test Student',         null,             'student',  'active',   100),
      ('tutor.pending@tuitionhub.test',   'CHANGE_ME', 'Pending Test Tutor',   '+8801700000004', 'tutor',    'pending',  20),
      ('center.approved@tuitionhub.test', 'CHANGE_ME', 'Approved Test Center', '+8801700000005', 'center',   'approved', 60)
    ) as t (email, password, display_name, phone, role, status, pct)
  loop
    if a.password = 'CHANGE_ME' then
      raise exception 'Set real passwords in supabase/seed.local.sql and run that copy instead';
    end if;
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', a.email,
      extensions.crypt(a.password, extensions.gen_salt('bf')), now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('role', 'guardian', 'display_name', a.display_name, 'phone', a.phone),
      now(), now(), '', '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), uid, uid::text, 'email',
      jsonb_build_object('sub', uid::text, 'email', a.email, 'email_verified', true),
      now(), now(), now()
    );
    update public.profiles
       set role = a.role, account_status = a.status, profile_pct = a.pct
     where id = uid;
  end loop;
end;
$$;

-- Link the test student to the test guardian.
insert into public.guardian_students (guardian_id, student_id)
select g.id, s.id
  from auth.users g, auth.users s
 where g.email = 'guardian@tuitionhub.test' and s.email = 'student@tuitionhub.test';

-- Sanity check: one row per account with the expected role and status.
select u.email, p.role, p.account_status, p.profile_pct
  from auth.users u join public.profiles p on p.id = u.id
 where u.email like '%@tuitionhub.test'
 order by p.role, u.email;

commit;
