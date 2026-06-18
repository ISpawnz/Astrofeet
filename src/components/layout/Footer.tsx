"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  RefreshCw,
  ShieldCheck,
  Headset,
  Instagram,
  Twitter,
  Youtube,
  Github,
  Send,
} from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const TRUST = [
  { emoji: "🚀", title: "Entrega orbital", desc: "Frete grátis acima de R$300" },
  { emoji: "🔄", title: "Troca fácil", desc: "30 dias para trocar ou devolver" },
  { emoji: "🔒", title: "Pagamento seguro", desc: "Cartão, Pix ou Boleto" },
  { emoji: "🛸", title: "Suporte 24/7", desc: "Nave AI pronta pra te ajudar" },
];

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Twitter, label: "Twitter / X", href: "#" },
  { icon: Youtube, label: "Youtube", href: "#" },
  { icon: Github, label: "Github", href: "#" },
];

const LINK_COLUMNS = [
  {
    title: "Explorar",
    links: [
      { label: "Drops", action: "products" as const, params: {} },
      { label: "Novidades", action: "products" as const, params: { sort: "newest" } },
      { label: "Mais vendidos", action: "products" as const, params: { bestSeller: "true" } },
      { label: "Guia de medidas", action: "size-guide" as const, params: {} },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { label: "Rastrear pedido", action: "track-order" as const, params: {} },
      { label: "Trocas e devoluções", action: "nave" as const, params: {} },
      { label: "Fale com a Nave", action: "nave" as const, params: {} },
    ],
  },
  {
    title: "Sobre",
    links: [
      { label: "Quem somos", action: "nave" as const, params: {} },
      { label: "Sustentabilidade", action: "nave" as const, params: {} },
      { label: "Contato", action: "nave" as const, params: {} },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export function Footer() {
  const navigate = useUIStore((s) => s.navigate);
  const openSizeGuide = useUIStore((s) => s.openSizeGuide);
  const openNave = useUIStore((s) => s.openNave);
  const [email, setEmail] = useState("");

  function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("Você entrou na órbita! Fique de olho nos drops. 🚀");
    setEmail("");
  }

  function handleLinkClick(action: string, params: Record<string, string>) {
    if (action === "size-guide") {
      openSizeGuide();
    } else if (action === "nave") {
      openNave();
    } else {
      navigate(action as Parameters<typeof navigate>[0], params);
    }
  }

  return (
    <footer className="mt-auto border-t border-white/10 bg-black/30 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* ── Social links row ── */}
        <div className="mb-10 flex items-center justify-center gap-3">
          {SOCIALS.map((s) => (
            <motion.a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.95 }}
              className="glass-chip flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-all duration-200 hover:border-[var(--neon-cyan)]/50 hover:text-[var(--neon-cyan)] hover:shadow-[0_0_16px_var(--neon-cyan)]"
            >
              <s.icon className="h-4.5 w-4.5" />
            </motion.a>
          ))}
        </div>

        {/* ── Trust badges ── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {TRUST.map((t) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="glass flex items-start gap-3 rounded-2xl border border-white/10 p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--neon-cyan)]/10 text-lg">
                {t.emoji}
              </span>
              <div>
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Orbit divider ── */}
      <div className="orbit-divider" />

      {/* ── Main footer content ── */}
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand + newsletter */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="animate-astro-pulse text-xl font-black text-gradient-neon">
                ASTROFEET
              </span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Sneakers com visual de outro planeta. Cada drop é uma viagem pela
              galáxia da moda.
            </p>

            {/* Newsletter */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Fique por dentro dos drops</p>
              <p className="text-xs text-muted-foreground">
                Receba ofertas exclusivas para quem viaja entre as estrelas.
              </p>
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  required
                  className="h-10 w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--neon-cyan)] transition-colors"
                />
                <button
                  type="submit"
                  className="h-10 shrink-0 rounded-full bg-[var(--neon-cyan)] px-4 text-sm font-semibold text-black transition hover:bg-[var(--neon-cyan)]/90 hover:shadow-[0_0_16px_var(--neon-cyan)]"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Link columns */}
          {LINK_COLUMNS.map((col) => (
            <div key={col.title} className="glass-strong rounded-2xl border border-white/10 p-4">
              <p className="mb-3 text-sm font-semibold">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleLinkClick(link.action, { ...link.params })}
                      className="text-sm text-muted-foreground text-glow-hover transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="orbit-divider" />
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 Astrofeet. Todos os direitos reservados.</p>
          <p>Feito com 💜 e stardust</p>
        </div>
      </div>
    </footer>
  );
}
