import type { ViewName, ViewParams } from "@/shared/types";

// Roteamento por hash (#/produto/orion-runner). O app é uma SPA de rota única,
// então o hash dá a cada tela uma URL compartilhável e faz o botão
// voltar/avançar do navegador funcionar — sem mudar a infra de deploy.

const PATH: Record<ViewName, string> = {
  home: "",
  products: "drops",
  product: "produto",
  checkout: "checkout",
  "order-success": "pedido-confirmado",
  admin: "admin",
  account: "conta",
  wishlist: "favoritos",
  "track-order": "rastreio",
  info: "info",
};

// Para estas telas um parâmetro vira segmento de caminho (/produto/<slug>).
const SEGMENT_PARAM: Partial<Record<ViewName, string>> = {
  product: "id",
  info: "page",
};

const BY_PATH = new Map(
  (Object.entries(PATH) as [ViewName, string][]).map(([v, p]) => [p, v]),
);

export const VIEW_TITLES: Record<ViewName, string> = {
  home: "Sneakers de outro planeta",
  products: "Drops",
  product: "Produto",
  checkout: "Checkout",
  "order-success": "Pedido confirmado",
  admin: "Painel do Comando",
  account: "Minha conta",
  wishlist: "Lista de desejos",
  "track-order": "Rastrear pedido",
  info: "Institucional",
};

export function toHash(view: ViewName, params: ViewParams = {}): string {
  const segKey = SEGMENT_PARAM[view];
  let path = `/${PATH[view]}`;
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    if (k === segKey) path += `/${encodeURIComponent(v)}`;
    else query.set(k, v);
  }
  const qs = query.toString();
  return `#${path === "/" ? "/" : path}${qs ? `?${qs}` : ""}`;
}

export function fromHash(hash: string): { view: ViewName; params: ViewParams } {
  const raw = hash.replace(/^#/, "");
  const [pathPart, qs = ""] = raw.split("?");
  const [first = "", second] = pathPart.split("/").filter(Boolean);
  const view = BY_PATH.get(first ?? "") ?? "home";
  const params: ViewParams = {};
  new URLSearchParams(qs).forEach((v, k) => {
    params[k] = v;
  });
  const segKey = SEGMENT_PARAM[view];
  if (segKey && second) {
    try {
      params[segKey] = decodeURIComponent(second);
    } catch {
      /* segmento malformado: ignora */
    }
  }
  // Pós-compra depende do pedido em memória — um link direto não tem como mostrá-lo.
  if (view === "order-success") return { view: "home", params: {} };
  // Produto sem slug não existe.
  if (view === "product" && !params.id) return { view: "products", params: {} };
  return { view, params };
}
