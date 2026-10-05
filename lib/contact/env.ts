import { z } from "zod";
import {
  isOfficialTurnstileTestSecret,
  isTurnstileTestSiteKey,
  looksLikeTurnstileTestSecret,
} from "@/lib/contact/constants";

/**
 * Configuração de servidor do formulário de contacto. Lida só aqui, nunca
 * duplicada.
 *
 * Restrições vinculativas:
 * - R1: destino, remetente, chaves e modo vivem APENAS em variáveis de
 *   ambiente do servidor. Nunca em `NEXT_PUBLIC_`, nunca em `content/`,
 *   nunca em `public/admin/config.yml`, nunca no repositório.
 * - R3: sem modo por omissão. `CONTACT_DELIVERY_MODE` ausente ou inválido
 *   faz a rota falhar fechada (503). Sem fallback para o remetente de
 *   testes do Resend nem para chaves de teste.
 * - R4: secrets de teste recusadas em `send` com NODE_ENV=production;
 *   secrets reais recusadas em `dry-run`.
 * - R5: `dry-run` nunca lê `RESEND_API_KEY` nem `CONTACT_RECIPIENT_EMAIL`
 *   (só verifica se estão definidas, para avisar de fugas de segredos).
 * - Os erros nomeiam a variável, NUNCA o valor.
 *
 * Este módulo é só de servidor: não importar a partir de Client Components.
 */

export type ContactConfig =
  | {
      mode: "send";
      resendApiKey: string;
      fromEmail: string;
      recipient: string;
      turnstileSecretKey: string;
      siteOrigin: string;
      expectedHostname: string;
    }
  | { mode: "dry-run"; turnstileSecretKey: string };

export type ContactConfigResult =
  | { ok: true; config: ContactConfig; warnings: string[] }
  | { ok: false; variable: string; reason: string };

const emailSchema = z.string().email().max(254);

function invalid(variable: string, reason: string): ContactConfigResult {
  return { ok: false, variable, reason };
}

function readVar(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * `RESEND_FROM_EMAIL` aceita `email@dominio` ou `Nome <email@dominio>`.
 * Recusa quebras de linha e ângulos soltos (vai para um cabeçalho).
 */
function isValidFromAddress(value: string): boolean {
  if (/[\r\n]/.test(value)) return false;
  const named = /^[^<>"\r\n]+ <([^<>\s]+)>$/.exec(value);
  const address = named ? named[1] : value;
  return emailSchema.safeParse(address).success;
}

/**
 * `CONTACT_SITE_ORIGIN`: origem absoluta sem caminho, query nem
 * credenciais, JÁ na forma canónica (igual a `new URL(v).origin`, com ou sem
 * barra final): host em minúsculas e sem porta por omissão explícita (ex.:
 * `:443`). Não normaliza: recusa o que não estiver nessa forma. `https:`
 * obrigatório; `http://localhost` (ou 127.0.0.1) só fora de
 * NODE_ENV=production.
 */
function parseSiteOrigin(value: string): { origin: string; hostname: string } | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.username || url.password || url.search || url.hash) return null;
  if (url.pathname !== "/") return null;
  if (value.replace(/\/$/, "") !== url.origin) return null;

  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const allowHttp = process.env.NODE_ENV !== "production" && isLocalhost;
  if (url.protocol !== "https:" && !(url.protocol === "http:" && allowHttp)) return null;

  return { origin: url.origin, hostname: url.hostname };
}

export function readContactConfig(): ContactConfigResult {
  const mode = readVar("CONTACT_DELIVERY_MODE");
  if (mode !== "send" && mode !== "dry-run") {
    return invalid("CONTACT_DELIVERY_MODE", mode === undefined ? "em falta" : "valor não suportado");
  }

  // Mesma regra que faz falhar o build.
  const violation = productionDeployViolation();
  if (violation) return invalid(violation.variable, violation.reason);

  const turnstileSecretKey = readVar("TURNSTILE_SECRET_KEY");
  if (!turnstileSecretKey) return invalid("TURNSTILE_SECRET_KEY", "em falta");

  if (mode === "dry-run") {
    if (!isOfficialTurnstileTestSecret(turnstileSecretKey)) {
      // Uma secret real em dry-run é sinal de configuração trocada entre
      // contextos (ex.: dry-run definido por engano em Production).
      return invalid("TURNSTILE_SECRET_KEY", "não é uma secret de teste oficial em modo dry-run");
    }
    const warnings: string[] = [];
    // Só presença, nunca o valor.
    for (const name of ["RESEND_API_KEY", "CONTACT_RECIPIENT_EMAIL"]) {
      if (readVar(name) !== undefined) warnings.push(name);
    }
    return { ok: true, config: { mode: "dry-run", turnstileSecretKey }, warnings };
  }

  if (process.env.NODE_ENV === "production" && looksLikeTurnstileTestSecret(turnstileSecretKey)) {
    return invalid("TURNSTILE_SECRET_KEY", "secret de teste em modo send");
  }

  const resendApiKey = readVar("RESEND_API_KEY");
  if (!resendApiKey) return invalid("RESEND_API_KEY", "em falta");

  const fromEmail = readVar("RESEND_FROM_EMAIL");
  if (!fromEmail) return invalid("RESEND_FROM_EMAIL", "em falta");
  if (!isValidFromAddress(fromEmail)) return invalid("RESEND_FROM_EMAIL", "formato inválido");

  const recipient = readVar("CONTACT_RECIPIENT_EMAIL");
  if (!recipient) return invalid("CONTACT_RECIPIENT_EMAIL", "em falta");
  // Um único endereço: sem vírgulas, espaços ou listas (o Zod recusa-os).
  if (!emailSchema.safeParse(recipient).success) {
    return invalid("CONTACT_RECIPIENT_EMAIL", "não é um único email válido");
  }

  const siteOriginRaw = readVar("CONTACT_SITE_ORIGIN");
  if (!siteOriginRaw) return invalid("CONTACT_SITE_ORIGIN", "em falta");
  const siteOrigin = parseSiteOrigin(siteOriginRaw);
  if (!siteOrigin) {
    return invalid("CONTACT_SITE_ORIGIN", "tem de ser uma origem https:// canónica, sem caminho");
  }

  return {
    ok: true,
    config: {
      mode: "send",
      resendApiKey,
      fromEmail,
      recipient,
      turnstileSecretKey,
      siteOrigin: siteOrigin.origin,
      expectedHostname: siteOrigin.hostname,
    },
    warnings: [],
  };
}

