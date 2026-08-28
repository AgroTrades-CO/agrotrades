/**
 * Configuração de servidor do formulário de contacto. Lida só aqui, nunca
 * duplicada — se faltar a variável, `readContactConfig()` devolve `null` e
 * a rota responde com um erro genérico (nunca diz ao cliente qual variável
 * falta — isso é só para os logs do servidor). Mesmo padrão de
 * `lib/auth/env.ts`.
 *
 * Restrição vinculativa 1 da arquitetura: este valor vive APENAS em
 * variável de ambiente do servidor. Nunca em `NEXT_PUBLIC_`, nunca em
 * `public/admin/config.yml`, nunca no repositório.
 */

export interface ContactConfig {
  resendApiKey: string;
}

export function readContactConfig(): ContactConfig | null {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error("[lib/contact/env] Configuração do formulário de contacto incompleta — confirme RESEND_API_KEY (ver .env.example).");
    return null;
  }

  return { resendApiKey };
}
