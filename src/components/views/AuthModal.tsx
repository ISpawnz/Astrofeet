"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User as UserIcon, Loader2, ArrowRight } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/client/api";
import type { PublicUser } from "@/shared/types";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/components/shared/motion";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const inputClass =
  "h-11 w-full rounded-xl border border-black/10 bg-black/[0.03] px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-foreground focus:ring-2 focus:ring-black/10";

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

function Field({ icon, error, type = "text", placeholder, value, onChange, autoComplete, name }: FieldProps) {
  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground">
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
            error && "border-rose-400/60 focus:border-rose-400 focus:ring-rose-400/30",
          )}
        />
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-xs text-rose-700"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] text-sm font-semibold text-white shadow-lg/20 transition disabled:cursor-not-allowed disabled:opacity-60"
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

function ToggleBrandButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="mt-6 rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-[#111]"
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
      cardRef.current?.querySelector<HTMLInputElement>("input")?.focus();
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
    if (mode === "register" && name.trim().length < 2) e.name = "Informe seu nome (ao menos 2 caracteres).";
    if (!email.includes("@") || email.trim().length < 4) e.email = "Informe um e-mail válido.";
    if (password.length < 6) e.password = "A senha precisa ter ao menos 6 caracteres.";
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
      toast.success(mode === "login" ? "Bem-vindo a bordo!" : "Conta criada! Bem-vindo à Astrofeet.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado. Tente novamente.");
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
                <h2 className="text-2xl font-bold text-foreground">Entrar</h2>
                <p className="mt-1 text-sm text-muted-foreground">Acesse sua conta Astrofeet</p>
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
                  onClick={() => toast.info("Em breve! Fale com nosso assistente.")}
                  className="text-xs text-muted-foreground transition hover:text-[var(--brand)]"
                >
                  Esqueci minha senha
                </button>
              </div>
              <SubmitButton loading={loading} label="Entrar" />
              <button
                type="button"
                onClick={fillDemo}
                className="block w-full text-center text-[11px] text-muted-foreground transition hover:text-foreground/80"
              >
                Demonstração: admin@astrofeet.com / admin123
              </button>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Criar conta</h2>
                <p className="mt-1 text-sm text-muted-foreground">Leva menos de um minuto</p>
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
          {...fadeUp}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center"
        >
          {mode === "login" ? (
            <>
              <h3 className="text-3xl font-black tracking-tighter text-white">Bem-vindo de volta!</h3>
              <p className="mt-2 max-w-[260px] text-sm text-white/70">
                Acompanhe pedidos, favoritos e pontos em um só lugar.
              </p>
              <ToggleBrandButton onClick={() => openAuth("register")} label="Criar conta" />
            </>
          ) : (
            <>
              <h3 className="text-3xl font-black tracking-tighter text-white">Crie sua conta</h3>
              <p className="mt-2 max-w-[260px] text-sm text-white/70">
                Ganhe 10% off na primeira compra com o cupom GALAXIA10.
              </p>
              <ToggleBrandButton onClick={() => openAuth("login")} label="Fazer login" />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  /* ---------------- shared brand background (crossfade) ----------- */
  const brandBg = <div className="absolute inset-0 bg-[#111]" />;

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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
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
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl bg-background shadow-2xl"
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
              className="absolute top-4 right-4 z-30 grid h-9 w-9 place-items-center rounded-full bg-white text-foreground shadow-sm transition hover:bg-[var(--surface)]"
            >
              <X className="h-4 w-4" />
            </button>

            {isMobile ? (
              /* ---------------- MOBILE: stacked ---------------- */
              <div className="max-h-[88vh] overflow-y-auto">
                <div className="px-6 pt-7 pb-2">{formContent}</div>

                <div className="h-6" />

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
                  className="absolute top-0 bottom-0 flex w-1/2 items-center"
                  animate={{ x: mode === "login" ? "0%" : "100%" }}
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                >
                  <div className="w-full px-8 lg:px-10">{formContent}</div>
                </motion.div>

                {/* BRAND panel — slides right<->left */}
                <motion.div
                  className="absolute top-0 bottom-0 w-1/2 overflow-hidden"
                  animate={{ x: mode === "login" ? "100%" : "0%" }}
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                >
                  {brandBg}
                  {brandContent}
                </motion.div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
