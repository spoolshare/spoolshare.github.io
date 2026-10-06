-- ============================================================================
-- SpoolShare: Postgres schema for Supabase
-- Mirrors src/types/index.ts. Every table has Row-Level Security enabled.
-- Apply with:  supabase db push   (or paste into the SQL editor)
-- ============================================================================

create extension if not exists "cube";

-- ---------------------------------------------------------------- enums ----
create type material as enum ('PLA','PLA+','PETG','ABS','ASA','TPU','PC','Nylon','Other');
create type finish as enum ('basic','matte','silk','metallic','translucent','glow','wood','marble','sparkle','carbon-fiber');
create type transparency as enum ('opaque','semi','translucent','clear');
create type recipe_status as enum ('draft','published','hidden');
create type mixing_method as enum ('Filament re-extruder','Pellet blend','Shred & re-extrude','Mixing hotend','3D pen','Other');
create type report_status as enum ('open','reviewing','resolved');
create type report_target as enum ('recipe','comment','reproduction','user');
create type notification_kind as enum ('reproduced','commented','followed','favorited','mentioned');

-- hex check used across tables
create domain hex_color as text check (value ~ '^#[0-9A-F]{6}$');

-- ------------------------------------------------------------- profiles ----
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9._-]{3,24}$'),
  display_name text not null,
  avatar_url text,
  avatar_hue smallint not null default 145,
  bio text check (char_length(bio) <= 500),
  location text,
  printers text[] not null default '{}',
  inventory_visibility text not null default 'public' check (inventory_visibility in ('public','private')),
  role text not null default 'member' check (role in ('member','moderator')),
  joined_at timestamptz not null default now()
);

create function is_moderator() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'moderator')
$$;

-- -------------------------------------------------------------- catalog ----
create table manufacturers (
  id text primary key,
  name text not null unique,
  website text
);

create table product_lines (
  id text primary key,
  manufacturer_id text not null references manufacturers on delete cascade,
  name text not null,
  material material not null,
  finish finish not null default 'basic',
  unique (manufacturer_id, name)
);

create table filaments (
  id text primary key default gen_random_uuid()::text,
  manufacturer_id text not null references manufacturers,
  product_line_id text not null references product_lines,
  material material not null,
  color_name text not null,
  color_code text,
  hex hex_color not null,               -- display approximation only
  hex_verified boolean not null default false,
  finish finish not null default 'basic',
  transparency transparency not null default 'opaque',
  notes text,
  is_custom boolean not null default false,
  owner_id uuid references profiles on delete cascade,  -- set for custom filaments
  -- CIELAB coordinates (D65), filled by trigger from hex, for color-similarity search
  lab cube,
  check (is_custom = (owner_id is not null))
);
create index filaments_line_idx on filaments (product_line_id);
create index filaments_lab_idx on filaments using gist (lab);

-- ------------------------------------------------------------ inventory ----
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  filament_id text not null references filaments on delete cascade,
  spools smallint default 1 check (spools >= 0),
  remaining_grams integer check (remaining_grams >= 0),
  photo jsonb,
  notes text,
  added_at timestamptz not null default now(),
  unique (user_id, filament_id)
);

-- -------------------------------------------------------------- recipes ----
create table recipes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  author_id uuid not null references profiles on delete cascade,
  status recipe_status not null default 'draft',
  result_hex hex_color not null,
  result_lab cube,                      -- trigger-maintained, used for ΔE pre-filtering
  photos jsonb not null default '[]',   -- [{id,url,alt,width,height,sampledHex}]
  lighting_notes text,
  material material not null,
  finish finish not null default 'basic',
  mixing_method mixing_method not null default 'Filament re-extruder',
  printer text,
  nozzle text,
  layer_height text,
  tags text[] not null default '{}',
  notes text,
  favorite_count integer not null default 0,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index recipes_status_created_idx on recipes (status, created_at desc);
create index recipes_author_idx on recipes (author_id);
create index recipes_lab_idx on recipes using gist (result_lab);
create index recipes_tags_idx on recipes using gin (tags);

-- Stages are ordered; inputs reference filaments OR earlier stages (DAG).
create table recipe_stages (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes on delete cascade,
  position smallint not null,
  name text not null,
  output_name text not null,
  batch_grams numeric(8,2),
  instructions text not null default '',
  photos jsonb not null default '[]',
  output_hex hex_color,
  unique (recipe_id, position)
);

create table stage_inputs (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references recipe_stages on delete cascade,
  position smallint not null,
  filament_id text references filaments,
  source_stage_id uuid references recipe_stages on delete cascade,
  parts numeric(10,4) not null check (parts > 0),
  check ((filament_id is null) <> (source_stage_id is null))
);
-- Earlier-only references are enforced in the publish RPC (see below).

