import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { getPublicAppBaseUrlFromEnv } from "@/lib/appPublicUrl";

const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS;
/** Leeres SMTP_FROM in Netlify würde sonst nicht auf SMTP_USER zurückfallen. */
const smtpFrom = (process.env.SMTP_FROM?.trim() || smtpUser) ?? "";

if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
  // eslint-disable-next-line no-console
  console.warn("[mail] SMTP environment variables are not fully configured.");
}

const resendApiKey = process.env.RESEND_API_KEY;
const emailProvider = (process.env.EMAIL_PROVIDER ?? "").toLowerCase(); // "resend" | "smtp" | ""
const emailFrom = process.env.EMAIL_FROM ?? smtpFrom;

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3001";

/** NEXT_PUBLIC_APP_URL oder Request-Host – für Links in Server Actions (Einladungen). */
export async function resolveMailAppBaseUrl(): Promise<string | undefined> {
  const fromEnv = getPublicAppBaseUrlFromEnv();
  if (fromEnv) return fromEnv;
  try {
    const h = await headers();
    const host =
      h.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h.get("host") ?? "";
    if (!host) return undefined;
    const proto =
      h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return undefined;
  }
}

export type SendInviteEmailResult = {
  provider: "resend" | "smtp";
  /** Resend: `data.id`; SMTP: Message-ID – für Logs / Resend-Dashboard. */
  messageId?: string;
};

async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<SendInviteEmailResult> {
  const { to, subject, text, html } = opts;

  const useResend =
    emailProvider === "resend" || (!!resendApiKey && emailProvider !== "smtp");

  if (useResend) {
    if (!resendApiKey) {
      throw new Error("[mail] RESEND_API_KEY fehlt (EMAIL_PROVIDER=resend).");
    }
    if (!emailFrom) {
      throw new Error("[mail] EMAIL_FROM fehlt für Resend.");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `[mail] Resend send failed (${res.status}): ${body || res.statusText}`,
      );
    }

    const rawText = await res.text().catch(() => "");
    let messageId: string | undefined;
    try {
      const j = JSON.parse(rawText) as { data?: { id?: string } };
      messageId = typeof j.data?.id === "string" ? j.data.id : undefined;
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line no-console
    console.info(
      `[mail] resend accepted to=${to} messageId=${messageId ?? "(unbekannt)"}`,
    );
    return { provider: "resend", messageId };
  }

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    throw new Error(
      "[mail] E-Mail-Versand nicht konfiguriert. Entweder Resend: EMAIL_PROVIDER=resend, RESEND_API_KEY, EMAIL_FROM — oder SMTP: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM (siehe .env.example). Unter Netlify: Environment variables setzen und neu deployen.",
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const info = await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    text,
    html,
  });
  const smtpId =
    typeof info.messageId === "string" ? info.messageId : undefined;
  // eslint-disable-next-line no-console
  console.info(`[mail] smtp sent to=${to} messageId=${smtpId ?? "?"}`);
  return { provider: "smtp", messageId: smtpId };
}

export async function sendInviteEmail(params: {
  to: string;
  token: string;
  fullName: string | null;
  /** Explizite Basis-URL (z. B. aus Server-Action). Sollte mit NEXT_PUBLIC_APP_URL der jeweiligen Site übereinstimmen. */
  appBaseUrl?: string;
}): Promise<SendInviteEmailResult> {
  const { to, token, fullName } = params;
  const base = (params.appBaseUrl ?? appUrl).replace(/\/$/, "");
  const registerUrl = `${base}/register?token=${encodeURIComponent(token)}`;

  const subject = "Ihre Einladung zu PRIDE";
  const text = [
    fullName ? `Hallo ${fullName},` : "Hallo,",
    "",
    "Sie wurden eingeladen, die PRIDE-Projektplattform zu nutzen.",
    "Bitte klicken Sie auf den folgenden Link, um Ihren Zugang anzulegen:",
    "",
    registerUrl,
    "",
    "Wenn Sie diese E-Mail nicht erwarten, können Sie sie ignorieren.",
  ].join("\n");

  const html = `
    <p>${fullName ? `Hallo ${fullName},` : "Hallo,"}</p>
    <p>Sie wurden eingeladen, die <strong>PRIDE</strong>-Projektplattform zu nutzen.</p>
    <p>
      Bitte klicken Sie auf den folgenden Link, um Ihren Zugang anzulegen:<br />
      <a href="${registerUrl}">${registerUrl}</a>
    </p>
    <p>Wenn Sie diese E-Mail nicht erwarten, können Sie sie ignorieren.</p>
  `;

  return sendTransactionalEmail({ to, subject, text, html });
}

