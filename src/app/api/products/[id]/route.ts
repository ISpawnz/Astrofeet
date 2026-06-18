import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { serializeProduct, serializeReview } from "@/lib/serialize";
import { HttpError, handleApiError, ok } from "@/lib/api";
import { sendEmailNotification } from "@/lib/notifications";
import type { Product } from "@/lib/types";

export const runtime = "nodejs";

function isAllSizeStockZero(sizeStockJson: string | undefined): boolean {
  if (!sizeStockJson) return true;
  try {
    const map = JSON.parse(sizeStockJson) as Record<string, number>;
    const values = Object.values(map);
    if (values.length === 0) return true;
    return values.every((v) => v <= 0);
  } catch {
    return true;
  }
}

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

    // Per-size stock map (optional). Only keys matching the (possibly updated)
    // sizes array are kept; values clamped to >= 0.
    if (body.sizeStock && typeof body.sizeStock === "object") {
      let sizesArr: number[] = [];
      try {
        sizesArr = JSON.parse((existing.sizes as string) || "[]");
      } catch {
        sizesArr = [];
      }
      if (Array.isArray(body.sizes)) sizesArr = body.sizes.map((s) => Number(s));
      const sizeStock: Record<string, number> = {};
      for (const s of sizesArr) {
        const v = Number((body.sizeStock as Record<string, unknown>)[String(s)]);
        if (Number.isFinite(v) && v >= 0) sizeStock[String(s)] = Math.floor(v);
      }
      data.sizeStock = JSON.stringify(sizeStock);
    }

    const updated = await db.product.update({
      where: { id },
      data,
      include: { reviews: { select: { id: true } } },
    });

    // Stock alert automation: if the product went from out-of-stock to in-stock,
    // queue "produto voltou ao estoque" notifications to all subscribers.
    try {
      const wasOutOfStock =
        (existing.stock as number) === 0 ||
        isAllSizeStockZero(existing.sizeStock as string);
      const newStock = typeof body.stock === "number" ? body.stock : (existing.stock as number);
      const newSizeStock = data.sizeStock
        ? (data.sizeStock as string)
        : (existing.sizeStock as string);
      const isInStockNow =
        newStock > 0 && !isAllSizeStockZero(newSizeStock);
      if (wasOutOfStock && isInStockNow) {
        // Find all users subscribed to this product
        const allUsers = await db.user.findMany({});
        const productName = (updated.name as string) || "produto";
        const productSlug = (updated.slug as string) || "";
        for (const u of allUsers) {
          let subscribedIds: string[] = [];
          try {
            subscribedIds = JSON.parse((u.stockAlerts as string) || "[]");
          } catch {
            subscribedIds = [];
          }
          if (subscribedIds.includes(id) && u.email) {
            await sendEmailNotification({
              type: "order_status",
              to: u.email as string,
              subject: `${productName} voltou ao estoque! 🚀`,
              body: [
                `Olá, ${u.name as string}!`,
                "",
                `Boa notícia: o sneaker "${productName}" que você marcou voltou ao estoque!`,
                "",
                "Corra antes que esgote de novo — os drops voam rápido por aqui.",
                "",
                "— Equipe Astrofeet",
              ].join("\n"),
              orderId: null,
            });
          }
        }
      }
    } catch {
      // Non-fatal: notification failure should never block product update.
    }

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
