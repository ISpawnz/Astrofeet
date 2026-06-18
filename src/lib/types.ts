// Shared domain types for Astrofeet

export type Role = "customer" | "admin";

export type ViewName =
  | "home"
  | "products"
  | "product"
  | "checkout"
  | "order-success"
  | "admin"
  | "account"
  | "wishlist"
  | "track-order";

export interface ViewParams {
  id?: string;
  category?: string;
  q?: string;
  [key: string]: string | undefined;
}

export interface ProductImage {
  src: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  description: string;
  images: string[];
  sizes: number[];
  stock: number;
  /** Per-size stock map: { "38": 5, "39": 0, ... }. Optional — falls back to `stock` when absent. */
  sizeStock?: Record<string, number>;
  rating: number;
  accent: string;
  badge: string | null;
  featured: boolean;
  bestSeller: boolean;
  createdAt: string;
  reviewCount?: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  active: boolean;
  description: string;
  expiresAt?: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number; // snapshot for display only — backend recalculates
  image: string;
  size: number;
  quantity: number;
  accent: string;
}

export interface OrderLineItem {
  productId: string;
  slug: string;
  name: string;
  quantity: number;
  size: number;
  unitPrice: number;
  subtotal: number;
}

export type OrderStatus =
  | "created"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  code: string;
  userId: string | null;
  status: OrderStatus;
  items: OrderLineItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
  };
  payment: {
    method: string; // "card" | "pix" | "boleto"
    cardLast4?: string;
  };
  createdAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ApiError {
  message: string;
}
