# CRON-3 — AccountView (customer account page)

**Agent**: full-stack-developer
**Task**: Build AccountView (customer account page with order history + profile)

## Work Log

- Read `/home/z/my-project/worklog.md` (Architecture, Design System, Shared
  components, Contracts sections) and previous Task records for context:
  Astrofeet SPA on Next.js 16 + TS + Tailwind 4 + shadcn/ui + framer-motion.
  Dark cosmic theme, neon cyan/violet/magenta/lime palette (NO indigo/blue).
  Glass/glass-strong utilities, `border-white/10`, `rounded-2xl/3xl`, p-4/p-6.
- Inspected live contracts before writing any code:
  - `src/stores/auth.ts` — `user: PublicUser | null`, `hydrated`, `setUser`,
    `logout`, `isAdmin()`.
  - `src/stores/ui.ts` — `navigate(view, params)`, `openAuth(mode)`.
  - `src/stores/cart.ts` — `count()` for header stat chip.
  - `src/stores/wishlist.ts` — `count()` for "Ver lista de desejos" chip.
  - `src/lib/client.ts` — `api.listOrders(): Promise<Order[]>`,
    `api.logout(): Promise<void>`.
  - `src/lib/types.ts` — `Order`, `OrderLineItem`, `OrderStatus`,
    `PublicUser`, `ViewName` (already includes `account`).
  - `src/lib/format.ts` — `formatPrice`, `formatDate`, `orderStatusLabel`,
    `orderStatusColor`.
  - `src/lib/serialize.ts` — verified `Order.payment` JSON includes extra
    fields (`couponCode`, `discount`) when a coupon was applied at checkout;
    defined a local `PaymentInfo = Order["payment"] & { couponCode?: string;
    discount?: number }` widening so the AccountView can render the discount
    row without type errors.
  - Existing views for style reference: `TrackOrderView.tsx` (timeline + glass
    panels + framer-motion entrances), `WishlistView.tsx` (empty states with
    dashed slow-spin ring + neon glow circle), `OrderSuccessView.tsx`
    (payment label helper + summary card layout), `HomeView.tsx` (StatsCard
    pattern), `AdminView.tsx` (Tabs + Table + status badge usage).
  - `src/app/globals.css` — confirmed `.glass`, `.glass-strong`,
    `.text-gradient-neon`, `.neon-text`, `--neon-cyan/violet/magenta/lime`,
    `.animate-spin-slow`, `:focus-visible` neon outline, custom scrollbar.
  - `src/app/page.tsx` and `src/components/layout/Header.tsx` — current view
    router and user dropdown structure to plan wiring edits.

## Built `src/components/views/AccountView.tsx`

Single `"use client"` file, TypeScript strict, ~700 lines, pt-BR copy. Default
+ named export `AccountView`. Structure:

1. **Hydration + auth guard**:
   - `useQuery({ queryKey: ["orders", "mine"], queryFn: () => api.listOrders(),
     enabled: hydrated && !!user })` — backend returns the caller's own
     orders for customers (and all orders for admins, so both work).
   - `!hydrated` → `<HydrationSkeleton />` (glass-strong header skeleton +
     3 rounded card skeletons).
   - `hydrated && !user` → `<NotSignedIn />` friendly guard card:
     "Você ainda não entrou na órbita" + "Entrar / Criar conta" gradient
     button → `openAuth("login")` + "Voltar ao início" outline button →
     `navigate("home")`. Dashed slow-spin cyan ring around an avatar circle.

2. **Breadcrumb** — `Início › Minha conta` (Home icon clickable, navigates
   `home`).

