import { z } from "zod";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { serializeReview } from "@/server/serialize";
import { body, fail, ok, route, str } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { round2 } from "@/shared/rules";

export const runtime = "nodejs";

const NewReview = z.object({
  productId: z.string().min(1, "Produto inválido."),
  rating: z.coerce.number().int().min(1, "Nota inválida (1 a 5).").max(5, "Nota inválida (1 a 5)."),
  comment: str(600).default(""),
  authorName: str(60).default(""),
});

export const POST = route(async (req) => {
  rateLimit(req, "reviews:create", 8, 15 * 60 * 1000);
  const user = await getCurrentUser();
  const { productId, rating, comment, authorName } = await body(req, NewReview);
  if (!(await db.product.findUnique({ where: { id: productId } }))) fail("Produto não encontrado.", 404);
  // Logado, o nome vem da sessão (não dá para se passar por outra pessoa).
  const review = await db.review.create({
    data: {
      productId,
      userId: user?.id ?? null,
      authorName: user?.name || authorName || "Cliente anônimo",
      rating,
      comment,
    },
  });
  const ratings = (await db.review.findMany({ where: { productId } })).map((r) => r.rating as number);
  await db.product.update({
    where: { id: productId },
    data: { rating: round2(ratings.reduce((a, b) => a + b, 0) / ratings.length) },
  });
  return ok({ review: serializeReview(review) }, 201);
});
