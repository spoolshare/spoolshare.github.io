-- ============================================================================
-- SpoolShare migration 003: run once after 002.
--  * "Multi-Color Filament Mixer" mixing method (the mixer by jetpad on MakerWorld)
--  * recipes.print_ideas  — optional "Looks great on" ideas / external model links
--  * reproductions.object_photos — photos of real objects printed with the color
--  * save_recipe() now stores print ideas
--  * Bambu Lab-only catalog
-- ============================================================================

alter type mixing_method add value if not exists 'Multi-Color Filament Mixer';

alter table recipes add column if not exists print_ideas jsonb not null default '[]';
alter table reproductions add column if not exists object_photos jsonb not null default '[]';

-- External links must be http(s); titles are required and short.
alter table recipes drop constraint if exists recipes_print_ideas_check;
alter table recipes add constraint recipes_print_ideas_check check (
  jsonb_typeof(print_ideas) = 'array' and jsonb_array_length(print_ideas) <= 12
);

create or replace function save_recipe_print_ideas(p_recipe uuid, p_ideas jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare idea jsonb;
begin
  if not exists (select 1 from recipes where id = p_recipe and author_id = auth.uid()) then
    raise exception 'Not your recipe.';
  end if;
  for idea in select * from jsonb_array_elements(coalesce(p_ideas, '[]')) loop
    if coalesce(trim(idea->>'title'), '') = '' then raise exception 'Each print idea needs a title.'; end if;
    if nullif(idea->>'url', '') is not null and (idea->>'url') !~* '^https?://' then
      raise exception 'Print idea links must start with http:// or https://';
    end if;
  end loop;
  update recipes set print_ideas = coalesce(p_ideas, '[]') where id = p_recipe;
end $$;
revoke execute on function save_recipe_print_ideas(uuid, jsonb) from anon;

-- Bambu Lab-only catalog: remove other brands that nothing references yet.
delete from filaments f
where f.manufacturer_id <> 'bambu' and not f.is_custom
  and not exists (select 1 from stage_inputs s where s.filament_id = f.id)
  and not exists (select 1 from recipe_composition c where c.filament_id = f.id);
delete from product_lines l where l.manufacturer_id <> 'bambu' and not exists (select 1 from filaments f where f.product_line_id = l.id);
delete from manufacturers m where m.id <> 'bambu' and not exists (select 1 from product_lines l where l.manufacturer_id = m.id);
