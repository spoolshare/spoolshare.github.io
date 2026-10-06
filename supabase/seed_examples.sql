-- SpoolShare official example recipes. Generated from src/lib/api/mock/seed/community.ts.
-- Run after schema.sql, seed.sql and migrations/002_app_functions.sql. Safe to re-run.
-- Their colors are CALCULATED predictions, not printed swatches, so is_example = true
-- and the app labels them "Calculated / Untested" until someone reproduces one.

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'official@spoolshare.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"username":"spoolshare","display_name":"SpoolShare"}', now(), now())
on conflict (id) do nothing;
update profiles set display_name = 'SpoolShare', bio = 'Official example recipes. Their colors are calculated predictions until the community prints and reproduces them.', avatar_hue = 145 where id = '00000000-0000-4000-8000-000000000001';

delete from recipes where author_id = '00000000-0000-4000-8000-000000000001' and is_example;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'dusty-purple') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-dusty-purple')::uuid, 'dusty-purple', 'Dusty Purple', 'An example starting point for a muted, purple color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#925D60', 'PLA', 'basic', 'Filament re-extruder', '{muted,purple,two-stage}', true, now() - interval '0 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-dusty-purple-s1', md5('spoolshare-example-dusty-purple')::uuid, 0, 'Create Light Blue', 'Light Blue Intermediate', 'Combine 3:1 (75% Jade White, 25% Cobalt Blue). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-dusty-purple-s1-in0', 'ex-dusty-purple-s1', 0, 'bambu-pla-basic-jade-white', null, 75);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-dusty-purple-s1-in1', 'ex-dusty-purple-s1', 1, 'bambu-pla-basic-cobalt-blue', null, 25);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-dusty-purple-s2', md5('spoolshare-example-dusty-purple')::uuid, 1, 'Create Purple', 'Final Purple', 'Combine 2:1:1 (50% Jade White, 25% Red, 25% Light Blue Intermediate). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-dusty-purple-s2-in0', 'ex-dusty-purple-s2', 0, 'bambu-pla-basic-jade-white', null, 50);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-dusty-purple-s2-in1', 'ex-dusty-purple-s2', 1, 'bambu-pla-basic-red', null, 25);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-dusty-purple-s2-in2', 'ex-dusty-purple-s2', 2, null, 'ex-dusty-purple-s1', 25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-dusty-purple')::uuid, 'bambu-pla-basic-jade-white', 0.6875);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-dusty-purple')::uuid, 'bambu-pla-basic-red', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-dusty-purple')::uuid, 'bambu-pla-basic-cobalt-blue', 0.0625);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'dusty-lavender') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-dusty-lavender')::uuid, 'dusty-lavender', 'Dusty Lavender', 'An example starting point for a pastel, lavender color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#8471D5', 'PLA', 'basic', 'Filament re-extruder', '{pastel,lavender,planters}', true, now() - interval '1 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-dusty-lavender-s1', md5('spoolshare-example-dusty-lavender')::uuid, 0, 'Dilute Cobalt', 'Pale Cobalt', 'Combine 7:1 (87.5% Jade White, 12.5% Cobalt Blue). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-dusty-lavender-s1-in0', 'ex-dusty-lavender-s1', 0, 'bambu-pla-basic-jade-white', null, 7);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-dusty-lavender-s1-in1', 'ex-dusty-lavender-s1', 1, 'bambu-pla-basic-cobalt-blue', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-dusty-lavender-s2', md5('spoolshare-example-dusty-lavender')::uuid, 1, 'Mix Lavender', 'Dusty Lavender', 'Combine 2:1:1 (50% Jade White, 25% Purple, 25% Pale Cobalt). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-dusty-lavender-s2-in0', 'ex-dusty-lavender-s2', 0, 'bambu-pla-basic-jade-white', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-dusty-lavender-s2-in1', 'ex-dusty-lavender-s2', 1, 'bambu-pla-basic-purple', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-dusty-lavender-s2-in2', 'ex-dusty-lavender-s2', 2, null, 'ex-dusty-lavender-s1', 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-dusty-lavender')::uuid, 'bambu-pla-basic-jade-white', 0.71875);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-dusty-lavender')::uuid, 'bambu-pla-basic-purple', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-dusty-lavender')::uuid, 'bambu-pla-basic-cobalt-blue', 0.03125);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'sage-mist') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-sage-mist')::uuid, 'sage-mist', 'Sage Mist', 'An example starting point for a green, muted color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#71B475', 'PLA', 'basic', 'Filament re-extruder', '{green,muted,terrain}', true, now() - interval '2 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-sage-mist-s1', md5('spoolshare-example-sage-mist')::uuid, 0, 'Mix Sage', 'Sage Mist', 'Combine 6:2:1 (66.7% Jade White, 22.2% Mistletoe Green, 11.1% Gray). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sage-mist-s1-in0', 'ex-sage-mist-s1', 0, 'bambu-pla-basic-jade-white', null, 6);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sage-mist-s1-in1', 'ex-sage-mist-s1', 1, 'bambu-pla-basic-mistletoe-green', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sage-mist-s1-in2', 'ex-sage-mist-s1', 2, 'bambu-pla-basic-gray', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sage-mist')::uuid, 'bambu-pla-basic-jade-white', 0.666667);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sage-mist')::uuid, 'bambu-pla-basic-mistletoe-green', 0.222222);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sage-mist')::uuid, 'bambu-pla-basic-gray', 0.111111);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'terracotta-clay') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-terracotta-clay')::uuid, 'terracotta-clay', 'Terracotta Clay', 'An example starting point for a earthy, matte color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#C76D3F', 'PLA', 'matte', 'Filament re-extruder', '{earthy,matte,pots}', true, now() - interval '3 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-terracotta-clay-s1', md5('spoolshare-example-terracotta-clay')::uuid, 0, 'Blend Terracotta', 'Terracotta', 'Combine 2:1:1 (50% Sunrise Orange, 25% Muted Red, 25% Cotton White). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-terracotta-clay-s1-in0', 'ex-terracotta-clay-s1', 0, 'polymaker-polyterra-sunrise-orange', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-terracotta-clay-s1-in1', 'ex-terracotta-clay-s1', 1, 'polymaker-polyterra-muted-red', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-terracotta-clay-s1-in2', 'ex-terracotta-clay-s1', 2, 'polymaker-polyterra-cotton-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-terracotta-clay')::uuid, 'polymaker-polyterra-sunrise-orange', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-terracotta-clay')::uuid, 'polymaker-polyterra-muted-red', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-terracotta-clay')::uuid, 'polymaker-polyterra-cotton-white', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'sea-glass') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-sea-glass')::uuid, 'sea-glass', 'Sea Glass', 'An example starting point for a teal, pastel color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#62C082', 'PLA', 'basic', 'Filament re-extruder', '{teal,pastel}', true, now() - interval '4 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-sea-glass-s1', md5('spoolshare-example-sea-glass')::uuid, 0, 'Teal Base', 'Light Teal', 'Combine 1:3 (25% Turquoise, 75% Jade White). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sea-glass-s1-in0', 'ex-sea-glass-s1', 0, 'bambu-pla-basic-turquoise', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sea-glass-s1-in1', 'ex-sea-glass-s1', 1, 'bambu-pla-basic-jade-white', null, 3);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-sea-glass-s2', md5('spoolshare-example-sea-glass')::uuid, 1, 'Green Shift', 'Sea Glass', 'Combine 3:1:2 (50% Light Teal, 16.7% Mistletoe Green, 33.3% Jade White). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sea-glass-s2-in0', 'ex-sea-glass-s2', 0, null, 'ex-sea-glass-s1', 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sea-glass-s2-in1', 'ex-sea-glass-s2', 1, 'bambu-pla-basic-mistletoe-green', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sea-glass-s2-in2', 'ex-sea-glass-s2', 2, 'bambu-pla-basic-jade-white', null, 2);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sea-glass')::uuid, 'bambu-pla-basic-jade-white', 0.708333);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sea-glass')::uuid, 'bambu-pla-basic-mistletoe-green', 0.166667);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sea-glass')::uuid, 'bambu-pla-basic-turquoise', 0.125);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'blush-rose') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-blush-rose')::uuid, 'blush-rose', 'Blush Rose', 'An example starting point for a pink, cosplay color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#F992AA', 'PLA', 'basic', 'Filament re-extruder', '{pink,cosplay,warm}', true, now() - interval '5 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-blush-rose-s1', md5('spoolshare-example-blush-rose')::uuid, 0, 'Blend', 'Blush Rose', 'Combine 5:2:2 (55.6% Jade White, 22.2% Pink, 22.2% Beige). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-blush-rose-s1-in0', 'ex-blush-rose-s1', 0, 'bambu-pla-basic-jade-white', null, 5);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-blush-rose-s1-in1', 'ex-blush-rose-s1', 1, 'bambu-pla-basic-pink', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-blush-rose-s1-in2', 'ex-blush-rose-s1', 2, 'bambu-pla-basic-beige', null, 2);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-blush-rose')::uuid, 'bambu-pla-basic-jade-white', 0.555556);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-blush-rose')::uuid, 'bambu-pla-basic-pink', 0.222222);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-blush-rose')::uuid, 'bambu-pla-basic-beige', 0.222222);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'midnight-teal') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-midnight-teal')::uuid, 'midnight-teal', 'Midnight Teal', 'An example starting point for a dark, teal color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#35555E', 'PLA', 'basic', 'Filament re-extruder', '{dark,teal}', true, now() - interval '6 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-midnight-teal-s1', md5('spoolshare-example-midnight-teal')::uuid, 0, 'Blend', 'Midnight Teal', 'Combine 2:1:1 (50% Turquoise, 25% Black, 25% Cobalt Blue). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-midnight-teal-s1-in0', 'ex-midnight-teal-s1', 0, 'bambu-pla-basic-turquoise', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-midnight-teal-s1-in1', 'ex-midnight-teal-s1', 1, 'bambu-pla-basic-black', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-midnight-teal-s1-in2', 'ex-midnight-teal-s1', 2, 'bambu-pla-basic-cobalt-blue', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-midnight-teal')::uuid, 'bambu-pla-basic-turquoise', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-midnight-teal')::uuid, 'bambu-pla-basic-black', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-midnight-teal')::uuid, 'bambu-pla-basic-cobalt-blue', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'butter-cream') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-butter-cream')::uuid, 'butter-cream', 'Butter Cream', 'An example starting point for a pastel, yellow color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#FCEA82', 'PLA', 'basic', 'Filament re-extruder', '{pastel,yellow,retro}', true, now() - interval '7 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-butter-cream-s1', md5('spoolshare-example-butter-cream')::uuid, 0, 'Blend', 'Butter Cream', 'Combine 8:1:1 (80% Jade White, 10% Sunflower Yellow, 10% Beige). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-butter-cream-s1-in0', 'ex-butter-cream-s1', 0, 'bambu-pla-basic-jade-white', null, 8);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-butter-cream-s1-in1', 'ex-butter-cream-s1', 1, 'bambu-pla-basic-sunflower-yellow', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-butter-cream-s1-in2', 'ex-butter-cream-s1', 2, 'bambu-pla-basic-beige', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-butter-cream')::uuid, 'bambu-pla-basic-jade-white', 0.8);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-butter-cream')::uuid, 'bambu-pla-basic-sunflower-yellow', 0.1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-butter-cream')::uuid, 'bambu-pla-basic-beige', 0.1);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'rusted-iron') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-rusted-iron')::uuid, 'rusted-iron', 'Rusted Iron', 'An example starting point for a terrain, brown color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#6A4E3A', 'PLA', 'basic', 'Filament re-extruder', '{terrain,brown,weathered}', true, now() - interval '8 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-rusted-iron-s1', md5('spoolshare-example-rusted-iron')::uuid, 0, 'Rust Base', 'Rust Base', 'Combine 2:2:1 (40% Orange, 40% Brown, 20% Black). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rusted-iron-s1-in0', 'ex-rusted-iron-s1', 0, 'bambu-pla-basic-orange', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rusted-iron-s1-in1', 'ex-rusted-iron-s1', 1, 'bambu-pla-basic-brown', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rusted-iron-s1-in2', 'ex-rusted-iron-s1', 2, 'bambu-pla-basic-black', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-rusted-iron-s2', md5('spoolshare-example-rusted-iron')::uuid, 1, 'Grit', 'Rusted Iron', 'Combine 4:1 (80% Rust Base, 20% Gray). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rusted-iron-s2-in0', 'ex-rusted-iron-s2', 0, null, 'ex-rusted-iron-s1', 4);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-rusted-iron-s2-in1', 'ex-rusted-iron-s2', 1, 'bambu-pla-basic-gray', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-rusted-iron')::uuid, 'bambu-pla-basic-orange', 0.32);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-rusted-iron')::uuid, 'bambu-pla-basic-brown', 0.32);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-rusted-iron')::uuid, 'bambu-pla-basic-gray', 0.2);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-rusted-iron')::uuid, 'bambu-pla-basic-black', 0.16);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'mint-chip') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-mint-chip')::uuid, 'mint-chip', 'Mint Chip', 'An example starting point for a easy, pastel color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#68D67B', 'PLA', 'basic', 'Filament re-extruder', '{easy,pastel,green}', true, now() - interval '9 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-mint-chip-s1', md5('spoolshare-example-mint-chip')::uuid, 0, 'Blend', 'Mint', 'Combine 4:1 (80% Jade White, 20% Bambu Green). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-mint-chip-s1-in0', 'ex-mint-chip-s1', 0, 'bambu-pla-basic-jade-white', null, 4);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-mint-chip-s1-in1', 'ex-mint-chip-s1', 1, 'bambu-pla-basic-bambu-green', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-mint-chip')::uuid, 'bambu-pla-basic-jade-white', 0.8);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-mint-chip')::uuid, 'bambu-pla-basic-bambu-green', 0.2);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'storm-cloud') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-storm-cloud')::uuid, 'storm-cloud', 'Storm Cloud', 'An example starting point for a gray, blue color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#6A6E75', 'PLA', 'basic', 'Filament re-extruder', '{gray,blue,precise}', true, now() - interval '10 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-storm-cloud-s1', md5('spoolshare-example-storm-cloud')::uuid, 0, 'Blend', 'Storm Cloud', 'Combine 6:3:1 (60% Light Gray, 30% Blue Grey, 10% Black). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-storm-cloud-s1-in0', 'ex-storm-cloud-s1', 0, 'bambu-pla-basic-light-gray', null, 6);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-storm-cloud-s1-in1', 'ex-storm-cloud-s1', 1, 'bambu-pla-basic-blue-grey', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-storm-cloud-s1-in2', 'ex-storm-cloud-s1', 2, 'bambu-pla-basic-black', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-storm-cloud')::uuid, 'bambu-pla-basic-light-gray', 0.6);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-storm-cloud')::uuid, 'bambu-pla-basic-blue-grey', 0.3);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-storm-cloud')::uuid, 'bambu-pla-basic-black', 0.1);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'coral-reef') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-coral-reef')::uuid, 'coral-reef', 'Coral Reef', 'An example starting point for a coral, warm color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#F9715F', 'PLA', 'basic', 'Filament re-extruder', '{coral,warm}', true, now() - interval '11 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-coral-reef-s1', md5('spoolshare-example-coral-reef')::uuid, 0, 'Blend', 'Coral', 'Combine 2:1:2 (40% Pink, 20% Orange, 40% Jade White). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-coral-reef-s1-in0', 'ex-coral-reef-s1', 0, 'bambu-pla-basic-pink', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-coral-reef-s1-in1', 'ex-coral-reef-s1', 1, 'bambu-pla-basic-orange', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-coral-reef-s1-in2', 'ex-coral-reef-s1', 2, 'bambu-pla-basic-jade-white', null, 2);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-coral-reef')::uuid, 'bambu-pla-basic-pink', 0.4);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-coral-reef')::uuid, 'bambu-pla-basic-jade-white', 0.4);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-coral-reef')::uuid, 'bambu-pla-basic-orange', 0.2);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'olive-drab') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-olive-drab')::uuid, 'olive-drab', 'Olive Drab', 'An example starting point for a green, military color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#47593B', 'PLA', 'basic', 'Filament re-extruder', '{green,military,terrain}', true, now() - interval '12 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-olive-drab-s1', md5('spoolshare-example-olive-drab')::uuid, 0, 'Blend', 'Olive Drab', 'Combine 3:1:1:1 (50% Mistletoe Green, 16.7% Brown, 16.7% Yellow, 16.7% Black). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-olive-drab-s1-in0', 'ex-olive-drab-s1', 0, 'bambu-pla-basic-mistletoe-green', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-olive-drab-s1-in1', 'ex-olive-drab-s1', 1, 'bambu-pla-basic-brown', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-olive-drab-s1-in2', 'ex-olive-drab-s1', 2, 'bambu-pla-basic-yellow', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-olive-drab-s1-in3', 'ex-olive-drab-s1', 3, 'bambu-pla-basic-black', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-olive-drab')::uuid, 'bambu-pla-basic-mistletoe-green', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-olive-drab')::uuid, 'bambu-pla-basic-brown', 0.166667);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-olive-drab')::uuid, 'bambu-pla-basic-yellow', 0.166667);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-olive-drab')::uuid, 'bambu-pla-basic-black', 0.166667);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'peach-fuzz') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-peach-fuzz')::uuid, 'peach-fuzz', 'Peach Fuzz', 'An example starting point for a peach, pastel color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#F3B996', 'PLA', 'matte', 'Filament re-extruder', '{peach,pastel,matte}', true, now() - interval '13 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-peach-fuzz-s1', md5('spoolshare-example-peach-fuzz')::uuid, 0, 'Blend', 'Peach Fuzz', 'Combine 1:2:1 (25% Mandarin Orange, 50% Ivory White, 25% Sakura Pink). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-peach-fuzz-s1-in0', 'ex-peach-fuzz-s1', 0, 'bambu-pla-matte-mandarin-orange', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-peach-fuzz-s1-in1', 'ex-peach-fuzz-s1', 1, 'bambu-pla-matte-ivory-white', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-peach-fuzz-s1-in2', 'ex-peach-fuzz-s1', 2, 'bambu-pla-matte-sakura-pink', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-peach-fuzz')::uuid, 'bambu-pla-matte-ivory-white', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-peach-fuzz')::uuid, 'bambu-pla-matte-mandarin-orange', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-peach-fuzz')::uuid, 'bambu-pla-matte-sakura-pink', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'ocean-depth') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-ocean-depth')::uuid, 'ocean-depth', 'Ocean Depth', 'An example starting point for a blue, teal color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#3B5959', 'PLA', 'basic', 'Filament re-extruder', '{blue,teal,multi-stage}', true, now() - interval '14 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-ocean-depth-s1', md5('spoolshare-example-ocean-depth')::uuid, 0, 'Teal Concentrate', 'Teal Concentrate', 'Combine 1:1 (50% Turquoise, 50% Bambu Green). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-ocean-depth-s1-in0', 'ex-ocean-depth-s1', 0, 'bambu-pla-basic-turquoise', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-ocean-depth-s1-in1', 'ex-ocean-depth-s1', 1, 'bambu-pla-basic-bambu-green', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-ocean-depth-s2', md5('spoolshare-example-ocean-depth')::uuid, 1, 'Deepen', 'Deep Teal', 'Combine 1:1 (50% Teal Concentrate, 50% Cobalt Blue). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-ocean-depth-s2-in0', 'ex-ocean-depth-s2', 0, null, 'ex-ocean-depth-s1', 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-ocean-depth-s2-in1', 'ex-ocean-depth-s2', 1, 'bambu-pla-basic-cobalt-blue', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-ocean-depth-s3', md5('spoolshare-example-ocean-depth')::uuid, 2, 'Tone Down', 'Ocean Depth', 'Combine 3:1:1 (60% Deep Teal, 20% Black, 20% Jade White). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-ocean-depth-s3-in0', 'ex-ocean-depth-s3', 0, null, 'ex-ocean-depth-s2', 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-ocean-depth-s3-in1', 'ex-ocean-depth-s3', 1, 'bambu-pla-basic-black', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-ocean-depth-s3-in2', 'ex-ocean-depth-s3', 2, 'bambu-pla-basic-jade-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-ocean-depth')::uuid, 'bambu-pla-basic-cobalt-blue', 0.3);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-ocean-depth')::uuid, 'bambu-pla-basic-black', 0.2);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-ocean-depth')::uuid, 'bambu-pla-basic-jade-white', 0.2);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-ocean-depth')::uuid, 'bambu-pla-basic-turquoise', 0.15);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-ocean-depth')::uuid, 'bambu-pla-basic-bambu-green', 0.15);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'sakura-milk') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-sakura-milk')::uuid, 'sakura-milk', 'Sakura Milk', 'An example starting point for a pink, pastel color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#EFC3DC', 'PLA', 'matte', 'Filament re-extruder', '{pink,pastel,matte}', true, now() - interval '15 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-sakura-milk-s1', md5('spoolshare-example-sakura-milk')::uuid, 0, 'Blend', 'Sakura Milk', 'Combine 1:1 (50% Sakura Pink, 50% Ivory White). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sakura-milk-s1-in0', 'ex-sakura-milk-s1', 0, 'bambu-pla-matte-sakura-pink', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-sakura-milk-s1-in1', 'ex-sakura-milk-s1', 1, 'bambu-pla-matte-ivory-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sakura-milk')::uuid, 'bambu-pla-matte-sakura-pink', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-sakura-milk')::uuid, 'bambu-pla-matte-ivory-white', 0.5);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'honey-amber') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-honey-amber')::uuid, 'honey-amber', 'Honey Amber', 'An example starting point for a yellow, warm color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#D07635', 'PLA', 'basic', 'Filament re-extruder', '{yellow,warm,gold}', true, now() - interval '16 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-honey-amber-s1', md5('spoolshare-example-honey-amber')::uuid, 0, 'Blend', 'Honey', 'Combine 4:1:1 (66.7% Sunflower Yellow, 16.7% Orange, 16.7% Brown). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-honey-amber-s1-in0', 'ex-honey-amber-s1', 0, 'bambu-pla-basic-sunflower-yellow', null, 4);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-honey-amber-s1-in1', 'ex-honey-amber-s1', 1, 'bambu-pla-basic-orange', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-honey-amber-s1-in2', 'ex-honey-amber-s1', 2, 'bambu-pla-basic-brown', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-honey-amber')::uuid, 'bambu-pla-basic-sunflower-yellow', 0.666667);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-honey-amber')::uuid, 'bambu-pla-basic-orange', 0.166667);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-honey-amber')::uuid, 'bambu-pla-basic-brown', 0.166667);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'denim-wash') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-denim-wash')::uuid, 'denim-wash', 'Denim Wash', 'An example starting point for a blue, muted color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#587298', 'PLA', 'basic', 'Filament re-extruder', '{blue,muted}', true, now() - interval '17 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-denim-wash-s1', md5('spoolshare-example-denim-wash')::uuid, 0, 'Blend', 'Denim', 'Combine 1:2:2 (20% Cobalt Blue, 40% Jade White, 40% Blue Grey). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-denim-wash-s1-in0', 'ex-denim-wash-s1', 0, 'bambu-pla-basic-cobalt-blue', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-denim-wash-s1-in1', 'ex-denim-wash-s1', 1, 'bambu-pla-basic-jade-white', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-denim-wash-s1-in2', 'ex-denim-wash-s1', 2, 'bambu-pla-basic-blue-grey', null, 2);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-denim-wash')::uuid, 'bambu-pla-basic-jade-white', 0.4);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-denim-wash')::uuid, 'bambu-pla-basic-blue-grey', 0.4);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-denim-wash')::uuid, 'bambu-pla-basic-cobalt-blue', 0.2);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'plum-wine') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-plum-wine')::uuid, 'plum-wine', 'Plum Wine', 'An example starting point for a purple, dark color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#643548', 'PLA', 'basic', 'Filament re-extruder', '{purple,dark,measured}', true, now() - interval '18 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-plum-wine-s1', md5('spoolshare-example-plum-wine')::uuid, 0, 'Blend', 'Plum Wine', 'Combine 2:2:1 (40% Maroon Red, 40% Indigo Purple, 20% Magenta). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-plum-wine-s1-in0', 'ex-plum-wine-s1', 0, 'bambu-pla-basic-maroon-red', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-plum-wine-s1-in1', 'ex-plum-wine-s1', 1, 'bambu-pla-basic-indigo-purple', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-plum-wine-s1-in2', 'ex-plum-wine-s1', 2, 'bambu-pla-basic-magenta', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-plum-wine')::uuid, 'bambu-pla-basic-maroon-red', 0.4);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-plum-wine')::uuid, 'bambu-pla-basic-indigo-purple', 0.4);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-plum-wine')::uuid, 'bambu-pla-basic-magenta', 0.2);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'lilac-haze') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-lilac-haze')::uuid, 'lilac-haze', 'Lilac Haze', 'An example starting point for a lavender, cross-brand color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#9876C9', 'PLA', 'basic', 'Filament re-extruder', '{lavender,cross-brand}', true, now() - interval '19 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-lilac-haze-s1', md5('spoolshare-example-lilac-haze')::uuid, 0, 'Blend', 'Lilac Haze', 'Combine 3:2:1 (50% Lilac Purple, 33.3% Vanilla White, 16.7% Purple). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-lilac-haze-s1-in0', 'ex-lilac-haze-s1', 0, 'prusament-pla-lilac-purple', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-lilac-haze-s1-in1', 'ex-lilac-haze-s1', 1, 'prusament-pla-vanilla-white', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-lilac-haze-s1-in2', 'ex-lilac-haze-s1', 2, 'bambu-pla-basic-purple', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-lilac-haze')::uuid, 'prusament-pla-lilac-purple', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-lilac-haze')::uuid, 'prusament-pla-vanilla-white', 0.333333);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-lilac-haze')::uuid, 'bambu-pla-basic-purple', 0.166667);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'golden-hour') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-golden-hour')::uuid, 'golden-hour', 'Golden Hour', 'An example starting point for a orange, warm color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#FB7D3F', 'PLA', 'basic', 'Filament re-extruder', '{orange,warm}', true, now() - interval '20 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-golden-hour-s1', md5('spoolshare-example-golden-hour')::uuid, 0, 'Blend', 'Golden Hour', 'Combine 2:2:1:1 (33.3% Orange, 33.3% Sunflower Yellow, 16.7% Pink, 16.7% Jade White). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-golden-hour-s1-in0', 'ex-golden-hour-s1', 0, 'bambu-pla-basic-orange', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-golden-hour-s1-in1', 'ex-golden-hour-s1', 1, 'bambu-pla-basic-sunflower-yellow', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-golden-hour-s1-in2', 'ex-golden-hour-s1', 2, 'bambu-pla-basic-pink', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-golden-hour-s1-in3', 'ex-golden-hour-s1', 3, 'bambu-pla-basic-jade-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-golden-hour')::uuid, 'bambu-pla-basic-orange', 0.333333);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-golden-hour')::uuid, 'bambu-pla-basic-sunflower-yellow', 0.333333);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-golden-hour')::uuid, 'bambu-pla-basic-pink', 0.166667);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-golden-hour')::uuid, 'bambu-pla-basic-jade-white', 0.166667);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'moss-stone') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-moss-stone')::uuid, 'moss-stone', 'Moss Stone', 'An example starting point for a terrain, green color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#5E9661', 'PLA', 'basic', 'Filament re-extruder', '{terrain,green,gray}', true, now() - interval '21 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-moss-stone-s1', md5('spoolshare-example-moss-stone')::uuid, 0, 'Blend', 'Moss Stone', 'Combine 3:2:1 (50% Gray, 33.3% Mistletoe Green, 16.7% Jade White). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-moss-stone-s1-in0', 'ex-moss-stone-s1', 0, 'bambu-pla-basic-gray', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-moss-stone-s1-in1', 'ex-moss-stone-s1', 1, 'bambu-pla-basic-mistletoe-green', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-moss-stone-s1-in2', 'ex-moss-stone-s1', 2, 'bambu-pla-basic-jade-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-moss-stone')::uuid, 'bambu-pla-basic-gray', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-moss-stone')::uuid, 'bambu-pla-basic-mistletoe-green', 0.333333);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-moss-stone')::uuid, 'bambu-pla-basic-jade-white', 0.166667);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'cocoa-latte') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-cocoa-latte')::uuid, 'cocoa-latte', 'Cocoa Latte', 'An example starting point for a brown, neutral color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#A28360', 'PLA', 'basic', 'Filament re-extruder', '{brown,neutral}', true, now() - interval '22 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-cocoa-latte-s1', md5('spoolshare-example-cocoa-latte')::uuid, 0, 'Blend', 'Cocoa Latte', 'Combine 1:2:1 (25% Cocoa Brown, 50% Beige, 25% Jade White). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-cocoa-latte-s1-in0', 'ex-cocoa-latte-s1', 0, 'bambu-pla-basic-cocoa-brown', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-cocoa-latte-s1-in1', 'ex-cocoa-latte-s1', 1, 'bambu-pla-basic-beige', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-cocoa-latte-s1-in2', 'ex-cocoa-latte-s1', 2, 'bambu-pla-basic-jade-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-cocoa-latte')::uuid, 'bambu-pla-basic-beige', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-cocoa-latte')::uuid, 'bambu-pla-basic-cocoa-brown', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-cocoa-latte')::uuid, 'bambu-pla-basic-jade-white', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'electric-violet') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-electric-violet')::uuid, 'electric-violet', 'Electric Violet', 'An example starting point for a purple, vivid color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#683EA8', 'PLA', 'basic', 'Filament re-extruder', '{purple,vivid,cosplay}', true, now() - interval '23 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-electric-violet-s1', md5('spoolshare-example-electric-violet')::uuid, 0, 'Blend', 'Electric Violet', 'Combine 3:1 (75% Purple, 25% Magenta). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-electric-violet-s1-in0', 'ex-electric-violet-s1', 0, 'bambu-pla-basic-purple', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-electric-violet-s1-in1', 'ex-electric-violet-s1', 1, 'bambu-pla-basic-magenta', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-electric-violet')::uuid, 'bambu-pla-basic-purple', 0.75);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-electric-violet')::uuid, 'bambu-pla-basic-magenta', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'arctic-ice') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-arctic-ice')::uuid, 'arctic-ice', 'Arctic Ice', 'An example starting point for a blue, pastel color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#6FCCE5', 'PLA', 'basic', 'Filament re-extruder', '{blue,pastel,cool}', true, now() - interval '24 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-arctic-ice-s1', md5('spoolshare-example-arctic-ice')::uuid, 0, 'Blend', 'Arctic Ice', 'Combine 10:1:1 (83.3% Jade White, 8.3% Cyan, 8.3% Turquoise). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-arctic-ice-s1-in0', 'ex-arctic-ice-s1', 0, 'bambu-pla-basic-jade-white', null, 10);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-arctic-ice-s1-in1', 'ex-arctic-ice-s1', 1, 'bambu-pla-basic-cyan', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-arctic-ice-s1-in2', 'ex-arctic-ice-s1', 2, 'bambu-pla-basic-turquoise', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-arctic-ice')::uuid, 'bambu-pla-basic-jade-white', 0.833333);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-arctic-ice')::uuid, 'bambu-pla-basic-cyan', 0.083333);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-arctic-ice')::uuid, 'bambu-pla-basic-turquoise', 0.083333);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'brick-red') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-brick-red')::uuid, 'brick-red', 'Old Brick', 'An example starting point for a red, earthy color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#A73E39', 'PLA', 'basic', 'Filament re-extruder', '{red,earthy,architecture}', true, now() - interval '25 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-brick-red-s1', md5('spoolshare-example-brick-red')::uuid, 0, 'Blend', 'Old Brick', 'Combine 3:2:1 (50% Red, 33.3% Brown, 16.7% Gray). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-brick-red-s1-in0', 'ex-brick-red-s1', 0, 'bambu-pla-basic-red', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-brick-red-s1-in1', 'ex-brick-red-s1', 1, 'bambu-pla-basic-brown', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-brick-red-s1-in2', 'ex-brick-red-s1', 2, 'bambu-pla-basic-gray', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-brick-red')::uuid, 'bambu-pla-basic-red', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-brick-red')::uuid, 'bambu-pla-basic-brown', 0.333333);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-brick-red')::uuid, 'bambu-pla-basic-gray', 0.166667);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'pistachio-cream') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-pistachio-cream')::uuid, 'pistachio-cream', 'Pistachio Cream', 'An example starting point for a green, pastel color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#83DF70', 'PLA', 'basic', 'Filament re-extruder', '{green,pastel}', true, now() - interval '26 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-pistachio-cream-s1', md5('spoolshare-example-pistachio-cream')::uuid, 0, 'Yellow-Green Base', 'Lime Base', 'Combine 1:1 (50% Bambu Green, 50% Yellow). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-pistachio-cream-s1-in0', 'ex-pistachio-cream-s1', 0, 'bambu-pla-basic-bambu-green', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-pistachio-cream-s1-in1', 'ex-pistachio-cream-s1', 1, 'bambu-pla-basic-yellow', null, 1);
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-pistachio-cream-s2', md5('spoolshare-example-pistachio-cream')::uuid, 1, 'Cream', 'Pistachio Cream', 'Combine 1:3:1 (20% Lime Base, 60% Jade White, 20% Beige). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-pistachio-cream-s2-in0', 'ex-pistachio-cream-s2', 0, null, 'ex-pistachio-cream-s1', 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-pistachio-cream-s2-in1', 'ex-pistachio-cream-s2', 1, 'bambu-pla-basic-jade-white', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-pistachio-cream-s2-in2', 'ex-pistachio-cream-s2', 2, 'bambu-pla-basic-beige', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-pistachio-cream')::uuid, 'bambu-pla-basic-jade-white', 0.6);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-pistachio-cream')::uuid, 'bambu-pla-basic-beige', 0.2);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-pistachio-cream')::uuid, 'bambu-pla-basic-bambu-green', 0.1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-pistachio-cream')::uuid, 'bambu-pla-basic-yellow', 0.1);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'graphite-blue') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-graphite-blue')::uuid, 'graphite-blue', 'Graphite Blue', 'An example starting point for a dark, blue color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#35353C', 'PETG', 'basic', 'Filament re-extruder', '{dark,blue,functional}', true, now() - interval '27 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-graphite-blue-s1', md5('spoolshare-example-graphite-blue')::uuid, 0, 'Blend', 'Graphite Blue', 'Combine 3:1 (75% Black, 25% Blue). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-graphite-blue-s1-in0', 'ex-graphite-blue-s1', 0, 'bambu-petg-hf-black', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-graphite-blue-s1-in1', 'ex-graphite-blue-s1', 1, 'bambu-petg-hf-blue', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-graphite-blue')::uuid, 'bambu-petg-hf-black', 0.75);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-graphite-blue')::uuid, 'bambu-petg-hf-blue', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'flamingo') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-flamingo')::uuid, 'flamingo', 'Flamingo', 'An example starting point for a pink, vivid color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#F35085', 'PLA', 'basic', 'Filament re-extruder', '{pink,vivid}', true, now() - interval '28 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-flamingo-s1', md5('spoolshare-example-flamingo')::uuid, 0, 'Blend', 'Flamingo', 'Combine 2:1:1 (50% Pink, 25% Magenta, 25% Jade White). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-flamingo-s1-in0', 'ex-flamingo-s1', 0, 'bambu-pla-basic-pink', null, 2);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-flamingo-s1-in1', 'ex-flamingo-s1', 1, 'bambu-pla-basic-magenta', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-flamingo-s1-in2', 'ex-flamingo-s1', 2, 'bambu-pla-basic-jade-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-flamingo')::uuid, 'bambu-pla-basic-pink', 0.5);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-flamingo')::uuid, 'bambu-pla-basic-magenta', 0.25);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-flamingo')::uuid, 'bambu-pla-basic-jade-white', 0.25);
end if;
end $ex$;

