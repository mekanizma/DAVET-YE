import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export type MailVia = "supabase" | "resend" | "brevo" | "smtp";

function env(name: string) {
  return (process.env[name] || "").trim();
}

export function resendConfigured() {
  return Boolean(env("RESEND_API_KEY"));
}

export function brevoConfigured() {
  return Boolean(env("BREVO_API_KEY"));
}

export function smtpConfigured() {
  return Boolean(env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASS"));
}

/** Auth mail and support mail both leave from Supabase (edge function → SMTP). */
export function supabaseMailConfigured() {
  return Boolean(env("NEXT_PUBLIC_SUPABASE_URL") && env("SUPABASE_SERVER_SECRET"));
}

/** HTTPS providers work on Render; SMTP is for local / paid instances. */
export function mailConfigured() {
  return supabaseMailConfigured() || resendConfigured() || brevoConfigured() || smtpConfigured();
}

/** Always includes info@mekanizma.com; merges SUPPORT_NOTIFY_EMAILS / ADMIN_EMAIL. */
export function supportNotifyEmails(): string[] {
  const set = new Set<string>();
  set.add("info@mekanizma.com");
  for (const raw of [env("SUPPORT_NOTIFY_EMAILS"), env("ADMIN_EMAIL")]) {
    for (const part of raw.split(/[,;\s]+/)) {
      const mail = part.trim().toLowerCase();
      if (mail.includes("@")) set.add(mail);
    }
  }
  return [...set];
}

function fromHeader() {
  const named = env("MAIL_FROM");
  if (named) return named;
  const addr = env("SMTP_FROM") || env("SMTP_USER") || "onboarding@resend.dev";
  const name = env("SMTP_FROM_NAME") || "Davetanisi";
  return `${name} <${addr}>`;
}

type Payload = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

async function sendViaResend(input: Payload): Promise<{ ok: true; via: "resend" } | { ok: false; error: string }> {
  const key = env("RESEND_API_KEY");
  if (!key) return { ok: false, error: "RESEND_API_KEY yok." };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromHeader(),
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html || undefined,
        reply_to: input.replyTo || undefined,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (!res.ok) {
      return { ok: false, error: data.message || data.name || `Resend HTTP ${res.status}` };
    }
    return { ok: true, via: "resend" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Resend gönderimi başarısız.";
    console.error("[mail-resend]", message);
    return { ok: false, error: message };
  }
}

async function sendViaBrevo(input: Payload): Promise<{ ok: true; via: "brevo" } | { ok: false; error: string }> {
  const key = env("BREVO_API_KEY");
  if (!key) return { ok: false, error: "BREVO_API_KEY yok." };

  const fromMatch = fromHeader().match(/^(.*?)\s*<([^>]+)>$/);
  const sender = fromMatch
    ? { name: fromMatch[1]!.replace(/^"|"$/g, "").trim(), email: fromMatch[2]!.trim() }
    : { name: "Davetanisi", email: fromHeader() };

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to: input.to.map((email) => ({ email })),
        subject: input.subject,
        textContent: input.text,
        htmlContent: input.html || undefined,
        replyTo: input.replyTo ? { email: input.replyTo } : undefined,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string };
    if (!res.ok) {
      return { ok: false, error: data.message || `Brevo HTTP ${res.status}` };
    }
    return { ok: true, via: "brevo" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Brevo gönderimi başarısız.";
    console.error("[mail-brevo]", message);
    return { ok: false, error: message };
  }
}

type StoredSmtp = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  from_name: string;
  notify: string;
};

/** SMTP lives in Supabase, not in Render env. Port 465 is closed; 587 answers. */
async function storedSmtp(): Promise<StoredSmtp | null> {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SECRET_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");
  const secret = env("SUPABASE_SERVER_SECRET");
  if (!url || !key || !secret) return null;
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc("dv_mail_smtp", { given_secret: secret });
  if (error || !data || typeof data !== "object") return null;
  const row = data as StoredSmtp;
  if (!row.host || !row.user || !row.pass || !row.from) return null;
  return row;
}

async function sendViaStoredSmtp(input: Payload): Promise<{ ok: true; via: "smtp" } | { ok: false; error: string }> {
  const smtp = await storedSmtp();
  if (!smtp) return { ok: false, error: "SMTP ayarı yok." };
  const port = Number(smtp.port) === 465 ? 587 : Number(smtp.port) || 587;
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port,
    secure: false,
    requireTLS: true,
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
    tls: { servername: smtp.host },
  });
  try {
    await transport.sendMail({
      from: `"${(smtp.from_name || "Davetanisi").replace(/"/g, "")}" <${smtp.from}>`,
      to: input.to.join(", "),
      replyTo: input.replyTo || undefined,
      subject: input.subject,
      text: input.text,
      html: input.html || undefined,
    });
    return { ok: true, via: "smtp" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP gönderimi başarısız.";
    console.error("[mail-smtp]", message);
    return { ok: false, error: message };
  }
}

function transporter() {
  const host = env("SMTP_HOST");
  const port = Number(env("SMTP_PORT") || "465") || 465;
  const secure = env("SMTP_SECURE") !== "false" && port === 465;
  const options: SMTPTransport.Options = {
    host,
    port,
    secure,
    auth: {
      user: env("SMTP_USER"),
      pass: process.env.SMTP_PASS || "",
    },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 12_000,
    tls: host ? { servername: host } : undefined,
  };
  return nodemailer.createTransport(options);
}

