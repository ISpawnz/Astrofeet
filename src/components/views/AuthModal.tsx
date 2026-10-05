"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/client/api";
import type { PublicUser } from "@/shared/types";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BALL_SIZE = 88; // sun & moon share the SAME visual size
const STAGE_SIZE = 150; // room for the sun rays around the body

const inputClass =
  "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[var(--neon-cyan)] focus:ring-2 focus:ring-[#34e7ff]/30";

// deterministic starfield for the brand panel (no hydration jitter)
const STARS = [
  { x: "14%", y: "18%", s: 2, d: 3.4, delay: 0 },
  { x: "82%", y: "12%", s: 1.6, d: 2.6, delay: 0.5 },
  { x: "68%", y: "30%", s: 1.4, d: 3.0, delay: 1.1 },
  { x: "22%", y: "62%", s: 1.8, d: 3.6, delay: 0.3 },
  { x: "88%", y: "70%", s: 2.2, d: 2.8, delay: 0.8 },
  { x: "40%", y: "82%", s: 1.5, d: 3.2, delay: 1.4 },
  { x: "55%", y: "22%", s: 1.3, d: 2.4, delay: 0.6 },
  { x: "10%", y: "44%", s: 1.7, d: 3.8, delay: 1.0 },
  { x: "75%", y: "52%", s: 1.4, d: 2.9, delay: 0.2 },
  { x: "32%", y: "32%", s: 1.6, d: 3.3, delay: 1.2 },
];

/* ------------------------------------------------------------------ */
/*  Celestial bodies                                                   */
/* ------------------------------------------------------------------ */

function Moon({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: BALL_SIZE,
        height: BALL_SIZE,
        left: "50%",
        top: "50%",
        marginLeft: -BALL_SIZE / 2,
        marginTop: -BALL_SIZE / 2,
        background:
          "radial-gradient(circle at 30% 38%, #ffffff 0%, #eef3f9 28%, #c7d2e0 62%, #8a96a6 100%)",
        boxShadow:
          "0 0 28px rgba(190,215,240,0.55), -12px 0 30px rgba(120,170,210,0.4), inset -8px -4px 18px rgba(50,65,85,0.45)",
      }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.5 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <span
        className="absolute rounded-full"
        style={{
          width: 12,
          height: 12,
          left: 22,
          top: 28,
          background: "radial-gradient(circle at 35% 35%, #b9c4d2, #828e9e)",
          opacity: 0.75,
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          width: 9,
          height: 9,
          left: 52,
          top: 50,
          background: "radial-gradient(circle at 35% 35%, #b9c4d2, #828e9e)",
          opacity: 0.6,
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          width: 7,
          height: 7,
          left: 30,
          top: 58,
          background: "radial-gradient(circle at 35% 35%, #b9c4d2, #828e9e)",
          opacity: 0.55,
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          width: 6,
          height: 6,
          left: 58,
          top: 24,
          background: "radial-gradient(circle at 35% 35%, #b9c4d2, #828e9e)",
          opacity: 0.5,
        }}
      />
    </motion.div>
  );
}

function Sun({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="absolute"
      style={{
        width: STAGE_SIZE,
        height: STAGE_SIZE,
        left: "50%",
        top: "50%",
        marginLeft: -STAGE_SIZE / 2,
        marginTop: -STAGE_SIZE / 2,
      }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.45 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* rotating rays */}
      <div className="absolute inset-0 animate-spin-slow">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              width: 3,
              height: 18,
              marginLeft: -1.5,
              marginTop: -9,
              borderRadius: 9999,
              background:
                "linear-gradient(to top, #ffd27a, rgba(255,200,110,0))",
              transformOrigin: "50% 50%",
              transform: `rotate(${i * 30}deg) translateY(-78px)`,
            }}
          />
        ))}
      </div>
      {/* body */}
      <div
        className="absolute rounded-full"
        style={{
          width: BALL_SIZE,
          height: BALL_SIZE,
          left: "50%",
          top: "50%",
          marginLeft: -BALL_SIZE / 2,
          marginTop: -BALL_SIZE / 2,
          background:
            "radial-gradient(circle at 68% 38%, #fff6d2 0%, #ffcf6e 32%, #ff9a3d 68%, #f56a1e 100%)",
          boxShadow:
            "0 0 32px rgba(255,170,70,0.6), 12px 0 32px rgba(255,140,50,0.45), inset -6px -4px 16px rgba(180,70,10,0.4)",
        }}
      />
    </motion.div>
  );
}

