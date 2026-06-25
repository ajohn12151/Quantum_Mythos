# CLAUDE.md — Aegis Front End

> Quantum Cryptographic Posture Management UI.
> **Read this file fully before doing any front-end work in this directory.** It is the contract for how UI gets built here, including which skills and MCP servers must be used and when.

---

## 0. Golden rules (always apply)

1. **Never hand-write a component that a skill or MCP can produce better.** For any UI work, the default path is: **shadcn MCP / Magic MCP for the parts → a design skill for the taste → verify in the running app.** Writing raw JSX from scratch is the fallback, not the first move.
2. **Always pull design judgment from the design skills** (`ui-ux-pro-max` and `frontend-design`) before laying out a new screen, section, or visual component. Don't improvise spacing, color, or typography — derive it from the skill output plus the tokens in `src/styles.css`.
3. **Always install shadcn primitives through the shadcn MCP**, never by copy-pasting component source. This repo is already a shadcn "new-york" project (`components.json`).
4. **Always verify visually.** After a meaningful UI change, run the app and look at it (`/run`, `/verify`, and the `screenshot` skill). A change isn't done until it's been seen rendering.
5. **Stay on-brand — "Frosted Aura".** Aegis is _calm, precise, glassmorphic — ONE light theme across the whole site (marketing **and** the product app; no dark scopes). A frosted-white canvas with translucent blurred **glass** panels and soft slate-blue auras. Solid **slate-blue (`#5C7E8F`)** for interaction; a frosted **slate→pale-blue** gradient reserved for brand moments. Bricolage Grotesque display + Inter body + JetBrains Mono for technical data._ Semantic status stays **muted** red (Shor-broken) / amber (Grover-weakened) / green (quantum-safe), used only where status semantics need it — everything else follows the frosted slate palette. Every UI decision should reinforce that.
6. **Restraint = premium.** Signature accents (`glass`, `bg-gradient-mesh` aura, `gradient-border`, `glow`, `text-gradient`) appear **at most once per viewport**. Everything else stays quiet: clean `surface`/`card-premium`/`glass` cards, hairline borders, generous whitespace. **No rainbow/multi-color gradients ever; no gradient-on-every-button** (primary CTAs are solid slate-blue). This is what keeps it $100M-pro instead of AI-slop.

---

## 1. Stack (what's actually here)

| Area       | Choice                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| Framework  | **TanStack Start** (SSR) + **TanStack Router** (file-based) + **TanStack React Query**                   |
| Build      | **Vite 8** via `@lovable.dev/vite-tanstack-config`                                                       |
| React      | **React 19** (`rsc: false` — these are client/SSR components, **not** RSC)                               |
| Language   | **TypeScript** (strict), `.tsx`                                                                          |
| Styling    | **Tailwind CSS v4** (CSS-first, `@theme inline` in `src/styles.css` — there is **no `tailwind.config`**) |
| Components | **shadcn/ui** (new-york style, slate base, lucide icons) in `src/components/ui`                          |
| Animation  | **framer-motion**                                                                                        |
| Forms      | **react-hook-form** + **zod** + `@hookform/resolvers`                                                    |
| Charts     | **recharts** (+ shadcn `chart.tsx` wrapper)                                                              |
| Toasts     | **sonner**                                                                                               |
| Backend    | **Supabase** (`@supabase/supabase-js`) via `src/integrations/supabase`                                   |
| Fonts      | Inter Variable (sans), JetBrains Mono Variable (mono) — already imported                                 |

### Vite config is locked

`vite.config.ts` uses `@lovable.dev/vite-tanstack-config`, which **already includes** tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro, the `@` alias, env injection, and dedupe. **Do not** add those plugins manually or the app breaks with duplicates. Extend only via `defineConfig({ vite: { ... } })`.

---

## 2. Directory map

```
src/
  routes/                  # TanStack file-based routes
    __root.tsx             # root layout
    index.tsx              # marketing home
    login.tsx / signup.tsx / pricing.tsx / how-it-works.tsx
    _authenticated/        # auth-gated route group
      route.tsx            # guard + shell
      app/                 # the product app screens
  components/
    ui/                    # shadcn primitives — MANAGED VIA shadcn MCP, avoid manual edits
    app/                   # product chrome: AppShell, PageHeader, StatusBadge
    marketing/             # MarketingHeader/Footer, QuantumBackground
  hooks/                   # use-mobile, etc.
  integrations/
    supabase/              # client.ts, client.server.ts, auth-middleware, auth-attacher, types
    lovable/
  lib/                     # utils (cn), mock-data, error handling
  styles.css               # Tailwind v4 theme + all design tokens
```

### Path aliases (from `components.json` / tsconfig)

