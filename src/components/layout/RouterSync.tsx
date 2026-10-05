"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useUIStore } from "@/stores/ui";
import { VIEW_TITLES } from "@/client/router";

/**
 * Liga o estado de navegação (zustand) à URL:
 *  - lê o hash na carga inicial (links diretos) e no botão voltar/avançar;
 *  - atualiza o <title> a cada tela;
 *  - devolve o foco ao conteúdo após navegar (leitores de tela / teclado).
 */
export function RouterSync() {
  const view = useUIStore((s) => s.view);
  const navigated = useUIStore((s) => s.navigated);
  const syncFromLocation = useUIStore((s) => s.syncFromLocation);
  const first = useRef(true);

  useLayoutEffect(() => {
    syncFromLocation();
    const onChange = () => syncFromLocation();
    window.addEventListener("popstate", onChange);
    window.addEventListener("hashchange", onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
      window.removeEventListener("hashchange", onChange);
    };
  }, [syncFromLocation]);

  // Título desejado da tela atual. O Next reaplica o <title> do metadata logo
  // após a hidratação (sobrescrevendo o nosso em links diretos), então
  // observamos o <head> e restauramos quando divergir.
  const desired = useRef("");
  useEffect(() => {
    const apply = () => {
      if (desired.current && document.title !== desired.current && !document.title.includes(" · Astrofeet")) {
        document.title = desired.current;
      }
    };
    const obs = new MutationObserver(apply);
    obs.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    desired.current =
      view === "home"
        ? "Astrofeet — Tênis de corrida, casual e skate"
        : `${VIEW_TITLES[view]} · Astrofeet`;
    document.title = desired.current;
    if (first.current) {
      first.current = false;
      return;
    }
    if (navigated) document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [view, navigated]);

  return null;
}
