import { NextRequest } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { handleApiError, ok, HttpError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Você é o assistente virtual oficial da Astrofeet, uma loja premium de tênis (corrida, casual e skate).
Tom: amigável, jovem, elegante, objetivo. Você fala português do Brasil.
Você AJUDA com:
- Dúvidas sobre pedidos (status, prazo, cancelamento)
- Entregas e frete (frete grátis acima de R$300, 3 a 7 dias úteis)
- Trocas e devoluções (até 30 dias)
- Ajuda para escolher produto (tamanho, categoria, estilo)
- Informações de pagamento (cartão, pix, boleto)
Regras:
- NUNCA invente preços. Se não souber, diga para checar na página do produto.
- Não use termos técnicos (API, backend, servidor, webhook, componentes).
- Respostas curtas (máx 4 frases), diretas e calorosas.
- Se o cliente quiser falar com humano, oriente a usar o WhatsApp da loja: (11) 99999-0000.
- Seja profissional e direto, sem gírias.`;

export async function POST(req: NextRequest) {
  try {
    rateLimit(req, "chat", 40, 15 * 60 * 1000);
    const body = await req.json().catch(() => ({}));
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const messages = rawMessages
      .filter(
        (m: { role?: string; content?: string }) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      )
      .slice(-12)
      .map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content.slice(0, 1200),
      }));

    if (messages.length === 0) throw new HttpError("Mensagem vazia.", 400);

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.6,
      max_tokens: 320,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Não consegui te responder agora, mas pode chamar de novo!";

    return ok({ reply });
  } catch (e) {
    return handleApiError(e);
  }
}
