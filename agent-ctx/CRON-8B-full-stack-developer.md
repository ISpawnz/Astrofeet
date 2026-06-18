# CRON-8B — Admin product image upload (base64) + stock alert UI feedback

## Scope
Single file: `src/components/views/AdminView.tsx`. Two features added on top
of the existing `ProductFormModal` and `ProductsTable`.

## Feature 1 — Image upload (base64) in `ProductFormModal`

### Architecture change
`ProductFormState.images` migrated from `string` (comma-separated) to
`string[]`. Both uploaded base64 Data URLs and manually pasted URLs now live
in the same array, which is what `api.createProduct` / `api.updateProduct`
already expected (`images: string[]`).

- `emptyForm().images` → `[]`
- `formFromProduct(p).images` → `[...p.images]`
- `onSubmit` now uses `form.images.length > 0 ? form.images : [/products/<slug>.png]`
  (same fallback to the static CDN path when nothing is set).

### New state / refs (inside `ProductFormModal`)
- `fileInputRef = useRef<HTMLInputElement>(null)` — hidden `<input type="file">`
- `urlInput: string` — text field for manual URL entry
- `dragging: boolean` — visual highlight when files are dragged over the zone

### New module constants
- `MAX_PRODUCT_IMAGES = 5`
- `MAX_IMAGE_BYTES = 2 * 1024 * 1024` (2 MB)

### Handlers
- `handleFiles(files: File[])`:
  - filters to `image/*` MIME types only (else `toast.error`)
  - checks available slots vs `MAX_PRODUCT_IMAGES` (else `toast.error`)
  - if overflow, `toast.warning` explaining how many were added
  - per file: rejects files > 2 MB with `toast.error`, otherwise reads via
    `FileReader.readAsDataURL` and pushes the resulting Data URL into
    `form.images` (guarding against the 5-image cap inside the setter)
- `addUrls()`:
  - parses `urlInput` as comma-separated URLs, trims + filters empties
  - respects the 5-image cap with the same error/warning pattern
  - clears `urlInput` after a successful add
- `removeImage(index: number)`:
  - filters the image at the given index out of `form.images`

### UI (replaces the previous single-line URL input)
Section header now shows an `ImageIcon` + "Imagens do produto" label and a
live `{n}/5` counter (turns magenta when the cap is hit).

1. **Drop zone** — `<button>` styled with a dashed `border-2`, rounded-2xl,
   glass tint. Supports:
   - click → opens native file picker via `fileInputRef.current?.click()`
   - dragover/dragleave/drop → updates `dragging` state for visual highlight
     and calls `handleFiles` on drop
   - hidden `<input type="file" accept="image/*" multiple>` inside; resets
     `e.target.value = ""` after each pick so the same file can be re-added
   - copy: "Arraste imagens aqui ou clique para selecionar" + helper line
     "PNG, JPG ou WEBP · até 2 MB cada · máx. 5 imagens"
2. **Thumbnail grid** — `grid grid-cols-5 gap-2`, each cell is an
   `aspect-square rounded-xl border-2 border-white/10` `motion.div` with a
   staggered scale-in animation. The image is rendered with `<img>` (base64
   is a valid `src`). A remove `<button>` (X icon, top-right) appears on
   hover (`opacity-0 group-hover:opacity-100`) and calls `removeImage(i)`.
3. **URL input** — kept BELOW the upload zone, per spec. Now a small form
   with the input + an "Adicionar" button (icon-only on mobile via
   `hidden sm:inline` label). Pressing Enter also triggers `addUrls()`.
   Helper copy explains the `/products/<slug>.png` fallback.

## Feature 2 — Stock alert automation feedback

### Restock toast in `ProductFormModal.onSubmit`
After a successful `api.updateProduct`, if `editing.stock === 0 && stockNum > 0`
(product was out of stock, now has stock), fire an additional
`toast.success("Produto reabastecido! Os exploradores inscritos serão avisados.")`
with `icon: <Bell className="h-4 w-4 text-[var(--neon-cyan)]" />` and
`duration: 6000`. The backend (already updated in this CRON-8 round) is
responsible for actually queueing the notifications to subscribed users —
this is purely a UX confirmation that the automation kicked in.

### Out-of-stock Bell indicator in `ProductsTable`
The "Estoque" cell now wraps the stock number in a flex container. When
`p.stock === 0`, a magenta Bell badge with an animated ping dot is rendered
next to the number. Both `title` and `aria-label` are set to
"Produto esgotado — exploradores podem estar inscritos para alerta" so the
admin gets a native tooltip + screen-reader hint. This avoids the need for
an admin-only stock-alerts endpoint (the existing `/api/stock-alerts` is
user-scoped and can't be reused).

## Design compliance
- Dark cosmic theme: `glass-strong` modal, `border-white/10` panels,
  `rounded-2xl` zones, `p-4`/`p-6` paddings.
- Brand neons only: cyan (drop zone accent, restock Bell icon, ImageIcon),
  magenta (Bell indicator + counter overflow), lime/violet untouched.
  NO indigo/blue.
- pt-BR copy, no jargon ("Arraste imagens aqui", "Você já atingiu o
  limite de 5 imagens", "Produto reabastecido!", etc.).
- Mobile-first: `grid-cols-5` thumbnails + flex URL row collapse to
  icon-only "Adicionar" button on `<sm`.
- framer-motion: thumbnail entrance with `initial/animate` scale-in,
  staggered by index.
- shadcn/ui primitives + lucide-react icons (`Upload`, `X`,
  `Image as ImageIcon`, `Bell`, `Plus`, `Loader2`).
- `toast` imported from `sonner` (already present).

## Files modified
- `src/components/views/AdminView.tsx` (only)

## Files explicitly NOT touched
- `AccountView.tsx`, `InfoView.tsx`, `CheckoutView.tsx`,
  `ProductDetailView.tsx`, `ProductCard.tsx`, `Footer.tsx`, `Header.tsx`,
  `page.tsx`, all backend files, all `src/stores/*`.

## Verification
- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1
  | grep AdminView` → **0 errors** in `AdminView.tsx`.
- Dev server (`bun run dev`, port 3000) recompiled successfully after each
  edit (see `dev.log`: only `✓ Compiled in Nms` lines, no errors).
- All remaining `tsc` errors are pre-existing backend issues in
  `src/app/api/**` (addresses, admin/metrics, coupons, orders, etc.) that
  predate this task and are explicitly out of scope.

## Notes for downstream agents
- `ProductFormState.images` is now `string[]`. Any future code that reads
  `form.images` (e.g. for preview outside the modal) should treat it as an
  array, not a comma-separated string.
- The `MAX_PRODUCT_IMAGES` / `MAX_IMAGE_BYTES` constants are module-scoped
  to `AdminView.tsx`. If the account view or product detail view ever needs
  similar upload UX, lift them to `src/lib/constants.ts` (don't duplicate).
- Base64 Data URLs can be large (≈1.33× file size). The backend's
  `JSON.stringify` of the product payload will include them inline; if
  image-heavy products ever hit Next.js body-size limits, the fix belongs
  in `src/app/api/products/route.ts` (out of scope here).
