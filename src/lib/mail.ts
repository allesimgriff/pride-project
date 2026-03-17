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

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3001";

export async function sendInviteEmail(params: {
  to: string;
  token: string;
  fullName: string | null;
}) {
  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    // eslint-disable-next-line no-console
    console.error("[mail] Missing SMTP configuration, cannot send invite email.");
    return;
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

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    text,
    html,
  });
}

