"use client";

import { Instagram, Twitter, Youtube } from "lucide-react";
import { useUIStore } from "@/stores/ui";

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Twitter, label: "X (Twitter)", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
];

const LINK_COLUMNS = [
  {
    title: "Comprar",
    links: [
      { label: "Lançamentos", action: "products" as const, params: { sort: "newest" } },
      { label: "Todos os tênis", action: "products" as const, params: {} },
      { label: "Mais vendidos", action: "products" as const, params: { bestSeller: "true" } },
      { label: "Guia de medidas", action: "size-guide" as const, params: {} },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { label: "Rastrear pedido", action: "track-order" as const, params: {} },
      { label: "Trocas e devoluções", action: "info" as const, params: { page: "trocas" } },
      { label: "Fale conosco", action: "assistant" as const, params: {} },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Quem somos", action: "info" as const, params: { page: "quem-somos" } },
      { label: "Sustentabilidade", action: "info" as const, params: { page: "sustentabilidade" } },
      { label: "Contato", action: "info" as const, params: { page: "contato" } },
    ],
  },
] as const;

export function Footer() {
  const navigate = useUIStore((s) => s.navigate);
  const openSizeGuide = useUIStore((s) => s.openSizeGuide);
  const openAssistant = useUIStore((s) => s.openNave);

  function handleLinkClick(action: string, params: Record<string, string>) {
    if (action === "size-guide") openSizeGuide();
    else if (action === "assistant") openAssistant();
    else navigate(action as Parameters<typeof navigate>[0], params);
  }

  return (
    <footer className="mt-auto bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <p className="text-2xl font-black tracking-tighter uppercase">Astrofeet</p>
          <p className="max-w-xs text-sm text-white/65">
            Tênis com design próprio para correr, andar e viver a cidade.
          </p>
          <div className="flex gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-white hover:text-white"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {LINK_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="mb-4 text-sm font-bold">{col.title}</p>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => handleLinkClick(link.action, { ...link.params })}
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-white/55 sm:flex-row sm:px-6">
          <p>© 2026 Astrofeet. Todos os direitos reservados.</p>
          <p>Pix · Cartão de crédito · Boleto</p>
        </div>
      </div>
    </footer>
  );
}
