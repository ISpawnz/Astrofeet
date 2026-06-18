# CRON-2 — full-stack-developer

## Task
Build two client-side SPA views for Astrofeet:
1. `src/components/views/WishlistView.tsx`
2. `src/components/views/TrackOrderView.tsx`

## Pre-flight
- Read `/home/z/my-project/worklog.md` (Architecture, Design System, Shared
  components, Contracts).
- Inspected live contracts:
  - `src/stores/wishlist.ts` — `items / hydrated / remove / clear / count`.
  - `src/stores/cart.ts` — `add(product, size, qty)`.
  - `src/stores/ui.ts` — `navigate(view, params)`, `params` index sig (params.code).
  - `src/stores/checkout.ts` — `lastOrder` carries `code`.
  - `src/lib/client.ts` — `api.product(slug)` returns `{ product, reviews }`;
    `api.trackOrder(code, email?)` returns flat `{ order: {...} }`.
  - `src/lib/types.ts` — `Product`, `OrderStatus` keys.
  - `src/lib/format.ts` — `formatPrice`, `formatDate`, `orderStatusLabel`,
    `orderStatusColor`.
  - `src/components/views/ProductCard.tsx` — accent-glow image recipe
    (aspect-square + blurred radial + object-contain p-4 + group-hover scale).
  - `src/components/views/OrderSuccessView.tsx` — timeline + summary style
    reference.
  - shadcn primitives in `src/components/ui/*` (button, input, label,
    separator, badge, skeleton).
  - `src/app/globals.css` — `.glass / .glass-strong / .neon-ring-soft /
    .animate-spin-slow / .text-gradient-neon / .neon-text / .animate-astro-float`.

## WishlistView.tsx
- `"use client"`, single file, default + named export.
- Header: eyebrow "Sua coleção" + gradient title "Lista de desejos" + subtitle
  "Os sneakers que você guardou para orbitar depois." + count chip showing
  `count()` items (rendered only when hydrated & non-empty).
- Hydration guard: if `!hydrated` → 4 skeleton cards in the same grid
  (`grid grid-cols-2 gap-4 lg:grid-cols-4`) to avoid SSR mismatch.
- Empty state: glowing magenta circle (blur + dashed slow-spin ring + glass
  inner circle) containing a `Heart`; copy "Sua lista está vazia" + "Salve
  seus sneakers favoritos clicando no coração em qualquer produto." + "Explorar
  drops" gradient button → `navigate("products")`. Below it a tiny reassurance
  line ("Toque no coração de qualquer produto para salvá-lo aqui.").
- Grid of items: each card mirrors ProductCard visual recipe — accent glow halo
  (`-inset-px blur-2xl opacity-0 group-hover:opacity-30`), aspect-square image
  panel with accent blurred radial + `object-contain p-4` + hover scale +
  rotate. Remove button top-right (glass, X icon, hover → rose). Brand
  uppercase muted, name `font-semibold` (hover → neon-cyan), price bold +
  "ou 10x de X". Full-width gradient "Adicionar ao carrinho" button.
- Card click (image or name) → `navigate("product", { id: slug })`. Remove &
  add buttons `stopPropagation`.
- framer-motion: `motion.div layout` with `initial opacity:0,y:20 whileInView`
  entrance + `exit opacity:0,x:-40,scale:0.85` slide-out. Wrapped in
  `<AnimatePresence mode="popLayout">` so removal animates cleanly without
  vacating the grid slot awkwardly.
- "Add to cart": per-card `loadingId: string | null` state. On click:
  `setLoadingId(item.id)` → `api.product(item.slug)` → pick
  `sizes[floor(len/2)] ?? sizes[0]` → `cart.add(product, size, 1)` →
  `toast.success`. On error: `toast.error(message)`. Button shows `Loader2`
  spinner + "Adicionando...".
- Footer actions (only when items exist): "Limpar lista" ghost (rose-tinted)
  → opens a sonner toast with `action: { label: "Limpar", onClick: clear }`
  and `cancel: { label: "Cancelar" }` for confirm. "Explorar mais drops"
  outline → `navigate("products")`.

## TrackOrderView.tsx
- `"use client"`, single file, default + named export.
- Header: eyebrow "Acompanhe sua encomenda" + gradient title "Rastrear pedido"
  + subtitle "Digite o código do seu pedido para ver onde ele está na rota.".