function CelestialBall({ mode }: { mode: "login" | "register" }) {
  return (
    <div
      className="absolute left-1/2 top-1/2 z-20"
      style={{
        width: STAGE_SIZE,
        height: STAGE_SIZE,
        marginLeft: -STAGE_SIZE / 2,
        marginTop: -STAGE_SIZE / 2,
      }}
    >
      <motion.div
        className="relative h-full w-full"
        animate={{ x: mode === "login" ? -12 : 12 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
      >
        <Moon visible={mode === "login"} />
        <Sun visible={mode === "register"} />
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

interface FieldProps {
  icon: ReactNode;
  error?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  name?: string;
}

function Field({
  icon,
  error,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  name,
}: FieldProps) {
  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
          {icon}
        </span>
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={cn(
            inputClass,
            "pl-10",
            error &&
              "border-rose-400/60 focus:border-rose-400 focus:ring-rose-400/30",
          )}
        />
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-xs text-rose-300"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubmitButton({
  loading,
  label,
}: {
  loading: boolean;
  label: string;
}) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] text-sm font-semibold text-black shadow-lg shadow-[#34e7ff]/20 transition disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </motion.button>
  );
}

function ToggleBrandButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="mt-6 rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
    >
      {label}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main modal                                                         */
/* ------------------------------------------------------------------ */

type Errors = { name?: string; email?: string; password?: string };

export function AuthModal() {
  const open = useUIStore((s) => s.authModalOpen);
  const mode = useUIStore((s) => s.authMode);
  const closeAuth = useUIStore((s) => s.closeAuth);
  const openAuth = useUIStore((s) => s.openAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const isMobile = useIsMobile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Esc to close + body scroll lock + autofocus
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuth();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      cardRef.current
        ?.querySelector<HTMLInputElement>("input")
        ?.focus();
    }, 140);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open, closeAuth]);

  // clear inline errors whenever the mode flips
  useEffect(() => {
    setErrors({});
  }, [mode]);

  // drop loading flag if the modal closes mid-request
  useEffect(() => {
    if (!open) setLoading(false);
  }, [open]);

  function validate(): boolean {
    const e: Errors = {};
    if (mode === "register" && name.trim().length < 2)
      e.name = "Informe seu nome (ao menos 2 caracteres).";
    if (!email.includes("@") || email.trim().length < 4)
      e.email = "Informe um e-mail válido.";
    if (password.length < 6)
      e.password = "A senha precisa ter ao menos 6 caracteres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (loading) return;
    if (!validate()) {
      toast.error("Confira os campos destacados.");
      return;
    }
    setLoading(true);
    try {
      let user: PublicUser;
      if (mode === "login") {
        user = await api.login(email.trim(), password);
      } else {
        user = await api.register(name.trim(), email.trim(), password);
      }
      setUser(user);
      closeAuth();
      toast.success(
        mode === "login"
          ? "Bem-vindo a bordo!"
          : "Conta criada! Bem-vindo à órbita.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Algo deu errado. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail("admin@astrofeet.com");
    setPassword("admin123");
    setErrors((e) => ({ ...e, email: undefined, password: undefined }));
    toast.info("Credenciais de demonstração preenchidas.");
  }

  /* ---------------- shared form (single instance) ---------------- */
  const formContent = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={mode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <form onSubmit={submit} className="space-y-4">
          {mode === "login" ? (
            <>
              <div>
                <h2 className="text-2xl font-bold text-white">Entrar</h2>
                <p className="mt-1 text-sm text-white/50">
                  Acesse sua conta Astrofeet
                </p>
              </div>
              <Field
                icon={<Mail className="h-4 w-4" />}
                type="email"
                name="email"
                placeholder="E-mail"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                error={errors.email}
              />
              <Field
                icon={<Lock className="h-4 w-4" />}
                type="password"
                name="password"
                placeholder="Senha"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                error={errors.password}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => toast.info("Em breve! Fale com a Nave.")}
                  className="text-xs text-white/50 transition hover:text-[var(--neon-cyan)]"
                >
                  Esqueci minha senha
                </button>
              </div>
              <SubmitButton loading={loading} label="Entrar" />
              <button
                type="button"
                onClick={fillDemo}
                className="block w-full text-center text-[11px] text-white/40 transition hover:text-white/70"
              >
                Demonstração: admin@astrofeet.com / admin123
              </button>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-bold text-white">Criar conta</h2>
                <p className="mt-1 text-sm text-white/50">
                  Junte-se à galáxia da moda
                </p>
              </div>
              <Field
                icon={<UserIcon className="h-4 w-4" />}
                name="name"
                placeholder="Nome completo"
                value={name}
                onChange={setName}
                autoComplete="name"
                error={errors.name}
              />
              <Field
                icon={<Mail className="h-4 w-4" />}
                type="email"
                name="email"
                placeholder="E-mail"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                error={errors.email}
              />
              <Field
                icon={<Lock className="h-4 w-4" />}
                type="password"
                name="password"
                placeholder="Senha (mín. 6 caracteres)"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                error={errors.password}
              />
              <SubmitButton loading={loading} label="Cadastrar" />
            </>
          )}
        </form>
      </motion.div>
    </AnimatePresence>
  );

  /* ---------------- shared brand copy (single instance) ----------- */
  const brandContent = (
    <div className="relative flex h-full flex-col items-center justify-center px-8 text-center lg:px-10">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center"
        >
          {mode === "login" ? (
            <>
              <Sparkles className="mb-3 h-6 w-6 text-cyan-100/90" />
              <h3 className="text-2xl font-bold text-white">
                Bem-vindo de volta!
              </h3>
              <p className="mt-2 max-w-[240px] text-sm text-white/70">
                Entre com seus dados e continue sua jornada pela galáxia.
              </p>
              <ToggleBrandButton
                onClick={() => openAuth("register")}
                label="Criar conta"
              />
            </>
          ) : (
            <>
              <Sparkles className="mb-3 h-6 w-6 text-amber-200/90" />
              <h3 className="text-2xl font-bold text-white">
                Olá, explorador!
              </h3>
              <p className="mt-2 max-w-[240px] text-sm text-white/70">
                Cadastre-se e comece a orbitar a galáxia da moda.
              </p>
              <ToggleBrandButton
                onClick={() => openAuth("login")}
                label="Fazer login"
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  /* ---------------- shared brand background (crossfade) ----------- */
  const brandBg = (
    <>
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, rgba(52,231,255,0.22), transparent 55%), radial-gradient(circle at 75% 80%, rgba(167,121,255,0.22), transparent 55%), linear-gradient(135deg, #0a1130 0%, #141848 50%, #0c1d3a 100%)",
        }}
        animate={{ opacity: mode === "login" ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 70% 25%, rgba(255,170,70,0.28), transparent 55%), radial-gradient(circle at 25% 80%, rgba(255,90,40,0.22), transparent 55%), linear-gradient(135deg, #2a1206 0%, #4a1d08 50%, #2a1206 100%)",
        }}
        animate={{ opacity: mode === "login" ? 0 : 1 }}
        transition={{ duration: 0.6 }}
      />
      <div className="absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: s.s,
              height: s.s,
              left: s.x,
              top: s.y,
              animation: `astro-twinkle ${s.d}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );

  /* --------------------------- render ----------------------------- */
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={closeAuth}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* card */}
          <motion.div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-label={mode === "login" ? "Entrar na conta" : "Criar conta"}
            className="glass-strong relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            {/* close button */}
            <button
              type="button"
              onClick={closeAuth}
              aria-label="Fechar"
              className="absolute right-4 top-4 z-30 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/30 text-white/70 backdrop-blur-sm transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {isMobile ? (
              /* ---------------- MOBILE: stacked ---------------- */
              <div className="max-h-[88vh] overflow-y-auto">
                <div className="px-6 pb-2 pt-7">{formContent}</div>

                {/* horizontal divider band with the celestial ball */}
                <div className="relative h-40">
                  <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <CelestialBall mode={mode} />
                </div>

                {/* brand panel (always bottom; copy + gradient swap) */}
                <div className="relative min-h-[210px] overflow-hidden">
                  {brandBg}
                  {brandContent}
                </div>
              </div>
            ) : (
              /* ---------------- DESKTOP: split ----------------- */
              <div className="relative h-[560px]">
                {/* FORM panel — slides left<->right */}
                <motion.div
                  className="absolute bottom-0 top-0 flex w-1/2 items-center"
                  animate={{ x: mode === "login" ? "0%" : "100%" }}
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                >
                  <div className="w-full px-8 lg:px-10">{formContent}</div>
                </motion.div>

                {/* BRAND panel — slides right<->left */}
                <motion.div
                  className="absolute bottom-0 top-0 w-1/2 overflow-hidden"
                  animate={{ x: mode === "login" ? "100%" : "0%" }}
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                >
                  {brandBg}
                  {brandContent}
                </motion.div>

                {/* central divider */}
                <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/12 to-transparent" />

                {/* the celestial ball sitting on the divider */}
                <CelestialBall mode={mode} />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
