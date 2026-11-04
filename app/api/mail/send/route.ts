import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const MAX_RECIPIENTS = 5;
const MAX_HTML_BYTES = 300_000;

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  const user = process.env.Email ?? process.env.EMAIL_USER;
  const pass = process.env.Email_Password ?? process.env.EMAIL_PASSWORD;
  if (!user || !pass) return null;
  transporter ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

function authorized(request: NextRequest) {
  const secret = process.env.MAIL_RELAY_SECRET || process.env.REVALIDATE_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!secret || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { to?: unknown; subject?: unknown; html?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const to = (Array.isArray(body.to) ? body.to : [body.to])
    .filter((r): r is string => typeof r === "string")
    .map((r) => r.trim())
    .filter((r) => EMAIL_RE.test(r));
  const subject = typeof body.subject === "string" ? body.subject.replace(/[\r\n]+/g, " ").slice(0, 200) : "";
  const html = typeof body.html === "string" ? body.html : "";

  if (to.length === 0 || to.length > MAX_RECIPIENTS || !subject || !html) {
    return NextResponse.json({ error: "to, subject and html are required" }, { status: 400 });
  }
  if (Buffer.byteLength(html) > MAX_HTML_BYTES) {
    return NextResponse.json({ error: "html too large" }, { status: 413 });
  }

  const mailer = getTransporter();
  if (!mailer) {
    return NextResponse.json({ error: "mail not configured" }, { status: 503 });
  }

  const from = process.env.Email ?? process.env.EMAIL_USER;
  try {
    const info = await mailer.sendMail({ from: `"Midora" <${from}>`, to, subject, html });
    return NextResponse.json({ sent: true, id: info.messageId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "send failed";
    console.error("mail relay send failed", message);
    return NextResponse.json({ error: message.slice(0, 200) }, { status: 502 });
  }
}
