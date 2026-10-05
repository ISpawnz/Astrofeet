import "server-only";
import { parseJSON } from "@/server/http";
import type { Address, Coupon, Notification, Order, Product, Review } from "@/shared/types";

// Linha crua do banco → formato público (nunca vaza campos internos como passwordHash).

type Row = Record<string, any>;

const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : String(d));
const pick = <K extends string>(r: Row, keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, r[k]])) as Record<K, Row[K]>;

export function serializeProduct(p: Row, reviewCount?: number): Product {
  const images = parseJSON<string[]>(p.images, []);
  const sizeStock = parseJSON<Record<string, number>>(p.sizeStock, {});
  return {
    ...pick(p, [
      "id",
      "slug",
      "name",
      "brand",
      "category",
      "price",
      "description",
      "stock",
      "rating",
      "accent",
      "badge",
      "featured",
      "bestSeller",
    ] as const),
    images: images.length ? images : ["/products/placeholder.svg"],
    sizes: parseJSON<unknown[]>(p.sizes, []).map(Number),
    sizeStock: Object.keys(sizeStock).length ? sizeStock : undefined,
    createdAt: iso(p.createdAt),
    reviewCount: reviewCount ?? p.reviews?.length ?? 0,
  } as Product;
}

export const serializeCoupon = (c: Row): Coupon =>
  ({
    ...pick(c, ["id", "code", "type", "value", "minSubtotal", "active", "description", "expiresAt"] as const),
    createdAt: iso(c.createdAt),
  }) as Coupon;

export const serializeReview = (r: Row): Review =>
  ({
    ...pick(r, ["id", "productId", "authorName", "rating", "comment"] as const),
    createdAt: iso(r.createdAt),
  }) as Review;

export const serializeOrder = (o: Row): Order => ({
  ...pick(o, ["id", "code", "userId", "status", "subtotal", "shipping", "total"] as const),
  items: parseJSON(o.items, []),
  customer: parseJSON(o.customer, { name: "", email: "" }),
  address: parseJSON(o.address, {} as Order["address"]),
  payment: parseJSON(o.payment, { method: "pix" }),
  createdAt: iso(o.createdAt),
});

export const serializeAddress = (a: Row): Address => ({
  ...pick(a, ["id", "userId", "label", "recipient", "cep", "street", "number", "district", "city", "state"] as const),
  complement: a.complement || undefined,
  isDefault: Boolean(a.isDefault),
  createdAt: iso(a.createdAt),
});

export const serializeNotification = (n: Row): Notification => ({
  ...pick(n, ["id", "type", "to", "subject", "body", "status"] as const),
  orderId: n.orderId ?? null,
  sentAt: iso(n.sentAt),
});
