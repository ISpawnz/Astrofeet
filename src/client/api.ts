"use client";

import type { Address, Coupon, Notification, Order, Product, PublicUser, Review } from "@/shared/types";

/** Único ponto do front que fala com o servidor. Erros viram `Error` com a mensagem da API. */
async function request<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `Erro ${res.status}: não foi possível concluir a ação.`);
  return data as T;
}

/** Faz a chamada e devolve só a chave `key` da resposta ({ product } → product). */
const unwrap = <T>(key: string, url: string, method?: string, body?: unknown) =>
  request<Record<string, T>>(url, method, body).then((d) => d[key]);

const qs = (params: Record<string, unknown> = {}) =>
  new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) => (v === undefined || v === null || v === "" ? [] : [[k, String(v)]])),
  ).toString();
const enc = encodeURIComponent;

type Input<T> = Partial<Omit<T, "id" | "createdAt">>;

export interface TrackedOrder {
  code: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  items: { name: string; quantity: number; size: number; unitPrice: number; subtotal: number }[];
  customerName: string;
  city: string;
  state: string;
  paymentMethod: string;
  createdAt: string;
}

export interface CouponPreview {
  valid: boolean;
  code: string;
  type?: "percent" | "fixed";
  value?: number;
  description: string;
  discount: number;
  minSubtotal?: number;
  message?: string;
}

export interface Loyalty {
  points: number;
  pointsValue: number;
  pointsPerReal: number;
  pointsToBrlRate: number;
  minRedeemPoints: number;
  history: { type: "earned"; points: number; description: string; date: string }[];
}

export interface AdminMetrics {
  ordersToday: number;
  revenue: number;
  ticket: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  recent: Order[];
  byStatus: Record<string, number>;
  revenueLast7Days: { date: string; label: string; revenue: number; orders: number }[];
  topProducts: { name: string; slug: string; units: number; revenue: number }[];
}

export const api = {
  // Auth
  me: () => unwrap<PublicUser | null>("user", "/api/auth/me").catch(() => null),
  login: (email: string, password: string) =>
    unwrap<PublicUser>("user", "/api/auth/login", "POST", { email, password }),
  register: (name: string, email: string, password: string) =>
    unwrap<PublicUser>("user", "/api/auth/register", "POST", { name, email, password }),
  logout: () => request<void>("/api/auth/logout", "POST"),
  updateProfile: (name: string) => unwrap<PublicUser>("user", "/api/auth/me", "PATCH", { name }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>("/api/auth/password", "POST", { currentPassword, newPassword }),

  // Produtos
  products: (params?: {
    category?: string;
    brand?: string;
    q?: string;
    sort?: string;
    min?: number;
    max?: number;
    size?: number;
    featured?: boolean;
    bestSeller?: boolean;
    ids?: string;
  }) => unwrap<Product[]>("products", `/api/products?${qs(params)}`),
  product: (slug: string) => request<{ product: Product; reviews: Review[] }>(`/api/products/${enc(slug)}`),
  relatedProducts: (id: string) => unwrap<Product[]>("products", `/api/products/${enc(id)}/related`),
  createProduct: (body: Partial<Product>) => unwrap<Product>("product", "/api/products", "POST", body),
  updateProduct: (id: string, body: Partial<Product>) => unwrap<Product>("product", `/api/products/${id}`, "PUT", body),
  deleteProduct: (id: string) => request<void>(`/api/products/${id}`, "DELETE"),
  createReview: (body: { productId: string; rating: number; comment: string; authorName: string }) =>
    unwrap<Review>("review", "/api/reviews", "POST", body),

  // Pedidos
  createOrder: (body: {
    items: { productId: string; size: number; quantity: number }[];
    customer: Order["customer"];
    address: Order["address"];
    payment: Order["payment"];
    couponCode?: string;
  }) => unwrap<Order>("order", "/api/orders", "POST", body),
  /** `mine`: o admin também vê só os próprios pedidos (ex.: em "Minha conta"). */
  listOrders: (mine = false) => unwrap<Order[]>("orders", `/api/orders?${qs({ mine: mine || undefined })}`),
  updateOrderStatus: (id: string, status: string) =>
    unwrap<Order>("order", `/api/orders/${id}/status`, "PATCH", { status }),
  bulkUpdateStatus: (orderIds: string[], status: string) =>
    request<{ updated: number; total: number }>("/api/admin/bulk-status", "POST", { orderIds, status }),
  trackOrder: (code: string, email: string) =>
    request<{ order: TrackedOrder }>(`/api/orders/track?${qs({ code, email })}`),
  async exportOrders(format: "csv" | "json" = "csv"): Promise<Blob> {
    const res = await fetch(`/api/orders/export?format=${format}`, { credentials: "include" });
    if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível exportar.`);
    return res.blob();
  },

  // Cupons
  validateCoupon: (code: string, subtotal: number) =>
    request<CouponPreview>("/api/coupons/validate", "POST", { code, subtotal }),
  listCoupons: () => unwrap<Coupon[]>("coupons", "/api/coupons"),
  createCoupon: (body: Input<Coupon>) => unwrap<Coupon>("coupon", "/api/coupons", "POST", body),
  updateCoupon: (id: string, body: Input<Coupon>) => unwrap<Coupon>("coupon", `/api/coupons/${id}`, "PATCH", body),
  deleteCoupon: (id: string) => request<void>(`/api/coupons/${id}`, "DELETE"),

  // Endereços
  listAddresses: () => unwrap<Address[]>("addresses", "/api/addresses"),
  createAddress: (body: Input<Address>) => unwrap<Address>("address", "/api/addresses", "POST", body),
  updateAddress: (id: string, body: Input<Address>) =>
    unwrap<Address>("address", `/api/addresses/${id}`, "PATCH", body),
  deleteAddress: (id: string) => request<void>(`/api/addresses/${id}`, "DELETE"),

  // Notificações, alertas de estoque, fidelidade, admin, chat
  listNotifications: (limit?: number) => unwrap<Notification[]>("notifications", `/api/notifications?${qs({ limit })}`),
  listStockAlerts: () => unwrap<string[]>("productIds", "/api/stock-alerts"),
  subscribeStockAlert: (productId: string) => request<void>("/api/stock-alerts", "POST", { productId }),
  unsubscribeStockAlert: (productId: string) => request<void>(`/api/stock-alerts?${qs({ productId })}`, "DELETE"),
  getLoyalty: () => request<Loyalty>("/api/loyalty"),
  redeemLoyalty: (points: number) =>
    request<{
      coupon: { id: string; code: string; type: "fixed"; value: number; description: string };
      pointsRemaining: number;
      discount: number;
    }>("/api/loyalty/redeem", "POST", { points }),
  adminMetrics: () => request<AdminMetrics>("/api/admin/metrics"),
  chat: (messages: { role: "user" | "assistant"; content: string }[]) =>
    unwrap<string>("reply", "/api/chat", "POST", { messages }),
};
