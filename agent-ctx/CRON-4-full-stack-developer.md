# CRON-4 — Admin coupon management tab

## Context
- Read `/home/z/my-project/worklog.md` (Architecture, Design System, Shared
  components, Contracts sections, CRON-2 entry).
- Read `/home/z/my-project/src/components/views/AdminView.tsx` (1575 lines).
- Read `/home/z/my-project/src/lib/types.ts` (`Coupon` type confirmed),
  `/home/z/my-project/src/lib/format.ts` (`formatPrice`, `formatDate`),
  `/home/z/my-project/src/lib/client.ts` (`api.listCoupons`, `createCoupon`,
  `updateCoupon`, `deleteCoupon` confirmed).
- Read `/home/z/my-project/src/components/ui/alert-dialog.tsx` (API matches
  existing usage in ProductsTable).

## Plan
- Add `Ticket, Check, X, Power, Copy` to lucide-react import block.
- Add `Coupon` to type import.
- Add 4th `TabsTrigger` "Cupons" (Ticket icon) after "Produtos".
- Add `TabsContent value="cupons"` rendering `<CouponsTab />`.
- Add `CouponFormModal` + `CouponsTab` sub-components below `ProductsTable`
  (before main `AdminView`).
- Match existing patterns: `useQuery` + `useQueryClient().invalidateQueries`
  (no `useMutation`), `toast` from sonner, shadcn primitives, framer-motion
  entrance, glass / border-white/10 / neon cyan palette, pt-BR copy.

## Notes for next agent
- Backend coupon CRUD already implemented (`/api/coupons` routes) — do not touch.
- `Coupon.expiresAt` is `string | null | undefined` per types; backend contract
  accepts `expiresAt?: string | null`.
- Date input uses `YYYY-MM-DD`; on submit convert to ISO via
  `new Date(YYYY-MM-DD + "T23:59:59").toISOString()`; on edit extract
  `.toISOString().slice(0,10)` from the stored ISO string.
