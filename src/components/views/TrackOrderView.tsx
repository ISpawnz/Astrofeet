"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Search,
  Loader2,
  Package,
  MapPin,
  CreditCard,
  QrCode,
  Barcode,
  Check,
  CalendarDays,
  User,
  AlertCircle,
  Orbit,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { useCheckoutStore } from "@/stores/checkout";
import { api } from "@/client/api";
import {
  formatPrice,
  formatDate,
  orderStatusLabel,
  orderStatusColor,
} from "@/shared/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type TrackedOrder = {
  code: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  items: {
    name: string;
    quantity: number;
    size: number;
    unitPrice: number;
    subtotal: number;
  }[];
  customerName: string;
  city: string;
  state: string;
  paymentMethod: string;
  createdAt: string;
};

const STEPS: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: "created", label: "Recebido", icon: <Check className="h-4 w-4" /> },
  { key: "paid", label: "Pago", icon: <Check className="h-4 w-4" /> },
  { key: "shipped", label: "Enviado", icon: <Rocket className="h-4 w-4" /> },
  { key: "delivered", label: "Entregue", icon: <Package className="h-4 w-4" /> },
];

function paymentMethodInfo(method: string): {
  label: string;
  icon: React.ReactNode;
} {
  switch (method) {
    case "card":
      return { label: "Cartão de crédito", icon: <CreditCard className="h-4 w-4" /> };
    case "pix":
      return { label: "Pix", icon: <QrCode className="h-4 w-4" /> };
    case "boleto":
      return { label: "Boleto", icon: <Barcode className="h-4 w-4" /> };
    default:
      return { label: method || "Pagamento", icon: <CreditCard className="h-4 w-4" /> };
  }
}

function InitialState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass mx-auto flex max-w-xl flex-col items-center gap-5 rounded-3xl p-10 text-center sm:p-14"
    >
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[var(--neon-cyan)]/15 blur-3xl" />
        <Orbit className="absolute inset-0 h-full w-full text-[var(--neon-violet)]/30" />
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <Rocket className="h-10 w-10 text-[var(--neon-cyan)]" />
        </motion.div>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold sm:text-3xl">Pronto para decolar?</h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Insira o código do seu pedido acima para acompanhar cada etapa da viagem.
        </p>
      </div>
      <div className="flex items-start gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-left">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--neon-lime)]" />
        <p className="text-xs text-muted-foreground">
          Não tem o código? Ele vem no e-mail de confirmação. Exemplo:{" "}
          <span className="font-mono font-semibold text-[var(--neon-cyan)]">
            AST-123456
          </span>
          .
        </p>
      </div>
    </motion.div>
  );
}

function NotFoundState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="glass mx-auto flex max-w-xl flex-col items-center gap-4 rounded-3xl p-10 text-center sm:p-12"
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-rose-500/15 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10">
          <AlertCircle className="h-8 w-8 text-rose-300" />
        </div>
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold sm:text-2xl">Pedido não encontrado</h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Confira o código e tente de novo. O e-mail de confirmação tem o código
          certo para colar aqui.
        </p>
      </div>
      <Button
        onClick={onRetry}
        variant="outline"
        className="rounded-full border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
      >
        Tentar de novo
      </Button>
    </motion.div>
  );
}

