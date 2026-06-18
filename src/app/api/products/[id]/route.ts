import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { serializeProduct, serializeReview } from "@/lib/serialize";
import { HttpError, handleApiError, ok } from "@/lib/api";
import type { Product } from "@/lib/types";

export const runtime = "nodejs";

async function findProduct(idOrSlug: string) {
  const product = await db.product.findFirst({
    where: { OR: [{ slug: idOrSlug }, { id: idOrSlug }] },
    include: { reviews: { orderBy: { createdAt: "desc" } } },
  });
  return product;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await findProduct(id);
    if (!product) throw new HttpError("Produto não encontrado.", 404);
    return ok({
      product: serializeProduct(product, (product.reviews as unknown[]).length),
      reviews: (product.reviews as []).map(serializeReview),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as Partial<Product>;
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) throw new HttpError("Produto não encontrado.", 404);

    const data: Record<string, unknown> = {};
    if (body.name) data.name = String(body.name);
    if (body.brand) data.brand = String(body.brand);
    if (body.category) data.category = String(body.category);
    if (body.slug) {
      data.slug = String(body.slug)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (typeof body.price === "number" && body.price > 0) data.price = body.price;
    if (typeof body.description === "string") data.description = body.description;
    if (Array.isArray(body.images))
      data.images = JSON.stringify(body.images.filter(Boolean));
    if (Array.isArray(body.sizes))
      data.sizes = JSON.stringify(body.sizes.map((s) => Number(s)));
    if (typeof body.stock === "number") data.stock = body.stock;
    if (typeof body.rating === "number") data.rating = body.rating;
    if (typeof body.accent === "string") data.accent = body.accent;
    if (body.badge !== undefined) data.badge = body.badge ? String(body.badge) : null;
    if (typeof body.featured === "boolean") data.featured = body.featured;
    if (typeof body.bestSeller === "boolean") data.bestSeller = body.bestSeller;

    const updated = await db.product.update({
      where: { id },
      data,
      include: { reviews: { select: { id: true } } },
    });
    return ok({ product: serializeProduct(updated) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) throw new HttpError("Produto não encontrado.", 404);
    await db.product.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
