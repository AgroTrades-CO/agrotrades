"use client";

import { useEffect, useState } from "react";

/**
 * Ponte entre o admin da TinaCMS e a pré-visualização.
 *
 * O admin carrega esta página no iframe. Ela lê a sessão da Tina Cloud do
 * `localStorage` — possível porque o /admin é servido da MESMA origem — e
 * envia-a a /api/editor-preview, que a valida contra a Tina Cloud e liga o
 * Draft Mode. Só então navega para a pré-visualização, para o caminho que o
 * SERVIDOR devolveu.
 *
 * Porquê esta página em vez de um redirect: uma navegação não leva cabeçalho
 * `Authorization`, e o token não pode ir em query string (fica em logs e no
 * `Referer`). É preciso JavaScript a fazer o pedido.
 *
 * O token é lido, enviado e esquecido: não vai para o estado, nem para o URL,
 * nem para a consola.
 */

/** Chave do `localStorage` usada pelo admin (tinacms, `AUTH_TOKEN_KEY`). */
const AUTH_TOKEN_KEY = "tinacms-auth";

/** O admin usa `id_token ?? access_token` como bearer; aqui é igual. */
function readToken(): string | null {
  try {
    const raw = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const tokens = parsed as { id_token?: unknown; access_token?: unknown };
    const token = typeof tokens.id_token === "string" ? tokens.id_token : tokens.access_token;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    // Modo privado, armazenamento bloqueado ou JSON estragado.
    return null;
  }
}

const MESSAGES = {
  loading: "A abrir a pré-visualização...",
  unauthorized: "Sessão da TinaCMS não encontrada ou expirada. Voltar a entrar no /admin e tentar de novo.",
  unknownTarget: "Esta página não tem pré-visualização.",
  failed: "Não foi possível abrir a pré-visualização.",
} as const;

type State = keyof typeof MESSAGES;

export function PreviewEntry({ target }: { target: string }) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let cancelled = false;
    const token = readToken();

    async function enter() {
      const response = await fetch("/api/editor-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ target }),
      });
      if (cancelled) return;
      if (response.status === 401 || response.status === 403) {
        setState("unauthorized");
        return;
      }
      if (response.status === 404) {
        setState("unknownTarget");
        return;
      }
      if (!response.ok) {
        setState("failed");
        return;
      }
      const { destination } = (await response.json()) as { destination?: unknown };
      if (cancelled) return;
      if (typeof destination !== "string") {
        setState("failed");
        return;
      }
      // `replace` para a entrada não ficar no histórico do iframe.
      window.location.replace(destination);
    }

    enter().catch(() => {
      if (!cancelled) setState("failed");
    });
    return () => {
      cancelled = true;
    };
  }, [target]);

  return (
    <p role="status" style={{ padding: "2rem", textAlign: "center" }}>
      {MESSAGES[state]}
    </p>
  );
}