-- Denormalized flattened composition, written by the publish RPC, so that
-- "recipes I can make" is a fast set query.
create table recipe_composition (
  recipe_id uuid not null references recipes on delete cascade,
  filament_id text not null references filaments,
  fraction numeric(7,6) not null check (fraction > 0 and fraction <= 1),
  primary key (recipe_id, filament_id)
);
create index recipe_composition_filament_idx on recipe_composition (filament_id);

-- -------------------------------------------------------- reproductions ----
create table reproductions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  result_hex hex_color not null,
  photos jsonb not null default '[]',
  printer text,
  material material,
  substitutions jsonb not null default '[]', -- [{originalFilamentId, usedFilamentId?, usedLabel?}]
  notes text,
  accuracy_rating smallint not null check (accuracy_rating between 1 and 5),
  delta_e numeric(6,2),                      -- ΔE00 vs. original, computed by edge function
  created_at timestamptz not null default now()
);
create index reproductions_recipe_idx on reproductions (recipe_id);

-- ---------------------------------------------------------------- social ---
create table favorites (
  user_id uuid not null references profiles on delete cascade,
  recipe_id uuid not null references recipes on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  name text not null,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
create table collection_items (
  collection_id uuid not null references collections on delete cascade,
  recipe_id uuid not null references recipes on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, recipe_id)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  parent_id uuid references comments on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table follows (
  follower_id uuid not null references profiles on delete cascade,
  followee_id uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles on delete cascade,
  target_type report_target not null,
  target_id text not null,
  reason text not null check (reason in ('inaccurate','spam','unsafe','stolen','offensive','other')),
  details text,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  kind notification_kind not null,
  actor_id uuid not null references profiles on delete cascade,
  recipe_id uuid references recipes on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table profiles enable row level security;
alter table manufacturers enable row level security;
alter table product_lines enable row level security;
alter table filaments enable row level security;
alter table inventory_items enable row level security;
alter table recipes enable row level security;
alter table recipe_stages enable row level security;
alter table stage_inputs enable row level security;
alter table recipe_composition enable row level security;
alter table reproductions enable row level security;
alter table favorites enable row level security;
alter table collections enable row level security;
alter table collection_items enable row level security;
alter table comments enable row level security;
alter table follows enable row level security;
alter table reports enable row level security;
alter table notifications enable row level security;

-- profiles: public read, self update
create policy "profiles readable" on profiles for select using (true);
create policy "profiles self insert" on profiles for insert with check (id = auth.uid());
create policy "profiles self update" on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid())); -- can't self-promote

-- catalog: public read; moderators write; users may create their own custom filaments
create policy "mfr read" on manufacturers for select using (true);
create policy "mfr mod write" on manufacturers for all using (is_moderator()) with check (is_moderator());
create policy "lines read" on product_lines for select using (true);
create policy "lines mod write" on product_lines for all using (is_moderator()) with check (is_moderator());
create policy "filaments read" on filaments for select using (not is_custom or owner_id = auth.uid() or is_moderator());
create policy "filaments custom insert" on filaments for insert with check (is_custom and owner_id = auth.uid());
create policy "filaments custom update" on filaments for update using (owner_id = auth.uid() or is_moderator());

-- inventory: owner full access; others read only when profile is public
create policy "inventory owner" on inventory_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "inventory public read" on inventory_items for select using (
  exists (select 1 from profiles p where p.id = user_id and p.inventory_visibility = 'public')
);

-- recipes: published are public; drafts only to author; moderators can hide
create policy "recipes read" on recipes for select using (status = 'published' or author_id = auth.uid() or is_moderator());
create policy "recipes author insert" on recipes for insert with check (author_id = auth.uid());
create policy "recipes author update" on recipes for update using (author_id = auth.uid() or is_moderator());
create policy "recipes author delete" on recipes for delete using (author_id = auth.uid());

create policy "stages read" on recipe_stages for select using (
  exists (select 1 from recipes r where r.id = recipe_id and (r.status = 'published' or r.author_id = auth.uid()))
);
create policy "stages author write" on recipe_stages for all using (
  exists (select 1 from recipes r where r.id = recipe_id and r.author_id = auth.uid())
) with check (exists (select 1 from recipes r where r.id = recipe_id and r.author_id = auth.uid()));

create policy "inputs read" on stage_inputs for select using (
  exists (select 1 from recipe_stages s join recipes r on r.id = s.recipe_id
          where s.id = stage_id and (r.status = 'published' or r.author_id = auth.uid()))
);
create policy "inputs author write" on stage_inputs for all using (
  exists (select 1 from recipe_stages s join recipes r on r.id = s.recipe_id where s.id = stage_id and r.author_id = auth.uid())
) with check (
  exists (select 1 from recipe_stages s join recipes r on r.id = s.recipe_id where s.id = stage_id and r.author_id = auth.uid())
);

