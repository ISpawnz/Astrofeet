# Task 6 — AdminView (seller dashboard)

**Agent**: full-stack-developer
**File produced**: `src/components/views/AdminView.tsx`

## What was built

A single `"use client"` React component (~900 lines, TypeScript strict) implementing the
Astrofeet seller/admin dashboard, rendered inside `/` when `useUIStore.view === "admin"`.

## Structure (sub-components in same file)

- `AdminGuard` — restricted-access screen (rose ShieldAlert + "Acesso restrito ao
  painel." + "Fazer login" via `useUIStore.openAuth("login")` + "Voltar à loja" via
  `navigate("home")`).
- Hydration-aware gate — waits for `useAuthStore.hydrated`, then enforces
  `user.role === "admin"`.
- Header — gradient "Painel do Comando" + muted admin email + "Voltar à loja".
- `Tabs` — Visão geral | Pedidos | Produtos (neon-cyan active state).
- `OverviewTab` — 4 `MetricCard`s (Pedidos hoje / Faturamento / Ticket médio /
  Produtos ativos) in `grid sm:grid-cols-2 lg:grid-cols-4 gap-4`; recharts `BarChart`
  of `byStatus` (neon-cyan bars, x = `orderStatusLabel`); recharts donut `PieChart`
  of recent orders by status using the neon palette
  `["#34e7ff","#ff5cf0","#a779ff","#c6ff5a","#ff7a3c"]` with a custom legend; compact
  "Últimos pedidos" Table (top 6 from `recent`).
- `OrdersTable` — full orders Table (`api.listOrders()`): Código / Cliente (name+email) /
  Itens (qty sum) / Total (`formatPrice`) / Status (badge + inline shadcn `Select`
  bound to `api.updateOrderStatus` → invalidates `["orders"]` + `["admin-metrics"]` +
  toast) / Data (`formatDate`). Sticky header inside `max-h-[28rem] overflow-y-auto`.
  Client-side search filter by code or customer name. Loading skeletons + empty/error
  states.
- `ProductsTable` — header with "Novo produto" button; glass Table with accent-glow
  thumb, name/brand, category chip, price, color-coded stock, badge, Destaque/Top/
  rating flags, Editar + Excluir icon buttons. Empty state with CTA.
- `ProductFormModal` (shadcn `Dialog`) — create/edit form: name (auto-suggests slug via
  `slugify` unless manually edited), brand, category select, price/stock/rating, accent
  palette of 6 neon presets + native color input, badge select (Nenhum/Novo/Drop
  limitado/Mais vendido — null when empty), description textarea, sizes chips 36–44,
  images (comma-separated URLs, defaults `/products/<slug>.png`), featured + bestSeller
  switches. Validates + calls `api.createProduct`/`api.updateProduct`, invalidates
  `["products"]` + `["admin-metrics"]`, toasts, closes.
- Delete confirmation via shadcn `AlertDialog` → `api.deleteProduct` → invalidate + toast.

## Contracts honored

- `useAuthStore` — `user`, `hydrated`, `user?.role === "admin"` guard.
- `useUIStore` — `navigate`, `openAuth("login")` (via `getState()` for the guard button).
- `api` — `adminMetrics`, `listOrders`, `updateOrderStatus`, `products`, `createProduct`,
  `updateProduct`, `deleteProduct`.
- Types — `Order`, `Product`, `OrderStatus` from `@/lib/types`.
- Format — `formatPrice`, `formatDate`, `orderStatusLabel`, `orderStatusColor` from
  `@/lib/format`.
- Toasts — `sonner`.
- Data — TanStack `useQuery` + `useQueryClient` invalidation with keys `["admin-metrics"]`,
  `["orders"]`, `["products"]` (no `useMutation`, per contract).
- Charts — `recharts` `BarChart/Bar/XAxis/YAxis/Tooltip/ResponsiveContainer/PieChart/Pie/Cell`.
- framer-motion entrances on header + metric cards.

## Design conventions

- Dark cosmic theme; transparent over global GalaxyBackground; `glass` / `glass-strong`,
  `border-white/10`, rounded-2xl/3xl, p-4/p-6.
- Brand neons via CSS vars; NO indigo/blue. Neon cyan = primary accent; violet/magenta/
  lime/orange for variety.
- Mobile-first: metrics stack, tables horizontally scrollable (shadcn `Table`), form
  grids collapse to single column, sticky table headers inside `max-h-[28rem]` /
  `max-h-96` scroll wrappers (global cosmic scrollbar).
- pt-BR non-technical copy: "Painel", "Pedidos", "Produtos", "Salvar", "Remover",
  "Status", "Faturamento", "Ticket médio", "Hoje", "Voltar à loja", etc.

## Verification

`node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` — ZERO errors in
`AdminView.tsx`. All remaining reported errors are pre-existing and unrelated (the
not-yet-installed `next` / `next/server` modules per the worklog note, JSON-Prisma stub
type friction in backend route files, and the `examples/` + `skills/` folders).

## No other files modified