- Search form (`glass-strong` rounded-3xl p-5/p-6): two inputs in a responsive
  grid (`sm:grid-cols-[1fr_1fr_auto]`):
    * "Código do pedido" — monospace, uppercase, `autoCapitalize=characters`,
      placeholder `AST-123456`, value uppercased onChange.
    * "E-mail (opcional, para validar)" — type=email, optional.
    * "Rastrear" gradient button with `Search` icon (swaps to `Loader2`
      spinner + "Rastreando..." when loading). All inputs disabled while
      loading.
  Prefill: `code` initialized from `useUIStore.params.code` OR
  `useCheckoutStore.lastOrder?.code`; a `useEffect` on `params.code` re-fills
  the field when navigated in with a new code.
- Submit: validates non-empty code (uppercased + trimmed); calls
  `api.trackOrder(code, email?)`. On success → `setResult(order)`,
  `toast.success("Pedido localizado!")`. On error → `setError(message)`,
  `setNotFound(true)`, `toast.error(message)`.
- InitialState: rocket inside a glass circle with floating animation, Orbit
  icon backdrop, "Pronto para decolar?" + "Insira o código do seu pedido
  acima." + example line "Não tem o código? Ele vem no e-mail de confirmação.
  Exemplo: AST-123456.".
- NotFoundState: rose AlertCircle in glowing rose circle, "Pedido não
  encontrado" + "Confira o código e tente de novo." + "Tentar de novo" button
  that clears the code and refocuses the input.
- ResultPanel (entrance `initial opacity:0,y:20 animate`):
    1. Code+status row: order.code in monospace neon-cyan with `neon-text`,
       status `Badge` styled with `orderStatusColor(status)` + label from
       `orderStatusLabel(status)`.
    2. Timeline (glass panel): 4 steps Recebido → Pago → Enviado → Entregue
       (each with its own icon). Connectors are vertical on mobile, horizontal
       on `sm+`. Completed steps = neon-cyan filled circles with check icon;
       current step = filled + `neon-ring-soft` + a pulsing ring
       (`motion.span` animating `opacity: [0.7, 0, 0.7]` and
       `scale: [1, 1.6, 1]` infinite). Future steps = empty white/15 circles
       with step number. Cancelled status → rose notice card instead of
       timeline.
    3. Summary grid (`md:grid-cols-2`): items list (icon + name + size/qty/
       unit + line total), separator, subtotal / frete (Grátis if 0) / total
       (gradient). Other column: Customer card (name, city/state with MapPin,
       date with CalendarDays) + Payment card (icon + label depending on
       `paymentMethod`: card → Cartão de crédito + CreditCard, pix → Pix +
       QrCode, boleto → Boleto + Barcode; status subtitle).
    4. Reassurance line: "Atualizamos o status a cada etapa. Em caso de
       dúvida, fale com a Nave no canto inferior.".
- AnimatePresence `mode="wait"` swaps between InitialState / NotFoundState /
  ResultPanel.
- Footer CTAs: "Continuar explorando" (outline → navigate products) +
  "Voltar ao início" (ghost → navigate home).

## Style adherence
- Dark cosmic theme throughout — `glass` / `glass-strong`, `border-white/10`,
  transparent bg over global GalaxyBackground.
- Brand neons via CSS vars only (`--neon-cyan/-magenta/-violet/-lime`); NO
  indigo/blue. Item.accent drives per-card glow in WishlistView.
- shadcn primitives used: button, input, label, separator, badge, skeleton.
- Rounded-2xl/3xl, p-4/p-6, mobile-first. Timeline stacks vertically on
  mobile and goes horizontal on `sm+`.
- framer-motion for entrances (initial opacity/y + animate / whileInView) and
  for the active-step pulse ring and remove transitions.
- pt-BR copy, no technical jargon ("endpoint", "request", "API" never appear).
- TypeScript strict; verified with
  `node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` — ZERO errors in
  either new file (remaining project errors are pre-existing backend route
  friction with the JSON-Prisma stub types and the examples/skills folders,
  unrelated to this task).

## Files produced
- `/home/z/my-project/src/components/views/WishlistView.tsx`
- `/home/z/my-project/src/components/views/TrackOrderView.tsx`

No other files modified. No routes/pages/tests created.
