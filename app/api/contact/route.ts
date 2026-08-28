import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { readContactConfig } from "@/lib/contact/env";
import { contacts } from "@/content";

/**
 * `/api/contact` — recebe o formulário de contacto de /contactos e /en/contact
 * e envia-o por email via Resend. Primeira rota do projeto que recebe dados
 * de um visitante (não só o proxy OAuth) — mesmo padrão de resposta das
 * rotas existentes: `Cache-Control: no-store` sempre, erro genérico ao
 * cliente, detalhe só nos logs do servidor (ver app/api/auth/route.ts).
 *
 * Sem base de dados: a mensagem é só relayed para o email de destino
 * configurado no admin (contacts.contactForm.recipientEmail) — nada fica
 * guardado neste servidor.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Endereço de testes do Resend — funciona sem verificar domínio, mas com
// limites e sem aspeto profissional. Trocar por RESEND_FROM_EMAIL (env var)
// assim que o domínio agrotrades.co.mz estiver verificado no Resend.
const DEFAULT_FROM = "AGRO TRADES <onboarding@resend.dev>";

// Nome do campo honeypot — tem de bater certo com o usado em ContactForm.tsx.
// Um bot que preenche todos os campos de um formulário cai aqui; um
// visitante real nunca o vê (escondido visualmente, sem tabindex).
const HONEYPOT_FIELD = "empresa";

const contactFormSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().min(1).max(150),
  message: z.string().trim().min(1).max(5000),
  [HONEYPOT_FIELD]: z.string().optional(),
});

function genericError(status: number): NextResponse {
  const response = NextResponse.json({ ok: false }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  if (!contacts.contactForm.visible) {
    // O formulário está desligado no admin — não aceitar submissões mesmo
    // que alguém chame a rota diretamente.
    return genericError(404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return genericError(400);
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return genericError(400);
  }

  const { name, email, phone, subject, message, [HONEYPOT_FIELD]: honeypot } = parsed.data;

  if (honeypot) {
    // Provável bot: responde OK sem denunciar a deteção, mas não envia nada.
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const config = readContactConfig();
  if (!config) {
    // readContactConfig() já regista o motivo exato nos logs do servidor.
    return genericError(500);
  }

  const resend = new Resend(config.resendApiKey);
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;

  const lines = [
    `Nome: ${name}`,
    `Email: ${email}`,
    phone ? `Telefone: ${phone}` : null,
    `Assunto: ${subject}`,
    "",
    message,
  ].filter((line): line is string => line !== null);

  try {
    const { error } = await resend.emails.send({
      from,
      to: contacts.contactForm.recipientEmail,
      replyTo: email,
      subject: `[Site] ${subject}`,
      text: lines.join("\n"),
    });

    if (error) {
      console.error("[api/contact] Resend recusou o envio:", error.message);
      return genericError(502);
    }
  } catch (err) {
    console.error("[api/contact] Falha ao enviar email:", err instanceof Error ? err.message : err);
    return genericError(502);
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
