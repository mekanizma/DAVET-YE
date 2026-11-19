import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

function env(name: string) {
  return (process.env[name] || "").trim();
}

export function smtpConfigured() {
  return Boolean(env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASS"));
}

export function mailRelayConfigured() {
  return Boolean(env("MAIL_RELAY_URL") && env("MAIL_RELAY_SECRET"));
}

export function mailConfigured() {
  return mailRelayConfigured() || smtpConfigured();
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

async function sendViaRelay(input: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<{ ok: true; via: "relay" } | { ok: false; error: string }> {
  const url = env("MAIL_RELAY_URL");
  const secret = env("MAIL_RELAY_SECRET");
  if (!url || !secret) return { ok: false, error: "MAIL_RELAY yapılandırılmamış." };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html || "",
        replyTo: input.replyTo || "",
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || `Relay HTTP ${res.status}` };
    }
    return { ok: true, via: "relay" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Relay gönderimi başarısız.";
    console.error("[mail-relay]", message);
    return { ok: false, error: message };
  }
}

async function sendViaSmtp(input: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<{ ok: true; via: "smtp" } | { ok: false; error: string }> {
  if (!smtpConfigured()) {
    return { ok: false, error: "SMTP yapılandırılmamış." };
  }
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
}): Promise<{ ok: true; via: "relay" | "smtp" } | { ok: false; error: string }> {
  const to = (Array.isArray(input.to) ? input.to : [input.to])
    .map((v) => v.trim())
    .filter(Boolean);
  if (!to.length) return { ok: false, error: "Alıcı yok." };

  const payload = {
    to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  };

  // Prefer HTTPS relay on Render (free plans block outbound SMTP 465/587).
  if (mailRelayConfigured()) {
    const relay = await sendViaRelay(payload);
    if (relay.ok) return relay;
    if (!smtpConfigured()) return relay;
    console.warn("[mail] relay failed, trying SMTP:", relay.error);
  }

  if (smtpConfigured()) {
    return sendViaSmtp(payload);
  }

  return { ok: false, error: "Ne MAIL_RELAY ne SMTP yapılandırılmamış." };
}

export async function probeMail(): Promise<{
  ok: boolean;
  via?: "relay" | "smtp";
  error?: string;
  configured: { relay: boolean; smtp: boolean };
}> {
  const configured = { relay: mailRelayConfigured(), smtp: smtpConfigured() };
  if (!configured.relay && !configured.smtp) {
    return { ok: false, error: "SMTP/MAIL_RELAY env yok.", configured };
  }
  const result = await sendMail({
    to: supportNotifyEmails(),
    subject: "[Davetanisi] SMTP / relay test",
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
}): Promise<void> {
  const to = supportNotifyEmails();
  if (!to.length || !mailConfigured()) {
    console.warn("[support-mail] skipped: mail not configured");
    return;
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

  const result = await sendMail({
    to,
    subject,
    text,
    html,
    replyTo: input.email,
  });
  if (!result.ok) {
    console.error("[support-mail] failed:", result.error);
  } else {
    console.log("[support-mail] sent via", result.via, "→", to.join(", "));
  }
}
