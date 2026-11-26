import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireAuth, authUser } from "../middleware/auth";
import {
  cancelSubscription,
  completeMockCheckout,
  createCheckout,
  getBillingStatus,
  handleRazorpayWebhook,
  listPlans,
  verifyCheckoutPayment,
} from "../services/billing";
import { badRequest } from "../utils/errors";
import { parseBody } from "../utils/validate";

export const billingRouter = Router();

const checkoutSchema = z.object({
  planId: z.string().trim().min(1).max(20),
  recurring: z.boolean().optional(),
});

const verifySchema = z.object({
  checkoutId: z.string().trim().min(1).max(64),
  razorpayPaymentId: z.string().trim().min(1).max(100).optional(),
  razorpayOrderId: z.string().trim().min(1).max(100).optional(),
  razorpaySubscriptionId: z.string().trim().min(1).max(100).optional(),
  razorpaySignature: z.string().trim().min(1).max(200).optional(),
});

const mockCompleteSchema = z.object({
  checkoutId: z.string().trim().min(1).max(64),
});

billingRouter.get("/plans", (_req, res) => {
  res.json(listPlans());
});

billingRouter.get("/status", requireAuth, async (req, res) => {
  res.json(await getBillingStatus(authUser(req).id));
});

billingRouter.post("/checkout", requireAuth, async (req, res) => {
  const input = parseBody(checkoutSchema, req.body);
  const checkout = await createCheckout(authUser(req).id, input.planId, input.recurring);
  res.status(201).json(checkout);
});

billingRouter.post("/verify", requireAuth, async (req, res) => {
  const input = parseBody(verifySchema, req.body);
  const result = await verifyCheckoutPayment(authUser(req).id, input.checkoutId, input);
  res.json(result);
});

billingRouter.post("/mock/complete", requireAuth, async (req, res) => {
  const { checkoutId } = parseBody(mockCompleteSchema, req.body);
  res.json(await completeMockCheckout(authUser(req).id, checkoutId));
});

billingRouter.post("/cancel", requireAuth, async (req, res) => {
  res.json(await cancelSubscription(authUser(req).id));
});

export async function razorpayWebhookHandler(req: Request, res: Response) {
  let rawBody: string;
  if (Buffer.isBuffer(req.body)) rawBody = req.body.toString("utf8");
  else if (typeof req.body === "string") rawBody = req.body;
  else throw badRequest("INVALID_WEBHOOK", "Webhook body must be raw JSON.");

  const signature = req.header("x-razorpay-signature") ?? null;
  const eventId = req.header("x-razorpay-event-id") ?? null;
  const result = await handleRazorpayWebhook(rawBody, signature, eventId);
  res.json(result);
}
