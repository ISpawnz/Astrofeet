# CRON-7B — full-stack-developer

## Task
Build the stock-alert subscription UI in two existing view files:

1. `src/components/views/ProductDetailView.tsx` — replace the old "sold out"
   line with a glass `StockAlertBanner` (Bell icon, amber/violet accent, rose
   "Produto esgotado" title) that lets a logged-in user subscribe to a
   back-in-stock alert, plus a tiny `LowStockHint` under the size selector
   for sizes with ≤2 units left.
2. `src/components/views/AccountView.tsx` — add a 5th "Alertas" tab with a
   `StockAlertsTab` showing the user's subscribed products (image, name,
   stock badge, in-stock → "Ver produto" + "Remover alerta"; out-of-stock →
   "Remover alerta" only) plus loading/empty/footer counter states.

## Pre-flight
- Read `/home/z/my-project/worklog.md` (architecture, design system, prior
  CRON entries).
- Read `ProductDetailView.tsx` (1159 lines) + `AccountView.tsx` (2004 lines)
  end-to-end to map imports, the `Info` component layout, the
  `NotificationsTab` pattern to mirror, the `TabsList`/`TabsContent` wiring,
  and the existing per-size stock helpers.
- Read `src/lib/client.ts` — confirmed `api.listStockAlerts()`,
  `api.subscribeStockAlert(id)`, `api.unsubscribeStockAlert(id)`,
  `api.products({ ids: "a,b,c" })` already exist.
- Read `src/lib/types.ts` — `Product.sizeStock?: Record<string, number>`
  optional; `Product.slug` for navigation; `PublicUser.email` for prefill.
- Read `src/lib/format.ts` — `formatPrice` available (not actually used in
  the alert tab — only stock badge + buttons needed).
- Read `src/stores/ui.ts` — `openAuth(mode)` + `navigate(view, params)`.
- Read `src/stores/auth.ts` — `user`, `hydrated` available.
- Verified backend `/api/products?ids=` filter at
  `src/app/api/products/route.ts:22-30` — supports comma-separated IDs.

## Implementation

### ProductDetailView.tsx
- Added `Bell`, `BellOff` to lucide-react imports.
- Added `isProductOutOfStock(product)` helper — `sizeStock` all ≤0 OR global
  `stock` ≤0 when `sizeStock` is absent.
- Added `StockAlertBanner({ product })` glass sub-component:
  - amber radial + violet glow, Bell icon, rose "Produto esgotado" +
    "Avise-me quando voltar ao estoque" subtitle.
  - `useQuery(["stock-alerts"], api.listStockAlerts, { enabled: !!user })`
    drives three states:
    1. subscribed → lime "Inscrito" pill (Check icon) + outline
       "Cancelar inscrição" button (BellOff icon, Loader2 while pending)
       → `api.unsubscribeStockAlert` + invalidate + toast
       "Inscrição cancelada."
    2. not logged in → "Faça login para ser avisado." + gradient "Entrar"
       button → `openAuth("login")`.
    3. logged in & not subscribed → email Input prefilled from
       `user.email` (useEffect) + amber→violet "Avise-me" button
       → `api.subscribeStockAlert` + invalidate + toast "Você será avisado
       quando este sneaker voltar ao estoque!".
- Added `LowStockHint({ product, count })` sub-component:
  - `useQuery(["stock-alerts"])` for subscription state.
  - subscribed → lime "Alerta ativo para este sneaker." with Check icon.
  - not subscribed → amber "Estoque baixo neste tamanho — apenas N
    unidades." + small Bell-link "Avise-me se esgotar antes." that calls
    `api.subscribeStockAlert` (or `openAuth("login")` if logged out) +
    toast "Você será avisado se este sneaker esgotar antes!".