/**
 * "Deploy de produção" na Vercel: `VERCEL_ENV === "production"` (variável de
 * sistema da Vercel, disponível no build e em runtime; `preview` nos Preview
 * deployments e `development` com `vercel dev`). Localmente não está
 * definida, por isso `next build` local não é tratado como produção.
 */
export function isProductionDeploy(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Quando é obrigatório usar chaves REAIS do Turnstile no build:
 * deploy de produção na Vercel OU `next build`/`next start` (NODE_ENV=production)
 * com `CONTACT_DELIVERY_MODE=send`. O segundo caso cobre um projeto em que as
 * variáveis de sistema da Vercel (`VERCEL_ENV`) não estão expostas: as
 * variáveis do projeto continuam disponíveis no build. Builds de teste
 * (local ou Preview) usam `dry-run` e não são afetados.
 */
function requiresRealTurnstileKeys(): boolean {
  return (
    isProductionDeploy() ||
    (process.env.NODE_ENV === "production" && readVar("CONTACT_DELIVERY_MODE") === "send")
  );
}

/**
 * Regra ÚNICA de configuração proibida num deploy de produção, usada pelo
 * runtime (`readContactConfig`, 503) e pelo build
 * (`assertProductionBuildConfig`, throw):
 * - `CONTACT_DELIVERY_MODE=dry-run`: os contactos reais seriam descartados
 *   em silêncio (ex.: valores de Preview copiados para Production);
 * - `TURNSTILE_SECRET_KEY` de teste, seja qual for o modo.
 * Variáveis em falta não são violação aqui (tratadas à parte: 503 em runtime,
 * sem falhar o build). Devolve só o nome da variável e o motivo, nunca o valor.
 */
function productionDeployViolation(): { variable: string; reason: string } | null {
  if (!isProductionDeploy()) return null;
  if (readVar("CONTACT_DELIVERY_MODE") === "dry-run") {
    return { variable: "CONTACT_DELIVERY_MODE", reason: "dry-run num deploy de produção" };
  }
  const secret = readVar("TURNSTILE_SECRET_KEY");
  if (secret !== undefined && looksLikeTurnstileTestSecret(secret)) {
    return { variable: "TURNSTILE_SECRET_KEY", reason: "secret de teste num deploy de produção" };
  }
  return null;
}

/** Faz falhar o BUILD de produção com a mesma regra do runtime. */
function assertProductionBuildConfig(): void {
  const violation = productionDeployViolation();
  if (violation) {
    throw new Error(`[lib/contact/env] ${violation.variable}: ${violation.reason} (ver .env.example).`);
  }
}

/**
 * Site key pública do Turnstile, lida num Server Component durante o
 * prerender. Sem prefixo `NEXT_PUBLIC_` de propósito:
 * permite validar aqui e fazer falhar o build de produção.
 *
 * - Deploy de produção (`VERCEL_ENV=production`) ou NODE_ENV=production com
 *   `CONTACT_DELIVERY_MODE=send`: chave ausente, inválida ou de
 *   teste -> `throw` (o build falha e o deploy anterior continua no ar).
 * - Deploy de produção com `CONTACT_DELIVERY_MODE=dry-run` ou secret de teste
 *   -> `throw`.
 * - Fora de produção: chave ausente ou inválida -> `null` (formulário
 *   desativado com a mensagem de erro); chave de teste -> devolvida.
 *
 * Chamar só quando o formulário está visível.
 */
export function readTurnstileSiteKey(): string | null {
  assertProductionBuildConfig();

  const siteKey = readVar("TURNSTILE_SITE_KEY");
  const wellFormed = siteKey !== undefined && /^[A-Za-z0-9_-]{1,100}$/.test(siteKey);

  if (requiresRealTurnstileKeys()) {
    if (!wellFormed) {
      throw new Error(
        "[lib/contact/env] TURNSTILE_SITE_KEY em falta ou inválida num deploy de produção (ou build com CONTACT_DELIVERY_MODE=send) com o formulário de contacto visível (ver .env.example).",
      );
    }
    if (isTurnstileTestSiteKey(siteKey)) {
      throw new Error(
        "[lib/contact/env] TURNSTILE_SITE_KEY é uma chave de teste da Cloudflare num deploy de produção (ou build com CONTACT_DELIVERY_MODE=send) (ver .env.example).",
      );
    }
    return siteKey;
  }

  if (!wellFormed) {
    if (siteKey !== undefined) {
      console.error("[lib/contact/env] TURNSTILE_SITE_KEY com formato inválido; formulário desativado.");
    }
    return null;
  }
  return siteKey;
}