`@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`. Always import via `@/…`, never deep relative paths.

---

## 3. Design tokens & brand (source of truth: `src/styles.css`)

**The app is ONE light "Frosted Aura" theme** (no dark scopes — `.theme-dark`/`.section-dark` were removed). Everything reads the light `:root` tokens. Use **CSS variables / Tailwind theme tokens**, never raw hex. Key tokens beyond the shadcn defaults:

- **Frosted neutrals (cool):** background is a frosted-white `oklch(0.98 0.005 235)`; foreground is deep slate ink `oklch(0.29 0.018 240)`; surfaces step toward the pale blue-gray `#D4DDE2`.
- `--primary` — **solid slate-blue** `oklch(0.5 0.045 235)` (`#5C7E8F` deepened), the interactive color (buttons, links, focus). Not a gradient. Deep enough that white text clears AA.
- `--quantum-cyan`, `--quantum-violet` — the frosted brand pair (**slate → pale-blue**; the `--quantum-violet` token name is kept for zero churn but holds the SLATE pole, `--quantum-cyan` the pale pole). Use via `var(--gradient-quantum)` / `text-gradient` / `bg-quantum` / `bg-gradient-mesh`, **reserved for signature moments**. ⚠️ `--quantum-cyan` is pale — never use it for text (illegible on white); use `--primary` for text accents like eyebrows.
- **Glass is the signature surface.** The strengthened `glass` utility (translucent white + `blur(18px)` + slate hairline) is the default for cards across marketing and the app; `bg-gradient-mesh` provides the soft slate-blue aura (once per viewport).
- **Custom utilities read raw tokens, not `--color-*` aliases.** `surface`/`card-premium`/`gradient-border` use `var(--card)`/`var(--border)` directly (Tailwind's `@theme inline` would otherwise freeze the `--color-*` alias). Follow that pattern for new scope-aware utilities.
- `--shor` (muted red), `--grover` (muted amber), `--pqc` (muted sage-green) — semantic quantum-threat status, harmonized with the cool palette; use the `status-shor`/`status-grover`/`status-pqc` badge utilities.
- `--elevated`, `--elevated-2`, `--card` — layered frosted surfaces.
- Elevation scale: `--shadow-xs/sm/md/card/card-lg/xl` (use via `shadow-[var(--shadow-md)]` etc., or the helper utilities below).
- Radii: `--radius: 0.75rem` with `sm/md/lg/xl/2xl` derived.

**Premium utility classes (defined in `styles.css` — prefer these over ad-hoc styling):**
`surface` / `surface-2` (elevated cards), `glass` (light frosted panel), `card-premium` (soft elevation + inner top-highlight), `lift` (hover-raise interaction — add to clickable/focal cards), `gradient-border` (cyan→violet 1px frame — featured card only, max one per view), `glow`/`glow-cyan` (key moment only), `text-gradient`/`bg-quantum`/`bg-quantum-soft`, `font-display`, `font-mono`, `reveal` (entrance), `grid-bg`/`dot-bg`, `animate-pulse-glow`/`animate-drift`/`animate-scan`.

Typography rule: **Bricolage Grotesque display** for headings (auto-applied to `h1/h2/h3`, or `font-display`); **Inter (`font-sans`) for prose/UI**; **JetBrains Mono (`font-mono`) for technical/data values** (keys, hashes, metrics, algorithm names, IDs).

When adding new semantic colors, add them as tokens in `src/styles.css` `@theme inline` + `:root` — do not inline raw colors in JSX. (One exception: recharts needs colors as `var(--token)` strings passed inline — that's fine and already the pattern in the dashboard.)

## 3a. Motion & media system (marketing — Cluely-grade scroll storytelling)

The marketing pages (`src/routes/index.tsx` especially) are a scroll-driven product story: a **dark cinematic hero → light premium body**. Reusable pieces:

- **`.section-dark`** (`styles.css`) — wrap any section to flip its subtree to a **twilight indigo-slate** palette (mid-dark, not near-black; overrides raw tokens locally; no global dark mode). Used by the hero. It stays cool to complement the cyan/violet glow, and blends into the warm body via a long gradient in the hero's bottom padding (no hard seam).
- **`Reveal`, `Stagger`, `StaggerItem`** (`src/components/marketing/Reveal.tsx`) — scroll-into-view fade-ups (via `useInView` + `animate`, not `whileInView`, so framer's loop is reliably driven on any page). **Reduced-motion safe** (renders visible immediately) and **hydration-safe** (stable element type). Wrap section blocks in `Reveal`; card grids in `Stagger`/`StaggerItem`.
- **`AppWindow`** (`AppWindow.tsx`) — frosted-`glass` chrome frame (traffic-light dots + title) holding animated product mockups; layered depth.
- **`AuroraBackground`** (`AuroraBackground.tsx`) — drifting slate-blue aurora blobs (`animate-aurora`, reduced-motion safe) behind the hero; `intensity="ambient"` for subtle section washes.
- **`SpotlightCard`** (`SpotlightCard.tsx`) — the default focal card: frosted `glass` + cursor-following slate spotlight + `lift`. Prefer it over bare `surface`/`card-premium` for marketing/app focal tiles.
- **Loop beam** — the `Loop` section runs an `animate-beam-travel` + `animate-beam-glow` light beam down a rail through the Discover→…→Verify nodes, with a progress fill driven by the active scroll step.
- **NetworkScan** (`NetworkScan.tsx`) — canvas showpiece: a subdomain constellation with a scan sweep that lights nodes broken(red)/safe(green) then a migration sweep flips red→green. Lives in the `BentoFeatures` hero tile.
- **BentoFeatures** (`BentoFeatures.tsx`) — glass bento grid of capability tiles, each with a micro-animation.
- **CursorGlow** (`CursorGlow.tsx`) — pointer-following blue glow inside a relative parent (hero); off on touch/reduced-motion. **TiltMedia** (`TiltMedia.tsx`) — mouse-follow 3D tilt for hero windows (nest _inside_ framer parallax, not on the same element).
- **Decorative bright blues:** `--blue-electric`/`--blue-bright` + `--gradient-aurora` and `animate-conic-spin`/`grid-drift`/`scan-sweep`/`float-y` are for **auroras/beams/glows/particles only** — never text/UI (which stay muted for AA). Effect layers: bright; content: calm.
- **PageBackdrop** (`PageBackdrop.tsx`) — one faint fixed ambient layer (static dots + two slow transform orbs) behind the whole marketing page; sections are transparent so it shows through subtly. Keep it low-opacity.
- **Readability rule (non-negotiable):** push effects, protect text. Content sits `relative z-10` above `-z-10` effects; over busy areas use the `text-scrim` util (frosted radial behind text) and/or `glass`. Verified: with the brighter aurora, all text still clears WCAG AA over the worst-case orb tint (foreground ~11.5:1, muted body ~6:1). If a new effect drops any text below 4.5:1, dial the effect back or strengthen the scrim — never ship hard-to-read copy.
- **Verifying over animated backgrounds:** screenshots race the always-animating canvases/backdrop. Verify readability **programmatically** — sample token colors and compute OKLCh→sRGB WCAG contrast in `evaluate_script` (see the contrast-probe pattern) — rather than relying only on captures.
- **`Marquee`** (`Marquee.tsx`) — infinite ticker (pauses on hover, reduced-motion-static). Used for the compliance standards row.
- **`useCountUp`** (`src/hooks/use-count-up.ts`) — count-up with `{ start }` trigger (for scroll-into-view) and reduced-motion jump-to-target.
- **Animated product demos are the "media"** (no stock assets): the hero scan terminal self-types; the pinned `Loop` (`useScroll` + `useMotionValueEvent`, 320vh sticky section) steps Discover→Prioritize→Remediate→Verify with the **red→green flip** as the payoff; the Differentiator priority bars fill on scroll.
- **Page wrapper:** marketing pages wrap content in `<MotionConfig reducedMotion="user">`.

**Motion rules:** transform/opacity only; reveals fire once; every animation must be `prefers-reduced-motion` safe — when adding a `motion` element with a hidden `initial`, gate it (`initial={reduce ? <visible> : <hidden>}`) or it can get stuck invisible. **Keep one signature motion moment per viewport** (restraint — same anti-slop rule as the visual system).

> Note: IO-based scroll reveals don't render under headless Edge `--virtual-time-budget` (it doesn't fire IntersectionObserver); verify them in a real browser, and use `--force-prefers-reduced-motion` headless captures to verify content/layout.

---

## 4. Skills — when to invoke each (front-end work)

Invoke these via the Skill tool. Treat them as **mandatory steps**, not optional helpers.

### `ui-ux-pro-max:ui-ux-pro-max` — primary UI/UX brain

Use for **every** plan/build/review of a screen or component: layout, color systems, font pairing, spacing, interaction states, accessibility, charts. It also integrates the shadcn MCP for component search.

- Actions to use it for: **plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check**.
- Invoke it _before_ writing layout code, and again to _review_ after.

### `frontend-design:frontend-design` — aesthetic direction

Use when establishing or reshaping the **visual identity** of new UI: making it look intentional and distinctive (not templated). Pair with `ui-ux-pro-max` — `frontend-design` sets the taste, `ui-ux-pro-max` sets the structure/rules.

### `run` — launch the app

Use to start the dev server and load a screen to confirm a change renders in the real app. First choice for "does this actually work."

### `verify` — prove the change works

Use to run the app and observe behavior after a change (fix/feature), before considering it done.

### `screenshot` — capture the result

Use to grab the rendered screen for visual confirmation and to show the user the result. Run after `/run` brings the app up.

### `code-review` / `simplify`

After a UI change of any size, run `code-review` (correctness) and/or `simplify` (reuse/efficiency/altitude) on the diff before wrapping up.

### Not front-end (don't reach for these for UI): `humanize`, `deep-research`, `gsd:*`, `claude-api`, etc. Use only if separately relevant.

---

## 5. MCP servers — when to use each

### shadcn MCP (configured in `.mcp.json`) — **the only way to add primitives**

Workflow for any shadcn component:

1. `mcp__shadcn__get_project_registries` — confirm registries.
2. `mcp__shadcn__list_items_in_registries` / `mcp__shadcn__search_items_in_registries` — find the component.
3. `mcp__shadcn__view_items_in_registries` + `mcp__shadcn__get_item_examples_from_registries` — read API & usage examples.
4. `mcp__shadcn__get_add_command_for_items` — get the exact `npx shadcn add …` command, then run it.
5. `mcp__shadcn__get_audit_checklist` — run the audit after adding/wiring components.

We already have 46 primitives in `src/components/ui`. **Check there first** — only add via MCP if it's genuinely missing. Don't re-implement an existing primitive.

### Magic MCP (21st.dev) — bespoke / inspired components

Use when you need a richer custom component that isn't a plain shadcn primitive:

- `mcp__magic__21st_magic_component_builder` — generate a new custom component from a description.
- `mcp__magic__21st_magic_component_inspiration` — pull design inspiration before building.
- `mcp__magic__21st_magic_component_refiner` — refine/redesign an existing component's UI.
- `mcp__magic__logo_search` — fetch company/tech logos (e.g. for integrations, marketing).

Rule of thumb: **shadcn MCP for standard primitives, Magic MCP for distinctive/marketing/hero pieces.** Always reconcile Magic output with our tokens (`src/styles.css`) and `cn()` conventions before committing.

> If an MCP tool's schema isn't loaded yet, use ToolSearch (`select:mcp__shadcn__…` / `select:mcp__magic__…`) to load it before calling.

---

## 6. Conventions

- **`cn()` from `@/lib/utils`** for all conditional class merging.
- **CVA** (`class-variance-authority`) for component variants, matching existing `ui/` patterns.
- **Icons:** `lucide-react` only (matches `components.json` `iconLibrary`).
- **Forms:** `react-hook-form` + `zod` schema + `@hookform/resolvers/zod`; use the shadcn `form.tsx` wrapper.
- **Data fetching:** TanStack Query hooks; Supabase via `@/integrations/supabase/client` (browser) or `client.server` (SSR). Don't instantiate ad-hoc Supabase clients.
- **Routes:** add files under `src/routes/…`; auth-gated screens go under `_authenticated/app/`. Let the router plugin generate the tree — don't hand-edit generated route trees.
- **Toasts:** `sonner` (`toast(...)`), the app already mounts `<Toaster />`.
- **Responsive:** mobile-first; use the `use-mobile` hook where breakpoint logic is needed.
- **No new global CSS files** — extend `src/styles.css` tokens/`@theme`.

---

## 7. Standard workflow for a front-end task

1. **Understand & design** → invoke `ui-ux-pro-max` (structure/UX) and `frontend-design` (aesthetics). Map it to our tokens & brand (§3).
2. **Source components** → existing `src/components/ui` first; else **shadcn MCP** (primitives) or **Magic MCP** (bespoke).
3. **Build** → compose with `cn()`, CVA, tokens, lucide, framer-motion. Keep mono-for-data / sans-for-prose.
4. **Run & see it** → `/run`, then `screenshot` to confirm it renders correctly in dark mode and responsively.
5. **Verify** → `/verify` the behavior; check forms, auth gating, query states (loading/empty/error).
6. **Review** → `/code-review` (+ `/simplify`) on the diff; run shadcn MCP `get_audit_checklist` if components were added.
7. Run `npm run lint` / `npm run format` before finishing.

## 8. Commands

```
npm run dev      # vite dev server  (use via /run)
npm run build    # production build
npm run preview  # preview prod build
npm run lint     # eslint
npm run format   # prettier --write
```

---

**Definition of done for any UI change:** on-brand, built from skills+MCPs (not improvised), seen rendering via screenshot, verified behaving, lint-clean, and reviewed.