function StatusTimeline({ status }: { status: string }) {
  const isCancelled = status === "cancelled";
  const currentStepIndex = STEPS.findIndex((s) => s.key === status);

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm">
          Este pedido foi <strong>cancelado</strong>. Se achar que é um erro,
          fale com a Nave no canto inferior direito.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      {STEPS.map((step, i) => {
        const completed = i <= currentStepIndex;
        const current = i === currentStepIndex;
        return (
          <li
            key={step.key}
            className="relative flex flex-1 items-center gap-3 sm:flex-col sm:items-center sm:text-center"
          >
            {/* Connector — vertical on mobile, horizontal on sm+ */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute left-[18px] top-9 h-[calc(100%+0.25rem)] w-0.5 sm:left-1/2 sm:top-9 sm:h-0.5 sm:w-full sm:-translate-x-1/2",
                  i < currentStepIndex
                    ? "bg-[var(--neon-cyan)]"
                    : "bg-white/10",
                )}
              />
            )}

            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
              {/* pulsing ring on active step */}
              {current && (
                <motion.span
                  className="absolute inset-0 rounded-full border border-[var(--neon-cyan)]"
                  initial={{ opacity: 0.7, scale: 1 }}
                  animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.6, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 220,
                  damping: 16,
                  delay: 0.1 + i * 0.07,
                }}
                className={cn(
                  "relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                  completed
                    ? "border-[var(--neon-cyan)] bg-[var(--neon-cyan)] text-black"
                    : "border-white/15 bg-white/5 text-muted-foreground",
                  current && "neon-ring-soft",
                )}
              >
                {completed ? step.icon : i + 1}
              </motion.span>
            </div>

            <span
              className={cn(
                "text-xs font-medium sm:mt-2",
                current ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ResultPanel({ order }: { order: TrackedOrder }) {
  const pay = paymentMethodInfo(order.paymentMethod);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* ---------- Code + status ---------- */}
      <div className="glass-strong flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Pedido
          </p>
          <p className="font-mono text-2xl font-black tracking-wider text-[var(--neon-cyan)] neon-text sm:text-3xl">
            {order.code}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "h-9 gap-1.5 rounded-full px-4 text-sm font-semibold",
            orderStatusColor(order.status),
          )}
        >
          {orderStatusLabel(order.status)}
        </Badge>
      </div>

      {/* ---------- Timeline ---------- */}
      <div className="glass rounded-3xl p-6">
        <h2 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Orbit className="h-4 w-4 text-[var(--neon-violet)]" />
          Status da entrega
        </h2>
        <StatusTimeline status={order.status} />
      </div>

      {/* ---------- Summary ---------- */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Items + totals */}
        <div className="glass rounded-3xl p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <Package className="h-4 w-4 text-[var(--neon-cyan)]" />
            Itens do pedido
          </h2>
          <ul className="space-y-3">
            {order.items.map((item, i) => (
              <li
                key={`${item.name}-${item.size}-${i}`}
                className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tam. {item.size} · Qtd. {item.quantity} ·{" "}
                    {formatPrice(item.unitPrice)}
                  </p>
                </div>
                <p className="self-center text-sm font-bold">
                  {formatPrice(item.subtotal)}
                </p>
              </li>
            ))}
          </ul>

          <Separator className="my-4 bg-white/10" />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">
                {formatPrice(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Frete</span>
              {order.shipping === 0 ? (
                <span className="font-semibold text-[var(--neon-lime)]">
                  Grátis
                </span>
              ) : (
                <span className="font-medium text-foreground">
                  {formatPrice(order.shipping)}
                </span>
              )}
            </div>
            <Separator className="my-2 bg-white/10" />
            <div className="flex items-end justify-between pt-1">
              <span className="text-base font-semibold">Total</span>
              <span className="text-xl font-black text-gradient-neon">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer + payment */}
        <div className="space-y-6">
          <div className="glass rounded-3xl p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <User className="h-4 w-4 text-[var(--neon-magenta)]" />
              Cliente
            </h2>
            <p className="text-sm font-medium text-foreground">
              {order.customerName}
            </p>
            <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--neon-magenta)]" />
              <span>
                {order.city}/{order.state}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 shrink-0 text-[var(--neon-violet)]" />
              <span>{formatDate(order.createdAt)}</span>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <CreditCard className="h-4 w-4 text-[var(--neon-violet)]" />
              Pagamento
            </h2>
            <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[var(--neon-cyan)]">
                {pay.icon}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{pay.label}</span>
                <span className="text-[11px] text-muted-foreground">
                  Status: {orderStatusLabel(order.status)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Reassurance ---------- */}
      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-[var(--neon-lime)]" />
        Atualizamos o status a cada etapa. Em caso de dúvida, fale com a Nave no
        canto inferior.
      </p>
    </motion.div>
  );
}

export function TrackOrderView() {
  const navigate = useUIStore((s) => s.navigate);
  const params = useUIStore((s) => s.params);
  const lastOrder = useCheckoutStore((s) => s.lastOrder);

  const initialCode =
    (typeof params.code === "string" ? params.code : "") ||
    lastOrder?.code ||
    "";

  const [code, setCode] = useState(initialCode);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Re-prefill if params change (e.g. navigated from order-success CTA)
  useEffect(() => {
    if (typeof params.code === "string" && params.code) {
      setCode(params.code);
      setError(null);
      setNotFound(false);
      setResult(null);
    }
  }, [params.code]);

  function normalizeCode(value: string): string {
    return value.trim().toUpperCase();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeCode(code);
    if (!normalized) {
      setError("Digite o código do seu pedido.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Informe o e-mail usado na compra para consultar o pedido.");
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);
    setResult(null);
    try {
      const data = await api.trackOrder(normalized, email.trim());
      setResult(data.order);
      toast.success("Pedido localizado!");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível localizar o pedido.";
      setError(message);
      setNotFound(true);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    setNotFound(false);
    setError(null);
    setCode("");
    const input = document.getElementById("track-code-input") as HTMLInputElement | null;
    input?.focus();
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      {/* ---------- Header ---------- */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2 text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[var(--neon-cyan)]">
          <Rocket className="h-3.5 w-3.5" />
          Acompanhe sua encomenda
        </div>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          <span className="text-gradient-neon">Rastrear pedido</span>
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          Digite o código do seu pedido para ver onde ele está na rota.
        </p>
      </motion.header>

      {/* ---------- Search form ---------- */}
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="glass-strong mt-8 rounded-3xl p-5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="track-code-input" className="text-xs uppercase tracking-wider text-muted-foreground">
              Código do pedido
            </Label>
            <Input
              id="track-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="AST-123456"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              disabled={loading}
              className="h-11 rounded-xl border-white/10 bg-white/5 font-mono text-sm tracking-wider uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal focus:border-[var(--neon-cyan)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="track-email-input" className="text-xs uppercase tracking-wider text-muted-foreground">
              E-mail da compra
            </Label>
            <Input
              id="track-email-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={loading}
              className="h-11 rounded-xl border-white/10 bg-white/5 text-sm focus:border-[var(--neon-cyan)]"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 rounded-xl bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-6 text-sm font-bold text-black hover:opacity-90 sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {loading ? "Rastreando..." : "Rastrear"}
          </Button>
        </div>

        {error && !notFound && (
          <p className="mt-3 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}
      </motion.form>

      {/* ---------- Body ---------- */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          {result ? (
            <ResultPanel key="result" order={result} />
          ) : notFound ? (
            <NotFoundState key="notfound" onRetry={retry} />
          ) : (
            <InitialState key="initial" />
          )}
        </AnimatePresence>
      </div>

      {/* ---------- Footer CTA ---------- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
      >
        <Button
          onClick={() => navigate("products")}
          variant="outline"
          className="rounded-full border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
        >
          Continuar explorando
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => navigate("home")}
          variant="ghost"
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
        >
          Voltar ao início
        </Button>
      </motion.div>
    </section>
  );
}

export default TrackOrderView;
