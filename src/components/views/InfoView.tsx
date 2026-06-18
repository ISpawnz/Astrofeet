"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Rocket,
  Users,
  Recycle,
  Package,
  Leaf,
  RefreshCw,
  Mail,
  Instagram,
  ArrowLeft,
  Compass,
  MapPin,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InfoPage = "quem-somos" | "sustentabilidade" | "contato" | "trocas";

interface ValuePillar {
  icon: LucideIcon;
  title: string;
  desc: string;
  accent: string;
}

interface NumberedStep {
  title: string;
  desc: string;
}

interface ContactChannel {
  icon: LucideIcon;
  title: string;
  desc: string;
  accent: string;
}

// ---------------------------------------------------------------------------
// Page content configs
// ---------------------------------------------------------------------------

const PAGE_META: Record<
  InfoPage,
  { eyebrow: string; title: string; subtitle: string }
> = {
  "quem-somos": {
    eyebrow: "Nossa história",
    title: "Quem somos",
    subtitle:
      "Astrofeet nasceu da interseção entre a cultura das ruas e a exploração espacial. Cada passo é uma viagem pela galáxia.",
  },
  sustentabilidade: {
    eyebrow: "Nosso compromisso",
    title: "Sustentabilidade",
    subtitle:
      "Cuidar do planeta é tão importante quanto explorar o universo. Cada escolha da Astrofeet respeita a nossa órbita.",
  },
  contato: {
    eyebrow: "Fale com a gente",
    title: "Fale com a gente",
    subtitle:
      "Nossa tripulação está pronta para te ajudar. Escolha o canal que faz mais sentido para você.",
  },
  trocas: {
    eyebrow: "Política de trocas",
    title: "Trocas e devoluções",
    subtitle:
      "Não deu certo com seu sneaker? Sem stress. Trocas e devoluções em até 30 dias, com a primeira troca por nossa conta.",
  },
};

const PILLARS_QUEM_SOMOS: ValuePillar[] = [
  {
    icon: Sparkles,
    title: "Design de outro planeta",
    desc: "Cada drop é desenhado para quem quer pisar fora da gravidade do óbvio.",
    accent: "var(--neon-cyan)",
  },
  {
    icon: Rocket,
    title: "Conforto orbital",
    desc: "Entressolas que absorvem o impacto como se você estivesse flutuando.",
    accent: "var(--neon-magenta)",
  },
  {
    icon: Users,
    title: "Comunidade de exploradores",
    desc: "Mais de 50 mil pés decolando com a gente em cada esquina do Brasil.",
    accent: "var(--neon-violet)",
  },
];

const INITIATIVES_SUSTENTABILIDADE: ValuePillar[] = [
  {
    icon: Recycle,
    title: "Materiais reciclados",
    desc: "Cabo e forro produzidos a partir de garrafas PET recicladas.",
    accent: "var(--neon-lime)",
  },
  {
    icon: Package,
    title: "Embalagem compostável",
    desc: "Caixas e sachês que viram adubo em até 90 dias.",
    accent: "var(--neon-cyan)",
  },
  {
    icon: Leaf,
    title: "Logística neutra em carbono",
    desc: "Compensamos cada entrega plantando árvores em áreas de preservação.",
    accent: "var(--neon-magenta)",
  },
  {
    icon: RefreshCw,
    title: "Programa de troca circular",
    desc: "Devolva seu sneaker antigo e ganhe crédito para o próximo drop.",
    accent: "var(--neon-violet)",
  },
];

const CONTACT_CHANNELS: ContactChannel[] = [
  {
    icon: Rocket,
    title: "Nave AI",
    desc: "Converse com a nossa assistente cósmica 24 horas por dia, 7 dias por semana.",
    accent: "var(--neon-cyan)",
  },
  {
    icon: Mail,
    title: "E-mail",
    desc: "contato@astrofeet.com — para parcerias, imprensa e conversas mais longas.",
    accent: "var(--neon-magenta)",
  },
  {
    icon: Instagram,
    title: "Instagram",
    desc: "@astrofeet — acompanhe os bastidores, drops e a comunidade de exploradores.",
    accent: "var(--neon-violet)",
  },
];

