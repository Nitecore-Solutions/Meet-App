import { config } from "../config";
import { AppError } from "../utils/errors";
import { escapeHtml } from "../utils/email";
import { logger } from "../utils/logger";

export type EmailKind = "verify_email" | "reset_password";

export type EmailDelivery = {
  kind: EmailKind;
  to: string;
  name: string;
  link: string;
  token: string;
};

export interface EmailProvider {
  readonly name: string;
  readonly exposesLink: boolean;
  send(delivery: EmailDelivery): Promise<void>;
}

const SUBJECTS: Record<EmailKind, string> = {
  verify_email: "Verify your PagalPagal email",
  reset_password: "Reset your PagalPagal password",
};

function htmlFor(delivery: EmailDelivery) {
  const action = delivery.kind === "verify_email" ? "verify your email" : "reset your password";
  const title = delivery.kind === "verify_email" ? "Verify your email" : "Reset your password";
  const safeName = escapeHtml(delivery.name);
  const safeLink = escapeHtml(delivery.link);
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1a1a1a">
    <h2>${title}</h2>
    <p>Hi ${safeName},</p>
    <p>Use the button below to ${action} for your PagalPagal account.</p>
    <p><a href="${safeLink}" style="background:#f5c518;color:#111;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold">${title}</a></p>
    <p>If the button does not work, copy this link into your browser:<br>${safeLink}</p>
    <p>This link expires soon. If you did not request this, you can ignore this email.</p>
    <p>— The PagalPagal team</p>
  </div>`;
}

class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";
  readonly exposesLink = true;

  async send(delivery: EmailDelivery) {
    logger.warn("Email delivery is using the console provider", {
      to: delivery.to,
      kind: delivery.kind,
      link: delivery.link,
      token: delivery.token,
    });
  }
}

class BrevoEmailProvider implements EmailProvider {
  readonly name = "brevo";
  readonly exposesLink = false;

  async send(delivery: EmailDelivery) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": config.email.brevo.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: config.email.brevo.fromName,
          email: config.email.brevo.fromEmail,
        },
        to: [{ email: delivery.to, name: delivery.name }],
        subject: SUBJECTS[delivery.kind],
        htmlContent: htmlFor(delivery),
      }),
    });
    if (!response.ok) {
      const details = await response.text().catch(() => "");
      logger.error("Brevo email delivery failed", { status: response.status, details });
      throw new AppError(502, "EMAIL_DELIVERY_FAILED", "We could not send the email. Please try again.");
    }
  }
}

let provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (provider) return provider;
  provider = config.email.provider === "brevo" ? new BrevoEmailProvider() : new ConsoleEmailProvider();
  logger.info("Email provider ready", { provider: provider.name });
  return provider;
}

export function exposeDevEmail() {
  return config.email.devMode || getEmailProvider().exposesLink;
}
