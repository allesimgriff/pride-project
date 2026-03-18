import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM ?? smtpUser;

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

export async function sendInviteEmail(params: {
  to: string;
  token: string;
  fullName: string | null;
}) {
  const { to, token, fullName } = params;
  const registerUrl = `${appUrl.replace(/\/$/, "")}/register?token=${encodeURIComponent(
    token,
  )}`;

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

    return;
  }

  // Fallback to SMTP (may be blocked by hosting).
  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    throw new Error(
      "[mail] SMTP-Konfiguration fehlt (SMTP_HOST/SMTP_USER/SMTP_PASS/SMTP_FROM).",
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

