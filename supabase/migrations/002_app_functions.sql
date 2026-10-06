-- ============================================================================
-- SpoolShare migration 002: run once after schema.sql (and seed.sql).
--  * admin role + is_admin()
--  * profile auto-created on sign-up
--  * client-generated (text) stage ids
--  * recipes.is_example
--  * save_recipe() RPC: atomic save/publish with DAG validation
--  * increment_view(), admin_list_members()
-- ============================================================================

-- ------------------------------------------------------------------ roles --
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('member', 'moderator', 'admin'));

create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function is_moderator() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('moderator', 'admin'))
$$;

-- ------------------------------------------------------ profile on signup --
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text;
  uname text;
  n int := 1;
begin
  base := regexp_replace(lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'maker')), '[^a-z0-9._-]', '', 'g');
  if length(base) < 3 then base := base || 'maker'; end if;
  base := left(base, 20);
  uname := base;
  while exists (select 1 from profiles where username = uname) loop
    n := n + 1;
    uname := base || n;
  end loop;
  insert into profiles (id, username, display_name, avatar_hue)
  values (new.id, uname, coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), uname), floor(random() * 360)::int);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Backfill: anyone who signed up before this migration gets a profile now.
do $$
declare u auth.users;
begin
  for u in select * from auth.users where id not in (select id from profiles) loop
    insert into profiles (id, username, display_name, avatar_hue)
    select u.id, x.uname, coalesce(nullif(trim(u.raw_user_meta_data->>'display_name'), ''), x.uname), floor(random() * 360)::int
    from (
      select case when exists (select 1 from profiles where username = b.base) then b.base || substr(md5(u.id::text), 1, 4) else b.base end as uname
      from (select left(case when length(c.v) < 3 then c.v || 'maker' else c.v end, 20) as base from (select regexp_replace(lower(coalesce(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1), 'maker')), '[^a-z0-9._-]', '', 'g') as v) c) b
    ) x;
  end loop;
end $$;

-- --------------------------------------------- client-generated stage ids --
drop policy if exists "inputs read" on stage_inputs;
drop policy if exists "inputs author write" on stage_inputs;
alter table stage_inputs drop constraint if exists stage_inputs_source_stage_id_fkey;
alter table stage_inputs drop constraint if exists stage_inputs_stage_id_fkey;
alter table recipe_stages alter column id drop default;
alter table recipe_stages alter column id type text using id::text;
alter table stage_inputs alter column id drop default;
alter table stage_inputs alter column id type text using id::text;
alter table stage_inputs alter column stage_id type text using stage_id::text;
alter table stage_inputs alter column source_stage_id type text using source_stage_id::text;
alter table stage_inputs add constraint stage_inputs_stage_id_fkey foreign key (stage_id) references recipe_stages(id) on delete cascade;
alter table stage_inputs add constraint stage_inputs_source_stage_id_fkey foreign key (source_stage_id) references recipe_stages(id) on delete cascade;

create policy "inputs read" on stage_inputs for select using (
  exists (select 1 from recipe_stages s join recipes r on r.id = s.recipe_id
          where s.id = stage_id and (r.status = 'published' or r.author_id = auth.uid()))
);
create policy "inputs author write" on stage_inputs for all using (
  exists (select 1 from recipe_stages s join recipes r on r.id = s.recipe_id where s.id = stage_id and r.author_id = auth.uid())
) with check (
  exists (select 1 from recipe_stages s join recipes r on r.id = s.recipe_id where s.id = stage_id and r.author_id = auth.uid())
);

-- ------------------------------------------------------------- examples ----
alter table recipes add column if not exists is_example boolean not null default false;

