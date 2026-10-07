-- SpoolShare official example recipes. Generated from src/lib/api/mock/seed/community.ts.
-- Run AFTER schema.sql, seed.sql and migrations 002–004. Safe to re-run: it replaces all examples.
-- These colors are CALCULATED previews, not printed swatches (is_example = true).
-- They belong to whichever account has the username 'spoolshare' (see claim_official_account.sql).

-- Create a placeholder official account only if none exists yet (it can't sign in).
do $off$ begin
if not exists (select 1 from profiles where username = 'spoolshare') then
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'official@spoolshare.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"username":"spoolshare","display_name":"SpoolShare"}', now(), now())
  on conflict (id) do nothing;
end if;
end $off$;

delete from recipes where author_id = (select id from profiles where username = 'spoolshare') and is_example;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'rosewood') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-rosewood')::uuid, 'rosewood', 'Rosewood', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#925D60', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{red,multi-stage,example}', true, '[]'::jsonb, now() - interval '0 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-rosewood-s1', md5('spoolshare-example-rosewood')::uuid, 0, 'Create Light Blue', 'Light Blue Intermediate', 'Load the mixer’s 4 slots as shown (3:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rosewood-s1-in0', 'ex-rosewood-s1', 0, 'bambu-pla-basic-jade-white', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rosewood-s1-in1', 'ex-rosewood-s1', 1, 'bambu-pla-basic-cobalt-blue', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-rosewood-s2', md5('spoolshare-example-rosewood')::uuid, 1, 'Mix Rosewood', 'Rosewood', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rosewood-s2-in0', 'ex-rosewood-s2', 0, 'bambu-pla-basic-jade-white', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rosewood-s2-in1', 'ex-rosewood-s2', 1, 'bambu-pla-basic-red', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rosewood-s2-in2', 'ex-rosewood-s2', 2, null, 'ex-rosewood-s1', 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-rosewood')::uuid, 'bambu-pla-basic-jade-white', 0.6875);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-rosewood')::uuid, 'bambu-pla-basic-red', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-rosewood')::uuid, 'bambu-pla-basic-cobalt-blue', 0.0625);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'blue-violet') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-blue-violet')::uuid, 'blue-violet', 'Blue Violet', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#796ED4', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{purple,multi-stage,example}', true, '[{"id":"blue-violet-idea0","title":"Flowers"},{"id":"blue-violet-idea1","title":"Decorative planters"},{"id":"blue-violet-idea2","title":"Articulated dragons"}]'::jsonb, now() - interval '5 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-blue-violet-s1', md5('spoolshare-example-blue-violet')::uuid, 0, 'Dilute Cobalt', 'Pale Cobalt', 'Load the mixer’s 4 slots as shown (3:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-blue-violet-s1-in0', 'ex-blue-violet-s1', 0, 'bambu-pla-basic-jade-white', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-blue-violet-s1-in1', 'ex-blue-violet-s1', 1, 'bambu-pla-basic-cobalt-blue', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-blue-violet-s2', md5('spoolshare-example-blue-violet')::uuid, 1, 'Mix Blue Violet', 'Blue Violet', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-blue-violet-s2-in0', 'ex-blue-violet-s2', 0, 'bambu-pla-basic-jade-white', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-blue-violet-s2-in1', 'ex-blue-violet-s2', 1, 'bambu-pla-basic-purple', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-blue-violet-s2-in2', 'ex-blue-violet-s2', 2, null, 'ex-blue-violet-s1', 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-blue-violet')::uuid, 'bambu-pla-basic-jade-white', 0.6875);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-blue-violet')::uuid, 'bambu-pla-basic-purple', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-blue-violet')::uuid, 'bambu-pla-basic-cobalt-blue', 0.0625);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'leaf-green') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-leaf-green')::uuid, 'leaf-green', 'Leaf Green', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#6AA86E', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{green,single-print,example}', true, '[{"id":"leaf-green-idea0","title":"Leaf ornaments"},{"id":"leaf-green-idea1","title":"Tabletop terrain"}]'::jsonb, now() - interval '10 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-leaf-green-s1', md5('spoolshare-example-leaf-green')::uuid, 0, 'Mix Leaf Green', 'Leaf Green', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-leaf-green-s1-in0', 'ex-leaf-green-s1', 0, 'bambu-pla-basic-jade-white', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-leaf-green-s1-in1', 'ex-leaf-green-s1', 1, 'bambu-pla-basic-mistletoe-green', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-leaf-green-s1-in2', 'ex-leaf-green-s1', 2, 'bambu-pla-basic-gray', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-leaf-green')::uuid, 'bambu-pla-basic-jade-white', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-leaf-green')::uuid, 'bambu-pla-basic-mistletoe-green', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-leaf-green')::uuid, 'bambu-pla-basic-gray', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'terracotta') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-terracotta')::uuid, 'terracotta', 'Terracotta', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#D47E53', 'PLA', 'matte', 'Multi-Color Filament Mixer', '{orange,single-print,example}', true, '[{"id":"terracotta-idea0","title":"Planters"},{"id":"terracotta-idea1","title":"Pots and saucers"}]'::jsonb, now() - interval '15 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-terracotta-s1', md5('spoolshare-example-terracotta')::uuid, 0, 'Mix Terracotta', 'Terracotta', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-terracotta-s1-in0', 'ex-terracotta-s1', 0, 'bambu-pla-matte-mandarin-orange', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-terracotta-s1-in1', 'ex-terracotta-s1', 1, 'bambu-pla-matte-terracotta', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-terracotta-s1-in2', 'ex-terracotta-s1', 2, 'bambu-pla-matte-ivory-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-terracotta')::uuid, 'bambu-pla-matte-mandarin-orange', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-terracotta')::uuid, 'bambu-pla-matte-terracotta', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-terracotta')::uuid, 'bambu-pla-matte-ivory-white', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'spring-green') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-spring-green')::uuid, 'spring-green', 'Spring Green', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#5AB773', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{green,multi-stage,example}', true, '[]'::jsonb, now() - interval '20 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-spring-green-s1', md5('spoolshare-example-spring-green')::uuid, 0, 'Teal Base', 'Light Teal', 'Load the mixer’s 4 slots as shown (3:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-spring-green-s1-in0', 'ex-spring-green-s1', 0, 'bambu-pla-basic-jade-white', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-spring-green-s1-in1', 'ex-spring-green-s1', 1, 'bambu-pla-basic-turquoise', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-spring-green-s2', md5('spoolshare-example-spring-green')::uuid, 1, 'Mix Spring Green', 'Spring Green', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-spring-green-s2-in0', 'ex-spring-green-s2', 0, null, 'ex-spring-green-s1', 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-spring-green-s2-in1', 'ex-spring-green-s2', 1, 'bambu-pla-basic-mistletoe-green', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-spring-green-s2-in2', 'ex-spring-green-s2', 2, 'bambu-pla-basic-jade-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-spring-green')::uuid, 'bambu-pla-basic-jade-white', 0.625);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-spring-green')::uuid, 'bambu-pla-basic-mistletoe-green', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-spring-green')::uuid, 'bambu-pla-basic-turquoise', 0.125);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'rose-pink') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-rose-pink')::uuid, 'rose-pink', 'Rose Pink', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#F98EA6', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{pink,single-print,example}', true, '[{"id":"rose-pink-idea0","title":"Jewelry dishes"},{"id":"rose-pink-idea1","title":"Cosplay accents"}]'::jsonb, now() - interval '25 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-rose-pink-s1', md5('spoolshare-example-rose-pink')::uuid, 0, 'Mix Rose Pink', 'Rose Pink', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rose-pink-s1-in0', 'ex-rose-pink-s1', 0, 'bambu-pla-basic-jade-white', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rose-pink-s1-in1', 'ex-rose-pink-s1', 1, 'bambu-pla-basic-pink', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rose-pink-s1-in2', 'ex-rose-pink-s1', 2, 'bambu-pla-basic-beige', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-rose-pink')::uuid, 'bambu-pla-basic-jade-white', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-rose-pink')::uuid, 'bambu-pla-basic-pink', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-rose-pink')::uuid, 'bambu-pla-basic-beige', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'deep-teal-gray') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-deep-teal-gray')::uuid, 'deep-teal-gray', 'Deep Teal Gray', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#35555E', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{teal,single-print,example}', true, '[]'::jsonb, now() - interval '30 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-deep-teal-gray-s1', md5('spoolshare-example-deep-teal-gray')::uuid, 0, 'Mix Deep Teal Gray', 'Deep Teal Gray', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-deep-teal-gray-s1-in0', 'ex-deep-teal-gray-s1', 0, 'bambu-pla-basic-turquoise', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-deep-teal-gray-s1-in1', 'ex-deep-teal-gray-s1', 1, 'bambu-pla-basic-black', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-deep-teal-gray-s1-in2', 'ex-deep-teal-gray-s1', 2, 'bambu-pla-basic-cobalt-blue', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-deep-teal-gray')::uuid, 'bambu-pla-basic-turquoise', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-deep-teal-gray')::uuid, 'bambu-pla-basic-black', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-deep-teal-gray')::uuid, 'bambu-pla-basic-cobalt-blue', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'butter-yellow') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-butter-yellow')::uuid, 'butter-yellow', 'Butter Yellow', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#FBEB94', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{yellow,multi-stage,example}', true, '[]'::jsonb, now() - interval '35 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-butter-yellow-s1', md5('spoolshare-example-butter-yellow')::uuid, 0, 'Pale Yellow', 'Pale Yellow', 'Load the mixer’s 4 slots as shown (3:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-butter-yellow-s1-in0', 'ex-butter-yellow-s1', 0, 'bambu-pla-basic-jade-white', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-butter-yellow-s1-in1', 'ex-butter-yellow-s1', 1, 'bambu-pla-basic-sunflower-yellow', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-butter-yellow-s2', md5('spoolshare-example-butter-yellow')::uuid, 1, 'Mix Butter Yellow', 'Butter Yellow', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-butter-yellow-s2-in0', 'ex-butter-yellow-s2', 0, 'bambu-pla-basic-jade-white', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-butter-yellow-s2-in1', 'ex-butter-yellow-s2', 1, null, 'ex-butter-yellow-s1', 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-butter-yellow-s2-in2', 'ex-butter-yellow-s2', 2, 'bambu-pla-basic-beige', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-butter-yellow')::uuid, 'bambu-pla-basic-jade-white', 0.6875);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-butter-yellow')::uuid, 'bambu-pla-basic-beige', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-butter-yellow')::uuid, 'bambu-pla-basic-sunflower-yellow', 0.0625);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'rust-brown') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-rust-brown')::uuid, 'rust-brown', 'Rust Brown', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#A7583C', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{brown,multi-stage,example}', true, '[{"id":"rust-brown-idea0","title":"Tabletop terrain"},{"id":"rust-brown-idea1","title":"Steampunk props"}]'::jsonb, now() - interval '40 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-rust-brown-s1', md5('spoolshare-example-rust-brown')::uuid, 0, 'Rust Base', 'Rust Base', 'Load the mixer’s 4 slots as shown (1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rust-brown-s1-in0', 'ex-rust-brown-s1', 0, 'bambu-pla-basic-orange', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rust-brown-s1-in1', 'ex-rust-brown-s1', 1, 'bambu-pla-basic-brown', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-rust-brown-s2', md5('spoolshare-example-rust-brown')::uuid, 1, 'Mix Rust Brown', 'Rust Brown', 'Load the mixer’s 4 slots as shown (3:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rust-brown-s2-in0', 'ex-rust-brown-s2', 0, null, 'ex-rust-brown-s1', 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rust-brown-s2-in1', 'ex-rust-brown-s2', 1, 'bambu-pla-basic-gray', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-rust-brown')::uuid, 'bambu-pla-basic-orange', 0.375);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-rust-brown')::uuid, 'bambu-pla-basic-brown', 0.375);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-rust-brown')::uuid, 'bambu-pla-basic-gray', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'light-green') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-light-green')::uuid, 'light-green', 'Light Green', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#60D272', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{green,single-print,example}', true, '[{"id":"light-green-idea0","title":"Desk organizers"}]'::jsonb, now() - interval '45 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-light-green-s1', md5('spoolshare-example-light-green')::uuid, 0, 'Mix Light Green', 'Light Green', 'Load the mixer’s 4 slots as shown (3:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-light-green-s1-in0', 'ex-light-green-s1', 0, 'bambu-pla-basic-jade-white', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-light-green-s1-in1', 'ex-light-green-s1', 1, 'bambu-pla-basic-bambu-green', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-light-green')::uuid, 'bambu-pla-basic-jade-white', 0.75);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-light-green')::uuid, 'bambu-pla-basic-bambu-green', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'slate-gray') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-slate-gray')::uuid, 'slate-gray', 'Slate Gray', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#666D79', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{neutral,multi-stage,example}', true, '[{"id":"slate-gray-idea0","title":"Tool holders"},{"id":"slate-gray-idea1","title":"Phone stands"}]'::jsonb, now() - interval '50 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-slate-gray-s1', md5('spoolshare-example-slate-gray')::uuid, 0, 'Dark Gray', 'Dark Gray', 'Load the mixer’s 4 slots as shown (3:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-slate-gray-s1-in0', 'ex-slate-gray-s1', 0, 'bambu-pla-basic-light-gray', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-slate-gray-s1-in1', 'ex-slate-gray-s1', 1, 'bambu-pla-basic-black', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-slate-gray-s2', md5('spoolshare-example-slate-gray')::uuid, 1, 'Mix Slate Gray', 'Slate Gray', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-slate-gray-s2-in0', 'ex-slate-gray-s2', 0, 'bambu-pla-basic-blue-grey', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-slate-gray-s2-in1', 'ex-slate-gray-s2', 1, null, 'ex-slate-gray-s1', 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-slate-gray-s2-in2', 'ex-slate-gray-s2', 2, 'bambu-pla-basic-light-gray', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-slate-gray')::uuid, 'bambu-pla-basic-blue-grey', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-slate-gray')::uuid, 'bambu-pla-basic-light-gray', 0.4375);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-slate-gray')::uuid, 'bambu-pla-basic-black', 0.0625);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'coral') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-coral')::uuid, 'coral', 'Coral', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#FA7B5B', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{red,single-print,example}', true, '[]'::jsonb, now() - interval '55 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-coral-s1', md5('spoolshare-example-coral')::uuid, 0, 'Mix Coral', 'Coral', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-coral-s1-in0', 'ex-coral-s1', 0, 'bambu-pla-basic-jade-white', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-coral-s1-in1', 'ex-coral-s1', 1, 'bambu-pla-basic-pink', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-coral-s1-in2', 'ex-coral-s1', 2, 'bambu-pla-basic-orange', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-coral')::uuid, 'bambu-pla-basic-jade-white', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-coral')::uuid, 'bambu-pla-basic-pink', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-coral')::uuid, 'bambu-pla-basic-orange', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'olive-drab') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-olive-drab')::uuid, 'olive-drab', 'Olive Drab', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#485139', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{green,multi-stage,example}', true, '[]'::jsonb, now() - interval '60 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-olive-drab-s1', md5('spoolshare-example-olive-drab')::uuid, 0, 'Khaki Base', 'Khaki Base', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-olive-drab-s1-in0', 'ex-olive-drab-s1', 0, 'bambu-pla-basic-mistletoe-green', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-olive-drab-s1-in1', 'ex-olive-drab-s1', 1, 'bambu-pla-basic-yellow', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-olive-drab-s1-in2', 'ex-olive-drab-s1', 2, 'bambu-pla-basic-brown', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-olive-drab-s2', md5('spoolshare-example-olive-drab')::uuid, 1, 'Mix Olive Drab', 'Olive Drab', 'Load the mixer’s 4 slots as shown (3:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-olive-drab-s2-in0', 'ex-olive-drab-s2', 0, null, 'ex-olive-drab-s1', 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-olive-drab-s2-in1', 'ex-olive-drab-s2', 1, 'bambu-pla-basic-black', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-olive-drab')::uuid, 'bambu-pla-basic-mistletoe-green', 0.375);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-olive-drab')::uuid, 'bambu-pla-basic-black', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-olive-drab')::uuid, 'bambu-pla-basic-yellow', 0.1875);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-olive-drab')::uuid, 'bambu-pla-basic-brown', 0.1875);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'peach') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-peach')::uuid, 'peach', 'Peach', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#F3B996', 'PLA', 'matte', 'Multi-Color Filament Mixer', '{orange,single-print,example}', true, '[]'::jsonb, now() - interval '65 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-peach-s1', md5('spoolshare-example-peach')::uuid, 0, 'Mix Peach', 'Peach', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-peach-s1-in0', 'ex-peach-s1', 0, 'bambu-pla-matte-ivory-white', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-peach-s1-in1', 'ex-peach-s1', 1, 'bambu-pla-matte-mandarin-orange', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-peach-s1-in2', 'ex-peach-s1', 2, 'bambu-pla-matte-sakura-pink', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-peach')::uuid, 'bambu-pla-matte-ivory-white', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-peach')::uuid, 'bambu-pla-matte-mandarin-orange', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-peach')::uuid, 'bambu-pla-matte-sakura-pink', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'deep-sea-gray') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-deep-sea-gray')::uuid, 'deep-sea-gray', 'Deep Sea Gray', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#3C5556', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{teal,multi-stage,example}', true, '[]'::jsonb, now() - interval '70 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-deep-sea-gray-s1', md5('spoolshare-example-deep-sea-gray')::uuid, 0, 'Teal Concentrate', 'Teal Concentrate', 'Load the mixer’s 4 slots as shown (1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-deep-sea-gray-s1-in0', 'ex-deep-sea-gray-s1', 0, 'bambu-pla-basic-turquoise', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-deep-sea-gray-s1-in1', 'ex-deep-sea-gray-s1', 1, 'bambu-pla-basic-bambu-green', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-deep-sea-gray-s2', md5('spoolshare-example-deep-sea-gray')::uuid, 1, 'Deepen', 'Deep Teal', 'Load the mixer’s 4 slots as shown (1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-deep-sea-gray-s2-in0', 'ex-deep-sea-gray-s2', 0, null, 'ex-deep-sea-gray-s1', 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-deep-sea-gray-s2-in1', 'ex-deep-sea-gray-s2', 1, 'bambu-pla-basic-cobalt-blue', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-deep-sea-gray-s3', md5('spoolshare-example-deep-sea-gray')::uuid, 2, 'Mix Deep Sea Gray', 'Deep Sea Gray', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-deep-sea-gray-s3-in0', 'ex-deep-sea-gray-s3', 0, null, 'ex-deep-sea-gray-s2', 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-deep-sea-gray-s3-in1', 'ex-deep-sea-gray-s3', 1, 'bambu-pla-basic-black', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-deep-sea-gray-s3-in2', 'ex-deep-sea-gray-s3', 2, 'bambu-pla-basic-jade-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-deep-sea-gray')::uuid, 'bambu-pla-basic-cobalt-blue', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-deep-sea-gray')::uuid, 'bambu-pla-basic-black', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-deep-sea-gray')::uuid, 'bambu-pla-basic-jade-white', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-deep-sea-gray')::uuid, 'bambu-pla-basic-turquoise', 0.125);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-deep-sea-gray')::uuid, 'bambu-pla-basic-bambu-green', 0.125);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'pale-pink') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-pale-pink')::uuid, 'pale-pink', 'Pale Pink', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#EFC3DC', 'PLA', 'matte', 'Multi-Color Filament Mixer', '{pink,single-print,example}', true, '[]'::jsonb, now() - interval '75 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-pale-pink-s1', md5('spoolshare-example-pale-pink')::uuid, 0, 'Mix Pale Pink', 'Pale Pink', 'Load the mixer’s 4 slots as shown (1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-pale-pink-s1-in0', 'ex-pale-pink-s1', 0, 'bambu-pla-matte-sakura-pink', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-pale-pink-s1-in1', 'ex-pale-pink-s1', 1, 'bambu-pla-matte-ivory-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-pale-pink')::uuid, 'bambu-pla-matte-sakura-pink', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-pale-pink')::uuid, 'bambu-pla-matte-ivory-white', 0.5);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'burnt-orange') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-burnt-orange')::uuid, 'burnt-orange', 'Burnt Orange', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#C76835', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{orange,single-print,example}', true, '[]'::jsonb, now() - interval '80 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-burnt-orange-s1', md5('spoolshare-example-burnt-orange')::uuid, 0, 'Mix Burnt Orange', 'Burnt Orange', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-burnt-orange-s1-in0', 'ex-burnt-orange-s1', 0, 'bambu-pla-basic-sunflower-yellow', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-burnt-orange-s1-in1', 'ex-burnt-orange-s1', 1, 'bambu-pla-basic-orange', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-burnt-orange-s1-in2', 'ex-burnt-orange-s1', 2, 'bambu-pla-basic-brown', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-burnt-orange')::uuid, 'bambu-pla-basic-sunflower-yellow', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-burnt-orange')::uuid, 'bambu-pla-basic-orange', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-burnt-orange')::uuid, 'bambu-pla-basic-brown', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'denim-blue') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-denim-blue')::uuid, 'denim-blue', 'Denim Blue', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#506A90', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{blue,single-print,example}', true, '[]'::jsonb, now() - interval '85 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-denim-blue-s1', md5('spoolshare-example-denim-blue')::uuid, 0, 'Mix Denim Blue', 'Denim Blue', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-denim-blue-s1-in0', 'ex-denim-blue-s1', 0, 'bambu-pla-basic-blue-grey', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-denim-blue-s1-in1', 'ex-denim-blue-s1', 1, 'bambu-pla-basic-jade-white', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-denim-blue-s1-in2', 'ex-denim-blue-s1', 2, 'bambu-pla-basic-cobalt-blue', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-denim-blue')::uuid, 'bambu-pla-basic-blue-grey', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-denim-blue')::uuid, 'bambu-pla-basic-jade-white', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-denim-blue')::uuid, 'bambu-pla-basic-cobalt-blue', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'plum') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-plum')::uuid, 'plum', 'Plum', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#5E3551', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{purple,single-print,example}', true, '[]'::jsonb, now() - interval '90 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-plum-s1', md5('spoolshare-example-plum')::uuid, 0, 'Mix Plum', 'Plum', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-plum-s1-in0', 'ex-plum-s1', 0, 'bambu-pla-basic-indigo-purple', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-plum-s1-in1', 'ex-plum-s1', 1, 'bambu-pla-basic-maroon-red', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-plum-s1-in2', 'ex-plum-s1', 2, 'bambu-pla-basic-magenta', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-plum')::uuid, 'bambu-pla-basic-indigo-purple', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-plum')::uuid, 'bambu-pla-basic-maroon-red', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-plum')::uuid, 'bambu-pla-basic-magenta', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'amethyst') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-amethyst')::uuid, 'amethyst', 'Amethyst', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#8B6CCE', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{purple,single-print,example}', true, '[{"id":"amethyst-idea0","title":"Trinket boxes"},{"id":"amethyst-idea1","title":"Flowers"}]'::jsonb, now() - interval '95 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-amethyst-s1', md5('spoolshare-example-amethyst')::uuid, 0, 'Mix Amethyst', 'Amethyst', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-amethyst-s1-in0', 'ex-amethyst-s1', 0, 'bambu-pla-matte-lilac-purple', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-amethyst-s1-in1', 'ex-amethyst-s1', 1, 'bambu-pla-basic-jade-white', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-amethyst-s1-in2', 'ex-amethyst-s1', 2, 'bambu-pla-basic-purple', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-amethyst')::uuid, 'bambu-pla-matte-lilac-purple', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-amethyst')::uuid, 'bambu-pla-basic-jade-white', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-amethyst')::uuid, 'bambu-pla-basic-purple', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'tangerine') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-tangerine')::uuid, 'tangerine', 'Tangerine', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#FA7A46', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{orange,single-print,example}', true, '[]'::jsonb, now() - interval '100 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-tangerine-s1', md5('spoolshare-example-tangerine')::uuid, 0, 'Mix Tangerine', 'Tangerine', 'Load the mixer’s 4 slots as shown (1:1:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-tangerine-s1-in0', 'ex-tangerine-s1', 0, 'bambu-pla-basic-orange', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-tangerine-s1-in1', 'ex-tangerine-s1', 1, 'bambu-pla-basic-sunflower-yellow', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-tangerine-s1-in2', 'ex-tangerine-s1', 2, 'bambu-pla-basic-pink', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-tangerine-s1-in3', 'ex-tangerine-s1', 3, 'bambu-pla-basic-jade-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-tangerine')::uuid, 'bambu-pla-basic-orange', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-tangerine')::uuid, 'bambu-pla-basic-sunflower-yellow', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-tangerine')::uuid, 'bambu-pla-basic-pink', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-tangerine')::uuid, 'bambu-pla-basic-jade-white', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'sage-green') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-sage-green')::uuid, 'sage-green', 'Sage Green', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#679A6A', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{green,single-print,example}', true, '[{"id":"sage-green-idea0","title":"Plant pots"},{"id":"sage-green-idea1","title":"Tabletop terrain"}]'::jsonb, now() - interval '105 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-sage-green-s1', md5('spoolshare-example-sage-green')::uuid, 0, 'Mix Sage Green', 'Sage Green', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sage-green-s1-in0', 'ex-sage-green-s1', 0, 'bambu-pla-basic-gray', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sage-green-s1-in1', 'ex-sage-green-s1', 1, 'bambu-pla-basic-mistletoe-green', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sage-green-s1-in2', 'ex-sage-green-s1', 2, 'bambu-pla-basic-jade-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sage-green')::uuid, 'bambu-pla-basic-gray', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sage-green')::uuid, 'bambu-pla-basic-mistletoe-green', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sage-green')::uuid, 'bambu-pla-basic-jade-white', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'camel') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-camel')::uuid, 'camel', 'Camel', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#A28360', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{orange,single-print,example}', true, '[]'::jsonb, now() - interval '110 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-camel-s1', md5('spoolshare-example-camel')::uuid, 0, 'Mix Camel', 'Camel', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-camel-s1-in0', 'ex-camel-s1', 0, 'bambu-pla-basic-beige', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-camel-s1-in1', 'ex-camel-s1', 1, 'bambu-pla-basic-cocoa-brown', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-camel-s1-in2', 'ex-camel-s1', 2, 'bambu-pla-basic-jade-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-camel')::uuid, 'bambu-pla-basic-beige', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-camel')::uuid, 'bambu-pla-basic-cocoa-brown', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-camel')::uuid, 'bambu-pla-basic-jade-white', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'royal-purple') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-royal-purple')::uuid, 'royal-purple', 'Royal Purple', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#683EA8', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{purple,single-print,example}', true, '[]'::jsonb, now() - interval '115 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-royal-purple-s1', md5('spoolshare-example-royal-purple')::uuid, 0, 'Mix Royal Purple', 'Royal Purple', 'Load the mixer’s 4 slots as shown (3:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-royal-purple-s1-in0', 'ex-royal-purple-s1', 0, 'bambu-pla-basic-purple', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-royal-purple-s1-in1', 'ex-royal-purple-s1', 1, 'bambu-pla-basic-magenta', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-royal-purple')::uuid, 'bambu-pla-basic-purple', 0.75);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-royal-purple')::uuid, 'bambu-pla-basic-magenta', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'sky-blue') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-sky-blue')::uuid, 'sky-blue', 'Sky Blue', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#60C2DF', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{teal,multi-stage,example}', true, '[]'::jsonb, now() - interval '120 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-sky-blue-s1', md5('spoolshare-example-sky-blue')::uuid, 0, 'Cyan Blend', 'Cyan Blend', 'Load the mixer’s 4 slots as shown (1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sky-blue-s1-in0', 'ex-sky-blue-s1', 0, 'bambu-pla-basic-cyan', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sky-blue-s1-in1', 'ex-sky-blue-s1', 1, 'bambu-pla-basic-turquoise', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-sky-blue-s2', md5('spoolshare-example-sky-blue')::uuid, 1, 'Mix Sky Blue', 'Sky Blue', 'Load the mixer’s 4 slots as shown (3:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sky-blue-s2-in0', 'ex-sky-blue-s2', 0, 'bambu-pla-basic-jade-white', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sky-blue-s2-in1', 'ex-sky-blue-s2', 1, null, 'ex-sky-blue-s1', 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sky-blue')::uuid, 'bambu-pla-basic-jade-white', 0.75);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sky-blue')::uuid, 'bambu-pla-basic-cyan', 0.125);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sky-blue')::uuid, 'bambu-pla-basic-turquoise', 0.125);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'brick-red') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-brick-red')::uuid, 'brick-red', 'Brick Red', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#A5403C', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{brown,single-print,example}', true, '[]'::jsonb, now() - interval '125 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-brick-red-s1', md5('spoolshare-example-brick-red')::uuid, 0, 'Mix Brick Red', 'Brick Red', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-brick-red-s1-in0', 'ex-brick-red-s1', 0, 'bambu-pla-basic-red', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-brick-red-s1-in1', 'ex-brick-red-s1', 1, 'bambu-pla-basic-brown', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-brick-red-s1-in2', 'ex-brick-red-s1', 2, 'bambu-pla-basic-gray', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-brick-red')::uuid, 'bambu-pla-basic-red', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-brick-red')::uuid, 'bambu-pla-basic-brown', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-brick-red')::uuid, 'bambu-pla-basic-gray', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'lime-green') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-lime-green')::uuid, 'lime-green', 'Lime Green', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#7ADC68', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{green,multi-stage,example}', true, '[]'::jsonb, now() - interval '130 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-lime-green-s1', md5('spoolshare-example-lime-green')::uuid, 0, 'Yellow-Green Base', 'Lime Base', 'Load the mixer’s 4 slots as shown (1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-lime-green-s1-in0', 'ex-lime-green-s1', 0, 'bambu-pla-basic-bambu-green', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-lime-green-s1-in1', 'ex-lime-green-s1', 1, 'bambu-pla-basic-yellow', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-lime-green-s2', md5('spoolshare-example-lime-green')::uuid, 1, 'Mix Lime Green', 'Lime Green', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-lime-green-s2-in0', 'ex-lime-green-s2', 0, 'bambu-pla-basic-jade-white', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-lime-green-s2-in1', 'ex-lime-green-s2', 1, null, 'ex-lime-green-s1', 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-lime-green-s2-in2', 'ex-lime-green-s2', 2, 'bambu-pla-basic-beige', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-lime-green')::uuid, 'bambu-pla-basic-jade-white', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-lime-green')::uuid, 'bambu-pla-basic-beige', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-lime-green')::uuid, 'bambu-pla-basic-bambu-green', 0.125);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-lime-green')::uuid, 'bambu-pla-basic-yellow', 0.125);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'graphite') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-graphite')::uuid, 'graphite', 'Graphite', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#35353C', 'PETG', 'basic', 'Multi-Color Filament Mixer', '{neutral,single-print,example}', true, '[]'::jsonb, now() - interval '135 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-graphite-s1', md5('spoolshare-example-graphite')::uuid, 0, 'Mix Graphite', 'Graphite', 'Load the mixer’s 4 slots as shown (3:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-graphite-s1-in0', 'ex-graphite-s1', 0, 'bambu-petg-hf-black', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-graphite-s1-in1', 'ex-graphite-s1', 1, 'bambu-petg-hf-blue', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-graphite')::uuid, 'bambu-petg-hf-black', 0.75);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-graphite')::uuid, 'bambu-petg-hf-blue', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'hot-pink') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, print_ideas, created_at, updated_at) values (md5('spoolshare-example-hot-pink')::uuid, 'hot-pink', 'Hot Pink', 'An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.', (select id from profiles where username = 'spoolshare'), 'published', '#F35085', 'PLA', 'basic', 'Multi-Color Filament Mixer', '{pink,single-print,example}', true, '[]'::jsonb, now() - interval '140 minutes', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-hot-pink-s1', md5('spoolshare-example-hot-pink')::uuid, 0, 'Mix Hot Pink', 'Hot Pink', 'Load the mixer’s 4 slots as shown (2:1:1) and print it.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-hot-pink-s1-in0', 'ex-hot-pink-s1', 0, 'bambu-pla-basic-pink', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-hot-pink-s1-in1', 'ex-hot-pink-s1', 1, 'bambu-pla-basic-magenta', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-hot-pink-s1-in2', 'ex-hot-pink-s1', 2, 'bambu-pla-basic-jade-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-hot-pink')::uuid, 'bambu-pla-basic-pink', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-hot-pink')::uuid, 'bambu-pla-basic-magenta', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-hot-pink')::uuid, 'bambu-pla-basic-jade-white', 0.25);
end if;
end $ex$;
