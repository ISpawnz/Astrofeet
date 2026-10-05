import { db } from "@/server/db";
import { serializeProduct } from "@/server/serialize";
import { route } from "@/server/http";

export const runtime = "nodejs";

// Até 4 relacionados: mesma marca → mesma categoria → melhor avaliados. :id aceita id ou slug.
export const GET = route(async (_req, { id }) => {
  const product = await db.product.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!product) return { products: [] };
  const others = await db.product.findMany({
    where: { id: { not: product.id } },
    orderBy: { rating: "desc" },
    include: { reviews: { select: { id: true } } },
  });
  const rank = (p: (typeof others)[number]) =>
    p.brand === product.brand ? 0 : p.category === product.category ? 1 : 2;
  return {
    products: others
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, 4)
      .map((p) => serializeProduct(p)),
  };
});
