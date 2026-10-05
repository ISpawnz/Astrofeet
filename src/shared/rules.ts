// Regras de negócio compartilhadas por front e back (o servidor continua sendo
// a autoridade: recalcula tudo no pedido; o front só usa para exibir).

export const ORDER_STATUSES = ["created", "paid", "shipped", "delivered", "cancelled"] as const;

export const FREE_SHIPPING_THRESHOLD = 300;
export const BASE_SHIPPING = 29.9;
export const shippingFor = (subtotal: number) =>
  subtotal <= 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING;

export const LOYALTY = { pointsPerReal: 1, brlPerPoint: 0.05, minRedeem: 100 } as const;

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Estoque de um tamanho (mapa por tamanho, com o estoque geral como reserva). */
export const stockFor = (p: { stock: number; sizeStock?: Record<string, number> }, size: number) =>
  p.sizeStock?.[String(size)] ?? p.stock;

export const CATEGORIES = ["Casual", "Corrida", "Lifestyle", "Performance", "Skate"] as const;
