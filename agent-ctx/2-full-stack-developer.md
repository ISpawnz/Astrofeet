# Task 2 — ProductsView

**Agent**: full-stack-developer
**Task**: Build ProductsView (filterable product grid)

## File produced
- `src/components/views/ProductsView.tsx` (~555 lines, single client component)

## What it does
Premium product listing page for the Astrofeet e-commerce SPA, rendered inside
the `/` route when `view === "products"`.

Features:
- **Header**: eyebrow "Catálogo" + gradient title "Escolha seu drop" + subtitle
  (animated entrance with framer-motion).
- **Search bar**: debounced text input (~300ms) with lucide `Search` icon and
  clear button.
- **Filters**:
  - Categoria — chip list (derived from facets query + "Todos")
  - Marca — chip list (derived from facets query + "Todas")
  - Tamanho — single-select numeric chips 36–44
  - Preço — dual-thumb shadcn `Slider` (0–R$2.000, step 50) with formatted
    R$ display; commits to filter state on release (no refetch spam)
  - "Limpar filtros" button to reset everything
- **Sort**: shadcn `Select` (Novidades / Menor preço / Maior preço /
  Melhor avaliação).
- **Results count**: "X modelos encontrados".
- **Grid**: `grid grid-cols-2 gap-4 lg:grid-cols-3` of existing `ProductCard`
  next to a sticky `lg:col-span-1` sidebar (`lg:grid-cols-[260px_1fr]`).
- **Loading**: 6 skeleton cards mirroring ProductCard layout.
- **Empty / Error state**: friendly EmptyState component with action button.
- **Mobile**: filters collapse into a left-side `Sheet` slide-over reusing the
  same FiltersPanel; trigger button shows "Filtros" + count CTA.

## Contracts used
- `useUIStore(s => s.params)` — initializes category, q, sort, size, min, max
  and preserves featured/bestSeller flags from incoming params.
- `api.products(params)` — `useQuery` with queryKey derived from a memoized
  `apiParams` object so any filter change refetches.
- A separate facets query (`api.products({ sort: "newest" })`, staleTime 5m)
  derives distinct categories & brands for stable filter lists.
- `ProductCard` handles click-to-detail (`navigate("product", { id: slug })`)
  and quick-add internally.
- `formatPrice` for BRL formatting.
- shadcn ui: button, input, select, sheet, slider, skeleton.

## Design conventions
- Dark cosmic theme; transparent background (GalaxyBackground is global).
- Panels use `border-white/10` + `bg-white/[0.03]` + `backdrop-blur`.
- Brand neons as CSS vars (`--neon-cyan`, `--neon-violet`) — no indigo/blue.
- Active chip state: `border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10
  text-[var(--neon-cyan)]`.
- Rounded-2xl/3xl corners, generous padding (p-5/p-6), touch targets ≥40px.
- All text in Portuguese (pt-BR); no technical jargon.

## Verification
- Ran `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` and
  filtered for `ProductsView` — **zero TypeScript errors in this file**.
  (Other repo-wide errors come from the still-pending `next` package install
  and are unrelated to this component.)
- Did not modify any other files; did not create new routes/pages; no tests
  written (per instructions).
