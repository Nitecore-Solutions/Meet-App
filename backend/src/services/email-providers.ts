import { config } from "../config";
import type { AuthTokenKind } from "../domain/types";
import { AppError } from "../utils/errors";
import { escapeHtml } from "../utils/email";
import { logger } from "../utils/logger";

export type EmailDelivery = {
  kind: AuthTokenKind;
  to: string;
  name: string;
  code?: string;
  link?: string;
};

export interface EmailProvider {
  readonly name: string;
  readonly exposesSecrets: boolean;
  send(delivery: EmailDelivery): Promise<void>;
}

const SUBJECTS: Record<AuthTokenKind, string> = {
  verify_email: "Verify your account",
  login: "Your sign-in code",
  reset_password: "Reset your password",
};

function htmlFor(delivery: EmailDelivery) {
  const safeName = escapeHtml(delivery.name);
  if (delivery.kind === "reset_password") {
    const safeLink = escapeHtml(delivery.link ?? "");
    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1a1a1a">
      <h2>Reset your password</h2>
      <p>Hi ${safeName}, we received a request to reset your password.</p>
      <p><a href="${safeLink}" style="background:#0e7a4e;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:bold">Reset Password</a></p>
      <p>This link expires in 30 minutes. If you didn't request it, ignore this email.</p>
      <p>Button not working? Copy this link: ${safeLink}</p>
    </div>`;
  }
  const safeCode = escapeHtml(delivery.code ?? "");
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1a1a1a">
    <h2>Verify your account</h2>
    <p>Hi ${safeName}, use this code to continue:</p>
    <div style="background:#f0fdf4;border:2px dashed #0e7a4e;border-radius:10px;padding:18px 40px;font-size:34px;font-weight:bold;letter-spacing:10px;color:#0e7a4e">${safeCode}</div>
    <p>This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
  </div>`;
}

class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";
  readonly exposesSecrets = true;

  async send(delivery: EmailDelivery) {
    logger.warn("Email delivery is using the console provider", {
      to: delivery.to,
      kind: delivery.kind,
      code: delivery.code ?? null,
      link: delivery.link ?? null,
      note: "In development these values are also returned as devCode/devLink in the API response.",
    });
  }
}

class BrevoEmailProvider implements EmailProvider {
  readonly name = "brevo";
  readonly exposesSecrets = false;

  async send(delivery: EmailDelivery) {
    const templateId =
      delivery.kind === "reset_password"
        ? config.email.brevo.resetTemplateId
        : config.email.brevo.verifyTemplateId;

    const body: Record<string, unknown> = {
      sender: {
        name: config.email.brevo.fromName,
        email: config.email.brevo.fromEmail,
      },
      to: [{ email: delivery.to, name: delivery.name }],
      ...(templateId
        ? {
            templateId: Number(templateId),
            params: {
              name: delivery.name,
              OTP: delivery.code ?? "",
              reset_link: delivery.link ?? "",
            },
          }
        : {
            subject: SUBJECTS[delivery.kind],
            htmlContent: htmlFor(delivery),
          }),
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": config.email.brevo.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const details = await response.text().catch(() => "");
      logger.error("Brevo email delivery failed", {
        status: response.status,
        details,
        templateId: templateId || "inline",
      });
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
  return config.email.devMode || getEmailProvider().exposesSecrets;
}
