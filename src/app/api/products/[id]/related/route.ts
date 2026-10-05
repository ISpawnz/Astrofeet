import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { serializeProduct } from "@/server/serialize";
import { handleApiError, ok } from "@/server/http";

export const runtime = "nodejs";

// GET /api/products/[id]/related — returns up to 4 related products
// Strategy: same brand → same category → fallback to other products, excluding the current one.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
    });
    if (!product) {
      // Try by slug
      const bySlug = await db.product.findFirst({
        where: { slug: id },
      });
      if (!bySlug) return ok({ products: [] });
      return relatedFor(bySlug);
    }
    return relatedFor(product);
  } catch (e) {
    return handleApiError(e);
  }
}

async function relatedFor(product: Record<string, unknown>) {
  const brand = product.brand as string;
  const category = product.category as string;
  const id = product.id as string;

  // 1. Same brand (excluding current)
  const sameBrand = await db.product.findMany({
    where: { brand, id: { not: id } },
    orderBy: { rating: "desc" },
  });

  // 2. Same category (excluding current + same-brand already found)
  const brandIds = new Set(sameBrand.map((p) => p.id));
  const sameCategory = await db.product.findMany({
    where: { category, id: { not: id } },
    orderBy: { rating: "desc" },
  });

  // 3. Other products (fallback)
  const categoryIds = new Set([...brandIds, ...sameCategory.map((p) => p.id)]);
  const others = await db.product.findMany({
    where: { id: { not: id } },
    orderBy: { rating: "desc" },
  });

  // Merge: brand first, then category, then others — deduplicate
  const seen = new Set<string>();
  const merged: Record<string, unknown>[] = [];
  for (const p of [...sameBrand, ...sameCategory, ...others]) {
    if (!seen.has(p.id as string) && p.id !== id) {
      seen.add(p.id as string);
      merged.push(p);
    }
    if (merged.length >= 4) break;
  }

  // Compute reviewCount for each
  const products: ReturnType<typeof serializeProduct>[] = [];
  for (const p of merged) {
    const reviewCount = await db.review.count({
      where: { productId: p.id },
    });
    products.push(serializeProduct(p as Parameters<typeof serializeProduct>[0], reviewCount));
  }

  return ok({ products });
}
