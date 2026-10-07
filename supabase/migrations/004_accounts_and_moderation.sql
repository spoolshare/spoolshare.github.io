-- ============================================================================
-- SpoolShare migration 004: run once after 003.
--  * Delete my account (self-service)
--  * Admin: delete or disable users
--  * Reports: resolution fields + moderator review
--  * Profile photos (avatars) in the swatches bucket
-- ============================================================================

-- ------------------------------------------------------------ profiles ----
alter table profiles add column if not exists disabled boolean not null default false;

-- Members may edit their own profile but never their role or disabled flag.
drop policy if exists "profiles self update" on profiles;
create policy "profiles self update" on profiles for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from profiles p where p.id = auth.uid())
    and disabled = (select p.disabled from profiles p where p.id = auth.uid())
  );

-- --------------------------------------------------------------- reports --
alter table reports add column if not exists resolution_note text;
alter table reports add column if not exists resolved_at timestamptz;
alter table reports add column if not exists resolved_by uuid references profiles on delete set null;

-- --------------------------------------------------------------- storage --
-- Admins may remove any uploaded photo (needed when deleting an account's content).
drop policy if exists "swatch admin delete" on storage.objects;
create policy "swatch admin delete" on storage.objects for delete using (bucket_id = 'swatches' and is_admin());

-- ------------------------------------------------------- delete account --
-- Deleting the auth user cascades to the profile and everything it owns
-- (recipes, reproductions, comments, favorites, collections, inventory, follows).
-- Photos in Storage are removed by the app first, via the Storage API.
create or replace function delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Please sign in.'; end if;
  if exists (select 1 from profiles where id = v_uid and role = 'admin')
     and (select count(*) from profiles where role = 'admin') = 1 then
    raise exception 'You are the only admin. Make someone else an admin before deleting your account.';
  end if;
  delete from auth.users where id = v_uid;
end $$;
revoke execute on function delete_my_account() from anon;

create or replace function admin_delete_user(p_user uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not is_admin() then raise exception 'Admins only.'; end if;
  if p_user = auth.uid() then raise exception 'Use Settings to delete your own account.'; end if;
  if exists (select 1 from profiles where id = p_user and username = 'spoolshare') then
    raise exception 'The official SpoolShare account holds the example recipes and cannot be deleted here.';
  end if;
  delete from auth.users where id = p_user;
end $$;
revoke execute on function admin_delete_user(uuid) from anon;

-- Disabled accounts cannot sign in (banned_until) and are flagged on their profile.
create or replace function admin_set_disabled(p_user uuid, p_disabled boolean) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not is_admin() then raise exception 'Admins only.'; end if;
  if p_user = auth.uid() then raise exception 'You cannot disable your own account.'; end if;
  update profiles set disabled = p_disabled where id = p_user;
  update auth.users set banned_until = case when p_disabled then 'infinity'::timestamptz else null end where id = p_user;
end $$;
revoke execute on function admin_set_disabled(uuid, boolean) from anon;

-- Members list now includes the disabled flag (it's part of the profile JSON).
create or replace function admin_list_members()
returns table (profile jsonb, email text, last_sign_in_at timestamptz, recipe_count bigint, reproduction_count bigint)
language sql stable security definer set search_path = public, auth as $$
  select to_jsonb(p), u.email::text, u.last_sign_in_at,
         (select count(*) from recipes r where r.author_id = p.id and r.status = 'published'),
         (select count(*) from reproductions x where x.user_id = p.id)
  from profiles p
  left join auth.users u on u.id = p.id
  where is_admin()
  order by p.joined_at desc
$$;
revoke execute on function admin_list_members() from anon;
