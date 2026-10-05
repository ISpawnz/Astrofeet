import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { HttpError, handleApiError } from "@/server/http";
import type { Order } from "@/shared/types";

export const runtime = "nodejs";

function escapeCsv(value: string): string {
  // Neutraliza "CSV injection": células iniciadas por = + - @ viram fórmulas no Excel.
  if (/^[=+\-@\t\r]/.test(value)) value = `'${value}`;
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function ordersToCsv(orders: Order[]): string {
  const headers = [
    "Código",
    "Status",
    "Data",
    "Cliente",
    "E-mail",
    "Telefone",
    "CEP",
    "Cidade",
    "Estado",
    "Método de pagamento",
    "Cupom",
    "Desconto",
    "Subtotal",
    "Frete",
    "Total",
    "Itens",
  ];
  const lines = [headers.join(",")];
  for (const o of orders) {
    const items = o.items
      .map((i) => `${i.name} (tam. ${i.size} × ${i.quantity})`)
      .join("; ");
    const row = [
      o.code,
      o.status,
      new Date(o.createdAt).toLocaleString("pt-BR"),
      o.customer.name,
      o.customer.email,
      o.customer.phone ?? "",
      o.address.cep,
      o.address.city,
      o.address.state,
      o.payment.method,
      o.payment.couponCode ?? "",
      String(o.payment.discount ?? 0),
      String(o.subtotal),
      String(o.shipping),
      String(o.total),
      items,
    ];
    lines.push(row.map(escapeCsv).join(","));
  }
  return lines.join("\n");
}

// GET /api/orders/export?format=csv|json — export the user's orders (admin sees all)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);

    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "csv";

    let orders;
    if (user.role === "admin") {
      orders = await db.order.findMany({ orderBy: { createdAt: "desc" } });
    } else {
      orders = await db.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
    }

    // Serialize orders
    const serialized: Order[] = orders.map((o) => {
      let items = [];
      let customer = { name: "", email: "" };
      let address = {} as Order["address"];
      let payment = { method: "pix" } as Order["payment"];
      try { items = JSON.parse(o.items || "[]"); } catch { items = []; }
      try { customer = JSON.parse(o.customer || "{}"); } catch { /* noop */ }
      try { address = JSON.parse(o.address || "{}"); } catch { /* noop */ }
      try { payment = JSON.parse(o.payment || "{}"); } catch { /* noop */ }
      return {
        id: o.id,
        code: o.code,
        userId: o.userId,
        status: o.status,
        items,
        subtotal: o.subtotal,
        shipping: o.shipping,
        total: o.total,
        customer,
        address,
        payment,
        createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
      };
    });

    if (format === "json") {
      return new Response(JSON.stringify({ orders: serialized }, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="pedidos-astrofeet-${Date.now()}.json"`,
        },
      });
    }

    // CSV format (default)
    const csv = ordersToCsv(serialized);
    return new Response("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pedidos-astrofeet-${Date.now()}.csv"`,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
