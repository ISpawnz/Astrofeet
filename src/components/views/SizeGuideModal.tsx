"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUIStore } from "@/stores/ui";
import { motion } from "framer-motion";
import { Ruler, X } from "lucide-react";

const ROWS = [
  { br: 36, eu: 37, us: 5, cm: 22.5 },
  { br: 37, eu: 38, us: 6, cm: 23.1 },
  { br: 38, eu: 39, us: 7, cm: 23.8 },
  { br: 39, eu: 40, us: 8, cm: 24.5 },
  { br: 40, eu: 41, us: 9, cm: 25.1 },
  { br: 41, eu: 42, us: 10, cm: 25.7 },
  { br: 42, eu: 43, us: 11, cm: 26.4 },
  { br: 43, eu: 44, us: 12, cm: 27.0 },
  { br: 44, eu: 45, us: 13, cm: 27.7 },
];

const TIPS = [
  {
    title: "Meça no fim do dia",
    desc: "Seus pés ficam um pouco maiores ao final do dia. Meça nesse horário para um ajuste perfeito.",
  },
  {
    title: "Use a mesma meia",
    desc: "Meça com a meia que você vai usar com o sneaker para não errar o tamanho.",
  },
  {
    title: "Pé maior? Use ele",
    desc: "Quase todo mundo tem um pé um pouco maior. Use a medida do maior para escolher o tamanho.",
  },
  {
    title: "Em dúvida, suba um",
    desc: "Entre dois tamanhos, prefira o maior. Um leve folgo é mais confortável que aperto.",
  },
];

export function SizeGuideModal() {
  const open = useUIStore((s) => s.sizeGuideOpen);
  const close = useUIStore((s) => s.closeSizeGuide);

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : close())}>
      <DialogContent
        className="max-h-[88vh] overflow-y-auto border-black/10 bg-background p-0 backdrop-blur-xl sm:max-w-2xl"
        aria-describedby="size-guide-desc"
      >
        <DialogHeader className="border-b border-black/10 px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)]/15 text-[var(--brand)]">
              <Ruler className="h-4 w-4" />
            </span>
            Guia de medidas
          </DialogTitle>
          <DialogDescription id="size-guide-desc" className="sr-only">
            Tabela de conversão de tamanhos e dicas para acertar na escolha.
          </DialogDescription>
          <p className="text-sm text-muted-foreground">
            Encontre seu tamanho ideal e evite trocas.
          </p>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-2xl border border-black/10"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black/[0.024] text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">BR</th>
                  <th className="px-4 py-3 font-semibold">EU</th>
                  <th className="px-4 py-3 font-semibold">US</th>
                  <th className="px-4 py-3 font-semibold">Pé (cm)</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) => (
                  <tr
                    key={r.br}
                    className={`border-t border-black/5 transition hover:bg-black/[0.02] ${
                      i % 2 ? "bg-black/[0.02]" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-bold text-[var(--brand)]">
                      {r.br}
                    </td>
                    <td className="px-4 py-2.5">{r.eu}</td>
                    <td className="px-4 py-2.5">{r.us}</td>
                    <td className="px-4 py-2.5">{r.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* How to measure */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground/80">
              Como medir seu pé
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-bold text-[var(--brand)]">1.</span>
                Coloque uma folha de papel no chão, encostada na parede.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[var(--brand)]">2.</span>
                Pise na folha com o calcanhar na parede, com a meia que vai
                usar.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[var(--brand)]">3.</span>
                Marque a ponta do dedo mais longo e meça do calcanhar à marca.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[var(--brand)]">4.</span>
                Compare o comprimento (em cm) com a tabela acima.
              </li>
            </ol>
          </div>

          {/* Tips */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground/80">
              Dicas de quem entende
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {TIPS.map((t) => (
                <div
                  key={t.title}
                  className="rounded-2xl border border-black/5 bg-black/[0.02] p-4"
                >
                  <p className="text-sm font-semibold">{t.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
