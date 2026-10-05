import "server-only";
import type { Product, Review, Order, OrderLineItem, Address, Notification, NotificationType } from "@/shared/types";

// Linha crua do store (JSON dinâmico, espelha o Prisma Client).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

// Parse the JSON-encoded arrays stored on the Product model and return a clean
// public shape (never leak internal storage details to the client).
export function serializeProduct(p: Row,
  reviewCount?: number,
): Product {
  let images: string[] = [];
  let sizes: number[] = [];
  let sizeStock: Record<string, number> = {};
  try {
    images = JSON.parse(p.images || "[]");
  } catch {
    images = [];
  }
  try {
    sizes = JSON.parse(p.sizes || "[]").map((n: unknown) => Number(n));
  } catch {
    sizes = [];
  }
  try {
    sizeStock = JSON.parse(p.sizeStock || "{}");
  } catch {
    sizeStock = {};
  }
  if (!images.length) images = ["/products/placeholder.svg"];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    description: p.description,
    images,
    sizes,
    stock: p.stock,
    sizeStock: Object.keys(sizeStock).length ? sizeStock : undefined,
    rating: p.rating,
    accent: p.accent,
    badge: p.badge,
    featured: p.featured,
    bestSeller: p.bestSeller,
    createdAt: p.createdAt.toISOString(),
    reviewCount: reviewCount ?? (p.reviews as { length?: number } | undefined)?.length ?? 0,
  };
}

export function serializeCoupon(c: Row,
) {
  return {
    id: c.id,
    code: c.code,
    type: c.type as "percent" | "fixed",
    value: c.value,
    minSubtotal: c.minSubtotal,
    active: c.active,
    description: c.description,
    expiresAt: c.expiresAt,
    createdAt: c.createdAt.toISOString(),
  };
}

export function serializeReview(r: Row): Review {
  return {
    id: r.id,
    productId: r.productId,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  };
}

export function serializeOrder(o: Row): Order {
  let items: OrderLineItem[] = [];
  let customer = { name: "", email: "" };
  let address = {} as Order["address"];
  let payment = { method: "pix" } as Order["payment"];
  try {
    items = JSON.parse(o.items || "[]");
  } catch {
    items = [];
  }
  try {
    customer = JSON.parse(o.customer || "{}");
  } catch {
    /* noop */
  }
  try {
    address = JSON.parse(o.address || "{}");
  } catch {
    /* noop */
  }
  try {
    payment = JSON.parse(o.payment || "{}");
  } catch {
    /* noop */
  }
  return {
    id: o.id,
    code: o.code,
    userId: o.userId,
    status: o.status as Order["status"],
    items,
    subtotal: o.subtotal,
    shipping: o.shipping,
    total: o.total,
    customer,
    address,
    payment,
    createdAt: o.createdAt.toISOString(),
  };
}

export function serializeAddress(a: Row): Address {
  return {
    id: a.id,
    userId: a.userId,
    label: a.label,
    recipient: a.recipient,
    cep: a.cep,
    street: a.street,
    number: a.number,
    complement: a.complement || undefined,
    district: a.district,
    city: a.city,
    state: a.state,
    isDefault: Boolean(a.isDefault),
    createdAt: a.createdAt.toISOString(),
  };
}

export function serializeNotification(n: Row): Notification {
  return {
    id: n.id,
    type: n.type as NotificationType,
    to: n.to,
    subject: n.subject,
    body: n.body,
    orderId: n.orderId ?? null,
    sentAt: n.sentAt.toISOString(),
    status: n.status as Notification["status"],
  };
}
