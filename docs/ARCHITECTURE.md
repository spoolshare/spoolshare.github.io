# SpoolShare — Architecture & Product Plan

> **Mix a color. Share the recipe.**
> A community database of *physically tested* mixed-filament color recipes.

The core value is **real people + real filament + real printed swatches + reproducible recipes**.
Anything calculated is a secondary, clearly labeled aid, never the product itself.

---

## 1. Information architecture

```
SpoolShare
├── Explore (/)                     hero + target color picker + curated rails
├── Search (/search)                full faceted search: color, HEX, ΔE, brand, material,
│                                   stages, creator, trust, "only what I can make", sort
├── Color Matcher (/match)          pick a target → ranked community-tested matches (ΔE2000)
│                                   + optional CALCULATED / UNTESTED prediction from my inventory
├── My Filaments (/filaments)       inventory management + catalog browser
│   └── Filament detail (/filament/:id)   catalog entry + every recipe that uses it
├── Create Recipe (/create)         8-step wizard, autosaved drafts (/create/:draftId)
├── Recipe (/r/:slug)               the detail page
│   ├── Make This Color (/r/:slug/make)        guided, checkable step-by-step mode
│   └── I Made This (/r/:slug/reproduce)       reproduction submission
├── Compare (/compare?ids=a,b,c)    side-by-side recipe comparison + slider
├── Profile (/u/:username)          recipes, reproductions, stats, achievements, public inventory
├── Saved (/saved)                  favorites + named collections + recently viewed
├── Notifications (/notifications)
├── Settings (/settings)            profile, privacy (inventory visibility), theme, units
└── Auth (/signin, /signup)
```

Global chrome:

* **Top nav (desktop):** logo · Explore · My Filaments · Color Matcher · Create · search · inventory toggle · notifications · avatar menu
* **Inventory panel:** a slide-over panel on desktop, a bottom sheet on mobile. "My Filaments" is reachable from *any* page because it changes what every page shows.
* **Mobile:** compact top bar (logo, search, avatar) plus a 5-item bottom tab bar (Explore · Match · Create · Filaments · Saved).

---

## 2. Domain model

All types live in `src/types/`. The Postgres schema (`supabase/schema.sql`) mirrors them 1:1.

### Filament catalog (manufacturer data)

| entity        | key fields |
|---------------|------------|
| `Manufacturer`| id, name, website |
| `ProductLine` | id, manufacturerId, name ("PLA Basic"), material, finish default |
| `Filament`    | id, productLineId, manufacturerId, material, colorName, colorCode (mfr SKU code), hex, finish, transparency, tdValue?, notes, verifiedHex (bool: hex measured by community vs. marketing value) |

`Material`: PLA, PLA+, PETG, ABS, ASA, TPU, PC, Nylon, Other
`Finish`: basic, matte, silk, metallic, translucent, glow, wood, marble, sparkle, carbon-fiber, dual-color
`Transparency`: opaque, semi, translucent, clear

> ⚠️ A filament's `hex` is a **display approximation**. It is never treated as a physical truth for mixing.

### Inventory

`InventoryItem`: id, userId, filamentId, quantity (spools, optional), remainingGrams?, photo?, notes, addedAt.
A **custom** inventory item (a filament not in the catalog) is a user-scoped `Filament` with `isCustom = true`.

### Recipes (the heart)

```
Recipe
 ├── meta: id, slug, name, description, authorId, createdAt, updatedAt, status (draft|published|hidden)
 ├── result: resultHex (creator-measured), photos[] (alt text required), lighting notes
 ├── print context: material, finish, printer?, nozzle?, mixingMethod, layerHeight?, tags[]
 ├── stages: Stage[]            (ordered; a stage may consume outputs of EARLIER stages only → DAG)
 └── derived (never stored as truth, recomputed): finalComposition, difficulty, trust, canMake
Stage
 ├── id, name ("Create Light Blue"), outputName ("Light Blue Intermediate")
 ├── inputs: StageInput[]   ← { source: {kind:'filament', filamentId} | {kind:'stage', stageId}, parts: number }
 ├── batchGrams?            (how much the creator made)
 ├── instructions (markdown-lite), photos[]
```

**Ratios are stored as `parts`** (any positive number). Percentages and integer load counts are
*derived*, so `3:1`, `75%/25%`, and `0.75/0.25` all describe the same stage, and editing in
any representation round-trips safely.

The final stage is the output. The **true final composition** is computed by recursively
flattening intermediates. For example, Dusty Purple:

```
S1 = 75% Jade White + 25% Cobalt Blue
S2 = 50% Jade White + 25% Red + 25% S1
⇒ Jade White 68.75% · Red 25% · Cobalt Blue 6.25%
```

The **gram planner** works backwards from a target mass, `need(stage) = Σ consumers share × need(consumer)`,
so it can tell you to make 2.5 g of Light Blue for a 10 g batch. It also supports an optional
waste/purge allowance (%), which scales every stage.

### Community

