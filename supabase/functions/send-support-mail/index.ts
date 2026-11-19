import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Support mail leaves from Supabase, same network path as auth mail.
 * Render cannot open SMTP. This function can.
 * Auth is the private server secret (not a public JWT): database triggers call it too.
 */

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  from_name: string;
  notify: string;
};

type Body = {
  secret?: string;
  id?: string;
  test?: boolean;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function smtpRead(conn: Deno.Conn): Promise<string> {
  const buf = new Uint8Array(8192);
  let text = "";
  while (true) {
    const n = await conn.read(buf);
    if (n === null) break;
    text += decoder.decode(buf.subarray(0, n));
    const lines = text.split("\r\n").filter(Boolean);
    const last = lines[lines.length - 1] || "";
    if (last.length >= 4 && last[3] === " ") break;
  }
  return text;
}

async function smtpCmd(conn: Deno.Conn, line: string): Promise<string> {
  await conn.write(encoder.encode(line + "\r\n"));
  return smtpRead(conn);
}

function b64(value: string) {
  return btoa(value);
}

/** Port 587 + STARTTLS. Port 465 is closed from this network. */
async function deliverSmtp(input: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}) {
  const port = input.port === 465 ? 587 : input.port || 587;
  const plain = await Deno.connect({ hostname: input.host, port });
  const banner = await smtpRead(plain);
  if (!banner.startsWith("220")) throw new Error("banner rejected");
  const ehlo = await smtpCmd(plain, "EHLO davetanisi.com");
  if (!ehlo.startsWith("250")) throw new Error("EHLO failed");
  const start = await smtpCmd(plain, "STARTTLS");
  if (!start.startsWith("220")) throw new Error("STARTTLS failed");
  const conn = await Deno.startTls(plain, { hostname: input.host });
  const ehlo2 = await smtpCmd(conn, "EHLO davetanisi.com");
  if (!ehlo2.startsWith("250")) throw new Error("EHLO after TLS failed");
  const auth = await smtpCmd(conn, "AUTH LOGIN");
  if (!auth.startsWith("334")) throw new Error("AUTH not accepted");
  const userResp = await smtpCmd(conn, b64(input.user));
  if (!userResp.startsWith("334")) throw new Error("USER rejected");
  const passResp = await smtpCmd(conn, b64(input.pass));
  if (!passResp.startsWith("235")) throw new Error("PASS rejected");
  const fromResp = await smtpCmd(conn, `MAIL FROM:<${input.from}>`);
  if (!fromResp.startsWith("250")) throw new Error("MAIL FROM failed");
  for (const addr of input.to) {
    const rcpt = await smtpCmd(conn, `RCPT TO:<${addr}>`);
    if (!rcpt.startsWith("250") && !rcpt.startsWith("251")) throw new Error("RCPT failed");
  }
  const dataResp = await smtpCmd(conn, "DATA");
  if (!dataResp.startsWith("354")) throw new Error("DATA not accepted");

  const boundary = "b" + crypto.randomUUID().replace(/-/g, "");
  const headers = [
    `Date: ${new Date().toUTCString()}`,
    `From: "${input.fromName.replace(/"/g, "")}" <${input.from}>`,
    `To: ${input.to.join(", ")}`,
    `Subject: =?UTF-8?B?${b64(unescape(encodeURIComponent(input.subject)))}?=`,
    "MIME-Version: 1.0",
  ];
  if (input.replyTo.includes("@")) headers.push(`Reply-To: ${input.replyTo}`);
  let body: string;
  if (input.html) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    body = [
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      input.text,
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "",
      input.html,
      `--${boundary}--`,
      "",
    ].join("\r\n");
  } else {
    headers.push("Content-Type: text/plain; charset=UTF-8");
    body = input.text + "\r\n";
  }
  const payload = (headers.join("\r\n") + "\r\n\r\n" + body).replace(/^\./gm, "..");
  await conn.write(encoder.encode(payload + "\r\n.\r\n"));
  const end = await smtpRead(conn);
  if (!end.startsWith("250")) throw new Error("message not accepted");
  try {
    await smtpCmd(conn, "QUIT");
  } catch {
    /* server may close first */
  }
  try {
    conn.close();
  } catch {
    /* already closed */
  }
}

