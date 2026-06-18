import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { serializeReview } from "@/lib/serialize";
import { HttpError, handleApiError, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    if (!productId) throw new HttpError("productId é obrigatório.", 400);
    const reviews = await db.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
    });
    return ok({ reviews: reviews.map(serializeReview) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));
    const productId = String(body.productId ?? "");
    const rating = Math.round(Number(body.rating));
    const comment = String(body.comment ?? "").trim();
    const authorName =
      String(body.authorName ?? "").trim() ||
      user?.name ||
      "Explorador anônimo";

    if (!productId) throw new HttpError("Produto inválido.", 400);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      throw new HttpError("Nota inválida (1 a 5).", 400);
    if (comment.length > 600)
      throw new HttpError("Comentário muito longo.", 400);

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) throw new HttpError("Produto não encontrado.", 404);

    const review = await db.review.create({
      data: {
        productId,
        userId: user?.id ?? null,
        authorName,
        rating,
        comment,
      },
    });

    // Recompute product rating
    const agg = await db.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    });
    if (agg._avg.rating) {
      await db.product.update({
        where: { id: productId },
        data: { rating: Number(agg._avg.rating.toFixed(2)) },
      });
    }

    return ok({ review: serializeReview(review) }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