/** Einladung in einen Workspace – Link geht auf /workspaces/join (nicht /register). */
export async function sendWorkspaceInviteEmail(params: {
  to: string;
  token: string;
  workspaceName: string;
  appBaseUrl?: string;
}): Promise<SendInviteEmailResult> {
  const { to, token, workspaceName } = params;
  const base = (params.appBaseUrl ?? appUrl).replace(/\/$/, "");
  const joinUrl = `${base}/workspaces/join?token=${encodeURIComponent(token)}`;
  const safeName = workspaceName.trim() || "Workspace";
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const subject = `Einladung zu Workspace „${safeName}“ (PRIDE)`;
  const text = [
    "Hallo,",
    "",
    `Sie wurden eingeladen, dem Workspace „${safeName}“ in der PRIDE-Projektplattform beizutreten.`,
    "Bitte klicken Sie auf den folgenden Link:",
    "",
    joinUrl,
    "",
    "Wenn Sie diese E-Mail nicht erwarten, können Sie sie ignorieren.",
  ].join("\n");

  const html = `
    <p>Hallo,</p>
    <p>Sie wurden eingeladen, dem Workspace <strong>${esc(safeName)}</strong> in der <strong>PRIDE</strong>-Projektplattform beizutreten.</p>
    <p>
      Bitte klicken Sie auf den folgenden Link:<br />
      <a href="${joinUrl}">${joinUrl}</a>
    </p>
    <p>Wenn Sie diese E-Mail nicht erwarten, können Sie sie ignorieren.</p>
  `;

  return sendTransactionalEmail({ to, subject, text, html });
}

export async function sendRoleChangedEmail(params: {
  to: string;
  fullName: string | null;
  role: "admin" | "entwicklung";
}) {
  const { to, fullName, role } = params;
  const roleDe = role === "admin" ? "Admin" : "Mitarbeiter";
  const roleEn = role === "admin" ? "Admin" : "Employee";

  const subject = `Ihre Rolle in PRIDE wurde geändert: ${roleDe}`;
  const text = [
    fullName ? `Hallo ${fullName},` : "Hallo,",
    "",
    `Ihre Rolle in PRIDE wurde angepasst.`,
    `Neue Rolle: ${roleDe} (${roleEn})`,
    "",
    "Bitte melden Sie sich neu an, falls Sie die Änderung noch nicht sehen.",
  ].join("\n");

  const html = `
    <p>${fullName ? `Hallo ${fullName},` : "Hallo,"}</p>
    <p>Ihre Rolle in <strong>PRIDE</strong> wurde angepasst.</p>
    <p>Neue Rolle: <strong>${roleDe}</strong> (${roleEn})</p>
    <p>Bitte melden Sie sich neu an, falls Sie die Änderung noch nicht sehen.</p>
  `;

  const useResend =
    emailProvider === "resend" || (!!resendApiKey && emailProvider !== "smtp");

  if (useResend) {
    if (!resendApiKey) {
      throw new Error("[mail] RESEND_API_KEY fehlt (EMAIL_PROVIDER=resend).");
    }
    if (!emailFrom) {
      throw new Error("[mail] EMAIL_FROM fehlt für Resend.");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `[mail] Resend send failed (${res.status}): ${body || res.statusText}`,
      );
    }

    return;
  }

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    throw new Error(
      "[mail] SMTP-Konfiguration fehlt (SMTP_HOST, SMTP_USER, SMTP_PASS und SMTP_FROM oder SMTP_USER).",
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    text,
    html,
  });
}

