import "server-only";

/**
 * Credenciais da Cloudinary, lidas só aqui.
 *
 * Restrições vinculativas:
 * - R1: as três variáveis vivem APENAS no ambiente de servidor. Nunca em
 *   `NEXT_PUBLIC_*` (o Next injetava-as no bundle do visitante), nunca em
 *   `TINA_PUBLIC_*` (a CLI da Tina escreve essas no JS do admin), nunca em
 *   `content/`, nunca no repositório.
 * - R2: sem valores por omissão. Variável em falta ou com formato inválido faz
 *   a rota falhar fechada (503). Sem media não se publica nada; não há modo
 *   degradado.
 * - R3: os erros nomeiam a variável, NUNCA o valor.
 *
 * `CLOUDINARY_CLOUD_NAME` não é segredo: aparece em todos os URLs de imagem do
 * site. Está aqui por conveniência, com as outras duas. O `api_key` também é
 * público por construção na Cloudinary (vai no formulário de upload do
 * browser); o `api_secret` é o único segredo e nunca sai do servidor.
 */

export type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export type CloudinaryConfigResult =
  | { ok: true; config: CloudinaryConfig }
  | { ok: false; variable: string; reason: string };

/** Nome da conta: minúsculas, dígitos, `-` e `_`. Vai para o URL da API. */
const CLOUD_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{1,62}[a-z0-9]$/;

/** O `api_key` da Cloudinary é numérico. */
const API_KEY_PATTERN = /^[0-9]{8,32}$/;

/** Só sanidade: recusa espaços, quebras de linha e valores truncados. */
const API_SECRET_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

/**
 * Prefixos que fariam o segredo chegar ao browser. Se alguém os definir, o
 * erro aparece aqui em vez de ficar uma chave publicada em silêncio no JS do
 * admin ou do site.
 */
const FORBIDDEN_VARS = [
  "NEXT_PUBLIC_CLOUDINARY_API_SECRET",
  "TINA_PUBLIC_CLOUDINARY_API_SECRET",
  "NEXT_PUBLIC_CLOUDINARY_API_KEY",
] as const;

function readVar(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function invalid(variable: string, reason: string): CloudinaryConfigResult {
  return { ok: false, variable, reason };
}

export function readCloudinaryConfig(): CloudinaryConfigResult {
  for (const name of FORBIDDEN_VARS) {
    if (readVar(name) !== undefined) {
      return invalid(name, "variável com prefixo público: o valor iria para o browser");
    }
  }

  const cloudName = readVar("CLOUDINARY_CLOUD_NAME");
  if (!cloudName) return invalid("CLOUDINARY_CLOUD_NAME", "em falta");
  if (!CLOUD_NAME_PATTERN.test(cloudName)) {
    return invalid("CLOUDINARY_CLOUD_NAME", "formato inválido");
  }

  const apiKey = readVar("CLOUDINARY_API_KEY");
  if (!apiKey) return invalid("CLOUDINARY_API_KEY", "em falta");
  if (!API_KEY_PATTERN.test(apiKey)) return invalid("CLOUDINARY_API_KEY", "formato inválido");

  const apiSecret = readVar("CLOUDINARY_API_SECRET");
  if (!apiSecret) return invalid("CLOUDINARY_API_SECRET", "em falta");
  if (!API_SECRET_PATTERN.test(apiSecret)) {
    return invalid("CLOUDINARY_API_SECRET", "formato inválido");
  }

  return { ok: true, config: { cloudName, apiKey, apiSecret } };
}
