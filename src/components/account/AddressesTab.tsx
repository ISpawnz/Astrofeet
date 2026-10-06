"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Pencil, Check, Loader2, Star, Trash2, Plus } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/client/api";
import { maskCEP } from "@/shared/format";
import { toast } from "sonner";
import type { Address } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fadeUp } from "@/components/shared/motion";
import { TextField } from "@/components/shared/TextField";

export interface AddressFormState {
  label: string;
  recipient: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export const emptyAddressForm: AddressFormState = {
  label: "",
  recipient: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  isDefault: false,
};

export function formFromAddress(addr: Address): AddressFormState {
  return {
    label: addr.label ?? "",
    recipient: addr.recipient ?? "",
    cep: addr.cep ?? "",
    street: addr.street ?? "",
    number: addr.number ?? "",
    complement: addr.complement ?? "",
    district: addr.district ?? "",
    city: addr.city ?? "",
    state: addr.state ?? "",
    isDefault: !!addr.isDefault,
  };
}

export const addrInputClass =
  "h-11 rounded-xl border border-black/10 bg-black/[0.03] px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--brand)] focus-visible:ring-0 focus-visible:ring-offset-0";

export function AddressFormModal({
  open,
  onOpenChange,
  address,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: Address | null;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddressFormState>(emptyAddressForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(address ? formFromAddress(address) : emptyAddressForm);
    }
  }, [open, address]);