-- ---------------------------------------------------------- save_recipe ----
-- p: { id?, name, description, resultHex, photos, lightingNotes, material, finish,
--      mixingMethod, printer, nozzle, layerHeight, tags, notes, slugBase,
--      stages: [{ id, name, outputName, batchGrams, instructions, photos, outputHex,
--                 inputs: [{ id, parts, filamentId? | stageId? }] }],
--      composition: [{ filamentId, fraction }] }
create or replace function save_recipe(p jsonb, p_publish boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_existing recipes;
  v_slug text;
  v_base text;
  v_n int := 2;
  v_status recipe_status := case when p_publish then 'published'::recipe_status else 'draft'::recipe_status end;
  st jsonb;
  inp jsonb;
  i int := 0;
  k int;
  v_sum numeric;
begin
  if v_uid is null then raise exception 'Please sign in to do that.' using errcode = '28000'; end if;
  if coalesce(trim(p->>'name'), '') = '' and p_publish then raise exception 'Give your recipe a name.'; end if;
  if jsonb_array_length(coalesce(p->'stages', '[]')) = 0 and p_publish then raise exception 'Add at least one mixing stage.'; end if;

  if nullif(p->>'id', '') is not null and (p->>'id') ~ '^[0-9a-f-]{36}$' then
    select * into v_existing from recipes where id = (p->>'id')::uuid;
    if found and v_existing.author_id <> v_uid then raise exception 'Not your recipe.'; end if;
    if found then v_id := v_existing.id; end if;
  end if;
  if v_id is null then v_id := gen_random_uuid(); end if;

  -- slug: drafts get a placeholder; first publish gets a unique pretty slug
  if p_publish and (v_existing.id is null or v_existing.status = 'draft') then
    v_base := coalesce(nullif(regexp_replace(lower(coalesce(p->>'slugBase', p->>'name')), '[^a-z0-9]+', '-', 'g'), ''), 'recipe');
    v_base := trim(both '-' from left(v_base, 60));
    v_slug := v_base;
    while exists (select 1 from recipes where slug = v_slug and id <> v_id) loop
      v_slug := v_base || '-' || v_n;
      v_n := v_n + 1;
    end loop;
  elsif v_existing.id is not null then
    v_slug := v_existing.slug;
  else
    v_slug := 'draft-' || v_id::text;
  end if;

  insert into recipes as r (id, slug, name, description, author_id, status, result_hex, photos, lighting_notes, material, finish,
                            mixing_method, printer, nozzle, layer_height, tags, notes, created_at, updated_at)
  values (v_id, v_slug, coalesce(p->>'name', ''), coalesce(p->>'description', ''), v_uid, v_status, upper(p->>'resultHex'),
          coalesce(p->'photos', '[]'), p->>'lightingNotes', (p->>'material')::material, (p->>'finish')::finish,
          (p->>'mixingMethod')::mixing_method, nullif(p->>'printer', ''), nullif(p->>'nozzle', ''), nullif(p->>'layerHeight', ''),
          coalesce(array(select jsonb_array_elements_text(p->'tags')), '{}'), nullif(p->>'notes', ''), now(), now())
  on conflict (id) do update set
    slug = excluded.slug, name = excluded.name, description = excluded.description, status = excluded.status,
    result_hex = excluded.result_hex, photos = excluded.photos, lighting_notes = excluded.lighting_notes,
    material = excluded.material, finish = excluded.finish, mixing_method = excluded.mixing_method, printer = excluded.printer,
    nozzle = excluded.nozzle, layer_height = excluded.layer_height, tags = excluded.tags, notes = excluded.notes,
    updated_at = now(),
    created_at = case when r.status = 'draft' and excluded.status = 'published' then now() else r.created_at end;

  -- stages + inputs (replace)
  delete from recipe_stages where recipe_id = v_id;
  for st in select * from jsonb_array_elements(coalesce(p->'stages', '[]')) loop
    insert into recipe_stages (id, recipe_id, position, name, output_name, batch_grams, instructions, photos, output_hex)
    values (st->>'id', v_id, i, coalesce(st->>'name', ''), coalesce(st->>'outputName', ''), nullif(st->>'batchGrams', '')::numeric,
            coalesce(st->>'instructions', ''), coalesce(st->'photos', '[]'), upper(nullif(st->>'outputHex', '')));
    i := i + 1;
  end loop;
  i := 0;
  for st in select * from jsonb_array_elements(coalesce(p->'stages', '[]')) loop
    k := 0;
    for inp in select * from jsonb_array_elements(coalesce(st->'inputs', '[]')) loop
      if nullif(inp->>'stageId', '') is not null then
        -- earlier-only references keep the stage graph acyclic
        if not exists (select 1 from recipe_stages s where s.id = inp->>'stageId' and s.recipe_id = v_id and s.position < i) then
          raise exception 'Stage % uses an intermediate that isn''t made before it.', i + 1;
        end if;
      elsif p_publish and nullif(inp->>'filamentId', '') is null then
        raise exception 'Stage % has an input with no filament selected.', i + 1;
      end if;
      if nullif(inp->>'filamentId', '') is not null or nullif(inp->>'stageId', '') is not null then
        insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts)
        values (inp->>'id', st->>'id', k, nullif(inp->>'filamentId', ''), nullif(inp->>'stageId', ''), greatest((inp->>'parts')::numeric, 0.0001));
      end if;
      k := k + 1;
    end loop;
    i := i + 1;
  end loop;

  -- flattened composition (computed client-side; sanity-checked here)
  delete from recipe_composition where recipe_id = v_id;
  if jsonb_array_length(coalesce(p->'composition', '[]')) > 0 then
    select sum((c->>'fraction')::numeric) into v_sum from jsonb_array_elements(p->'composition') c;
    if p_publish and abs(v_sum - 1) > 0.001 then raise exception 'Composition must add up to 100%%.'; end if;
    insert into recipe_composition (recipe_id, filament_id, fraction)
    select v_id, c->>'filamentId', round((c->>'fraction')::numeric, 6)
    from jsonb_array_elements(p->'composition') c
    where (c->>'fraction')::numeric > 0;
  end if;

  return jsonb_build_object('id', v_id, 'slug', v_slug);
end $$;

revoke execute on function save_recipe(jsonb, boolean) from anon;

-- ------------------------------------------------------------ view count --
create or replace function increment_view(p_recipe uuid) returns void
language sql security definer set search_path = public as $$
  update recipes set view_count = view_count + 1 where id = p_recipe and status = 'published'
$$;

-- --------------------------------------------------------- admin members --
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

-- After you sign up in the app, make yourself the admin (replace the username):
--   update profiles set role = 'admin' where username = 'your-username';
