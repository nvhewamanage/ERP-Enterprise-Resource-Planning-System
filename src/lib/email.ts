import nodemailer, { type Transporter } from "nodemailer";

// SMTP is optional. If it isn't configured (no SMTP_HOST), emails are
// logged to the console instead of sent — this keeps local dev and CI
// working out of the box without requiring a real mail provider, while
// still exercising every code path that calls sendEmail().
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const t = getTransporter();

  if (!t) {
    console.log(`[email:dev] would send to ${input.to} — "${input.subject}"`);
    return;
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM ?? "ERP System <no-reply@erp.local>",
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
  } catch (err) {
    // Same principle as audit logging: a mail-provider hiccup shouldn't
    // fail the request that triggered the email (e.g. user creation).
    console.error("Failed to send email:", err);
  }
}

export async function sendWelcomeEmail(user: { name: string; email: string; roleLabel: string }): Promise<void> {
  await sendEmail({
    to: user.email,
    subject: "Your ERP account has been created",
    html: `
      <p>Hi ${user.name},</p>
      <p>An account has been created for you on the ERP system with the role <strong>${user.roleLabel}</strong>.</p>
      <p>Ask your administrator for your temporary password if you haven't received it separately, and change it after your first login.</p>
    `,
  });
}

export async function sendLowStockAlertEmail(
  to: string,
  items: { name: string; sku: string; quantityOnHand: number; reorderLevel: number }[]
): Promise<void> {
  const rows = items
    .map((i) => `<li>${i.name} (${i.sku}) — ${i.quantityOnHand} left, reorder level ${i.reorderLevel}</li>`)
    .join("");
  await sendEmail({
    to,
    subject: `Low stock alert: ${items.length} product${items.length === 1 ? "" : "s"} below reorder level`,
    html: `<p>The following products have fallen at or below their reorder level:</p><ul>${rows}</ul>`,
  });
}