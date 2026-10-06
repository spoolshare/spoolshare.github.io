# SpoolShare

**Mix a color. Share the recipe.**

SpoolShare is a community database of *physically tested* mixed-filament color recipes for 3D printing.
Makers track the filament they own, find community recipes they can make right now, follow
multi-stage mixing instructions, and upload reproductions so everyone can see which recipes reliably produce the same color.

> Real people + real filament + real printed swatches + reproducible recipes.
> Calculated predictions exist, but they are always labeled **Calculated / Untested**.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # recipe math + color science unit tests
npm run build        # type-check + production build into dist/
```

With no environment variables the app runs on a **mock backend** that is seeded with a catalog of
~120 filaments across 8 brands, 10 makers, 30 recipes, and their reproductions. Everything persists to `localStorage`.
First-time visitors are signed in as **Demo Maker** (`demo@spoolshare.app` / `demo`).
Settings → *Reset demo data* restores the seed.

## Deploying to GitHub Pages

1. Push to a GitHub repo (`main` branch).
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` tests, builds with the right base path
   (`/<repo-name>/`), and publishes. `dist/404.html` is a copy of `index.html`, so deep links like
   `/r/dusty-purple` work.

## Connecting Supabase

The app uses Supabase automatically when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
(in `.env.local` locally, and as repository **variables** for the GitHub Pages build). Add `?backend=mock` to any
URL to use the local demo data instead for that browser tab.

Run these in the Supabase **SQL Editor**, in this order:

1. `supabase/schema.sql`: tables, row-level security, triggers, the `swatches` storage bucket
2. `supabase/seed.sql`: the filament catalog (8 brands, 125 filaments)
3. `supabase/migrations/002_app_functions.sql`: admin role, profile-on-signup, `save_recipe`, members list
4. `supabase/seed_examples.sql`: 30 official example recipes under the **SpoolShare** account. Their colors are
   calculated predictions, so they show as *Calculated / Untested* until someone reproduces them.

Then sign up in the app and make yourself admin:

```sql
update profiles set role = 'admin' where username = 'your-username';
```

The admin-only **Members** page is at `/admin/members` (also in the avatar menu).

**Never** put the `service_role` / secret key in any `VITE_` variable or in frontend code.

## Project layout

```
docs/ARCHITECTURE.md      information architecture, data model, color science, trust model
supabase/schema.sql       production schema with row-level security
src/
  types/                  domain model (Filament, Recipe, Stage, Reproduction, …)
  lib/
    color/                sRGB↔Lab, CIEDE2000, Kubelka–Munk prediction, photo sampling, color names
    recipe/               multi-stage flattening, gram planner, ratios, trust levels, can-make
    api/                  SpoolShareApi interface + mock adapter (seeded, localStorage)
    hooks/                useQuery cache, session, inventory, favorites, preferences
  components/
    ui/                   design-system primitives (Button, Dialog, Sheet, Menu, Field, …)
    color/                ColorPicker, SwatchVisual, HexChip, CompareSlider, DeltaEMeter
    filament/             SpoolIcon, FilamentCatalog, InventoryPanel
    recipe/               RecipeCard, StageFlow, CompositionBar, CanMakeBanner, PhotoUploader
    layout/               AppShell, TopNav, mobile tab bar
  features/               one folder per page/route
```

## Color science, briefly

* Matching uses **CIEDE2000** in CIELAB, never RGB distance. Bands: ≤2 near-identical, ≤5 close, ≤10 noticeable.
* Community averages are computed in **Lab**.
* Predictions use a single-constant **Kubelka–Munk** pigment model on linear RGB. It's better than averaging HEX,
  but it ignores brand pigment loading and translucency, so it's labeled untested.
* Photo HEX estimation takes a glare-resistant trimmed median in Lab, and the user can always override it.
