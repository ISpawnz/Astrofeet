"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, X, Send, Sparkles } from "lucide-react";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK = [
  "Como acompanho meu pedido?",
  "Qual o prazo de entrega?",
  "Me ajuda a escolher um tênis",
  "Como funciona a troca?",
];

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Olá, explorador! 🚀 Eu sou a Nave. Posso te ajudar com pedido, entrega, escolha de produto e mais. O que você precisa?",
};

export function ShipAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await api.chat(
        next.map((m) => ({ role: m.role, content: m.content })),
      );
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Tive um problema para responder agora, mas pode tentar de novo! 🚀",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating ship button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full"
        aria-label="Abrir assistente"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="absolute inset-0 rounded-full bg-[var(--neon-cyan)] opacity-25 blur-xl" />
        <span className="absolute inset-0 rounded-full border border-[var(--neon-cyan)]/50" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-violet)] text-black shadow-[0_0_25px_var(--neon-cyan)]">
          {open ? <X className="h-6 w-6" /> : <Rocket className="h-6 w-6" />}
        </span>
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--neon-magenta)] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--neon-magenta)]" />
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="fixed bottom-24 right-5 z-50 flex h-[30rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl glass-strong shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-[var(--neon-cyan)]/10 to-[var(--neon-magenta)]/10 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-violet)] text-black">
                <Rocket className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold leading-tight">Nave</p>
                <p className="text-xs text-muted-foreground">
                  Sua guia pela galáxia
                </p>
              </div>
              <Sparkles className="h-4 w-4 text-[var(--neon-cyan)]" />
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto p-4"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                      m.role === "user"
                        ? "rounded-br-sm bg-[var(--neon-cyan)] text-black"
                        : "rounded-bl-sm bg-white/5 text-foreground",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-white/5 px-3 py-3">
                    <Dot delay="0s" />
                    <Dot delay="0.15s" />
                    <Dot delay="0.3s" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick replies */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-foreground/80 transition hover:border-[var(--neon-cyan)]/50 hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-white/10 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte à Nave..."
                className="h-10 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--neon-cyan)]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--neon-cyan)] text-black transition hover:opacity-90 disabled:opacity-40"
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60"
      style={{ animationDelay: delay }}
    />
  );
}
