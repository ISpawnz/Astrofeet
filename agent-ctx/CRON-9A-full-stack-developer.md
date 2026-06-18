---
Task ID: CRON-9A
Agent: full-stack-developer
Task: Order export UI in AccountView + rating distribution panel in ProductDetailView

Work Log:
- Read `/home/z/my-project/worklog.md` (last 200 lines) to understand previous
  agents' work (CRON-8A/B: info pages, image upload, order details enhancement).
- Read `src/components/views/AccountView.tsx` (OrdersTab is at line 773,
  header bar with order count is at line 849-853). Read
  `src/components/views/ProductDetailView.tsx` (ReviewsSection at line 829,
  existing summary panel in left grid column at lines 963-1004).
- Confirmed `api.exportOrders(format: "csv" | "json"): Promise<Blob>` already
  exists at `src/lib/client.ts:326`.

Feature 1 — Order export UI in AccountView:
- Added `Download` and `FileJson` to the lucide-react imports.
- Added local `exporting: "csv" | "json" | null` state to `OrdersTab`.
- Added `handleExport(format)`:
    * sets `exporting` for spinner
    * `await api.exportOrders(format)` → Blob
    * `URL.createObjectURL(blob)` → temporary anchor click → download with
      filename `pedidos-astrofeet-${Date.now()}.${format}`
    * `URL.revokeObjectURL(url)` cleanup
    * `toast.success("Pedidos exportados em CSV|JSON.")` on success
    * `toast.error(err.message || "Erro ao exportar.")` on failure
    * `setExporting(null)` in finally
- Replaced the single `<p>` count line with a `flex flex-wrap items-center
  justify-between gap-3` container holding the count on the left and a
  `flex gap-2` group of two glass-chip buttons on the right.
- CSV button: `Download` icon (cyan), spinner is `Loader2` (cyan).
- JSON button: `FileJson` icon (violet), spinner is `Loader2` (violet).
- Both buttons: `disabled` while `exporting !== null`, `aria-label`,
  icon-only on mobile, `hidden sm:inline` text label on sm+.

Feature 2 — Rating distribution panel in ProductDetailView:
- Replaced the existing `dist` (Record) and `avg` (number) memos with:
    * `distribution` array memo: `[5,4,3,2,1].map(stars => ({ stars, count, pct }))`
      using `reviews.filter(r => r.rating === stars).length` and
      `(count / reviews.length) * 100` (or 0).
    * `avgRating` = `reviews.length > 0 ? mean : product.rating`.
- Replaced the existing `grid lg:grid-cols-[280px_1fr]` (summary + list)
  with a vertical `space-y-6` container:
    * If `reviews.length === 0`: a friendly centered glass card with a
      circled amber `Star` and "Ainda não há avaliações. Seja o primeiro
      a avaliar!" message.
    * Else: a glass `rounded-2xl p-4 sm:p-6` card with two columns
      (`flex-col sm:flex-row`):
        - Left (sm:w-44, shrink-0): `text-gradient-animated` 5xl/6xl bold
          avg number + amber `Star` icon, "X avaliações" below.
        - Right (flex-1): 5 horizontal bars, one per star level
          (5★ → 1★). Each row:
            + amber Star + number (w-8 shrink-0 label)
            + `h-2 rounded-full bg-white/10` track with a `motion.div`
              filled portion using `bg-gradient-to-r from-[var(--neon-cyan)]
              to-[var(--neon-violet)]`, `initial={{ width: 0 }}` →
              `animate={{ width: ${pct}% }}`, staggered 0.08s delay per
              row.
            + `(N) · P%` muted count+percentage on the right.
- Removed the existing list's `reviews.length === 0` empty-state card (the
  new panel's friendly message replaces it). The review list now only
  renders when `reviews.length > 0`.

Verification:
- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1
  | grep -E "AccountView|ProductDetailView"` → ZERO matches (zero errors).
  All remaining tsc errors are pre-existing JSON-Prisma stub friction in
  `src/app/api/**` (addresses, coupons, orders, metrics, products,
  reviews) — explicitly out of scope, not modified.
- ESLint: `bunx eslint` fails with the pre-existing
  `scopeManager.addGlobals is not a function` runtime error (ESLint 10.5 +
  bunx mismatch, same as CRON-8A noted). Environment issue, not a code
  issue.
- Dev server (port 3000) recompiled cleanly: `✓ Compiled in Nms` only,
  no warnings/errors. Existing `/api/orders/export?format=json` already
  returning 200 in dev.log from earlier.

Stage Summary:
- Modified: `src/components/views/AccountView.tsx`
  - + `Download`, `FileJson` to lucide-react imports
  - + `exporting` state + `handleExport` in `OrdersTab`
  - Header bar rewritten with count + CSV/JSON glass-chip buttons
    (responsive: icon-only on mobile, icon+text on sm+), spinner on the
    clicked button while exporting.
- Modified: `src/components/views/ProductDetailView.tsx`
  - Replaced `dist`/`avg` memos with `distribution` array + `avgRating`
  - Replaced `grid lg:grid-cols-[280px_1fr]` summary+list layout with
    vertical stack: new rating distribution panel (full-width, two-column
    on sm+) above + full-width review list below.
  - New panel: large `text-gradient-animated` avg + amber Star on left,
    5 amber-star-labelled bars (h-2, gradient cyan→violet fill, framer-
    motion width animation with staggered delay) on right.
  - 0-reviews case shows friendly "Ainda não há avaliações. Seja o
    primeiro a avaliar!" glass card.
- No other files touched. AdminView, InfoView, CheckoutView, ProductCard,
  HomeView, layout, stores, page.tsx, and all backend files untouched.