  function update<K extends keyof AddressFormState>(key: K, value: AddressFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.label.trim()) return "Informe um apelido para o endereço.";
    if (!form.recipient.trim()) return "Informe quem recebe no endereço.";
    if (form.cep.replace(/\D/g, "").length !== 8) return "CEP inválido (8 dígitos).";
    if (!form.street.trim()) return "Informe a rua.";
    if (!form.number.trim()) return "Informe o número.";
    if (!form.city.trim()) return "Informe a cidade.";
    if (form.state.trim().length !== 2) return "UF precisa ter 2 letras.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const body = {
        label: form.label.trim(),
        recipient: form.recipient.trim(),
        cep: form.cep.replace(/\D/g, ""),
        street: form.street.trim(),
        number: form.number.trim(),
        complement: form.complement.trim() || undefined,
        district: form.district.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        isDefault: form.isDefault,
      };
      if (address) {
        await api.updateAddress(address.id, body);
        toast.success("Endereço atualizado com sucesso!");
      } else {
        await api.createAddress(body);
        toast.success("Endereço salvo com sucesso!");
      }
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o endereço agora.");
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!address;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border-black/10 bg-[var(--card)] p-0">
        <div className="max-h-[88vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5 text-[var(--hot)]" />
              {isEdit ? "Editar endereço" : "Novo endereço"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEdit ? "Atualize os dados do endereço salvo." : "Preencha os dados do endereço de entrega."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-6">
            <TextField
              id="addr-label"
              label="Apelido"
              className="sm:col-span-3"
              value={form.label}
              onChange={(e) => update("label", e.target.value)}
              placeholder="Casa, Trabalho..."
              inputClassName={addrInputClass}
              maxLength={40}
            />
            <TextField
              id="addr-recipient"
              label="Quem recebe"
              className="sm:col-span-3"
              value={form.recipient}
              onChange={(e) => update("recipient", e.target.value)}
              placeholder="Nome de quem recebe"
              inputClassName={addrInputClass}
              maxLength={80}
            />
            <TextField
              id="addr-cep"
              label="CEP"
              className="sm:col-span-2"
              value={form.cep}
              onChange={(e) => update("cep", maskCEP(e.target.value))}
              placeholder="00000-000"
              inputClassName={addrInputClass}
              inputMode="numeric"
            />
            <TextField
              id="addr-street"
              label="Rua"
              className="sm:col-span-4"
              value={form.street}
              onChange={(e) => update("street", e.target.value)}
              placeholder="Av. Paulista"
              inputClassName={addrInputClass}
            />
            <TextField
              id="addr-number"
              label="Número"
              className="sm:col-span-2"
              value={form.number}
              onChange={(e) => update("number", e.target.value)}
              placeholder="42"
              inputClassName={addrInputClass}
              inputMode="numeric"
            />
            <div className="sm:col-span-4">
              <Label htmlFor="addr-complement" className="mb-1.5 block text-sm">
                Complemento <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="addr-complement"
                value={form.complement}
                onChange={(e) => update("complement", e.target.value)}
                placeholder="Apto, bloco..."
                className={addrInputClass}
              />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="addr-district" className="mb-1.5 block text-sm">
                Bairro <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="addr-district"
                value={form.district}
                onChange={(e) => update("district", e.target.value)}
                placeholder="Centro"
                className={addrInputClass}
              />
            </div>
            <TextField
              id="addr-city"
              label="Cidade"
              className="sm:col-span-2"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="São Paulo"
              inputClassName={addrInputClass}
            />
            <TextField
              id="addr-state"
              label="UF"
              className="sm:col-span-1"
              value={form.state}
              onChange={(e) => update("state", e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())}
              placeholder="SP"
              maxLength={2}
              inputClassName={addrInputClass}
            />
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-black/[0.02] p-3.5 sm:col-span-6">
              <div>
                <p className="text-sm font-semibold">Salvar como padrão</p>
                <p className="text-[11px] text-muted-foreground">
                  Endereços padrão aparecem primeiro na hora de finalizar a compra.
                </p>
              </div>
              <Switch checked={form.isDefault} onCheckedChange={(v) => update("isDefault", v)} />
            </div>

            <DialogFooter className="mt-2 gap-2 sm:col-span-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full border-black/15 bg-black/[0.03] px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-black/[0.06]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-70"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {isEdit ? "Salvar alterações" : "Salvar endereço"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AddressCard({
  address,
  index,
  onEdit,
  onSetDefault,
  onAskDelete,
}: {
  address: Address;
  index: number;
  onEdit: () => void;
  onSetDefault: () => void;
  onAskDelete: () => void;
}) {
  const parts: string[] = [`${address.street}, ${address.number}`];
  if (address.complement) parts.push(address.complement);
  if (address.district) parts.push(address.district);
  parts.push(`${address.city} · ${address.state}`);
  parts.push(`CEP ${address.cep}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.4) }}
      className="glass relative overflow-hidden rounded-3xl p-5"
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--hot)]/15 text-[var(--hot)]">
            <MapPin className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base leading-tight font-bold">{address.label}</h3>
            <p className="text-xs text-muted-foreground">{address.recipient}</p>
          </div>
        </div>
        {address.isDefault && (
          <Badge
            variant="outline"
            className="rounded-full border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700"
          >
            <Star className="mr-1 h-3 w-3" />
            Padrão
          </Badge>
        )}
      </div>

      <div className="relative mt-3 space-y-0.5 text-sm text-foreground/85">
        {parts.map((p, i) => (
          <p key={i} className={i === parts.length - 1 ? "font-mono text-xs text-muted-foreground" : ""}>
            {p}
          </p>
        ))}
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <Button
          onClick={onEdit}
          variant="outline"
          className="rounded-full border-black/15 bg-black/[0.03] px-3.5 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-black/[0.06]"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
        {!address.isDefault && (
          <Button
            onClick={onSetDefault}
            variant="outline"
            className="rounded-full border-black/15 bg-black/[0.03] px-3.5 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-black/[0.06]"
          >
            <Star className="h-3.5 w-3.5 text-[var(--success)]" />
            Tornar padrão
          </Button>
        )}
        <Button
          onClick={onAskDelete}
          variant="ghost"
          className="ml-auto rounded-full px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-500/10 hover:text-rose-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </Button>
      </div>
    </motion.div>
  );
}

export function AddressesTab() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const queryClient = useQueryClient();
  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api.listAddresses(),
    enabled: hydrated && !!user,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(addr: Address) {
    setEditing(addr);
    setModalOpen(true);
  }

  async function handleSetDefault(addr: Address) {
    try {
      await api.updateAddress(addr.id, { isDefault: true });
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success(`"${addr.label}" é agora seu endereço padrão.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteAddress(id);
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Endereço removido.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover.");
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-3xl bg-black/[0.03]" />
        ))}
      </div>
    );
  }

  const list = addresses ?? [];

  return (
    <div className="space-y-5">
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.45 }}
        className="glass flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
            <MapPin className="h-5 w-5 text-[var(--hot)]" />
            Meus endereços
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Mantenha seus endereços de entrega salvos para finalizar mais rápido.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo endereço
        </Button>
      </motion.div>

      {list.length === 0 ? (
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="glass mx-auto flex max-w-xl flex-col items-center gap-5 rounded-3xl p-10 text-center sm:p-14"
        >
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-black/[0.03]">
              <MapPin className="h-8 w-8 text-[var(--hot)]" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold sm:text-2xl">Você ainda não tem endereços salvos</h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Salve seus endereços de entrega favoritos para finalizar suas compras em poucos cliques.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-bold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Adicionar endereço
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((addr, i) => (
            <AddressCard
              key={addr.id}
              address={addr}
              index={i}
              onEdit={() => openEdit(addr)}
              onSetDefault={() => handleSetDefault(addr)}
              onAskDelete={() => setDeletingId(addr.id)}
            />
          ))}
        </div>
      )}

      <AddressFormModal open={modalOpen} onOpenChange={setModalOpen} address={editing} />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent className="rounded-3xl border-black/10 bg-[var(--card)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-700" />
              Remover endereço?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita. O endereço será removido da sua lista, mas seus pedidos anteriores
              continuam salvos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-full border-black/15 bg-black/[0.03] px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-black/[0.06]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-600"
            >
              <Trash2 className="h-4 w-4" />
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