const TROCA_STEPS: NumberedStep[] = [
  {
    title: "Solicite a troca",
    desc: "Fale com a Nave AI informando o código do pedido e qual item você quer trocar.",
  },
  {
    title: "Receba o código de coleta",
    desc: "Mandamos um código de postagem gratuita direto no seu e-mail em poucos minutos.",
  },
  {
    title: "Despache o produto",
    desc: "Embale o sneaker na caixa original e cole em qualquer ponto dos Correios.",
  },
  {
    title: "Receba seu novo sneaker",
    desc: "Assim que o produto chegar no nosso centro galáctico, despachamos a troca.",
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative px-4 pt-12 text-center sm:pt-16"
    >
      <div className="mx-auto max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-foreground/80 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
          {eyebrow}
        </span>
        <h1 className="mt-5 text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          <span className="text-gradient-animated">{title}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      </div>
      <div className="orbit-divider mt-8" />
    </motion.header>
  );
}

function PillarCard({
  pillar,
  index,
}: {
  pillar: ValuePillar;
  index: number;
}) {
  const Icon = pillar.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4) }}
      className="card-hover-glow glass relative overflow-hidden rounded-3xl border border-white/10 p-6"
    >
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-3xl"
        style={{ background: pillar.accent }}
        aria-hidden
      />
      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10"
        style={{
          background: `${pillar.accent}1a`,
          color: pillar.accent,
        }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="relative mt-4 text-lg font-bold">{pillar.title}</h3>
      <p className="relative mt-1.5 text-sm text-muted-foreground">
        {pillar.desc}
      </p>
    </motion.div>
  );
}

function SectionHeading({
  children,
  icon,
  accent = "var(--neon-cyan)",
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon && (
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: `${accent}1a`, color: accent }}
        >
          {icon}
        </span>
      )}
      <h2 className="text-lg font-bold tracking-tight sm:text-xl">{children}</h2>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page renderers
// ---------------------------------------------------------------------------

