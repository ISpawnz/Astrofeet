import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { serializeProduct } from "@/server/serialize";
import { body, ok, route } from "@/server/http";
import { ProductCreate, toProductData } from "@/server/products";
import { slugify } from "@/shared/format";

export const runtime = "nodejs";

const SORT: Record<string, Record<string, string>> = {
  "price-asc": { price: "asc" },
  "price-desc": { price: "desc" },
  rating: { rating: "desc" },
};

export const GET = route(async (req) => {
  const q = Object.fromEntries(new URL(req.url).searchParams);
  const where: Record<string, unknown> = {};
  if (q.category && q.category !== "Todos") where.category = q.category;
  if (q.brand && q.brand !== "Todas") where.brand = q.brand;
  if (q.featured === "true") where.featured = true;
  if (q.bestSeller === "true") where.bestSeller = true;
  if (q.ids)
    where.id = {
      in: q.ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  if (q.min || q.max) where.price = { ...(q.min && { gte: Number(q.min) }), ...(q.max && { lte: Number(q.max) }) };
  if (q.size) where.sizes = { contains: q.size }; // sizes é um array JSON em texto
  if (q.q) where.OR = ["name", "brand", "category", "description"].map((f) => ({ [f]: { contains: q.q } }));

  const products = await db.product.findMany({
    where,
    orderBy: SORT[q.sort] ?? { createdAt: "desc" },
    include: { reviews: { select: { id: true } } },
  });
  return { products: products.map((p) => serializeProduct(p)) };
});

export const POST = route(async (req) => {
  await requireAdmin();
  const input = await body(req, ProductCreate);
  const created = await db.product.create({
    data: {
      description: "",
      stock: 0,
      rating: 4.5,
      accent: "#cc3d0a",
      badge: null,
      featured: false,
      bestSeller: false,
      images: JSON.stringify(["/products/placeholder.svg"]),
      sizes: JSON.stringify([38, 39, 40, 41, 42]),
      sizeStock: "{}",
      ...toProductData({ ...input, sizes: input.sizes ?? [38, 39, 40, 41, 42] }),
      slug: input.slug || slugify(input.name),
    },
  });
  return ok({ product: serializeProduct(created, 0) }, 201);
});
