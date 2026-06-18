import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { serializeProduct } from "@/lib/serialize";
import { HttpError, handleApiError, ok } from "@/lib/api";
import type { Product } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") || undefined;
    const brand = url.searchParams.get("brand") || undefined;
    const q = url.searchParams.get("q") || undefined;
    const sort = url.searchParams.get("sort") || undefined;
    const min = url.searchParams.get("min");
    const max = url.searchParams.get("max");
    const size = url.searchParams.get("size");
    const featured = url.searchParams.get("featured");
    const bestSeller = url.searchParams.get("bestSeller");

    const where: Record<string, unknown> = {};
    if (category && category !== "Todos") where.category = category;
    if (brand && brand !== "Todas") where.brand = brand;
    if (featured === "true") where.featured = true;
    if (bestSeller === "true") where.bestSeller = true;
    if (min || max) {
      where.price = {};
      if (min) (where.price as { gte?: number }).gte = Number(min);
      if (max) (where.price as { lte?: number }).lte = Number(max);
    }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { brand: { contains: q } },
        { category: { contains: q } },
        { description: { contains: q } },
      ];
    }
    // size filter (stored as JSON string array) — use contains on the raw string
    if (size) {
      where.sizes = { contains: String(size) };
    }

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "price-asc") orderBy = { price: "asc" };
    else if (sort === "price-desc") orderBy = { price: "desc" };
    else if (sort === "rating") orderBy = { rating: "desc" };
    else if (sort === "newest") orderBy = { createdAt: "desc" };

    const products = await db.product.findMany({
      where,
      orderBy,
      include: { reviews: { select: { id: true } } },
    });

    const out = products.map((p) =>
      serializeProduct(p, (p.reviews as { length?: number }).length),
    );
    return ok({ products: out });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as Partial<Product>;
    const name = String(body.name ?? "").trim();
    const brand = String(body.brand ?? "").trim();
    const category = String(body.category ?? "").trim();
    if (name.length < 2) throw new HttpError("Nome do produto é obrigatório.", 400);
    if (!brand) throw new HttpError("Marca é obrigatória.", 400);
    if (!category) throw new HttpError("Categoria é obrigatória.", 400);
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0)
      throw new HttpError("Preço inválido.", 400);

    const slug =
      String(body.slug ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const images = Array.isArray(body.images)
      ? body.images.filter(Boolean)
      : ["/products/placeholder.svg"];
    const sizes = Array.isArray(body.sizes)
      ? body.sizes.map((s) => Number(s)).filter((n) => Number.isFinite(n))
      : [38, 39, 40, 41, 42];

    // Per-size stock map (optional). If provided, only keys matching selected
    // sizes are kept; values are clamped to >= 0.
    let sizeStock: Record<string, number> = {};
    if (body.sizeStock && typeof body.sizeStock === "object") {
      for (const s of sizes) {
        const v = Number((body.sizeStock as Record<string, unknown>)[String(s)]);
        if (Number.isFinite(v) && v >= 0) sizeStock[String(s)] = Math.floor(v);
      }
    }

    const created = await db.product.create({
      data: {
        slug,
        name,
        brand,
        category,
        price,
        description: String(body.description ?? ""),
        images: JSON.stringify(images),
        sizes: JSON.stringify(sizes),
        stock: Number(body.stock ?? 0) || 0,
        sizeStock: JSON.stringify(sizeStock),
        rating: Number(body.rating ?? 4.5) || 4.5,
        accent: String(body.accent ?? "#34e7ff"),
        badge: body.badge ? String(body.badge) : null,
        featured: Boolean(body.featured),
        bestSeller: Boolean(body.bestSeller),
      },
      include: { reviews: { select: { id: true } } },
    });
    return ok(
      { product: serializeProduct(created, 0) },
      201,
    );
  } catch (e) {
    return handleApiError(e);
  }
}
