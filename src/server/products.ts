import "server-only";
import { z } from "zod";
import { db } from "@/server/db";
import { parseJSON, required, str } from "@/server/http";
import { sendEmailNotification } from "@/server/notifications";
import { slugify } from "@/shared/format";

// Só caminhos locais (/...) ou https://. Bloqueia javascript:, data:, http:.
const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^\/(?!\/)/.test(v) || /^https:\/\//i.test(v));

const fields = {
  name: required("Nome do produto é obrigatório.", 120).min(2, "Nome do produto é obrigatório."),
  brand: required("Marca é obrigatória.", 80),
  category: required("Categoria é obrigatória.", 80),
  price: z.coerce.number().positive("Preço inválido."),
  slug: str(120).transform(slugify),
  description: str(4000),
  images: z
    .array(z.unknown())
    .transform((l) => l.filter((v) => imageUrl.safeParse(v).success).slice(0, 12) as string[]),
  sizes: z.array(z.coerce.number()),
  stock: z.coerce.number().int().min(0),
  sizeStock: z.record(z.string(), z.unknown()),
  rating: z.coerce.number().min(0).max(5),
  accent: str(20),
  badge: str(40)
    .nullable()
    .transform((v) => v || null),
  featured: z.boolean(),
  bestSeller: z.boolean(),
};
export const ProductCreate = z
  .object(fields)
  .partial()
  .required({ name: true, brand: true, category: true, price: true });
export const ProductUpdate = z.object(fields).partial();

/** Converte o corpo validado para colunas do banco (arrays/mapas viram JSON). */
export function toProductData(input: z.infer<typeof ProductUpdate>, currentSizes: number[] = []) {
  const { images, sizes, sizeStock, ...rest } = input;
  const data: Record<string, unknown> = { ...rest };
  if (images) data.images = JSON.stringify(images.length ? images : ["/products/placeholder.svg"]);
  if (sizes) data.sizes = JSON.stringify(sizes);
  if (sizeStock) {
    // Só tamanhos existentes, quantidades inteiras >= 0.
    const map: Record<string, number> = {};
    for (const s of sizes ?? currentSizes) {
      const v = Math.floor(Number(sizeStock[String(s)]));
      if (v >= 0) map[s] = v;
    }
    data.sizeStock = JSON.stringify(map);
  }
  return data;
}

export const findProduct = (idOrSlug: string) =>
  db.product.findFirst({
    where: { OR: [{ slug: idOrSlug }, { id: idOrSlug }] },
    include: { reviews: { orderBy: { createdAt: "desc" } } },
  });

const inStock = (p: Record<string, unknown>) =>
  (p.stock as number) > 0 && Object.values(parseJSON<Record<string, number>>(p.sizeStock, { _: 1 })).some((v) => v > 0);

/** Se o produto voltou ao estoque, avisa quem pediu "avise-me". */
export async function notifyBackInStock(before: Record<string, unknown>, after: Record<string, unknown>) {
  if (inStock(before) || !inStock(after)) return;
  for (const u of await db.user.findMany({}))
    if (parseJSON<string[]>(u.stockAlerts, []).includes(after.id as string))
      await sendEmailNotification({
        type: "order_status",
        to: u.email,
        subject: `${after.name} voltou ao estoque!`,
        body: `Olá, ${u.name}!\n\nO tênis "${after.name}" que você marcou voltou ao estoque. Corra antes que esgote de novo!\n\n— Equipe Astrofeet`,
      });
}