function QuemSomosPage() {
  return (
    <div className="space-y-10">
      {/* Story */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="space-y-4"
      >
        <p className="text-pretty text-sm leading-relaxed text-foreground/85 sm:text-base">
          A Astrofeet começou com um grupo de exploradores que acreditava em uma
          coisa simples: <strong className="text-foreground">cada passo é uma
          viagem pela galáxia</strong>. Nascemos do encontro entre a cultura das
          ruas e a curiosidade de quem olha para o céu e sonha em ir além.
        </p>
        <p className="text-pretty text-sm leading-relaxed text-foreground/85 sm:text-base">
          Unimos designers, materialistas e astronautas de carteirinha para criar
          sneakers que parecem ter pousado de outra dimensão. Cada drop é uma
          cápsula espacial com solado próprio, identidade própria e uma
          comunidade que entende exatamente do que se trata.
        </p>
        <p className="text-pretty text-sm leading-relaxed text-foreground/85 sm:text-base">
          Hoje, a Astrofeet veste os pés de quem caminha pelas calçadas do
          Brasil levando um pedacinho do cosmos em cada parada.
        </p>
      </motion.div>

      {/* Pillars */}
      <div>
        <SectionHeading
          icon={<Sparkles className="h-4 w-4" />}
          accent="var(--neon-cyan)"
        >
          O que nos move
        </SectionHeading>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {PILLARS_QUEM_SOMOS.map((p, i) => (
            <PillarCard key={p.title} pillar={p} index={i} />
          ))}
        </div>
      </div>

      {/* Mission */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--neon-violet)]/15 via-transparent to-[var(--neon-magenta)]/15 p-6 sm:p-8"
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--neon-magenta)] opacity-20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--neon-cyan)] opacity-20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <Rocket className="h-3.5 w-3.5" />
            Nossa missão
          </span>
          <p className="mt-4 text-balance text-lg font-bold leading-relaxed sm:text-xl">
            Transformar cada caminhada em uma exploração. Levar o conforto do
            espaço para o asfalto e fazer da moda uma ponte entre pessoas que
            olham para o alto.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function SustentabilidadePage() {
  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="space-y-4"
      >
        <p className="text-pretty text-sm leading-relaxed text-foreground/85 sm:text-base">
          A galáxia é grande, mas o nosso planeta é o único que temos. Por isso,
          a Astrofeet se compromete a reduzir o impacto ambiental em cada etapa
          do caminho — do design do sneaker até a entrega na sua porta.
        </p>
        <p className="text-pretty text-sm leading-relaxed text-foreground/85 sm:text-base">
          Acreditamos que moda cósmica e responsabilidade andam juntas. Cada
          decisão nossa passa por uma pergunta simples:{" "}
          <strong className="text-foreground">isso respeita a nossa órbita?</strong>
        </p>
      </motion.div>

      <div>
        <SectionHeading
          icon={<Leaf className="h-4 w-4" />}
          accent="var(--neon-lime)"
        >
          Nossas iniciativas
        </SectionHeading>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {INITIATIVES_SUSTENTABILIDADE.map((p, i) => (
            <PillarCard key={p.title} pillar={p} index={i} />
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--neon-lime)]/15 via-transparent to-[var(--neon-cyan)]/15 p-6 text-center sm:p-8"
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--neon-lime)] opacity-25 blur-3xl" />
        <div className="relative">
          <Sparkles className="mx-auto h-8 w-8 text-[var(--neon-lime)]" />
          <p className="mt-3 text-balance text-xl font-black sm:text-2xl">
            <span className="text-gradient-animated">
              Pequenos passos, grande impacto planetário.
            </span>
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Cada sneaker Astrofeet é uma escolha a favor do futuro. Junte-se a
            nós nessa missão.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function ContatoPage() {
  const openNave = useUIStore((s) => s.openNave);
  const navigate = useUIStore((s) => s.navigate);

  return (
    <div className="space-y-10">
      <div>
        <SectionHeading
          icon={<Mail className="h-4 w-4" />}
          accent="var(--neon-magenta)"
        >
          Canais de comunicação
        </SectionHeading>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {CONTACT_CHANNELS.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.08, 0.4) }}
                className="card-hover-glow glass relative overflow-hidden rounded-3xl border border-white/10 p-6"
              >
                <div
                  className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-3xl"
                  style={{ background: c.accent }}
                  aria-hidden
                />
                <div
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10"
                  style={{ background: `${c.accent}1a`, color: c.accent }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="relative mt-4 text-lg font-bold">{c.title}</h3>
                <p className="relative mt-1.5 text-sm text-muted-foreground">
                  {c.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
        className="glass-strong rounded-3xl border border-white/10 p-6 text-center sm:p-8"
      >
        <p className="text-pretty text-sm text-muted-foreground sm:text-base">
          Nossa equipe de exploradores responde em até{" "}
          <strong className="text-foreground">24h</strong>. Para assuntos
          urgentes, fale com a Nave AI — ela está sempre acordada.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => openNave()}
            className="btn-cosmic rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-5 py-2.5 text-sm font-bold text-black hover:opacity-90"
          >
            <Rocket className="h-4 w-4" />
            Falar com a Nave
          </Button>
          <Button
            onClick={() => navigate("track-order")}
            variant="outline"
            className="rounded-full border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
          >
            <Truck className="h-4 w-4" />
            Rastrear pedido
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function TrocasPage() {
  const openNave = useUIStore((s) => s.openNave);

  return (
    <div className="space-y-10">
      {/* Policy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="glass-strong rounded-3xl border border-white/10 p-6 sm:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]">
              <RefreshCw className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">30 dias para trocar ou devolver</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                A contar da data em que o sneaker pousar na sua casa.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[var(--neon-lime)]/10 text-[var(--neon-lime)]">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">Primeira troca por nossa conta</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Frete de ida e volta grátis na primeira troca de cada pedido.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Steps */}
      <div>
        <SectionHeading
          icon={<Compass className="h-4 w-4" />}
          accent="var(--neon-violet)"
        >
          Como funciona
        </SectionHeading>
        <ol className="mt-5 space-y-3">
          {TROCA_STEPS.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: Math.min(i * 0.08, 0.4) }}
              className="glass flex items-start gap-4 rounded-2xl border border-white/10 p-4"
            >
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-violet)] text-sm font-black text-black">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-bold">{step.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  {step.desc}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>

      {/* Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
        className="glass rounded-3xl border border-white/10 p-6 sm:p-8"
      >
        <SectionHeading
          icon={<ShieldCheck className="h-4 w-4" />}
          accent="var(--neon-magenta)"
        >
          Condições para troca
        </SectionHeading>
        <ul className="mt-4 space-y-2.5 text-sm text-foreground/85">
          <li className="flex items-start gap-2.5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--neon-cyan)]" />
            O sneaker precisa estar sem uso, sem marcas de desgaste.
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--neon-cyan)]" />
            Embalagem original (caixa e tags) deve acompanhar o produto.
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--neon-cyan)]" />
            Tenha em mãos o número do pedido e o e-mail usado na compra.
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--neon-cyan)]" />
            Defeitos de fabricação contam com prazo estendido de 90 dias.
          </li>
        </ul>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
        className="glass-strong flex flex-col items-center gap-4 rounded-3xl border border-white/10 p-6 text-center sm:p-8"
      >
        <MapPin className="h-8 w-8 text-[var(--neon-cyan)]" />
        <div>
          <p className="text-lg font-bold sm:text-xl">
            Precisa abrir uma solicitação de troca?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            A Nave AI coleta os dados do seu pedido e gera o código de postagem
            em segundos.
          </p>
        </div>
        <Button
          onClick={() => openNave()}
          className="btn-cosmic rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-6 py-3 text-sm font-bold text-black hover:opacity-90"
        >
          <Rocket className="h-4 w-4" />
          Falar com a Nave
        </Button>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

function isValidPage(value: unknown): value is InfoPage {
  return (
    value === "quem-somos" ||
    value === "sustentabilidade" ||
    value === "contato" ||
    value === "trocas"
  );
}

export function InfoView() {
  const params = useUIStore((s) => s.params);
  const navigate = useUIStore((s) => s.navigate);
  const openNave = useUIStore((s) => s.openNave);

  const page: InfoPage = isValidPage(params.page) ? params.page : "quem-somos";
  const meta = PAGE_META[page];

  return (
    <section className="mx-auto w-full max-w-4xl px-4 pb-16 pt-6 sm:px-6">
      <PageHero
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={meta.subtitle}
      />

      <motion.div
        key={page}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="glass-strong mt-8 rounded-3xl border border-white/10 p-5 sm:p-8"
      >
        {page === "quem-somos" && <QuemSomosPage />}
        {page === "sustentabilidade" && <SustentabilidadePage />}
        {page === "contato" && <ContatoPage />}
        {page === "trocas" && <TrocasPage />}
      </motion.div>

      {/* Bottom actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <Button
          onClick={() => navigate("home")}
          variant="outline"
          className="rounded-full border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à loja
        </Button>
        <Button
          onClick={() => openNave()}
          className="btn-cosmic rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-5 py-2.5 text-sm font-bold text-black hover:opacity-90"
        >
          <Rocket className="h-4 w-4" />
          Falar com a Nave
        </Button>
      </motion.div>
    </section>
  );
}
