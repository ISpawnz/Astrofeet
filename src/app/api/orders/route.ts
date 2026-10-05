import { getCurrentUser } from "@/server/auth";
import { body, ok, route } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { withLock } from "@/server/lock";
import { createOrder, listOrders, OrderInput } from "@/server/orders";

export const runtime = "nodejs";

export const GET = route(async (req) => {
  const user = await getCurrentUser();
  const mine = new URL(req.url).searchParams.get("mine") === "true";
  return { orders: user ? await listOrders(user, mine) : [] };
});

export const POST = route(async (req) => {
  rateLimit(req, "orders:create", 30, 15 * 60 * 1000);
  const [user, input] = await Promise.all([getCurrentUser(), body(req, OrderInput)]);
  // Serializado: checagem de estoque + baixa + cupom precisam ser atômicos.
  return ok({ order: await withLock("checkout", () => createOrder(input, user)) }, 201);
});