do $ex$ begin
if not exists (select 1 from recipes where slug = 'wisteria-dream') then
insert into recipes (id, slug, name, description, author_id, status, result_hex, material, finish, mixing_method, tags, is_example, created_at, updated_at) values (md5('spoolshare-example-wisteria-dream')::uuid, 'wisteria-dream', 'Wisteria Dream', 'An example starting point for a lavender, purple color. The swatch color shown is a calculated prediction. Print it and post your result to make it a tested recipe.', '00000000-0000-4000-8000-000000000001', 'published', '#9072CF', 'PLA', 'basic', 'Filament re-extruder', '{lavender,purple,pastel}', true, now() - interval '29 hours', now());
insert into recipe_stages (id, recipe_id, position, name, output_name, instructions) values ('ex-wisteria-dream-s1', md5('spoolshare-example-wisteria-dream')::uuid, 0, 'Blend', 'Wisteria', 'Combine 3:1:1 (60% Lilac Purple, 20% Purple, 20% Jade White). Purge until the extrudate is uniform with no streaks before judging the color.');
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-wisteria-dream-s1-in0', 'ex-wisteria-dream-s1', 0, 'bambu-pla-matte-lilac-purple', null, 3);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-wisteria-dream-s1-in1', 'ex-wisteria-dream-s1', 1, 'bambu-pla-basic-purple', null, 1);
insert into stage_inputs (id, stage_id, position, filament_id, source_stage_id, parts) values ('ex-wisteria-dream-s1-in2', 'ex-wisteria-dream-s1', 2, 'bambu-pla-basic-jade-white', null, 1);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-wisteria-dream')::uuid, 'bambu-pla-matte-lilac-purple', 0.6);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-wisteria-dream')::uuid, 'bambu-pla-basic-purple', 0.2);
insert into recipe_composition (recipe_id, filament_id, fraction) values (md5('spoolshare-example-wisteria-dream')::uuid, 'bambu-pla-basic-jade-white', 0.2);

end if;
end $ex$;