import type { Product, Review, Order, OrderLineItem } from "@/lib/types";

// Parse the JSON-encoded arrays stored on the Product model and return a clean
// public shape (never leak internal storage details to the client).
export function serializeProduct(
  p: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    description: string;
    images: string;
    sizes: string;
    stock: number;
    rating: number;
    accent: string;
    badge: string | null;
    featured: boolean;
    bestSeller: boolean;
    createdAt: Date;
    reviews?: unknown[];
  },
  reviewCount?: number,
): Product {
  let images: string[] = [];
  let sizes: number[] = [];
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
    rating: p.rating,
    accent: p.accent,
    badge: p.badge,
    featured: p.featured,
    bestSeller: p.bestSeller,
    createdAt: p.createdAt.toISOString(),
    reviewCount: reviewCount ?? (p.reviews as { length?: number } | undefined)?.length ?? 0,
  };
}

export function serializeReview(r: {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}): Review {
  return {
    id: r.id,
    productId: r.productId,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  };
}

export function serializeOrder(o: {
  id: string;
  code: string;
  userId: string | null;
  status: string;
  items: string;
  subtotal: number;
  shipping: number;
  total: number;
  customer: string;
  address: string;
  payment: string;
  createdAt: Date;
}): Order {
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
