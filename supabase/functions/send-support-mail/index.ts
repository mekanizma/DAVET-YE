import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

  const client = new SMTPClient({
    connection: {
      hostname: smtp.host,
      port: Number(smtp.port) || 465,
      tls: Number(smtp.port) !== 587,
      auth: { username: smtp.user, password: smtp.pass },
    },
  });

  try {
    const sent = client.send({
      from: `${smtp.from_name || "Davetanisi"} <${smtp.from}>`,
      to,
      subject,
      content: text,
      html,
      replyTo: replyTo.includes("@") ? replyTo : undefined,
    });
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("smtp timeout")), 18_000);
    });
    await Promise.race([sent, timeout]);
    try {
      await client.close();
    } catch {
      /* already closed */
    }
    return json({ ok: true, via: "supabase" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "smtp failed";
    console.error("[send-support-mail]", message);
    if (requestId) {
      await db.from("dv_support").update({ mail_sent_at: null }).eq("id", requestId);
    }
    try {
      await client.close();
    } catch {
      /* ignore */
    }
    return json({ ok: false, error: message }, 502);
  }
});
