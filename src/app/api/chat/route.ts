import { z } from "zod";
import ZAI from "z-ai-web-dev-sdk";
import { body, route } from "@/server/http";
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

const Chat = z.object({
  messages: z
    .array(z.unknown())
    .transform((list) =>
      list
        .flatMap((m) => {
          const r = z.object({ role: z.enum(["user", "assistant"]), content: z.string() }).safeParse(m);
          return r.success ? [{ ...r.data, content: r.data.content.slice(0, 1200) }] : [];
        })
        .slice(-12),
    )
    .refine((l) => l.length > 0, "Mensagem vazia."),
});

export const POST = route(async (req) => {
  rateLimit(req, "chat", 40, 15 * 60 * 1000);
  const { messages } = await body(req, Chat);
  const completion = await (
    await ZAI.create()
  ).chat.completions.create({
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    temperature: 0.6,
    max_tokens: 320,
  });
  return {
    reply:
      completion.choices?.[0]?.message?.content?.trim() || "Não consegui te responder agora, mas pode chamar de novo!",
  };
});
