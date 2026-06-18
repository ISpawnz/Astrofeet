"use client";

import type {
  Product,
  Review,
  Order,
  PublicUser,
} from "@/lib/types";

async function request<T>(
  input: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  const text = await res.text();
  const data = text ? safeParse(text) : null;
  if (!res.ok) {
    const message =
      (data && (data as { message?: string }).message) ||
      `Erro ${res.status}: não foi possível concluir a ação.`;
    throw new Error(message);
  }
  return data as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ---------- Auth ----------
export const api = {
  async me(): Promise<PublicUser | null> {
    try {
      const data = await request<{ user: PublicUser | null }>("/api/auth/me");
      return data.user;
    } catch {
      return null;
    }
  },
  async login(email: string, password: string): Promise<PublicUser> {
    const data = await request<{ user: PublicUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return data.user;
  },
  async register(name: string, email: string, password: string): Promise<PublicUser> {
    const data = await request<{ user: PublicUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    return data.user;
  },
  async logout(): Promise<void> {
    await request<{ ok: true }>("/api/auth/logout", { method: "POST" });
  },

  // ---------- Products ----------
  async products(params?: {
    category?: string;
    brand?: string;
    q?: string;
    sort?: string;
    min?: number;
    max?: number;
    size?: number;
    featured?: boolean;
    bestSeller?: boolean;
  }): Promise<Product[]> {
    const qs = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "")
          qs.set(k, String(v));
      });
    }
    const data = await request<{ products: Product[] }>(
      `/api/products?${qs.toString()}`,
    );
    return data.products;
  },
  async product(slug: string): Promise<{ product: Product; reviews: Review[] }> {
    return request(`/api/products/${encodeURIComponent(slug)}`);
  },
  async createProduct(body: Partial<Product>): Promise<Product> {
    const data = await request<{ product: Product }>("/api/products", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return data.product;
  },
  async updateProduct(id: string, body: Partial<Product>): Promise<Product> {
    const data = await request<{ product: Product }>(
      `/api/products/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
    );
    return data.product;
  },
  async deleteProduct(id: string): Promise<void> {
    await request<{ ok: true }>(`/api/products/${id}`, { method: "DELETE" });
  },

  // ---------- Orders ----------
  async createOrder(payload: {
    items: { productId: string; size: number; quantity: number }[];
    customer: Order["customer"];
    address: Order["address"];
    payment: Order["payment"];
    couponCode?: string;
  }): Promise<Order> {
    const data = await request<{ order: Order }>("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data.order;
  },
  async listOrders(): Promise<Order[]> {
    const data = await request<{ orders: Order[] }>("/api/orders");
    return data.orders;
  },
  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const data = await request<{ order: Order }>(
      `/api/orders/${id}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    );
    return data.order;
  },
  async trackOrder(code: string, email?: string): Promise<{
    order: {
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
    };
  }> {
    const qs = new URLSearchParams({ code });
    if (email) qs.set("email", email);
    return request(`/api/orders/track?${qs.toString()}`);
  },

  // ---------- Coupons ----------
  async validateCoupon(
    code: string,
    subtotal: number,
  ): Promise<{
    valid: boolean;
    code: string;
    type?: "percent" | "fixed";
    value?: number;
    description: string;
    discount: number;
    minSubtotal?: number;
    message?: string;
  }> {
    return request("/api/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, subtotal }),
    });
  },

  // ---------- Reviews ----------
  async createReview(payload: {
    productId: string;
    rating: number;
    comment: string;
    authorName: string;
  }): Promise<Review> {
    const data = await request<{ review: Review }>("/api/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data.review;
  },

  // ---------- Admin metrics ----------
  async adminMetrics(): Promise<{
    ordersToday: number;
    revenue: number;
    ticket: number;
    totalOrders: number;
    totalProducts: number;
    recent: Order[];
    byStatus: Record<string, number>;
  }> {
    return request("/api/admin/metrics");
  },

  // ---------- Chat (AI assistant) ----------
  async chat(messages: { role: "user" | "assistant"; content: string }[]): Promise<string> {
    const data = await request<{ reply: string }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
    return data.reply;
  },
};