| entity          | notes |
|-----------------|-------|
| `User`/`Profile`| username, displayName, avatar (hue-seeded fallback), bio, location, printers[], inventoryVisibility (public / private), joinedAt |
| `Reproduction`  | recipeId, userId, resultHex, photos[], printer, substitutions[] (filament swaps used), notes, accuracyRating 1–5, createdAt. **ΔE00 vs. original is derived.** |
| `Favorite`      | userId, recipeId, collectionId? |
| `Collection`    | userId, name, description, isPublic |
| `Comment`       | recipeId, userId, parentId?, body, createdAt |
| `Follow`        | followerId, followeeId |
| `Report`        | targetType (recipe/comment/reproduction/user), targetId, reason, details, status (open/reviewing/resolved) |
| `Notification`  | userId, kind (reproduced / commented / followed / favorited), actorId, targetId, read |

---

## 3. Color science (`src/lib/color/`)

* **Conversions:** sRGB ↔ linear RGB ↔ XYZ (D65) ↔ CIELAB ↔ LCh, plus HSV for the picker.
* **Distance:** **CIEDE2000 (ΔE00)** for all ranking, matching, and reproduction agreement.
  Bands: ≤ 2 near-identical, ≤ 5 close match, ≤ 10 noticeable, > 10 different.
  Photos add measurement noise, so the UI always says "measured from photo".
* **Community average color:** averaged in **CIELAB**, not RGB, with a ΔE-spread (consistency) figure.
* **Photo HEX estimation:** sample the center region (or a user-clicked point) and take a
  *trimmed median* in Lab, which rejects specular highlights and shadows. The user can always override it.
* **Prediction (CALCULATED / UNTESTED):** single-constant **Kubelka–Munk** per sRGB channel
  on linearized reflectance (K/S mixed by weight), which is a better pigment model than averaging HEX.
  The inverse "suggest a mix from my inventory" does a coarse-to-fine search over 1–3 owned filaments
  to minimize ΔE00, then snaps to friendly ratios. Every output is badged **🧮 Calculated / Untested**.

## 4. Trust model (`src/lib/recipe/trust.ts`)

| badge | rule |
|-------|------|
| 🧮 Calculated / Untested | generated by the predictor; no physical swatch |
| 🧪 Tested | published by its creator with a photographed swatch (1 data point) |
| ✓ Reproduced | ≥ 1 independent reproduction within ΔE00 ≤ 5 |
| ✓✓ Highly Reproduced | ≥ 5 close reproductions **and** ≥ 80 % close-match rate |

We never claim "verified" from a single upload. Confidence grows with independent reproductions.

## 5. Data access layer (`src/lib/api/`)

```
SpoolShareApi (interface, async, typed)   ← all UI goes through this
 ├── mock adapter     localStorage-persisted, seeded, simulated latency   (default)
 └── supabase adapter (future) uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
```

* UI never imports the mock DB directly; it uses `api.*` via the `useQuery` / `useMutation` hooks.
* The adapter is selected in `src/lib/api/index.ts` based on env vars.
* **No secrets in frontend code.** The Supabase *anon* key is designed to be public;
  security comes from Row-Level Security policies in `supabase/schema.sql`. Anything privileged
  (moderation actions, image processing) belongs in Supabase Edge Functions.
* Photos: mock = downscaled data URLs; Supabase = Storage bucket `swatches/` with per-user paths.

## 6. Component system (`src/components/`)

```
ui/        Button, IconButton, Badge, Card, Input, Textarea, Select, Switch, SegmentedControl,
           Tabs, Dialog, Sheet, Menu, Tooltip, Skeleton, EmptyState, Avatar, Toast, Field
color/     ColorPicker (SV plane + hue + HEX/RGB/name), HexChip (copy), ColorDot, SwatchImage
           (procedural printed-swatch render when no photo), CompareSlider, DeltaEMeter
filament/  SpoolIcon, FilamentRow, FilamentChipList, FilamentPicker (catalog search dialog),
           InventoryPanel (slide-over / bottom sheet)
recipe/    RecipeCard, RecipeRail, TrustBadge, CanMakeBadge, StageFlow (SVG flow diagram),
           CompositionBar, GramPlanner, RatioEditor, ReproductionStats, ReproductionCard
layout/    AppShell, TopNav, MobileTabBar, Footer, PageHeader
```

Design tokens are CSS variables in `src/styles/index.css` (light + dark), consumed through Tailwind v4 `@theme`.
Accessibility: every color is shown with HEX text, every status has an icon and a label, all controls are
keyboard reachable, dialogs trap focus, and photos require alt text.

## 7. Roadmap after v0.1

1. Supabase adapter + auth (email magic link + OAuth) + storage
2. Moderation queue UI for reports, plus rate limits via Edge Functions
3. Server-side color index (Lab columns plus a cube index) so ΔE queries scale
4. Calibration card: photograph swatches next to a printed gray card to correct white balance
5. Filament catalog contributions with community-measured HEX values