async function sendViaSmtp(input: Payload): Promise<{ ok: true; via: "smtp" } | { ok: false; error: string }> {
  if (!smtpConfigured()) return { ok: false, error: "SMTP yapılandırılmamış." };
  const fromAddr = env("SMTP_FROM") || env("SMTP_USER");
  const fromName = env("SMTP_FROM_NAME") || "Davetanisi";
  try {
    await transporter().sendMail({
      from: `"${fromName.replace(/"/g, "")}" <${fromAddr}>`,
      to: input.to.join(", "),
      replyTo: input.replyTo || undefined,
      subject: input.subject,
      text: input.text,
      html: input.html || undefined,
    });
    return { ok: true, via: "smtp" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP gönderimi başarısız.";
    console.error("[mail-smtp]", message);
    return { ok: false, error: message };
  }
}

export async function sendMail(input: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<{ ok: true; via: MailVia } | { ok: false; error: string }> {
  const to = (Array.isArray(input.to) ? input.to : [input.to])
    .map((v) => v.trim())
    .filter(Boolean);
  if (!to.length) return { ok: false, error: "Alıcı yok." };

  const payload: Payload = {
    to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  };

  // Support mail is sent by the Supabase function (see notifySupportRequest).
  // This fallback is for the admin probe when that function is not configured.
  if (resendConfigured()) {
    const r = await sendViaResend(payload);
    if (r.ok) return r;
    console.warn("[mail] Resend failed:", r.error);
    if (!brevoConfigured() && !smtpConfigured()) return r;
  }

  if (brevoConfigured()) {
    const r = await sendViaBrevo(payload);
    if (r.ok) return r;
    console.warn("[mail] Brevo failed:", r.error);
    if (!smtpConfigured()) return r;
  }

  if (smtpConfigured()) return sendViaSmtp(payload);

  return {
    ok: false,
    error: "RESEND_API_KEY (önerilen) veya BREVO_API_KEY / SMTP ayarlayın.",
  };
}

export async function probeMail(): Promise<{
  ok: boolean;
  via?: MailVia;
  error?: string;
  configured: { supabase: boolean; resend: boolean; brevo: boolean; smtp: boolean };
}> {
  const configured = {
    supabase: supabaseMailConfigured(),
    resend: resendConfigured(),
    brevo: brevoConfigured(),
    smtp: smtpConfigured(),
  };
  const stored = await storedSmtp();
  if (stored) {
    const viaStored = await sendViaStoredSmtp({
      to: stored.notify.split(/[,;\s]+/).map((v) => v.trim()).filter((v) => v.includes("@")),
      subject: "[Davetanisi] Mail test",
      text: "Bu bir test mesajıdır. Destek bildirimi çalışıyor.",
    });
    if (viaStored.ok) return { ok: true, via: viaStored.via, configured };
    return { ok: false, error: viaStored.error, configured };
  }
  if (!configured.resend && !configured.brevo && !configured.smtp) {
    return { ok: false, error: "Supabase mail veya RESEND_API_KEY / SMTP yok.", configured };
  }
  const result = await sendMail({
    to: supportNotifyEmails(),
    subject: "[Davetanisi] Mail test",
    text: "Bu bir test mesajıdır. Destek bildirimi kanalı çalışıyor.",
  });
  if (result.ok) return { ok: true, via: result.via, configured };
  return { ok: false, error: result.error, configured };
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function notifySupportRequest(input: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  source: string;
  createdAt: string;
}): Promise<{ ok: true; via: MailVia } | { ok: false; error: string }> {
  const stored = await storedSmtp();
  const to = stored
    ? stored.notify.split(/[,;\s]+/).map((v) => v.trim().toLowerCase()).filter((v) => v.includes("@"))
    : supportNotifyEmails();
  if (!to.length || !mailConfigured()) {
    console.warn("[support-mail] skipped: mail not configured");
    return { ok: false, error: "Mail yapılandırılmamış." };
  }

  const who = `${input.firstName} ${input.lastName}`.trim();
  const sourceLabel = input.source === "page" ? "İletişim sayfası" : "Destek butonu";
  const subject = `[Davetanisi] Yeni destek talebi — ${who}`;
  const text = [
    "Yeni bir destek talebi geldi.",
    "",
    `Ad: ${who}`,
    `E-posta: ${input.email}`,
    `Kaynak: ${sourceLabel}`,
    `Tarih: ${input.createdAt}`,
    `Kayıt: ${input.id}`,
    "",
    "Mesaj:",
    input.message,
    "",
    "Yönetim: https://davetanisi.com/yonetim/destek",
  ].join("\n");

  const html = `
    <div style="font-family:Georgia,serif;line-height:1.5;color:#1c1814">
      <p><strong>Yeni destek talebi</strong></p>
      <p>
        <strong>Ad:</strong> ${esc(who)}<br/>
        <strong>E-posta:</strong> <a href="mailto:${esc(input.email)}">${esc(input.email)}</a><br/>
        <strong>Kaynak:</strong> ${esc(sourceLabel)}<br/>
        <strong>Tarih:</strong> ${esc(input.createdAt)}
      </p>
      <p style="white-space:pre-wrap;border-left:3px solid #c4a574;padding-left:12px">${esc(input.message)}</p>
      <p><a href="https://davetanisi.com/yonetim/destek">Yönetimde aç</a></p>
    </div>
  `;

  const result = stored
    ? await sendViaStoredSmtp({ to, subject, text, html, replyTo: input.email })
    : await sendMail({ to, subject, text, html, replyTo: input.email });
  if (!result.ok) {
    console.error("[support-mail] failed:", result.error);
    return result;
  }
  console.log("[support-mail] sent via", result.via, "→", to.join(", "));
  return result;
}
