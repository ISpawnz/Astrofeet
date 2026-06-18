# Task 4 — CheckoutView + OrderSuccessView + checkout store

## Agent
full-stack-developer

## Scope
Built the checkout flow for the Astrofeet SPA: a tiny non-persisted zustand
store that holds the last completed order, the CheckoutView (single-page form
+ sticky order summary), and the OrderSuccessView (celebration + status
timeline + summary + CTAs).

## Files produced
- `src/stores/checkout.ts` — zustand store (`lastOrder`, `setLastOrder`,
  `clear`). Non-persisted (lives only for the current session, just long
  enough to bridge checkout → success view).
- `src/components/views/CheckoutView.tsx` — full checkout experience.
- `src/components/views/OrderSuccessView.tsx` — order confirmation experience.

## Contracts honored
- Cart store: `useCartStore` → `items`, `subtotal()`, `clear()`. CartItem
  fields used: productId, slug, name, price, image, size, quantity, accent.
  (NOTE: `src/stores/cart.ts` was not present at build time — being created by
  another subagent in parallel. The contract above is what this view expects.)
- UI nav: `useUIStore` → `navigate("order-success")` after success,
  `navigate("products")` for empty-cart CTA / "Continuar comprando".
- Auth: `useAuthStore` → `user` used to prefill name + email on mount.
- API: `api.createOrder(payload)` — payload sends only
  `{ productId, size, quantity }` per item (NO prices, backend recalculates).
  On success → `clear()` cart, `setLastOrder(order)`, navigate, toast.
  On error → toast the thrown Error.message.
- Checkout store: `useCheckoutStore` → `lastOrder`, `setLastOrder`.
- Format helpers used: `formatPrice`, `maskCEP`, `maskPhone`, `maskCard`,
  `maskExpiry`, `maskCVV`, `orderStatusLabel`.
- Toasts: `sonner`.

## CheckoutView highlights
- Empty-cart state with "Explorar drops" CTA → `navigate("products")`.
- Layout: `grid lg:grid-cols-[1fr_380px] gap-8` (form left / sticky summary
  right). Mobile-first single column.
- Three glass form sections with numbered neon legends:
  1. **Contato** — name, email, phone (maskPhone). Prefilled from auth user.
  2. **Entrega** — CEP (maskCEP), street, number, complement (optional),
     district, city, UF (2 letters, uppercased, filtered).
  3. **Pagamento** — RadioGroup of three custom card options
     (Cartão de crédito / Pix / Boleto) with icon + hint.
     - Card selected → animated card fields (number maskCard, name, expiry
       maskExpiry MM/AA, CVV maskCVV).
     - Pix/Boleto → friendly note about QR Code / código de barras on
       confirmation.
- Validation: inline `FieldError` under each invalid field + toast on submit.
  Email regex, CEP 8 digits, UF 2 chars, card 13+ digits, CVV 3+ digits, etc.
- Order summary (sticky `glass-strong` panel):
  - Cart items list (thumbnail w/ accent glow, name, size, qty, line total)
    capped at `max-h-72` w/ custom scrollbar.
  - Subtotal, Frete (free if subtotal ≥ 300 else R$29,90 — computed same as
    backend for display), Total (gradient text).
  - Free-ship badge when unlocked.
  - "Finalizar compra" gradient button, full width, with `Loader2` spinner
    while submitting.
  - Trust row (ShieldCheck "Pagamento seguro" · Lock "Dados criptografados").
- Reassurance line under header: "Pagamento seguro · Frete grátis acima de
  R$300".
- framer-motion entrance on header, form, and aside (staggered).

## OrderSuccessView highlights
- Reads `lastOrder` from `useCheckoutStore`. Null → friendly "Nenhum pedido
  recente" card + "Voltar ao início".
- Celebration block:
  - Big check icon inside a glowing circle (neon-lime → neon-cyan gradient),
    surrounded by a slow-spinning dashed ring and animated sparkle particles
    in brand colors.
  - "Pedido confirmado!" gradient title.
  - "enviamos a confirmação para {email}" subtitle.
  - Order code line (mono font, neon cyan) + copy button (clipboard +
    `toast.success("Código copiado!")`).
- Status timeline stepper: Recebido → Pago → Enviado → Entregue. Current step
  highlighted with neon ring; completed steps filled cyan w/ check icon.
  Cancelled orders render a dedicated rose-tinted notice instead of the
  stepper. Uses `orderStatusLabel` for labels.
- Two-column grid:
  - Items + totals (subtotal, frete, total) — same format as checkout.
  - Delivery address (name, street/number/complement, district, city/UF, CEP)
    + payment card (icon + label; for card shows "Cartão final {last4}").
- CTAs (centered, stacked on mobile):
  - "Acompanhar na Nave" (gradient) → toast "Fale com a Nave no canto
    inferior direito 🚀".
  - "Continuar explorando" → `navigate("products")`.
  - "Voltar ao início" → `navigate("home")`.
- All framer-motion entrance animations w/ staggered delays.

## Design conventions
- Transparent backgrounds over the global GalaxyBackground. `glass` /
  `glass-strong` panels, `border-white/10`, rounded-3xl / rounded-2xl.
- Brand neons via CSS vars (`var(--neon-cyan)` etc.); NO indigo/blue.
- shadcn components: `Button`, `Input`, `Label`, `Separator`, `RadioGroup` +
  `RadioGroupItem`. (All already exist in `src/components/ui`.)
- Inputs styled per spec:
  `h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none
  focus:border-[var(--neon-cyan)]`.
- pt-BR copy throughout, no technical jargon.
- Mobile-first; sticky summary collapses to single column on mobile.

## Type-check status
`node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` reports ZERO
errors in the three new files except a missing-module error for
`@/stores/cart`, which is being authored by a parallel subagent (cart store
contract is documented in the worklog). Once `src/stores/cart.ts` lands with
the agreed `items / subtotal() / clear()` API, the project compiles clean.

## Notes for downstream agents
- The CheckoutView reads `items`, `subtotal()`, and `clear()` from the cart
  store, and reads `item.productId`, `item.size`, `item.quantity` to build the
  payload, plus `item.image`, `item.name`, `item.price`, `item.accent` for the
  summary preview. Any cart-store implementation must expose exactly these.
- The OrderSuccessView assumes the `Order` shape from `src/lib/types.ts`
  (code, status, items[], subtotal, shipping, total, customer, address,
  payment with optional cardLast4, createdAt). No extra fields required.
- `setLastOrder` is called BEFORE `navigate("order-success")` so the success
  view reads the order on first paint.
