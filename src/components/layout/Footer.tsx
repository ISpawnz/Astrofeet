"use client";

import { useUIStore } from "@/stores/ui";
import { Truck, RefreshCw, ShieldCheck, Headset } from "lucide-react";

const TRUST = [
  { icon: Truck, title: "Entrega orbital", desc: "Frete grátis acima de R$300" },
  { icon: RefreshCw, title: "Troca fácil", desc: "30 dias para trocar ou devolver" },
  { icon: ShieldCheck, title: "Pagamento seguro", desc: "Cartão, Pix ou boleto" },
  { icon: Headset, title: "Suporte 24/7", desc: "Nave pronta pra te ajudar" },
];

export function Footer() {
  const navigate = useUIStore((s) => s.navigate);

  return (
    <footer className="mt-auto border-t border-white/10 bg-black/30 backdrop-blur-md">
      {/* Trust block */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {TRUST.map((t) => (
            <div
              key={t.title}
              className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]">
                <t.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="grid gap-8 border-t border-white/5 pt-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="animate-astro-pulse text-xl font-black text-gradient-neon">
                ASTROFEET
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Sneakers com visual de outro planeta. Cada drop é uma viagem pela
              galáxia da moda.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Explorar</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button onClick={() => navigate("products", {})} className="hover:text-foreground">
                  Todos os modelos
                </button>
              </li>
              <li>
                <button onClick={() => navigate("products", { sort: "newest" })} className="hover:text-foreground">
                  Novidades
                </button>
              </li>
              <li>
                <button onClick={() => navigate("products", { bestSeller: "true" })} className="hover:text-foreground">
                  Mais vendidos
                </button>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Atendimento</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button
                  onClick={() => navigate("track-order")}
                  className="transition hover:text-foreground"
                >
                  Rastrear pedido
                </button>
              </li>
              <li>Entrega e prazos</li>
              <li>Trocas e devoluções</li>
              <li>Formas de pagamento</li>
              <li>WhatsApp: (11) 99999-0000</li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Newsletter</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Entre na órbita e receba os drops em primeira mão.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex gap-2"
            >
              <input
                type="email"
                placeholder="Seu e-mail"
                className="h-10 w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--neon-cyan)]"
              />
              <button
                type="submit"
                className="h-10 shrink-0 rounded-full bg-[var(--neon-cyan)] px-4 text-sm font-semibold text-black hover:bg-[var(--neon-cyan)]/90"
              >
                Assinar
              </button>
            </form>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Astrofeet. Todos os direitos reservados.</p>
          <p>Feito entre as estrelas 🛰️</p>
        </div>
      </div>
    </footer>
  );
}