function notifyList(raw: string) {
  const set = new Set<string>();
  for (const part of String(raw || "").split(/[,;\s]+/)) {
    const mail = part.trim().toLowerCase();
    if (mail.includes("@")) set.add(mail);
  }
  if (!set.size) set.add("info@mekanizma.com");
  return [...set];
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  const body = (await req.json().catch(() => null)) as Body | null;
  const secret = String(body?.secret || "").trim();
  if (!secret) return json({ ok: false, error: "unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) return json({ ok: false, error: "function env missing" }, 500);

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: cfg, error: cfgError } = await db.rpc("dv_mail_smtp", { given_secret: secret });
  if (cfgError || !cfg || typeof cfg !== "object") {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  const smtp = cfg as SmtpConfig;
  const to = notifyList(smtp.notify);

  let subject = "";
  let text = "";
  let html = "";
  let replyTo = "";
  const requestId = String(body?.id || "").trim();

  if (requestId) {
    const { data: claimed, error: claimError } = await db
      .from("dv_support")
      .update({ mail_sent_at: new Date().toISOString() })
      .eq("id", requestId)
      .is("mail_sent_at", null)
      .select("id,first_name,last_name,email,message,source,created_at")
      .maybeSingle();
    if (claimError) return json({ ok: false, error: "claim failed" }, 500);
    if (!claimed) {
      const { data: existing } = await db
        .from("dv_support")
        .select("id,mail_sent_at")
        .eq("id", requestId)
        .maybeSingle();
      if (existing?.mail_sent_at) return json({ ok: true, via: "supabase", duplicate: true });
      return json({ ok: false, error: "request not found" }, 404);
    }

    const who = `${claimed.first_name || ""} ${claimed.last_name || ""}`.trim();
    const sourceLabel = claimed.source === "page" ? "İletişim sayfası" : "Destek butonu";
    subject = `[Davetanisi] Yeni destek talebi — ${who}`;
    replyTo = String(claimed.email || "");
    text = [
      "Yeni bir destek talebi geldi.",
      "",
      `Ad: ${who}`,
      `E-posta: ${claimed.email}`,
      `Kaynak: ${sourceLabel}`,
      `Tarih: ${claimed.created_at}`,
      `Kayıt: ${claimed.id}`,
      "",
      "Mesaj:",
      String(claimed.message || ""),
      "",
      "Yönetim: https://davetanisi.com/yonetim/destek",
    ].join("\n");
    html = `<div style="font-family:Georgia,serif;line-height:1.55;color:#1c1814">
      <p><strong>Yeni destek talebi</strong></p>
      <p>
        <strong>Ad:</strong> ${esc(who)}<br/>
        <strong>E-posta:</strong> <a href="mailto:${esc(String(claimed.email || ""))}">${esc(String(claimed.email || ""))}</a><br/>
        <strong>Kaynak:</strong> ${esc(sourceLabel)}
      </p>
      <p style="white-space:pre-wrap;border-left:3px solid #c4a574;padding-left:12px">${esc(String(claimed.message || ""))}</p>
      <p><a href="https://davetanisi.com/yonetim/destek">Yönetimde aç</a></p>
    </div>`;
  } else if (body?.test) {
    subject = "[Davetanisi] Destek mail testi";
    text = "Bu bir test mesajıdır. Destek bildirimi Supabase üzerinden gidiyor — doğrulama ve şifre sıfırlama ile aynı taraf.";
    html = "<p>Bu bir test mesajıdır. Destek bildirimi Supabase üzerinden gidiyor.</p>";
  } else {
    return json({ ok: false, error: "id or test required" }, 400);
  }

  try {
    const sent = deliverSmtp({
      host: smtp.host,
      port: Number(smtp.port) || 587,
      user: smtp.user,
      pass: smtp.pass,
      from: smtp.from,
      fromName: smtp.from_name || "Davetanisi",
      to,
      subject,
      text,
      html,
      replyTo,
    });
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("smtp timeout")), 25_000);
    });
    await Promise.race([sent, timeout]);
    return json({ ok: true, via: "supabase" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "smtp failed";
    console.error("[send-support-mail]", message);
    if (requestId) {
      await db.from("dv_support").update({ mail_sent_at: null }).eq("id", requestId);
    }
    return json({ ok: false, error: message }, 502);
  }
});
