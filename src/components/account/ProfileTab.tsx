"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, LifeBuoy, Clock, KeyRound, Pencil, Check, X, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { api } from "@/client/api";
import { toast } from "sonner";
import type { PublicUser } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { fadeUp } from "@/components/shared/motion";

export function ProfileRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-black/[0.02] p-3.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${accent}22`, color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground/90">{value}</p>
      </div>
    </div>
  );
}

export function ProfileTab({ user }: { user: PublicUser }) {
  const navigate = useUIStore((s) => s.navigate);
  const setUser = useAuthStore((s) => s.setUser);
  const roleLabel = user.role === "admin" ? "Administrador" : "Cliente";
  const roleAccent = user.role === "admin" ? "var(--hot)" : "var(--brand)";

  // Editable name state
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user.name);
  const [savingName, setSavingName] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setNameValue(user.name);
  }, [user.name]);

  async function saveName() {
    const trimmed = nameValue.trim();
    if (trimmed.length < 2) {
      toast.error("Nome precisa ter ao menos 2 caracteres.");
      return;
    }
    if (trimmed === user.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const updated = await api.updateProfile(trimmed);
      setUser(updated);
      toast.success("Nome atualizado com sucesso!");
      setEditingName(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSavingName(false);
    }
  }

  function resetPasswordFields() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleChangePassword() {
    if (!currentPassword) {
      toast.error("Informe sua senha atual.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A nova senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("A nova senha precisa ser diferente da atual.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      toast.success("Senha atualizada com sucesso.");
      resetPasswordFields();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar a senha agora.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Read-only profile */}
      <motion.div {...fadeUp} transition={{ duration: 0.45 }} className="glass rounded-3xl p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-wider text-muted-foreground uppercase">
          <User className="h-4 w-4 text-[var(--brand)]" />
          Meus dados
        </h2>
        <div className="mt-4 space-y-2.5">
          {/* Editable name row */}
          <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-black/[0.02] p-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "color-mix(in oklab, var(--brand) 12%, transparent)" }}
            >
              <User className="h-4 w-4 text-[var(--brand)]" />
            </span>
            <div className="flex-1">
              <p className="text-[11px] tracking-wider text-muted-foreground uppercase">Nome</p>
              {editingName ? (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") {
                        setEditingName(false);
                        setNameValue(user.name);
                      }
                    }}
                    className="h-9 flex-1 rounded-lg border border-[var(--brand)] bg-black/[0.03] px-3 text-sm font-medium outline-none"
                    placeholder="Seu nome"
                  />
                  <button
                    onClick={saveName}
                    disabled={savingName}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)] text-white transition hover:opacity-90 disabled:opacity-40"
                    aria-label="Salvar nome"
                  >
                    {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNameValue(user.name);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-black/[0.03] text-muted-foreground transition hover:text-foreground"
                    aria-label="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  <button
                    onClick={() => setEditingName(true)}
                    className="flex items-center gap-1 text-xs text-[var(--brand)] transition hover:underline"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </button>
                </div>
              )}
            </div>
          </div>
          <ProfileRow icon={<Mail className="h-4 w-4" />} label="E-mail" value={user.email} accent="var(--ink)" />
          <ProfileRow
            icon={<KeyRound className="h-4 w-4" />}
            label="Tipo de conta"
            value={
              <span style={{ color: roleAccent }} className="font-semibold">
                {roleLabel}
              </span>
            }
            accent={roleAccent}
          />
          <ProfileRow
            icon={<Clock className="h-4 w-4" />}
            label="Membro desde"
            value="Cliente desde 2026"
            accent="var(--success)"
          />
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-black/5 bg-black/[0.02] p-3.5">
          <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
          <p className="text-xs text-muted-foreground">
            Para trocar seu e-mail, fale com nosso assistente no canto inferior.
          </p>
        </div>
      </motion.div>

      <Separator className="bg-black/[0.06]" />

      {/* Segurança / trocar senha */}
      <motion.div {...fadeUp} transition={{ duration: 0.45, delay: 0.1 }} className="glass rounded-3xl p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-wider text-muted-foreground uppercase">
          <Lock className="h-4 w-4 text-[var(--success)]" />
          Segurança
        </h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Mantenha sua conta protegida com uma senha forte.
        </p>
        <div className="mt-4 max-w-md space-y-3">
          <PasswordInputRow
            id="pw-current"
            label="Senha atual"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
          />
          <PasswordInputRow
            id="pw-new"
            label="Nova senha"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            hint="Ao menos 6 caracteres."
          />
          <PasswordInputRow
            id="pw-confirm"
            label="Confirmar nova senha"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
          />
          <div className="flex justify-end pt-1">
            <Button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-70"
            >
              {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Salvar senha
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function PasswordInputRow({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block text-sm">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 rounded-xl border-black/10 bg-black/[0.03] pr-11 text-sm transition-colors outline-none focus:border-[var(--brand)] focus-visible:ring-0 focus-visible:ring-offset-0"
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
          aria-label={show ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
