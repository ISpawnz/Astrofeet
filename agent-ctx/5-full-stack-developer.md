# Task 5 — AuthModal (animated sun/moon split login/register)

## File produced
- `src/components/views/AuthModal.tsx` (single "use client" component,
  named export `AuthModal`, TypeScript strict, ~560 lines).

## Contracts honored
- `useUIStore`: `authModalOpen`, `authMode` ("login"|"register"),
  `openAuth(mode)`, `closeAuth()` — the mode flip drives the swap animation.
- `useAuthStore`: `setUser(user)`.
- `api.login(email,password)` / `api.register(name,email,password)` →
  `PublicUser`; throws `Error` with `.message` on failure (surfaced via toast).
- `PublicUser` type, `sonner` toast, `useIsMobile` hook (768px), `cn` util.
- No other files modified. No new routes/pages/tests.

## Animation technique
- DESKTOP: `relative h-[560px]` stage with two `absolute w-1/2` panels.
  FORM panel animates `x: "0%" | "100%"`, BRAND panel animates
  `x: "100%" | "0%"` (framer-motion % x = % of element's own width = 50% of
  card) → real left/right swap via spring (220/28). Form & brand *content*
  crossfade inside each panel (AnimatePresence mode="wait", opacity, 0.2s).
- CELESTIAL BALL: centered on the divider; inner motion.div drifts
  `x: -12 | +12` toward the form side. Two SAME-SIZE 88px bodies stack &
  crossfade: Moon (pale grey-white radial + craters, lit-left, cool glow) ↔
  Sun (warm gold/orange radial + 12 rotating rays, lit-right, warm glow),
  opacity 0↔1 + scale 0.5↔1 over 0.5s.
- BRAND GRADIENT: two stacked gradient layers (cool navy/violet/cyan for
  login-moon; warm umber/orange for register-sun) crossfade opacity 0.6s,
  plus a deterministic twinkling starfield.
- MOBILE (`useIsMobile`): stacked — form top, 160px divider band with the same
  CelestialBall (still morphs), brand bottom. `max-h-[88vh] overflow-y-auto`.

## Forms / validation / UX
- Login: email + password + "Esqueci minha senha" (toast) + clickable demo
  line "Demonstração: admin@astrofeet.com / admin123" that fills the fields.
- Register: name(>=2) + email(contains @) + password(>=6); inline errors +
  toast on invalid; errors clear on mode change; loading resets on close.
- Success → setUser → closeAuth → toast ("Bem-vindo a bordo!" /
  "Conta criada! Bem-vindo à órbita.").
- Esc / backdrop click / X button (top-right, z-30) close; body scroll lock +
  autofocus first input; ARIA dialog + aria-modal + pt-BR aria-label.
- Inputs use the mandated class; dark cosmic theme; glass-strong card;
  border-white/10; rounded-3xl; cyan->violet gradient submit; NO indigo/blue
  brand (moon cool grey-white, sun warm gold — celestial bodies only).

## Verification
- `tsc --noEmit -p tsconfig.json` → no errors referencing AuthModal.tsx
  (remaining errors are the documented missing `next` package + unrelated
  parallel API routes).
- `bun run lint` unavailable in this env (eslint not installed).
