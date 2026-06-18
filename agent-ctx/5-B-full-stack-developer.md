# Task 5-B — Coupon usage analytics + admin notifications tab

## Scope
Two frontend features in `src/components/views/AdminView.tsx` only:

1. **Usage analytics columns in CouponsTab** — 2 new table columns (USOS,
   DESCONTO GERADO) placed between STATUS and VALIDADE, plus a 3-card
   summary row at the top (cupons ativos / total usos / desconto gerado).
2. **New "Notificações" tab** — 5th admin tab (Bell icon) with a
   `NotificationsTab` sub-component showing all mock emails sent by the
   store, with per-type icon/color, status badge, expandable body, and
   a "Ver pedido" link when orderId is present.

## Backend contracts (already done, not modified)
- `GET /api/coupons` → each coupon has `usageCount: number` and
  `totalDiscount: number` (BRL).
- `GET /api/notifications` → `{ notifications: Notification[] }` sorted by
  `sentAt` desc. Admin sees all; customer sees own.
- `api.listNotifications(limit?)` already in `src/lib/client.ts`.
- `Coupon` extended with `usageCount?` / `totalDiscount?`; `Notification`
  + `NotificationType` already in `src/lib/types.ts`.

## Files modified
- `src/components/views/AdminView.tsx` (2396 → 2739 lines)

## Imports added
- lucide-react: `Bell, Mail, Clock, Truck, Sparkles, RefreshCw, ChevronDown`
- `@/lib/types`: `Notification, NotificationType`
- `@/components/ui/collapsible`: `Collapsible, CollapsibleTrigger,
  CollapsibleContent`

## New sub-components (all in AdminView.tsx)
1. **`MiniStat`** — compact glass card (icon + value + label) reused by
   the CouponsTab summary row.
2. **`NOTIFICATION_META`** constant — maps `NotificationType` →
   `{ Icon, color }`:
   - `order_created` → Package + cyan #34e7ff
   - `order_status` → Truck + violet #a779ff
   - `coupon_applied` → Ticket + magenta #ff5cf0
   - `welcome` → Sparkles + lime #c6ff5a
3. **`NotificationStatusBadge`** — `sent` → emerald "Enviado",
   `queued` → amber "Na fila", `failed` → rose "Falhou".
4. **`NotificationsTab`** — header (title + subtitle + Atualizar button),
   loading skeleton (4 rows), error retry, empty state with Bell icon,
   scrollable list (`max-h-[32rem] overflow-y-auto`) of Collapsible cards,
   footer counter "Mostrando X notificações".

## CouponsTab changes
- 3-card summary grid (sm:grid-cols-3) above the table:
  - "Cupons ativos" (count of `c.active`)
  - "Total de usos" (sum of `usageCount`)
  - "Desconto gerado" (formatPrice of sum `totalDiscount`)
- 2 new `<TableHead>` columns between STATUS and VALIDADE: "Usos" and
  "Desconto gerado".
- 2 new `<TableCell>` per row:
  - USOS: cyan-tinted Badge with `usageCount` when > 0; muted "—" when 0.
  - DESCONTO GERADO: emerald `formatPrice(totalDiscount)` when > 0; muted
    "—" when 0.
- Loading skeleton + empty-state `colSpan` bumped 8 → 10.

## 5th admin tab
- `<TabsTrigger value="notificacoes">` with `<Bell />` icon + label
  "Notificações", placed after "Cupons".
- `<TabsContent value="notificacoes"><NotificationsTab /></TabsContent>`.

## Notification card anatomy
Each card is a `motion.div` (opacity + y, staggered delay = `i * 0.04`,
capped at 0.4) wrapping a `Collapsible`:
- Type icon in a 10×10 colored tile (`color + 1f` alpha bg).
- Subject as `CollapsibleTrigger` button (font-medium, hover cyan).
- Status badge inline (emerald/amber/rose).
- Recipient "Para: {to}" with `Mail` icon (muted).
- Sent time `formatDate(sentAt)` with `Clock` icon (muted).
- "Ver pedido" button (cyan) when `orderId` is present — calls
  `toast(\`Pedido ${n.orderId}\`)`.
- `ChevronDown` `CollapsibleTrigger` button (rotates 180° when open).
- `CollapsibleContent`: `<pre>` with `whitespace-pre-wrap break-words`,
  mono font, `bg-black/30`, `p-3 rounded-xl`, showing the full email body.

## Verification
- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 |
  grep -E "AdminView"` → **ZERO errors**. Pre-existing TS errors in
  `src/app/api/reviews/route.ts` and `src/lib/notifications.ts` are
  backend JSON-Prisma stub friction, unrelated to this task.
- `node node_modules/eslint/bin/eslint.js src/components/views/AdminView.tsx`
  → 0 errors, 1 pre-existing warning (unused eslint-disable directive at
  line 1492, unrelated).
- Seeded 4 test notifications via admin `POST /api/notifications` covering
  all 4 types (order_created, order_status, coupon_applied, welcome).
- agent-browser QA (admin@astrofeet.com):
  - Cupons tab: summary row shows "3 CUPONS ATIVOS / 2 TOTAL DE USOS /
    R$63,90 DESCONTO GERADO". Table shows USOS + DESCONTO GERADO columns:
    GALAXIA10 → "2" (cyan badge) / "R$63,90" (emerald); DROP15 + ORBITA50
    → muted "—" / "—".
  - Notificações tab: 4 cards sorted sentAt desc; expand/collapse works
    (pre body revealed with full email template); "Ver pedido" button
    triggers sonner toast; footer "Mostrando 4 notificações". No console
    errors, no browser errors.

## Notes / decisions
- Used `usageCount ?? 0` and `totalDiscount ?? 0` everywhere (defensive —
  the type marks both as optional, even though the backend always returns
  them now).
- Summary row only renders when `data && data.length > 0` (so the empty
  state takes over cleanly when there are no coupons yet — showing 0/0/
  R$0,00 next to an empty-state card would be visually noisy).
- "Ver pedido" button uses `toast(\`Pedido ${n.orderId}\`)` as per the
  task spec ("or omit if too complex") — kept it simple, no navigation.
- Used a single `expandedId` state in `NotificationsTab` so only one
  notification body is expanded at a time (accordion-style behavior —
  cleaner UX than allowing multiple open).
- `<pre>` element for the body uses `whitespace-pre-wrap break-words` so
  long URLs/lines wrap on mobile instead of causing horizontal scroll.
- Status badge uses `text-[10px]` (vs `text-[11px]` for coupon status) so
  it sits comfortably inline next to the subject without breaking the
  layout on narrow viewports.
- No new files created; no backend files touched; AccountView.tsx and
  CheckoutView.tsx untouched (parallel subagent 5-A's territory).
