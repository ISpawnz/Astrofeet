"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Trash2, Truck, RefreshCcw, CreditCard } from "lucide-react";
import { api } from "@/client/api";
import { useUIStore } from "@/stores/ui";
import { useCartStore } from "@/stores/cart";
import { useRecentStore } from "@/stores/recent";
import { ProductCard, cardProduct } from "./ProductCard";
import { formatPrice } from "@/shared/format";
import { toast } from "sonner";
import type { Product } from "@/shared/types";
import { fadeUp } from "@/components/shared/motion";

const COUPONS = [
  { code: "GALAXIA10", label: "10% off", desc: "na primeira compra" },
  { code: "ORBITA50", label: "R$50 off", desc: "acima de R$300" },
  { code: "DROP15", label: "15% off", desc: "acima de R$500" },
];

export function HomeView() {
  const navigate = useUIStore((s) => s.navigate);
  const add = useCartStore((s) => s.add);
  const recent = useRecentStore((s) => s.items);
  const recentHydrated = useRecentStore((s) => s.hydrated);
  const clearRecent = useRecentStore((s) => s.clear);

  const { data: featured } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => api.products({ featured: true }),
  });
  const { data: bestSellers } = useQuery({
    queryKey: ["products", "bestSeller"],
    queryFn: () => api.products({ bestSeller: true }),
  });
  const { data: newest } = useQuery({
    queryKey: ["products", "newest"],
    queryFn: () => api.products({ sort: "newest" }),
  });

  const hero = featured?.[0];
  const highlights = featured?.slice(1, 4) ?? [];

  // Uma foto por categoria, a partir do catálogo já carregado.
  const categories = useMemo(() => {
    const seen = new Map<string, Product>();
    for (const p of newest ?? []) if (!seen.has(p.category)) seen.set(p.category, p);
    return Array.from(seen.entries()).slice(0, 4);
  }, [newest]);

  function heroAdd() {
    if (!hero) return;
    const size = hero.sizes[Math.floor(hero.sizes.length / 2)] ?? hero.sizes[0];
    if (size) {
      add(hero, size, 1);
      toast.success(`${hero.name} (tam. ${size}) adicionado ao carrinho`);
    }
  }

  return (
    <div className="flex flex-col">
      {/* ---------- HERO ---------- */}
      <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-16">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--brand)] uppercase">Nova coleção</p>
          <h1 className="mt-4 text-5xl leading-[0.95] font-black tracking-tighter text-balance sm:text-6xl lg:text-7xl xl:text-8xl">
            Feito para andar mais longe.
          </h1>
          <p className="mt-6 max-w-md text-lg text-pretty text-muted-foreground">
            Tênis de corrida, casual e skate com design próprio, conforto para o dia inteiro e entrega para todo o
            Brasil.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("products")}
              className="btn-cosmic group inline-flex h-12 items-center gap-2 rounded-full bg-[var(--brand)] px-7 text-sm font-bold text-white hover:bg-[var(--brand)]/90"
            >
              Comprar agora
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => navigate("products", { sort: "newest" })}
              className="inline-flex h-12 items-center rounded-full border border-foreground px-7 text-sm font-bold transition hover:bg-foreground hover:text-background"
            >
              Ver lançamentos
            </button>
          </div>
          <ul className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-6 text-sm">
            {[
              { icon: Truck, t: "Frete grátis", d: "acima de R$300" },
              { icon: RefreshCcw, t: "Troca grátis", d: "em até 30 dias" },
              { icon: CreditCard, t: "10x sem juros", d: "no cartão" },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t}>
                <Icon className="h-5 w-5" aria-hidden />
                <p className="mt-2 font-semibold">{t}</p>
                <p className="text-xs text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {hero ? (
            <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-[var(--surface)] sm:aspect-square lg:aspect-[4/5]">
              <button
                onClick={() => navigate("product", { id: hero.slug })}
                className="absolute inset-0"
                aria-label={`Ver ${hero.name}`}
              >
                <img
                  src={hero.images[0]}
                  alt={hero.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              </button>
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-lg sm:inset-x-6 sm:bottom-6">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {hero.badge ?? "Em destaque"}
                  </p>
                  <p className="truncate font-bold">{hero.name}</p>
                  <p className="text-sm">{formatPrice(hero.price)}</p>
                </div>
                <button
                  onClick={heroAdd}
                  className="shrink-0 rounded-full bg-foreground px-4 py-2.5 text-sm font-bold text-background transition hover:bg-foreground/85"
                >
                  Adicionar
                </button>
              </div>
            </div>
          ) : (
            <div className="shimmer aspect-[4/3] rounded-3xl sm:aspect-square lg:aspect-[4/5]" />
          )}
        </motion.div>
      </section>

      {/* ---------- CATEGORIAS ---------- */}
      {categories.length > 0 && (
        <Section title="Compre por categoria">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {categories.map(([category, p]) => (
              <button
                key={category}
                onClick={() => navigate("products", { category })}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--surface)] text-left"
              >
                <img
                  src={p.images[0]}
                  alt=""
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <span className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-full bg-white px-4 py-2.5 text-sm font-bold shadow-sm">
                  {category}
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ---------- LANÇAMENTOS ---------- */}
      {newest && newest.length > 0 && (
        <Section title="Lançamentos" action={() => navigate("products", { sort: "newest" })} actionLabel="Ver todos">
          <div className={`grid grid-cols-2 gap-x-4 gap-y-8 ${colsLg(Math.min(newest.length, 4), 4)}`}>
            {newest.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ---------- BANNER + CUPONS ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-foreground text-background">
          <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-white/60 uppercase">Oferta da semana</p>
              <h2 className="mt-3 max-w-lg text-4xl leading-[1.05] font-black tracking-tighter sm:text-5xl">
                Frete grátis em compras acima de R$300.
              </h2>
              <button
                onClick={() => navigate("products")}
                className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-[#111] transition hover:bg-white/85"
              >
                Aproveitar
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <ul className="grid gap-2">
              {COUPONS.map((c) => (
                <li key={c.code}>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(c.code).catch(() => {});
                      toast.success(`Cupom ${c.code} copiado! Use no checkout.`);
                    }}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/15 px-5 py-4 text-left transition hover:border-white/40 hover:bg-white/5"
                  >
                    <span>
                      <span className="block font-mono text-lg font-bold tracking-wide">{c.code}</span>
                      <span className="text-xs text-white/60">{c.desc}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-bold">{c.label}</span>
                      <span className="text-xs text-white/60">Copiar</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- DESTAQUES ---------- */}
      {highlights.length > 0 && (
        <Section
          title="Edições limitadas"
          action={() => navigate("products", { featured: "true" })}
          actionLabel="Ver todos"
        >
          <div className={`grid grid-cols-2 gap-x-4 gap-y-8 ${colsLg(highlights.length, 3)}`}>
            {highlights.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ---------- MAIS VENDIDOS ---------- */}
      {bestSellers && bestSellers.length > 0 && (
        <Section
          title="Mais vendidos"
          action={() => navigate("products", { bestSeller: "true" })}
          actionLabel="Ver todos"
        >
          <div className={`grid grid-cols-2 gap-x-4 gap-y-8 ${colsLg(Math.min(bestSellers.length, 4), 4)}`}>
            {bestSellers.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ---------- VISTOS RECENTEMENTE ---------- */}
      {recentHydrated && recent.length > 0 && (
        <Section
          title="Vistos recentemente"
          action={() => {
            clearRecent();
            toast.success("Histórico de visualizações limpo.");
          }}
          actionLabel="Limpar"
          actionIcon={<Trash2 className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {recent.slice(0, 4).map((r, i) => (
              <ProductCard key={r.id} product={cardProduct(r)} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ---------- NEWSLETTER ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 rounded-3xl bg-[var(--surface)] p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tighter sm:text-4xl">Receba os lançamentos primeiro.</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Novidades, reposições e ofertas exclusivas direto no seu e-mail. Sem spam.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Inscrição confirmada! Obrigado.");
              (e.currentTarget as HTMLFormElement).reset();
            }}
            className="flex w-full gap-2"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              E-mail
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              placeholder="Seu melhor e-mail"
              className="h-12 min-w-0 flex-1 rounded-full border border-input bg-white px-5 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground"
            />
            <button
              type="submit"
              className="h-12 shrink-0 rounded-full bg-foreground px-6 text-sm font-bold text-background hover:bg-foreground/85"
            >
              Assinar
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

// Colunas no desktop = nº de itens (até o máximo), para a última linha nunca
// ficar com um buraco. Classes estáticas para o Tailwind enxergá-las.
function colsLg(count: number, max: 3 | 4): string {
  const n = Math.max(1, Math.min(count, max));
  return n === 1 ? "lg:grid-cols-1" : n === 2 ? "lg:grid-cols-2" : n === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
}

function Section({
  title,
  action,
  actionLabel,
  actionIcon,
  children,
}: {
  title: string;
  action?: () => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-black tracking-tighter sm:text-3xl">{title}</h2>
        {action && actionLabel && (
          <button
            onClick={action}
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
          >
            {actionLabel}
            {actionIcon ?? <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
