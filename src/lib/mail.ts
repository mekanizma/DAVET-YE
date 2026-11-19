import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

function env(name: string) {
  return (process.env[name] || "").trim();
}

export function smtpConfigured() {
  return Boolean(env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASS"));
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
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
    tls: host ? { servername: host } : undefined,
  };
  return nodemailer.createTransport(options);
}

export async function sendMail(input: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!smtpConfigured()) {
    return { ok: false, error: "SMTP yapılandırılmamış." };
  }
  const to = (Array.isArray(input.to) ? input.to : [input.to])
    .map((v) => v.trim())
    .filter(Boolean);
  if (!to.length) return { ok: false, error: "Alıcı yok." };

  const fromAddr = env("SMTP_FROM") || env("SMTP_USER");
  const fromName = env("SMTP_FROM_NAME") || "Davetanisi";
  try {
    await transporter().sendMail({
      from: `"${fromName.replace(/"/g, "")}" <${fromAddr}>`,
      to: to.join(", "),
      replyTo: input.replyTo || undefined,
      subject: input.subject,
      text: input.text,
      html: input.html || undefined,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP gönderimi başarısız.";
    console.error("[mail]", message);
    return { ok: false, error: message };
  }
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
  if (!to.length || !smtpConfigured()) return;

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

  await sendMail({
    to,
    subject,
    text,
    html,
    replyTo: input.email,
  });
}
