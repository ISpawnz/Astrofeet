"use client";

import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { stockFor } from "@/shared/rules";
import type { Product } from "@/shared/types";

/** Botões de tamanho com estoque por tamanho (esgotado riscado, "últimas" em âmbar). */
export function SizePicker({
  product,
  value,
  onChange,
  compact = false,
}: {
  product: Product;
  value: number | null;
  onChange: (size: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap", compact ? "gap-1.5" : "gap-2")}>
      {product.sizes.map((s) => {
        const stock = stockFor(product, s);
        const soldOut = stock <= 0;
        const low = !soldOut && stock <= 2;
        const selected = value === s && !soldOut;
        return (
          <button
            key={s}
            type="button"
            onClick={() => !soldOut && onChange(s)}
            disabled={soldOut}
            aria-pressed={selected}
            title={soldOut ? `Tamanho ${s} esgotado` : low ? `Últimas ${stock} unidades` : `Tamanho ${s}`}
            className={cn(
              "relative rounded-xl border font-bold transition",
              compact ? "h-9 min-w-10 px-2.5 text-xs" : "h-12 min-w-14 px-3 text-sm",
              soldOut && "cursor-not-allowed line-through opacity-40",
              selected
                ? "border-foreground bg-foreground text-background"
                : low
                  ? "border-amber-500/40 bg-amber-500/5 text-amber-800 hover:border-amber-500/60"
                  : "hover:border-foreground/40",
            )}
          >
            {s}
            {selected && !compact && (
              <Check className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--brand)] p-0.5 text-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** − n + com limites. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  compact = false,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
}) {
  const btn = cn(
    "flex items-center justify-center rounded-full transition hover:bg-black/5 disabled:opacity-40",
    compact ? "h-7 w-7" : "h-9 w-9",
  );
  const icon = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="inline-flex w-fit items-center gap-1 rounded-full border p-0.5">
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Diminuir quantidade"
      >
        <Minus className={icon} />
      </button>
      <span className="w-7 text-center text-sm font-bold tabular-nums">{value}</span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Aumentar quantidade"
      >
        <Plus className={icon} />
      </button>
    </div>
  );
}
