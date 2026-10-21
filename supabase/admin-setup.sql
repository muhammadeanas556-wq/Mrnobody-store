-- =====================================================================
-- Grant admin access to the store owner.
--
-- STEP 1 (Supabase dashboard, NOT in code):
--   Authentication → Users → "Add user" → "Create new user"
--   Email: muhammadeanas5@gmail.com, set the initial password there,
--   tick "Auto Confirm User".
--
-- STEP 2: run this file in SQL Editor. It links that auth user to the
-- admin_users table. No password is stored or referenced here.
-- =====================================================================

insert into public.admin_users (user_id, email, role)
select id, email, 'owner'
from auth.users
where lower(email) = lower('muhammadeanas5@gmail.com')
on conflict (user_id) do nothing;

-- Verify (should return one row):
select a.email, a.role, a.created_at from public.admin_users a;
