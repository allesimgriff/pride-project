import nodemailer from "nodemailer";

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

export type SendInviteEmailResult = {
  provider: "resend" | "smtp";
  /** Resend: `data.id`; SMTP: Message-ID – für Logs / Resend-Dashboard. */
  messageId?: string;
};

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

  // Prefer a provider that works reliably in serverless environments.
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

  // Fallback to SMTP (may be blocked by hosting).
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

