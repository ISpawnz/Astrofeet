"use client";

import { motion } from "framer-motion";
import { AlertCircle, Check, Package, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "created", label: "Recebido", Icon: Check },
  { key: "paid", label: "Pago", Icon: Check },
  { key: "shipped", label: "Enviado", Icon: Truck },
  { key: "delivered", label: "Entregue", Icon: Package },
];

/** Etapas do pedido (vertical no mobile, horizontal a partir de sm). */
export function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled")
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p>
          Este pedido foi <strong>cancelado</strong>. Se achar que é um erro, fale com nosso assistente.
        </p>
      </div>
    );

  const current = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="flex flex-col gap-5 sm:flex-row sm:justify-between">
      {STEPS.map(({ key, label, Icon }, i) => (
        <li key={key} className="relative flex flex-1 items-center gap-3 sm:flex-col sm:text-center">
          {i < STEPS.length - 1 && (
            <span
              aria-hidden
              className={cn(
                "absolute top-9 left-[18px] h-full w-0.5 sm:top-[18px] sm:left-1/2 sm:h-0.5 sm:w-full",
                i < current ? "bg-[var(--brand)]" : "bg-border",
              )}
            />
          )}
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 + i * 0.07 }}
            className={cn(
              "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
              i <= current
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "bg-background text-muted-foreground",
              i === current && "ring-4 ring-[var(--brand)]/20",
            )}
          >
            {i <= current ? <Icon className="h-4 w-4" /> : i + 1}
          </motion.span>
          <span className={cn("text-xs font-medium", i === current ? "text-foreground" : "text-muted-foreground")}>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}
