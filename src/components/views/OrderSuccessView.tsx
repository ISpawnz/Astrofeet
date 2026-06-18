"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Rocket,
  ArrowRight,
  Home,
  Package,
  MapPin,
  CreditCard,
  QrCode,
  Barcode,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { useCheckoutStore } from "@/stores/checkout";
import { useUIStore } from "@/stores/ui";
import { formatPrice, orderStatusLabel } from "@/lib/format";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Order } from "@/lib/types";

const STEPS: { key: Order["status"]; label: string }[] = [
  { key: "created", label: "Recebido" },
  { key: "paid", label: "Pago" },
  { key: "shipped", label: "Enviado" },
  { key: "delivered", label: "Entregue" },
];

function paymentLabel(order: Order): { label: string; icon: React.ReactNode } {
  switch (order.payment.method) {
    case "card":
      return {
        label: order.payment.cardLast4
          ? `Cartão final ${order.payment.cardLast4}`
          : "Cartão de crédito",
        icon: <CreditCard className="h-4 w-4" />,
      };
    case "pix":
      return { label: "Pix", icon: <QrCode className="h-4 w-4" /> };
    case "boleto":
      return { label: "Boleto", icon: <Barcode className="h-4 w-4" /> };
    default:
      return {
        label: orderStatusLabel(order.payment.method) || "Pagamento",
        icon: <CreditCard className="h-4 w-4" />,
      };
  }
}

