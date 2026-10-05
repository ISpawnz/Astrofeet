import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { serializeProduct, serializeReview } from "@/server/serialize";
import { body, fail, parseJSON, route } from "@/server/http";
import { findProduct, notifyBackInStock, ProductUpdate, toProductData } from "@/server/products";

export const runtime = "nodejs";

// :id aceita id ou slug.
export const GET = route(async (_req, { id }) => {
  const product = (await findProduct(id)) ?? fail("Produto não encontrado.", 404);
  return { product: serializeProduct(product), reviews: product.reviews.map(serializeReview) };
});

export const PUT = route(async (req, { id }) => {
  await requireAdmin();
  const existing = (await db.product.findUnique({ where: { id } })) ?? fail("Produto não encontrado.", 404);
  const data = toProductData(await body(req, ProductUpdate), parseJSON<number[]>(existing.sizes, []));
  const updated = await db.product.update({ where: { id }, data, include: { reviews: { select: { id: true } } } });
  await notifyBackInStock(existing, updated);
  return { product: serializeProduct(updated) };
});

export const DELETE = route(async (_req, { id }) => {
  await requireAdmin();
  if (!(await db.product.findUnique({ where: { id } }))) fail("Produto não encontrado.", 404);
  await db.product.delete({ where: { id } });
  return { ok: true };
});
