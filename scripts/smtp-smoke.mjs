import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || user;
const to = process.env.SUPPORT_NOTIFY_EMAILS || "info@mekanizma.com";

if (!host || !user || !pass) {
  console.error("SMTP env eksik");
  process.exit(1);
}

const transport = nodemailer.createTransport({
  host,
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: { user, pass },
  tls: { servername: host },
});

try {
  await transport.verify();
  console.log("SMTP verify OK");
  const info = await transport.sendMail({
    from: `"Davetanisi" <${from}>`,
    to,
    subject: "[Davetanisi] SMTP test",
    text: "Destek maili SMTP testi. Bu mesaji gorebiliyorsaniz ayar dogru.",
  });
  console.log("sent", info.messageId);
} catch (err) {
  console.error("FAIL", err instanceof Error ? err.message : err);
  process.exit(1);
}