export function OrderSuccessView() {
  const lastOrder = useCheckoutStore((s) => s.lastOrder);
  const navigate = useUIStore((s) => s.navigate);

  // ---------- No recent order ----------
  if (!lastOrder) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass flex flex-col items-center gap-5 rounded-3xl p-10 sm:p-14"
        >
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
            <div className="absolute inset-0 rounded-full bg-[var(--neon-violet)]/10 blur-2xl" />
            <Package className="h-11 w-11 text-[var(--neon-violet)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Nenhum pedido recente
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Quando você finalizar uma compra, ela aparece aqui com todos os
              detalhes da entrega.
            </p>
          </div>
          <Button
            onClick={() => navigate("home")}
            className="rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-6 py-3 text-sm font-bold text-black hover:opacity-90"
          >
            Voltar ao início
            <Home className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>
    );
  }

  const order = lastOrder;
  const pay = paymentLabel(order);
  const isCancelled = order.status === "cancelled";
  const currentStepIndex = STEPS.findIndex((s) => s.key === order.status);

  async function copyCode() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(order.code);
      } else {
        const tmp = document.createElement("textarea");
        tmp.value = order.code;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        document.body.removeChild(tmp);
      }
      toast.success("Código copiado!");
    } catch {
      toast.error("Não foi possível copiar o código.");
    }
  }

  function talkToNave() {
    toast("Fale com a Nave no canto inferior direito 🚀", {
      description: "Nosso assistente te ajuda com o acompanhamento.",
    });
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      {/* ---------- Hero / celebration ---------- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center text-center"
      >
        {/* floating sparkles */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {[
            { x: "10%", y: "20%", d: 0, c: "var(--neon-cyan)" },
            { x: "85%", y: "15%", d: 0.2, c: "var(--neon-magenta)" },
            { x: "20%", y: "70%", d: 0.4, c: "var(--neon-lime)" },
            { x: "78%", y: "75%", d: 0.6, c: "var(--neon-violet)" },
            { x: "50%", y: "5%", d: 0.8, c: "var(--neon-cyan)" },
          ].map((s, i) => (
            <motion.span
              key={i}
              className="absolute"
              style={{ left: s.x, top: s.y }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0.8] }}
              transition={{
                duration: 1.8,
                delay: s.d,
                repeat: Infinity,
                repeatDelay: 1.2,
              }}
            >
              <Sparkles
                className="h-4 w-4"
                style={{ color: s.c }}
              />
            </motion.span>
          ))}
        </div>

        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
          className="relative flex h-24 w-24 items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full bg-[var(--neon-lime)]/20 blur-2xl" />
          <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-dashed border-[var(--neon-cyan)]/40" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-lime)] to-[var(--neon-cyan)] text-black">
            <CheckCircle2 className="h-11 w-11" strokeWidth={2.5} />
          </div>
        </motion.div>

        <div className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground/80">
          <PartyPopper className="h-3.5 w-3.5 text-[var(--neon-magenta)]" />
          Pedido confirmado
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
          <span className="text-gradient-neon">Pedido confirmado!</span>
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Enviamos a confirmação para{" "}
          <strong className="text-foreground">{order.customer.email}</strong>.
          Seu par já está em preparação para a decolagem.
        </p>

        {/* Code line with copy */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <span className="text-xs text-muted-foreground">Código do pedido:</span>
          <span className="font-mono text-sm font-bold tracking-wider text-[var(--neon-cyan)]">
            {order.code}
          </span>
          <button
            onClick={copyCode}
            className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
            aria-label="Copiar código do pedido"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>

      {/* ---------- Status timeline ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="glass mt-10 rounded-3xl p-6"
      >
        <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Acompanhamento
        </h2>

        {isCancelled ? (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
            <Package className="h-5 w-5" />
            <p className="text-sm">
              Este pedido foi{" "}
              <strong>{orderStatusLabel(order.status)}</strong>. Entre em
              contato com a Nave para mais detalhes.
            </p>
          </div>
        ) : (
          <ol className="flex items-center justify-between">
            {STEPS.map((step, i) => {
              const completed = i <= currentStepIndex;
              const current = i === currentStepIndex;
              return (
                <li
                  key={step.key}
                  className="relative flex flex-1 flex-col items-center text-center"
                >
                  {/* Connector line (except last) */}
                  {i < STEPS.length - 1 && (
                    <span
                      className={[
                        "absolute top-4 left-1/2 h-0.5 w-full",
                        i < currentStepIndex
                          ? "bg-[var(--neon-cyan)]"
                          : "bg-white/10",
                      ].join(" ")}
                    />
                  )}
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 220,
                      damping: 16,
                      delay: 0.2 + i * 0.08,
                    }}
                    className={[
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                      completed
                        ? "border-[var(--neon-cyan)] bg-[var(--neon-cyan)] text-black"
                        : "border-white/15 bg-white/5 text-muted-foreground",
                      current
                        ? "neon-ring-soft"
                        : "",
                    ].join(" ")}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      i + 1
                    )}
                  </motion.span>
                  <span
                    className={[
                      "mt-2 text-[11px] font-medium sm:text-xs",
                      current ? "text-foreground" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </motion.div>

      {/* ---------- Details grid ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mt-6 grid gap-6 md:grid-cols-2"
      >
        {/* Items + totals */}
        <div className="glass rounded-3xl p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <Package className="h-4 w-4 text-[var(--neon-cyan)]" />
            Itens do pedido
          </h2>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li
                key={`${item.productId}-${item.size}`}
                className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <Package className="h-6 w-6 text-muted-foreground" />
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

        {/* Address + payment */}
        <div className="space-y-6">
          <div className="glass rounded-3xl p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-4 w-4 text-[var(--neon-magenta)]" />
              Endereço de entrega
            </h2>
            <p className="text-sm font-medium text-foreground">
              {order.customer.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.address.street}, {order.address.number}
              {order.address.complement ? ` · ${order.address.complement}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.address.district} · {order.address.city}/
              {order.address.state}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              CEP {order.address.cep}
            </p>
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
      </motion.div>

      {/* ---------- CTAs ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
      >
        <Button
          onClick={() => navigate("track-order", { code: lastOrder.code })}
          className="rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-6 py-3 text-sm font-bold text-black hover:opacity-90"
        >
          <Rocket className="h-4 w-4" />
          Rastrear pedido
        </Button>
        <Button
          onClick={talkToNave}
          variant="outline"
          className="rounded-full border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
        >
          Falar com a Nave
        </Button>
        <Button
          onClick={() => navigate("products")}
          variant="outline"
          className="rounded-full border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
        >
          Continuar explorando
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => navigate("home")}
          variant="ghost"
          className="rounded-full px-6 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          Voltar ao início
        </Button>
      </motion.div>
    </section>
  );
}