3. **`AccountHeader` (glass-strong card)** with framer-motion entrance:
   - Avatar circle with the user's initial — gradient bg from neon cyan →
     neon violet, with a blurred glow halo behind.
   - Name (h1, black weight) + role chip ("Comando" if admin in magenta,
     "Explorador" if customer in cyan) + email (with Mail icon, truncated).
   - "Ver lista de desejos" outline button (Heart icon, magenta) with count
     badge from `useWishlistStore.count()`.
   - "Sair" ghost button (rose tint) → `api.logout()` + `logout()` +
     `navigate("home")` + toast.success. Shows "Saindo..." + spinner
     disabled state during the await. Network errors are swallowed
     (local state is still cleared).
   - Stats row (3 StatCards, mobile `grid-cols-2`, sm:grid-cols-3): Total
     de pedidos (cyan accent), Total investido (sum of orders.total,
     violet), No carrinho (cart count, lime). Each card has a blurred
     accent blob top-right + tinted icon chip. Shows "—" while orders
     are still loading.

4. **`Tabs` (shadcn)** — pill-style `TabsList` (glass rounded-full
   border-white/10) with neon-gradient active state:
   - `Meus pedidos` (Package icon)
   - `Meus dados` (User icon)

5. **OrdersTab**:
   - Loading: 3 `Skeleton` rounded-3xl cards.
   - Empty state: dashed slow-spin cyan ring around a Package icon,
     "Você ainda não fez nenhum pedido" copy + "Explorar drops" gradient
     button → `navigate("products")`.
   - Non-empty: shows "{n} pedidos no total" count + sorts orders
     most-recent-first (`new Date(b.createdAt) - new Date(a.createdAt)`)
     and renders one `OrderCard` per order with framer-motion
     `initial opacity:0,y:16 whileInView` staggered by index (capped at
     0.4s delay).

