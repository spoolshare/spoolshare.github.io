-- ============================================================================
-- Make a real, sign-in-able account the official SpoolShare account.
--
-- 1. Sign up on SpoolShare with spoolshare.makerworld@gmail.com (any username).
-- 2. Run this script in the Supabase SQL Editor.
--
-- It moves the official example recipes to that account, removes the old
-- placeholder (which could never sign in), and renames the account to
-- @spoolshare / "SpoolShare". Safe to re-run.
-- ============================================================================
do $$
declare
  v_email text := 'spoolshare.makerworld@gmail.com';
  v_new uuid := (select id from auth.users where lower(email) = lower(v_email));
  v_placeholder uuid := '00000000-0000-4000-8000-000000000001';
begin
  if v_new is null then
    raise exception 'No account with % yet. Sign up on SpoolShare with that email first.', v_email;
  end if;

  update recipes set author_id = v_new where author_id = v_placeholder;
  delete from auth.users where id = v_placeholder;  -- also removes the placeholder profile

  update profiles set
    username = 'spoolshare',
    display_name = 'SpoolShare',
    bio = 'Official SpoolShare account: example recipes for the Multi-Color Filament Mixer. Suggestions? spoolshare.makerworld@gmail.com',
    avatar_hue = 145
  where id = v_new;

  update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where id = v_new;
end $$;
