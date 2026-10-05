"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Lock,
  QrCode,
  Barcode,
  ShieldCheck,
  ShoppingBag,
  Loader2,
  Sparkles,
  Ticket,
  Check,
  X,
  MapPin,
} from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { useUIStore } from "@/stores/ui";
import { useAuthStore } from "@/stores/auth";
import { useCheckoutStore } from "@/stores/checkout";
import { api } from "@/client/api";
import {
  formatPrice,
  maskCEP,
  maskCard,
  maskCVV,
  maskExpiry,
  maskPhone,
} from "@/shared/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Address } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

const FREE_SHIPPING = 300;
const BASE_SHIPPING = 29.9;

type PaymentMethod = "card" | "pix" | "boleto";

interface FormState {
  name: string;
  email: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  payment: PaymentMethod;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCVV: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const inputClass =
  "h-11 rounded-xl border border-black/10 bg-black/[0.03] px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--brand)] focus-visible:ring-0 focus-visible:ring-offset-0";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-rose-700" role="alert">
      {message}
    </p>
  );
}

export function CheckoutView() {
  const { items, subtotal, clear } = useCartStore();
  const navigate = useUIStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const setLastOrder = useCheckoutStore((s) => s.setLastOrder);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    payment: "card",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCVV: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponState, setCouponState] = useState<{
    status: "idle" | "validating" | "applied" | "error";
    code?: string;
    description?: string;
    discount?: number;
    message?: string;
  }>({ status: "idle" });

  // Prefill from authenticated user
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name,
        email: f.email || user.email,
      }));
    }
  }, [user]);

  // Saved addresses (only fetched when logged in)
  const { data: savedAddresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api.listAddresses(),
    enabled: !!user,
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  function fillFromAddress(addr: Address) {
    setForm((f) => ({
      ...f,
      cep: addr.cep,
      street: addr.street,
      number: addr.number,
      complement: addr.complement ?? "",
      district: addr.district ?? "",
      city: addr.city,
      state: addr.state,
    }));
    setSelectedAddressId(addr.id);
    setErrors((e) => {
      const next = { ...e };
      delete next.cep;
      delete next.street;
      delete next.number;
      delete next.district;
      delete next.city;
      delete next.state;
      return next;
    });
    toast.success(`Endereço “${addr.label}” preenchido.`);
  }

  function clearAddressForm() {
    setForm((f) => ({
      ...f,
      cep: "",
      street: "",
      number: "",
      complement: "",
      district: "",
      city: "",
      state: "",
    }));
    setSelectedAddressId(null);
  }

  const sub = subtotal();
  const discount = couponState.status === "applied" ? couponState.discount ?? 0 : 0;
  const afterDiscount = Math.max(0, sub - discount);
  const shipping = afterDiscount === 0 || afterDiscount >= FREE_SHIPPING ? 0 : BASE_SHIPPING;
  const total = afterDiscount + shipping;

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponState({ status: "validating" });
    try {
      const res = await api.validateCoupon(code, sub);
      if (res.valid) {
        setCouponState({
          status: "applied",
          code: res.code,
          description: res.description,
          discount: res.discount,
        });
        toast.success(`Cupom ${res.code} aplicado! -${formatPrice(res.discount)}`);
      } else {
        setCouponState({
          status: "error",
          message: res.message ?? "Cupom não aplicável.",
        });
        toast.error(res.message ?? "Cupom não aplicável.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cupom inválido.";
      setCouponState({ status: "error", message: msg });
      toast.error(msg);
    }
  }

  function removeCoupon() {
    setCouponInput("");
    setCouponState({ status: "idle" });
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!form.name.trim()) e.name = "Informe seu nome completo.";
    if (!form.email.trim()) e.email = "Informe seu e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "E-mail inválido.";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10)
      e.phone = "Telefone inválido.";

    if (!form.cep.trim() || form.cep.replace(/\D/g, "").length !== 8)
      e.cep = "CEP inválido (8 dígitos).";
    if (!form.street.trim()) e.street = "Informe a rua.";
    if (!form.number.trim()) e.number = "Informe o número.";
    if (!form.district.trim()) e.district = "Informe o bairro.";
    if (!form.city.trim()) e.city = "Informe a cidade.";
    if (!form.state.trim() || form.state.length !== 2)
      e.state = "UF com 2 letras.";

    if (form.payment === "card") {
      if (form.cardNumber.replace(/\s/g, "").length < 13)
        e.cardNumber = "Número do cartão inválido.";
      if (!form.cardName.trim()) e.cardName = "Nome no cartão é obrigatório.";
      if (!/^\d{2}\/\d{2}$/.test(form.cardExpiry))
        e.cardExpiry = "Validade no formato MM/AA.";
      if (form.cardCVV.length < 3) e.cardCVV = "CVV inválido.";
    }
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Revise os campos destacados no formulário.");
      return;
    }

    setSubmitting(true);
    try {
      const cardLast4 =
        form.payment === "card"
          ? form.cardNumber.replace(/\D/g, "").slice(-4)
          : undefined;

      const order = await api.createOrder({
        items: items.map((i) => ({
          productId: i.productId,
          size: i.size,
          quantity: i.quantity,
        })),
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        address: {
          cep: form.cep.trim(),
          street: form.street.trim(),
          number: form.number.trim(),
          complement: form.complement.trim() || undefined,
          district: form.district.trim(),
          city: form.city.trim(),
          state: form.state.trim().toUpperCase(),
        },
        payment: {
          method: form.payment,
          cardLast4,
        },
        couponCode:
          couponState.status === "applied" ? couponState.code : undefined,
      });

      clear();
      setLastOrder(order);
      toast.success("Pedido confirmado!");
      navigate("order-success");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível finalizar a compra agora. Tente novamente.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Empty cart ----------
  if (items.length === 0) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass flex flex-col items-center gap-5 rounded-3xl p-10 sm:p-14"
        >
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-black/[0.03]">
            <ShoppingBag className="h-11 w-11 text-[var(--brand)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Seu carrinho está vazio
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Adicione um par ao carrinho antes de seguir para o checkout.
            </p>
          </div>
          <Button
            onClick={() => navigate("products")}
            className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-bold text-white hover:opacity-90"
          >
            Explorar drops
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <button
          onClick={() => navigate("products")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Continuar comprando
        </button>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          <span className="text-gradient-neon">Checkout</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pagamento seguro · Frete grátis acima de R$300
        </p>
      </motion.div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-8 lg:grid-cols-[1fr_380px]"
        noValidate
      >
        {/* ---------- FORM (left) ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="space-y-6"
        >
          {/* Contato */}
          <fieldset className="glass rounded-3xl p-6">
            <legend className="flex items-center gap-2 px-2 text-sm font-bold uppercase tracking-wider text-[var(--brand)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)]/15 text-xs font-black text-[var(--brand)]">
                1
              </span>
              Contato
            </legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="ck-name" className="mb-1.5 block text-sm">
                  Nome completo
                </Label>
                <Input
                  id="ck-name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Como devemos te chamar?"
                  className={inputClass}
                  autoComplete="name"
                />
                <FieldError message={errors.name} />
              </div>
              <div>
                <Label htmlFor="ck-email" className="mb-1.5 block text-sm">
                  E-mail
                </Label>
                <Input
                  id="ck-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="voce@astrofeet.com"
                  className={inputClass}
                  autoComplete="email"
                />
                <FieldError message={errors.email} />
              </div>
              <div>
                <Label htmlFor="ck-phone" className="mb-1.5 block text-sm">
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="ck-phone"
                  value={form.phone}
                  onChange={(e) => update("phone", maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className={inputClass}
                  inputMode="tel"
                  autoComplete="tel"
                />
                <FieldError message={errors.phone} />
              </div>
            </div>
          </fieldset>

          {/* Entrega */}
          <fieldset className="glass rounded-3xl p-6">
            <legend className="flex items-center gap-2 px-2 text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ink)]/15 text-xs font-black text-[var(--ink)]">
                2
              </span>
              Entrega
            </legend>

            {/* Saved addresses quick-fill */}
            {savedAddresses && savedAddresses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-[var(--ink)]" />
                  <span>
                    Selecione um endereço salvo ou preencha manualmente
                    abaixo.
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {savedAddresses.map((addr, i) => {
                    const active = selectedAddressId === addr.id;
                    return (
                      <motion.button
                        key={addr.id}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: Math.min(i * 0.05, 0.3),
                        }}
                        onClick={() => fillFromAddress(addr)}
                        className={cn(
                          "group relative flex min-w-[220px] shrink-0 flex-col gap-1 rounded-2xl border p-3.5 text-left transition-all",
                          active
                            ? "border-[var(--brand)] bg-[var(--brand)]/10 neon-ring-soft"
                            : "border-black/10 bg-black/[0.02] hover:border-black/15 hover:bg-black/[0.036]",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-sm font-bold">
                            <MapPin className="h-3.5 w-3.5 text-[var(--hot)]" />
                            {addr.label}
                          </span>
                          {active ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)] text-white">
                              <Check className="h-3 w-3" />
                            </span>
                          ) : addr.isDefault ? (
                            <Badge
                              variant="outline"
                              className="rounded-full border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0 text-[9px] font-bold text-emerald-700"
                            >
                              Padrão
                            </Badge>
                          ) : null}
                        </div>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {addr.recipient}
                        </p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {addr.city} · {addr.state}
                        </p>
                        <span
                          className={cn(
                            "mt-1 inline-flex items-center gap-1 text-[11px] font-semibold",
                            active
                              ? "text-[var(--brand)]"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          {active ? (
                            <>
                              <Check className="h-3 w-3" />
                              Selecionado
                            </>
                          ) : (
                            "Usar"
                          )}
                        </span>
                      </motion.button>
                    );
                  })}
                  {/* Clear button */}
                  <button
                    type="button"
                    onClick={clearAddressForm}
                    className="flex min-w-[100px] shrink-0 items-center justify-center gap-1 rounded-2xl border border-dashed border-black/15 bg-black/[0.02] px-4 text-xs font-semibold text-muted-foreground transition hover:border-black/25 hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    Limpar
                  </button>
                </div>
              </motion.div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Label htmlFor="ck-cep" className="mb-1.5 block text-sm">
                  CEP
                </Label>
                <Input
                  id="ck-cep"
                  value={form.cep}
                  onChange={(e) => update("cep", maskCEP(e.target.value))}
                  placeholder="00000-000"
                  className={inputClass}
                  inputMode="numeric"
                  autoComplete="postal-code"
                />
                <FieldError message={errors.cep} />
              </div>
              <div className="sm:col-span-4">
                <Label htmlFor="ck-street" className="mb-1.5 block text-sm">
                  Rua
                </Label>
                <Input
                  id="ck-street"
                  value={form.street}
                  onChange={(e) => update("street", e.target.value)}
                  placeholder="Av. Paulista"
                  className={inputClass}
                  autoComplete="address-line1"
                />
                <FieldError message={errors.street} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="ck-number" className="mb-1.5 block text-sm">
                  Número
                </Label>
                <Input
                  id="ck-number"
                  value={form.number}
                  onChange={(e) => update("number", e.target.value)}
                  placeholder="42"
                  className={inputClass}
                  inputMode="numeric"
                  autoComplete="address-line2"
                />
                <FieldError message={errors.number} />
              </div>
              <div className="sm:col-span-4">
                <Label
                  htmlFor="ck-complement"
                  className="mb-1.5 block text-sm"
                >
                  Complemento{" "}
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="ck-complement"
                  value={form.complement}
                  onChange={(e) => update("complement", e.target.value)}
                  placeholder="Apto, bloco..."
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-3">
                <Label htmlFor="ck-district" className="mb-1.5 block text-sm">
                  Bairro
                </Label>
                <Input
                  id="ck-district"
                  value={form.district}
                  onChange={(e) => update("district", e.target.value)}
                  placeholder="Centro"
                  className={inputClass}
                />
                <FieldError message={errors.district} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="ck-city" className="mb-1.5 block text-sm">
                  Cidade
                </Label>
                <Input
                  id="ck-city"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="São Paulo"
                  className={inputClass}
                  autoComplete="address-level2"
                />
                <FieldError message={errors.city} />
              </div>
              <div className="sm:col-span-1">
                <Label htmlFor="ck-state" className="mb-1.5 block text-sm">
                  UF
                </Label>
                <Input
                  id="ck-state"
                  value={form.state}
                  onChange={(e) =>
                    update(
                      "state",
                      e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase(),
                    )
                  }
                  placeholder="SP"
                  maxLength={2}
                  className={inputClass}
                  autoComplete="address-level1"
                />
                <FieldError message={errors.state} />
              </div>
            </div>
          </fieldset>

          {/* Pagamento */}
          <fieldset className="glass rounded-3xl p-6">
            <legend className="flex items-center gap-2 px-2 text-sm font-bold uppercase tracking-wider text-[var(--hot)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--hot)]/15 text-xs font-black text-[var(--hot)]">
                3
              </span>
              Pagamento
            </legend>

            <RadioGroup
              value={form.payment}
              onValueChange={(v) => update("payment", v as PaymentMethod)}
              className="mt-4 grid gap-3 sm:grid-cols-3"
            >
              <PaymentOption
                value="card"
                title="Cartão de crédito"
                hint="Em até 12x"
                icon={<CreditCard className="h-5 w-5" />}
                active={form.payment === "card"}
              />
              <PaymentOption
                value="pix"
                title="Pix"
                hint="5% off à vista"
                icon={<QrCode className="h-5 w-5" />}
                active={form.payment === "pix"}
              />
              <PaymentOption
                value="boleto"
                title="Boleto"
                hint="Vence em 3 dias"
                icon={<Barcode className="h-5 w-5" />}
                active={form.payment === "boleto"}
              />
            </RadioGroup>

            {/* Card fields */}
            {form.payment === "card" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-5 grid gap-4 sm:grid-cols-6"
              >
                <div className="sm:col-span-6">
                  <Label
                    htmlFor="ck-card-number"
                    className="mb-1.5 block text-sm"
                  >
                    Número do cartão
                  </Label>
                  <Input
                    id="ck-card-number"
                    value={form.cardNumber}
                    onChange={(e) =>
                      update("cardNumber", maskCard(e.target.value))
                    }
                    placeholder="0000 0000 0000 0000"
                    className={inputClass}
                    inputMode="numeric"
                    autoComplete="cc-number"
                  />
                  <FieldError message={errors.cardNumber} />
                </div>
                <div className="sm:col-span-6">
                  <Label
                    htmlFor="ck-card-name"
                    className="mb-1.5 block text-sm"
                  >
                    Nome impresso no cartão
                  </Label>
                  <Input
                    id="ck-card-name"
                    value={form.cardName}
                    onChange={(e) => update("cardName", e.target.value)}
                    placeholder="NOME COMO NO CARTÃO"
                    className={inputClass}
                    autoComplete="cc-name"
                  />
                  <FieldError message={errors.cardName} />
                </div>
                <div className="sm:col-span-3">
                  <Label
                    htmlFor="ck-card-expiry"
                    className="mb-1.5 block text-sm"
                  >
                    Validade
                  </Label>
                  <Input
                    id="ck-card-expiry"
                    value={form.cardExpiry}
                    onChange={(e) =>
                      update("cardExpiry", maskExpiry(e.target.value))
                    }
                    placeholder="MM/AA"
                    className={inputClass}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                  />
                  <FieldError message={errors.cardExpiry} />
                </div>
                <div className="sm:col-span-3">
                  <Label htmlFor="ck-card-cvv" className="mb-1.5 block text-sm">
                    CVV
                  </Label>
                  <Input
                    id="ck-card-cvv"
                    value={form.cardCVV}
                    onChange={(e) => update("cardCVV", maskCVV(e.target.value))}
                    placeholder="123"
                    className={inputClass}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                  />
                  <FieldError message={errors.cardCVV} />
                </div>
              </motion.div>
            )}

            {/* Pix / Boleto notes */}
            {(form.payment === "pix" || form.payment === "boleto") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-5 flex items-start gap-3 rounded-2xl border border-black/10 bg-black/[0.03] p-4"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--success)]/15">
                  {form.payment === "pix" ? (
                    <QrCode className="h-5 w-5 text-[var(--success)]" />
                  ) : (
                    <Barcode className="h-5 w-5 text-[var(--success)]" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {form.payment === "pix" ? (
                    <>
                      Você verá o <strong className="text-foreground">QR Code</strong>{" "}
                      Pix na confirmação do pedido. O pagamento é confirmado em
                      segundos.
                    </>
                  ) : (
                    <>
                      O <strong className="text-foreground">código de barras</strong>{" "}
                      do boleto aparecerá na confirmação. Vence em 3 dias úteis.
                    </>
                  )}
                </p>
              </motion.div>
            )}
          </fieldset>
        </motion.div>

        {/* ---------- ORDER SUMMARY (right, sticky) ---------- */}
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:sticky lg:top-6 lg:h-fit"
        >
          <div className="glass-strong rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Resumo do pedido</h2>
              <span className="rounded-full bg-black/[0.03] px-2.5 py-1 text-xs text-muted-foreground">
                {items.reduce((n, i) => n + i.quantity, 0)}{" "}
                {items.reduce((n, i) => n + i.quantity, 0) === 1
                  ? "item"
                  : "itens"}
              </span>
            </div>

            {/* Items list */}
            <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.size}`}
                  className="flex gap-3 rounded-2xl border border-black/5 bg-black/[0.02] p-2.5"
                >
                  <div
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/[0.03]"
                    style={{
                      boxShadow: `inset 0 0 14px ${item.accent}30`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="line-clamp-1 text-sm font-semibold">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tam. {item.size} · Qtd. {item.quantity}
                    </p>
                  </div>
                  <p className="self-center text-sm font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <Separator className="my-4 bg-black/[0.06]" />

            {/* Coupon */}
            <div className="mb-3">
              {couponState.status === "applied" ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700">
                      <Check className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-emerald-700">
                        {couponState.code} aplicado
                      </p>
                      <p className="text-[11px] text-emerald-700/70">
                        {couponState.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-700">
                      -{formatPrice(couponState.discount ?? 0)}
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-emerald-700/60 transition hover:text-emerald-700"
                      aria-label="Remover cupom"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        if (couponState.status === "error")
                          setCouponState({ status: "idle" });
                      }}
                      placeholder="Cupom de desconto"
                      className="h-10 w-full rounded-xl border border-black/10 bg-black/[0.03] pl-9 pr-3 text-sm uppercase tracking-wider outline-none placeholder:text-muted-foreground/60 focus:border-[var(--brand)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={
                      !couponInput.trim() || couponState.status === "validating"
                    }
                    className="h-10 shrink-0 rounded-xl bg-black/[0.06] px-4 text-sm font-semibold transition hover:bg-black/[0.09] disabled:opacity-40"
                  >
                    {couponState.status === "validating" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Aplicar"
                    )}
                  </button>
                </div>
              )}
              {couponState.status === "error" && (
                <p className="mt-1.5 text-xs text-rose-700">
                  {couponState.message}
                </p>
              )}
              {couponState.status === "idle" && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Experimente:{" "}
                  <button
                    type="button"
                    onClick={() => setCouponInput("GALAXIA10")}
                    className="font-mono font-semibold text-[var(--brand)] hover:underline"
                  >
                    GALAXIA10
                  </button>{" "}
                  (10% off)
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">
                  {formatPrice(sub)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Desconto ({couponState.code})</span>
                  <span className="font-semibold">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Frete</span>
                {shipping === 0 ? (
                  <span className="font-semibold text-[var(--success)]">
                    Grátis
                  </span>
                ) : (
                  <span className="font-medium text-foreground">
                    {formatPrice(shipping)}
                  </span>
                )}
              </div>
              {shipping === 0 && afterDiscount > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-[var(--success)]">
                  <Sparkles className="h-3 w-3" />
                  Frete grátis liberado!
                </p>
              )}
              <Separator className="my-2 bg-black/[0.06]" />
              <div className="flex items-end justify-between pt-1">
                <span className="text-base font-semibold">Total</span>
                <span className="text-2xl font-black text-gradient-neon">
                  {formatPrice(total)}
                </span>
              </div>
              <p className="text-right text-[11px] text-muted-foreground">
                {form.payment === "card"
                  ? "Em até 12x sem juros no cartão"
                  : form.payment === "pix"
                    ? "À vista no Pix"
                    : "À vista no boleto"}
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand)] py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Finalizar compra
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {/* Trust row */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[11px] text-muted-foreground">
              <div className="flex flex-col items-center gap-1 rounded-xl border border-black/5 bg-black/[0.02] px-2 py-2.5">
                <ShieldCheck className="h-4 w-4 text-[var(--brand)]" />
                Pagamento seguro
              </div>
              <div className="flex flex-col items-center gap-1 rounded-xl border border-black/5 bg-black/[0.02] px-2 py-2.5">
                <Lock className="h-4 w-4 text-[var(--ink)]" />
                Dados criptografados
              </div>
            </div>
          </div>
        </motion.aside>
      </form>
    </section>
  );
}

interface PaymentOptionProps {
  value: PaymentMethod;
  title: string;
  hint: string;
  icon: React.ReactNode;
  active: boolean;
}

function PaymentOption({
  value,
  title,
  hint,
  icon,
  active,
}: PaymentOptionProps) {
  return (
    <Label
      htmlFor={`pay-${value}`}
      className={[
        "group relative flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-all",
        active
          ? "border-[var(--brand)] bg-[var(--brand)]/10 neon-ring-soft"
          : "border-black/10 bg-black/[0.02] hover:border-black/15 hover:bg-black/[0.036]",
      ].join(" ")}
    >
      <RadioGroupItem
        id={`pay-${value}`}
        value={value}
        className="sr-only"
        aria-label={title}
      />
      <span
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
          active
            ? "bg-[var(--brand)] text-white"
            : "bg-black/[0.03] text-muted-foreground group-hover:text-foreground",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold leading-tight">{title}</span>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </span>
    </Label>
  );
}