create policy "composition read" on recipe_composition for select using (true);
-- composition is written only by the security-definer publish function.

-- reproductions: public read; must be signed in; cannot reproduce own recipe
create policy "repro read" on reproductions for select using (true);
create policy "repro insert" on reproductions for insert with check (
  user_id = auth.uid() and not exists (select 1 from recipes r where r.id = recipe_id and r.author_id = auth.uid())
);
create policy "repro owner modify" on reproductions for update using (user_id = auth.uid());
create policy "repro owner delete" on reproductions for delete using (user_id = auth.uid() or is_moderator());

create policy "fav owner" on favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "collections read" on collections for select using (is_public or user_id = auth.uid());
create policy "collections owner" on collections for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "collection items read" on collection_items for select using (
  exists (select 1 from collections c where c.id = collection_id and (c.is_public or c.user_id = auth.uid()))
);
create policy "collection items owner" on collection_items for all using (
  exists (select 1 from collections c where c.id = collection_id and c.user_id = auth.uid())
) with check (exists (select 1 from collections c where c.id = collection_id and c.user_id = auth.uid()));

create policy "comments read" on comments for select using (true);
create policy "comments insert" on comments for insert with check (user_id = auth.uid());
create policy "comments delete" on comments for delete using (user_id = auth.uid() or is_moderator());

create policy "follows read" on follows for select using (true);
create policy "follows self" on follows for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());

create policy "reports insert" on reports for insert with check (reporter_id = auth.uid());
create policy "reports mod read" on reports for select using (is_moderator() or reporter_id = auth.uid());
create policy "reports mod update" on reports for update using (is_moderator());

create policy "notifications owner read" on notifications for select using (user_id = auth.uid());
create policy "notifications owner update" on notifications for update using (user_id = auth.uid());
-- notifications are inserted by triggers (security definer), never by clients.

-- ============================================================================
-- Counters & notification triggers
-- ============================================================================
create function on_favorite_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update recipes set favorite_count = favorite_count + 1 where id = new.recipe_id;
    insert into notifications (user_id, kind, actor_id, recipe_id)
      select r.author_id, 'favorited', new.user_id, r.id from recipes r where r.id = new.recipe_id and r.author_id <> new.user_id;
  else
    update recipes set favorite_count = greatest(0, favorite_count - 1) where id = old.recipe_id;
  end if;
  return null;
end $$;
create trigger favorites_count after insert or delete on favorites for each row execute function on_favorite_change();

create function on_reproduction_insert() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, kind, actor_id, recipe_id)
    select r.author_id, 'reproduced', new.user_id, r.id from recipes r where r.id = new.recipe_id;
  return null;
end $$;
create trigger reproductions_notify after insert on reproductions for each row execute function on_reproduction_insert();

create function on_comment_insert() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, kind, actor_id, recipe_id)
    select r.author_id, 'commented', new.user_id, r.id from recipes r where r.id = new.recipe_id and r.author_id <> new.user_id;
  return null;
end $$;
create trigger comments_notify after insert on comments for each row execute function on_comment_insert();

create function on_follow_insert() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, kind, actor_id) values (new.followee_id, 'followed', new.follower_id);
  return null;
end $$;
create trigger follows_notify after insert on follows for each row execute function on_follow_insert();

-- ============================================================================
-- Storage: swatch photos at swatches/<user id>/<file>
-- ============================================================================
insert into storage.buckets (id, name, public) values ('swatches', 'swatches', true) on conflict do nothing;
create policy "swatch read" on storage.objects for select using (bucket_id = 'swatches');
create policy "swatch upload own folder" on storage.objects for insert
  with check (bucket_id = 'swatches' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "swatch delete own" on storage.objects for delete
  using (bucket_id = 'swatches' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- Recipes "I can make": every composition filament is in my inventory
-- ============================================================================
create view recipes_can_make as
  select r.id as recipe_id, auth.uid() as user_id
  from recipes r
  where r.status = 'published'
    and not exists (
      select 1 from recipe_composition c
      where c.recipe_id = r.id
        and c.filament_id not in (select filament_id from inventory_items where user_id = auth.uid())
    );

-- TODO (next migration):
--  * publish_recipe(jsonb) RPC: validates the stage DAG (earlier-only refs), flattens the
--    composition into recipe_composition, assigns a unique slug, flips status.
--  * hex → Lab trigger for filaments.lab / recipes.result_lab (plpgsql port of src/lib/color/convert.ts)
--  * Edge Function computing ΔE00 on reproduction insert (port of src/lib/color/deltaE.ts)
