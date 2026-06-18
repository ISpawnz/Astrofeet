"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Flame, Rocket, ShieldCheck } from "lucide-react";
import { api } from "@/lib/client";
import { useUIStore } from "@/stores/ui";
import { useCartStore } from "@/stores/cart";
import { ProductCard } from "./ProductCard";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export function HomeView() {
  const navigate = useUIStore((s) => s.navigate);
  const add = useCartStore((s) => s.add);

  const { data: featured } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => api.products({ featured: "true" }),
  });
  const { data: bestSellers } = useQuery({
    queryKey: ["products", "bestSeller"],
    queryFn: () => api.products({ bestSeller: "true" }),
  });
  const { data: newest } = useQuery({
    queryKey: ["products", "newest"],
    queryFn: () => api.products({ sort: "newest" }),
  });

  const hero = featured?.[0];
  const drops = featured?.slice(1, 4) ?? [];

  function heroAdd() {
    if (!hero) return;
    const size = hero.sizes[Math.floor(hero.sizes.length / 2)] ?? hero.sizes[0];
    if (size) {
      add(hero, size, 1);
      toast.success(`${hero.name} adicionado ao carrinho`);
    }
  }

  return (
    <div className="flex flex-col">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:pt-20">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 text-center lg:text-left"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
              Drop limitado · edição galáxia
            </span>
            <h1 className="mt-5 text-balance text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Sneakers com
              <br />
              <span className="text-gradient-neon animate-astro-pulse">
                visual de outro
              </span>
              <br />
              planeta.
            </h1>
            <p className="mx-auto mt-5 max-w-md text-pretty text-base text-muted-foreground lg:mx-0">
              Cada par da Astrofeet é uma nave para seus pés. Explore os drops,
              escolha seu tamanho e decole.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <button
                onClick={() => navigate("products")}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-6 py-3 text-sm font-bold text-black transition hover:opacity-90"
              >
                Explorar drops
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
              {hero && (
                <button
                  onClick={() => navigate("product", { id: hero.slug })}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
                >
                  Ver destaque
                </button>
              )}
            </div>
            {/* mini stats */}
            <div className="mt-9 flex items-center justify-center gap-6 text-center lg:justify-start">
              {[
                { n: "6", l: "drops em órbita" },
                { n: "4.7★", l: "avaliação média" },
                { n: "30d", l: "para trocar" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="text-xl font-black text-gradient-neon">{s.n}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero product */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative"
          >
            <div className="relative mx-auto aspect-square max-w-md">
              {/* orbit rings */}
              <div className="absolute inset-0 rounded-full border border-white/5 animate-spin-slow" />
              <div className="absolute inset-8 rounded-full border border-white/[0.07]" />
              <div className="absolute inset-16 rounded-full border border-white/[0.04]" />
              {/* glow */}
              {hero && (
                <div
                  className="absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
                  style={{ background: hero.accent }}
                />
              )}
              {hero && (
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <img
                    src={hero.images[0]}
                    alt={hero.name}
                    className="h-full w-full animate-astro-float object-contain drop-shadow-2xl"
                  />
                </div>
              )}
              {/* floating price chip */}
              {hero && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-2xl glass-strong px-5 py-3 text-center"
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {hero.badge ?? "Em destaque"}
                  </p>
                  <p className="text-sm font-bold">{hero.name}</p>
                  <button
                    onClick={heroAdd}
                    className="mt-1 text-xs font-semibold text-[var(--neon-cyan)] hover:underline"
                  >
                    Adicionar por {formatPrice(hero.price)} →
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------- DROPS LIMITADOS ---------- */}
      {drops.length > 0 && (
        <Section
          eyebrow="Edição galáxia"
          title="Escolha seu drop"
          icon={<Flame className="h-4 w-4 text-[var(--neon-magenta)]" />}
          action={() => navigate("products")}
          actionLabel="Ver todos"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drops.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ---------- PROMO BANNER ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--neon-violet)]/15 via-transparent to-[var(--neon-magenta)]/15 p-8 sm:p-12"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--neon-magenta)] opacity-20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[var(--neon-cyan)] opacity-20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                <Rocket className="h-3.5 w-3.5" />
                Promoção da semana
              </span>
              <h3 className="mt-3 max-w-xl text-3xl font-black sm:text-4xl">
                Frete grátis para toda a galáxia acima de{" "}
                <span className="text-gradient-neon">R$300</span>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Aproveite o impulso e leve seu sneaker orbital com entrega por
                nossa conta.
              </p>
            </div>
            <button
              onClick={() => navigate("products")}
              className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:opacity-90"
            >
              Aproveitar
            </button>
          </div>
        </motion.div>
      </section>

      {/* ---------- NOVIDADES ---------- */}
      {newest && newest.length > 0 && (
        <Section
          eyebrow="Recém-chegados"
          title="Novidades no radar"
          icon={<Sparkles className="h-4 w-4 text-[var(--neon-cyan)]" />}
          action={() => navigate("products", { sort: "newest" })}
          actionLabel="Ver novidades"
        >
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {newest.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ---------- MAIS VENDIDOS ---------- */}
      {bestSellers && bestSellers.length > 0 && (
        <Section
          eyebrow="Os preferidos"
          title="Mais vendidos da órbita"
          icon={<Flame className="h-4 w-4 text-[var(--neon-lime)]" />}
          action={() => navigate("products", { bestSeller: "true" })}
          actionLabel="Ver mais vendidos"
        >
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {bestSellers.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ---------- NEWSLETTER CTA ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center sm:p-14">
          <div className="absolute inset-0 grid-overlay opacity-30" />
          <div className="relative">
            <ShieldCheck className="mx-auto h-8 w-8 text-[var(--neon-cyan)]" />
            <h3 className="mt-4 text-2xl font-black sm:text-3xl">
              Entre na órbita da Astrofeet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Receba os drops em primeira mão e ofertas exclusivas para quem
              viaja entre as estrelas.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Inscrição confirmada! Bem-vindo a bordo 🚀");
                (e.currentTarget as HTMLFormElement).reset();
              }}
              className="mx-auto mt-6 flex max-w-md gap-2"
            >
              <input
                type="email"
                required
                placeholder="Seu melhor e-mail"
                className="h-12 flex-1 rounded-full border border-white/10 bg-white/5 px-5 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--neon-cyan)]"
              />
              <button
                type="submit"
                className="h-12 shrink-0 rounded-full bg-[var(--neon-cyan)] px-6 text-sm font-bold text-black hover:opacity-90"
              >
                Assinar
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  icon,
  action,
  actionLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  icon?: React.ReactNode;
  action?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            {icon}
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">{title}</h2>
        </div>
        {action && actionLabel && (
          <button
            onClick={action}
            className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--neon-cyan)] hover:underline"
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