6. **`OrderCard`** (per-order):
   - Header: Package icon chip + order code (mono neon-cyan + neon-text) +
     date (CalendarDays icon, formatDate). Status badge top-right using
     `orderStatusColor(status)` + `orderStatusLabel(status)`.
   - Items summary block: `itemsSummary(order)` — up to 2 item names +
     "+X mais" if more (e.g. "Meteor Air (Tam 41), Orion Runner (Tam 40)
     +1 mais"). Below: item count (Layers icon) + payment method label
     with icon (Cartão de crédito / Pix / Boleto; card shows "· final
     XXXX" if cardLast4 present) + coupon line in emerald ("Cupom X ·
     -R$Y") when `payment.couponCode && payment.discount > 0`.
   - Footer row: Total (text-gradient-neon, struck-through + muted when
     cancelled) + "Rastrear" gradient button →
     `navigate("track-order", { code: order.code })` + "Ver detalhes"
     outline button using shadcn `Collapsible`/`CollapsibleTrigger`
     (chevron toggles between right/down + label "Ver detalhes" /
     "Ocultar detalhes").
   - Expanded details (AnimatePresence height:auto + opacity transition):
     two-column grid on sm+:
     - Left: full items list (Package icon tile + name + Tam/Qtd/Unit
       price + line subtotal) + totals card (Subtotal / Desconto if
       any / Frete showing "Grátis" when 0 / Total gradient).
     - Right: address card (MapPin header, customer name + street,
       number, complement, district, city/state, CEP) + payment card
       (icon + label + status + coupon info if applied).

7. **ProfileTab** ("Meus dados") — grid lg:grid-cols-2:
   - Read-only profile card: 4 `ProfileRow` items (Nome / E-mail / Tipo
     de conta with Comando/Explorador accent color / Membro desde =
     "Explorador desde 2026"). Note line at the bottom: "Para alterar
     seus dados, fale com a Nave no canto inferior." (LifeBuoy icon).
   - "Endereços salvos" empty state card: dashed-border container with
     magenta MapPin in glowing circle, "Nenhum endereço salvo ainda"
     copy + "Seus endereços de entrega ficam salvos a cada pedido. Em
     breve você poderá gerenciá-los aqui." + "Fazer um pedido" outline
     button → `navigate("products")`.

8. **HelpFooter** (glass card, motion whileInView):
   - ShieldCheck icon + "Precisa de ajuda?" + supportive copy.
   - "Falar com a Nave" outline button →
     `toast("A Nave está no canto inferior direito, pronta para ajudar 🚀")`.
   - "Rastrear um pedido" gradient button → `navigate("track-order")`.

## Wiring

- **`src/app/page.tsx`**: imported `AccountView` from
  `@/components/views/AccountView` and added
  `{view === "account" && <AccountView />}` to the main view router
  (alongside wishlist and track-order).
- **`src/components/layout/Header.tsx`**:
  - Imported `Package` and `UserCircle` lucide icons.
  - User dropdown: added "Minha conta" (UserCircle icon) and
    "Meus pedidos" (Package icon) items between "Rastrear pedido" and
    the conditional admin "Painel" / "Sair" items. Both call
    `navigate("account")`.
  - Mobile menu: added a "Minha conta" entry (gated on `showUser`) so
    logged-in users on mobile can also reach the account page.
  - Bumped mobile menu max-height from `max-h-80` → `max-h-96` to
    accommodate the new item without clipping.

## Verification

- `node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`: ZERO errors
  referencing `AccountView.tsx`, `Header.tsx`, or `src/app/page.tsx`. All
  remaining reported errors are pre-existing and unrelated (JSON-Prisma
  stub friction in backend route files, examples/ and skills/ folders, and
  the documented `auth.ts`/`client.ts` typing noise — same set as before
  this task).
- `bun run lint` not available (eslint not installed in this env, per
  existing worklog note). Code follows the established style from sibling
  views.
- Dev server log shows clean compilation (`✓ Compiled in 124ms` etc.) and
  `/api/orders` returning 200 — confirming the orders query will resolve
  when a logged-in user opens the account view.

## Stage Summary

- Files produced / modified:
  - **Created**: `src/components/views/AccountView.tsx` (~700 lines,
    single "use client" file, default + named export, TypeScript strict).
  - **Modified**: `src/app/page.tsx` (added import + view router branch).
  - **Modified**: `src/components/layout/Header.tsx` (added 2 dropdown
    items, 1 mobile menu item, 1 max-height bump, 2 icon imports).
- Honors every contract verbatim:
  - `useAuthStore` — `user`, `hydrated`, `logout` (also `setUser` unused
    here but available); admin/customer both reachable.
  - `useUIStore` — `navigate(view, params)` for products / track-order /
    home / account / wishlist, `openAuth("login")` for the guard CTA.
  - `api.listOrders()` (TanStack `useQuery` with key
    `["orders", "mine"]` and `enabled: hydrated && !!user`), `api.logout()`.
  - `useWishlistStore.count()` + `useCartStore.count()` for header stat
    chips.
  - `Order`, `PublicUser` types (with a widened `PaymentInfo` for the
    optional coupon fields the backend stores on `payment` JSON).
  - `formatPrice`, `formatDate`, `orderStatusLabel`, `orderStatusColor`.
  - `sonner` `toast` for logout success + help button.
  - shadcn primitives only (button, badge, skeleton, separator, tabs,
    collapsible).
  - framer-motion entrances (initial opacity:0,y:16 + whileInView /
    animate, staggered by index, AnimatePresence for the expanded
    details).
  - Dark cosmic theme — transparent over global GalaxyBackground,
    `glass`/`glass-strong`, `border-white/10`, `rounded-2xl/3xl`,
    `p-4/p-6`, neon cyan primary with violet/magenta/lime variety, NO
    indigo/blue.
  - pt-BR copy throughout, no technical jargon (no "endpoint", "query",
    "mutation"). Mobile-first responsive (cards stack, grid collapses to
    `grid-cols-2` then `sm:grid-cols-3` / `lg:grid-cols-2`).
- No new routes/pages/tests created. Only the AccountView file + the two
  wiring edits (Header dropdown + page.tsx view router), per the task
  spec. Agent context recorded at
  `/home/z/my-project/agent-ctx/CRON-3-full-stack-developer.md`.