- Wired both into the `Info` panel: replaced the old "Este modelo está
  temporariamente esgotado." `<p>` with `{isProductOutOfStock(product) &&
  <StockAlertBanner .../>}` and the old "Apenas X unidades neste tamanho.
  Corra!" block with `{...eff <= 2 && eff > 0 ? <LowStockHint .../> : null}`.
- Added `const soldOut = isProductOutOfStock(product);` to `Info` and
  switched the "Adicionar ao carrinho" / "Comprar agora" buttons from
  `disabled={product.stock === 0}` to `disabled={soldOut}` — more accurate
  for products with `sizeStock`.

### AccountView.tsx
- Added `BellOff` to lucide-react imports.
- Added `Product` to the `import type {...} from "@/lib/types"` line.
- Added `StockAlertsTab` sub-component (mirrors `NotificationsTab`'s
  structure):
  - Header: "Meus alertas de estoque" + subtitle.
  - `useQuery(["stock-alerts"], api.listStockAlerts)` for subscribed IDs.
  - `useQuery(["alert-products", ids.join(",")], () => api.products({
    ids: ids.join(",") }), { enabled: ids.length > 0 })` for full product
    data.
  - `isLoading = alertsLoading || (ids.length > 0 && productsLoading)`.
  - Loading: 3 skeleton cards in `grid sm:grid-cols-2 gap-4`.
  - Empty: glass-strong dashed panel with Bell icon in rounded square,
    "Você não tem alertas ativos." + the spec hint + "Explorar drops"
    gradient button → `navigate("products")`.
  - Grid: `grid sm:grid-cols-2 gap-4` of `motion.div` cards with
    staggered entrance (delay = index * 0.06). Each card:
      * 16x16 image button → `navigate("product", { id: p.slug })`.
      * Brand uppercase + name (also clickable, hover → neon-cyan).
      * Emerald "Em estoque" or rose "Esgotado" Badge based on `p.stock`.
      * Actions: in-stock → "Ver produto" gradient + "Remover alerta"
        outline; out-of-stock → "Remover alerta" outline only.
        "Remover alerta" calls `api.unsubscribeStockAlert(p.id)` +
        invalidate + toast "Alerta removido." with per-card Loader2
        spinner via `removingId` state.
  - Footer counter: "{N} alerta(s) ativo(s)".
- Wired 5th tab into `TabsList`: `<TabsTrigger value="alertas">` with
  `<BellOff className="h-4 w-4" />` + "Alertas" label, using the same
  cyan→violet active-state classes as the other tabs.
- Added `<TabsContent value="alertas" className="mt-6"><StockAlertsTab
  /></TabsContent>` after the "notificacoes" content.

## Style adherence
- Dark cosmic theme — `glass` / `glass-strong`, `border-white/10`,
  rounded-2xl/3xl, p-4/p-6.
- Brand neons only via CSS vars (`--neon-cyan/-magenta/-violet/-lime`); NO
  indigo/blue. Amber for low-stock / sold-out warning, rose for "esgotado",
  emerald for "Em estoque", lime for "Inscrito".
- Mobile-first responsive (`flex-col sm:flex-row`, `grid sm:grid-cols-2`).
- framer-motion entrances (`initial opacity:0,y:10/12 animate opacity:1,y:0`).
- shadcn primitives (Button, Input, Badge, Skeleton, Tabs) + lucide-react
  icons (Bell, BellOff, X via existing import, Check, Loader2).
- pt-BR copy throughout, no technical jargon.
- `toast` from sonner for all feedback, `useQueryClient().invalidateQueries`
  after every subscribe/unsubscribe.

## Verification
- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` shows
  ZERO errors in `ProductDetailView.tsx` / `AccountView.tsx` (remaining TS
  errors are pre-existing backend JSON-Prisma stub friction in
  `src/app/api/*` and `examples/`/`skills/` folders — unrelated to this
  task).
- Dev server recompiles cleanly (`✓ Compiled in ~120-260ms`), `GET /`
  returns 200 with no errors in `dev.log`.

## Files modified
- `/home/z/my-project/src/components/views/ProductDetailView.tsx`
- `/home/z/my-project/src/components/views/AccountView.tsx`

No other files modified. No backend/routes/pages/tests created. Did NOT
touch ProductCard, AdminView, CheckoutView, Header, Footer, or any stores.
