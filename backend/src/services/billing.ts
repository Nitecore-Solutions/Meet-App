import crypto from "node:crypto";
import { config } from "../config";
import { query, queryOne, withTransaction } from "../db";
import type {
  BillingCheckoutRow,
  BillingMode,
  SubscriptionRow,
  UserRow,
} from "../domain/types";
import {
  addMonthsIso,
  nowIso,
  randomId,
  sha256,
  timingSafeHex,
} from "../utils/crypto";
import { AppError, badRequest, conflict, notFound } from "../utils/errors";
import { logger } from "../utils/logger";
import { serializeOwnProfile } from "./users";

export type PlusPlan = {
  id: string;
  label: string;
  months: number;
  price: number;
  pricePaise: number;
  currency: "INR";
  perMonth: number;
  badge?: string;
};

export const PLUS_PLANS: PlusPlan[] = [
  {
    id: "12m",
    label: "12 Months",
    months: 12,
    price: 2499,
    pricePaise: 249900,
    currency: "INR",
    perMonth: 208,
    badge: "BEST VALUE",
  },
  {
    id: "6m",
    label: "6 Months",
    months: 6,
    price: 1499,
    pricePaise: 149900,
    currency: "INR",
    perMonth: 250,
  },
  {
    id: "1m",
    label: "1 Month",
    months: 1,
    price: 399,
    pricePaise: 39900,
    currency: "INR",
    perMonth: 399,
  },
];

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

type RazorpaySubscription = {
  id: string;
  status: string;
  short_url?: string;
  current_start?: number;
  current_end?: number;
};

function getPlan(planId: string) {
  const plan = PLUS_PLANS.find((item) => item.id === planId);
  if (!plan) throw badRequest("INVALID_PLAN", "Choose a valid Plus plan.");
  return plan;
}

function publicPlan(plan: PlusPlan) {
  return {
    id: plan.id,
    label: plan.label,
    months: plan.months,
    price: plan.price,
    currency: plan.currency,
    perMonth: plan.perMonth,
    badge: plan.badge ?? null,
  };
}

export function listPlans() {
  return {
    plans: PLUS_PLANS.map(publicPlan),
    currency: "INR",
    mock: config.razorpay.mock,
    razorpayKeyId: config.razorpay.mock ? null : config.razorpay.keyId,
  };
}

function assertPaymentsReady() {
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    throw new AppError(
      503,
      "PAYMENTS_NOT_CONFIGURED",
      "Razorpay is not configured on the server."
    );
  }
}

async function razorpayRequest<T>(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>
): Promise<T> {
  assertPaymentsReady();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${config.razorpay.keyId}:${config.razorpay.keySecret}`
      ).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    const record = data as { error?: { description?: string; code?: string } } | null;
    logger.error("Razorpay API request failed", {
      path,
      status: response.status,
      description: record?.error?.description,
    });
    throw new AppError(
      502,
      "RAZORPAY_ERROR",
      record?.error?.description ?? "Razorpay could not process that request."
    );
  }
  return data as T;
}

async function createCheckoutRow(
  userId: string,
  plan: PlusPlan,
  mode: BillingMode
) {
  const row = await queryOne<BillingCheckoutRow>(
    `INSERT INTO billing_checkouts
      (id, user_id, plan_id, mode, status, amount, currency, provider_order_id,
       provider_subscription_id, payment_id, created_at, completed_at)
     VALUES ($1, $2, $3, $4, 'pending', $5, 'INR', NULL, NULL, NULL, $6, NULL)
     RETURNING *`,
    [randomId(), userId, plan.id, mode, plan.pricePaise, nowIso()]
  );
  if (!row) throw new AppError(500, "CHECKOUT_FAILED", "Could not start checkout.");
  return row;
}

function checkoutDetails(
  user: UserRow,
  plan: PlusPlan,
  checkout: BillingCheckoutRow,
  payment:
    | { mode: "mock" }
    | { mode: "order"; orderId: string }
    | { mode: "subscription"; subscriptionId: string; shortUrl?: string }
) {
  const base = {
    checkoutId: checkout.id,
    plan: publicPlan(plan),
    amount: plan.pricePaise,
    currency: "INR",
    mock: config.razorpay.mock,
    name: "PagalPagal Plus",
    description: `${plan.label} of PagalPagal Plus`,
    prefill: {
      name: user.name,
      contact: user.email,
      email: user.email,
    },
    notes: {
      userId: user.id,
      planId: plan.id,
      checkoutId: checkout.id,
    },
  };
  if (payment.mode === "mock") {
    return { ...base, mode: "mock" as const, razorpayKeyId: null };
  }
  if (payment.mode === "order") {
    return {
      ...base,
      mode: "order" as const,
      razorpayKeyId: config.razorpay.keyId,
      orderId: payment.orderId,
    };
  }
  return {
    ...base,
    mode: "subscription" as const,
    razorpayKeyId: config.razorpay.keyId,
    subscriptionId: payment.subscriptionId,
    shortUrl: payment.shortUrl ?? null,
  };
}

async function failCheckout(checkoutId: string) {
  await query(
    "UPDATE billing_checkouts SET status = 'failed' WHERE id = $1 AND status = 'pending'",
    [checkoutId]
  ).catch(() => {});
}

export async function createCheckout(
  userId: string,
  planId: string,
  recurring = false
) {
  const user = await queryOne<UserRow>("SELECT * FROM users WHERE id = $1", [userId]);
  if (!user) throw notFound("USER_NOT_FOUND", "That profile could not be found.");
  const plan = getPlan(planId);

  if (config.razorpay.mock) {
    const checkout = await createCheckoutRow(user.id, plan, "mock");
    return checkoutDetails(user, plan, checkout, { mode: "mock" });
  }

  assertPaymentsReady();
  const configuredPlanId = config.razorpay.planIds[plan.id as keyof typeof config.razorpay.planIds];
  const useSubscription = recurring && Boolean(configuredPlanId);
  const mode: BillingMode = useSubscription ? "subscription" : "order";
  const checkout = await createCheckoutRow(user.id, plan, mode);

  try {
    if (useSubscription) {
      const subscription = await razorpayRequest<RazorpaySubscription>("/subscriptions", "POST", {
        plan_id: configuredPlanId,
        total_count: Math.max(1, plan.months),
        quantity: 1,
        customer_notify: 1,
        notes: {
          userId: user.id,
          planId: plan.id,
          checkoutId: checkout.id,
        },
      });
      await query(
        "UPDATE billing_checkouts SET provider_subscription_id = $1 WHERE id = $2",
        [subscription.id, checkout.id]
      );
      const updated = { ...checkout, provider_subscription_id: subscription.id };
      return checkoutDetails(user, plan, updated, {
        mode: "subscription",
        subscriptionId: subscription.id,
        shortUrl: subscription.short_url,
      });
    }

    const order = await razorpayRequest<RazorpayOrder>("/orders", "POST", {
      amount: plan.pricePaise,
      currency: "INR",
      receipt: checkout.id,
      notes: {
        userId: user.id,
        planId: plan.id,
        checkoutId: checkout.id,
      },
    });
    await query(
      "UPDATE billing_checkouts SET provider_order_id = $1 WHERE id = $2",
      [order.id, checkout.id]
    );
    const updated = { ...checkout, provider_order_id: order.id };
    return checkoutDetails(user, plan, updated, {
      mode: "order",
      orderId: order.id,
    });
  } catch (error) {
    await failCheckout(checkout.id);
    throw error;
  }
}

async function checkoutForUser(userId: string, checkoutId: string) {
  const checkout = await queryOne<BillingCheckoutRow>(
    "SELECT * FROM billing_checkouts WHERE id = $1 AND user_id = $2",
    [checkoutId, userId]
  );
  if (!checkout) throw notFound("CHECKOUT_NOT_FOUND", "That checkout could not be found.");
  return checkout;
}

function verifyHmac(payload: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return timingSafeHex(expected, signature);
}

export async function verifyCheckoutPayment(
  userId: string,
  checkoutId: string,
  input: {
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpaySubscriptionId?: string;
    razorpaySignature?: string;
  }
) {
  const checkout = await checkoutForUser(userId, checkoutId);
  if (checkout.status === "completed") {
    return { alreadyComplete: true, status: await getBillingStatus(userId) };
  }
  if (checkout.status === "failed") {
    throw conflict("CHECKOUT_FAILED", "That checkout failed. Start a new one.");
  }
  if (checkout.mode === "mock") {
    throw badRequest(
      "MOCK_CHECKOUT",
      "This is a mock checkout. Complete it with POST /api/billing/mock/complete."
    );
  }
  assertPaymentsReady();

  const paymentId = input.razorpayPaymentId?.trim();
  const signature = input.razorpaySignature?.trim();
  if (!paymentId || !signature) {
    throw badRequest("PAYMENT_DETAILS_REQUIRED", "Payment ID and signature are required.");
  }

  if (checkout.mode === "order") {
    const orderId = input.razorpayOrderId?.trim();
    if (!orderId || orderId !== checkout.provider_order_id) {
      throw badRequest("ORDER_MISMATCH", "That payment does not belong to this checkout.");
    }
    if (!verifyHmac(`${orderId}|${paymentId}`, signature, config.razorpay.keySecret)) {
      throw new AppError(400, "INVALID_PAYMENT_SIGNATURE", "Payment verification failed.");
    }
    const activated = await activateCheckout(checkout.id, {
      paymentId,
      orderId,
      subscriptionId: null,
    });
    return {
      alreadyComplete: false,
      user: activated.profile,
      subscription: activated.subscription,
    };
  }

  const subscriptionId = input.razorpaySubscriptionId?.trim();
  if (!subscriptionId || subscriptionId !== checkout.provider_subscription_id) {
    throw badRequest("SUBSCRIPTION_MISMATCH", "That subscription does not belong to this checkout.");
  }
  if (!verifyHmac(`${paymentId}|${subscriptionId}`, signature, config.razorpay.keySecret)) {
    throw new AppError(400, "INVALID_PAYMENT_SIGNATURE", "Payment verification failed.");
  }
  const activated = await activateCheckout(checkout.id, {
    paymentId,
    orderId: null,
    subscriptionId,
  });
  return {
    alreadyComplete: false,
    user: activated.profile,
    subscription: activated.subscription,
  };
}

export async function completeMockCheckout(userId: string, checkoutId: string) {
  if (!config.razorpay.mock) {
    throw new AppError(404, "NOT_FOUND", "The requested resource was not found.");
  }
  const checkout = await checkoutForUser(userId, checkoutId);
  if (checkout.mode !== "mock") {
    throw badRequest("NOT_A_MOCK_CHECKOUT", "That checkout is not a mock checkout.");
  }
  if (checkout.status !== "pending") {
    return { alreadyComplete: checkout.status === "completed", status: await getBillingStatus(userId) };
  }
  const activated = await activateCheckout(checkout.id, {
    paymentId: `mock_payment_${randomId()}`,
    orderId: `mock_order_${checkout.id}`,
    subscriptionId: null,
    mock: true,
  });
  return {
    alreadyComplete: false,
    user: activated.profile,
    subscription: activated.subscription,
    status: await getBillingStatus(userId),
  };
}

async function activateCheckout(
  checkoutId: string,
  payment: {
    paymentId: string;
    orderId: string | null;
    subscriptionId: string | null;
    mock?: boolean;
  }
) {
  const result = await withTransaction(async (tx) => {
    const checkoutResult = await tx.query<BillingCheckoutRow>(
      "SELECT * FROM billing_checkouts WHERE id = $1 FOR UPDATE",
      [checkoutId]
    );
    const checkout = checkoutResult.rows[0];
    if (!checkout) throw notFound("CHECKOUT_NOT_FOUND", "That checkout could not be found.");
    if (checkout.status === "completed") {
      const existing = await tx.query<SubscriptionRow>(
        "SELECT * FROM subscriptions WHERE checkout_id = $1",
        [checkout.id]
      );
      const user = await tx.query<UserRow>("SELECT * FROM users WHERE id = $1", [checkout.user_id]);
      if (!user.rows[0]) throw notFound("USER_NOT_FOUND", "That profile could not be found.");
      return { checkout, user: user.rows[0], subscription: existing.rows[0] ?? null };
    }
    if (checkout.status === "failed") {
      throw conflict("CHECKOUT_FAILED", "That checkout failed. Start a new one.");
    }

    const plan = getPlan(checkout.plan_id);
    const userResult = await tx.query<UserRow>(
      "SELECT * FROM users WHERE id = $1 FOR UPDATE",
      [checkout.user_id]
    );
    const user = userResult.rows[0];
    if (!user) throw notFound("USER_NOT_FOUND", "That profile could not be found.");

    const currentExpiry = user.plus_expires_at
      ? new Date(user.plus_expires_at)
      : null;
    const base =
      currentExpiry && currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();
    const startsAt = nowIso();
    const endsAt = addMonthsIso(plan.months, base);
    const completedAt = nowIso();

    const updatedUserResult = await tx.query<UserRow>(
      `UPDATE users
       SET is_plus = TRUE, plus_expires_at = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [endsAt, completedAt, user.id]
    );
    const updatedUser = updatedUserResult.rows[0];
    if (!updatedUser) throw new AppError(500, "PLUS_UPDATE_FAILED", "Could not activate Plus.");

    await tx.query(
      `UPDATE billing_checkouts
       SET status = 'completed', payment_id = $1, completed_at = $2
       WHERE id = $3`,
      [payment.paymentId, completedAt, checkout.id]
    );

    const provider = payment.mock ? "mock" : "razorpay";
    const subscription = await tx.query<SubscriptionRow>(
      `INSERT INTO subscriptions
        (id, user_id, plan_id, provider, checkout_id, status,
         razorpay_order_id, razorpay_payment_id, razorpay_subscription_id,
         starts_at, ends_at, auto_renew, created_at, updated_at, cancelled_at)
       VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, $9, $10, $11, $12, $12, NULL)
       ON CONFLICT (checkout_id) WHERE checkout_id IS NOT NULL DO NOTHING
       RETURNING *`,
      [
        randomId(),
        user.id,
        plan.id,
        provider,
        checkout.id,
        payment.orderId,
        payment.paymentId,
        payment.subscriptionId,
        startsAt,
        endsAt,
        checkout.mode === "subscription",
        completedAt,
      ]
    );
    let subscriptionRow = subscription.rows[0] ?? null;
    if (!subscriptionRow) {
      subscriptionRow =
        (await tx.query<SubscriptionRow>(
          "SELECT * FROM subscriptions WHERE checkout_id = $1",
          [checkout.id]
        )).rows[0] ?? null;
    }

    return {
      checkout: { ...checkout, status: "completed" as const },
      user: updatedUser,
      subscription: subscriptionRow,
    };
  });

  logger.info("Plus membership activated", {
    userId: result.user.id,
    planId: result.checkout.plan_id,
    checkoutId: result.checkout.id,
    plusExpiresAt: result.user.plus_expires_at,
    mock: Boolean(payment.mock),
  });

  return {
    profile: await serializeOwnProfile(result.user),
    subscription: result.subscription,
    checkout: result.checkout,
  };
}

export type BillingStatus = {
  isPlus: boolean;
  plusExpiresAt: string | null;
  planId: string | null;
  autoRenew: boolean;
  subscription: SubscriptionRow | null;
  subscriptions: SubscriptionRow[];
  mock: boolean;
};

export async function getBillingStatus(userId: string): Promise<BillingStatus> {
  const user = await queryOne<UserRow>("SELECT * FROM users WHERE id = $1", [userId]);
  if (!user) throw notFound("USER_NOT_FOUND", "That profile could not be found.");
  const subscriptions = await query<SubscriptionRow>(
    "SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
    [userId]
  );
  const latest = subscriptions.rows[0] ?? null;
  const isPlus = Boolean(
    user.is_plus && user.plus_expires_at && new Date(user.plus_expires_at).getTime() > Date.now()
  );
  return {
    isPlus,
    plusExpiresAt: user.plus_expires_at,
    planId: isPlus ? latest?.plan_id ?? null : null,
    autoRenew: Boolean(latest?.auto_renew && isPlus),
    subscription: latest,
    subscriptions: subscriptions.rows,
    mock: config.razorpay.mock,
  };
}

export async function cancelSubscription(userId: string) {
  const user = await queryOne<UserRow>("SELECT * FROM users WHERE id = $1", [userId]);
  if (!user) throw notFound("USER_NOT_FOUND", "That profile could not be found.");
  const subscription = await queryOne<SubscriptionRow>(
    `SELECT * FROM subscriptions
     WHERE user_id = $1 AND auto_renew = TRUE AND razorpay_subscription_id IS NOT NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  if (!subscription) {
    throw badRequest(
      "NO_RECURRING_SUBSCRIPTION",
      "You do not have a recurring Plus subscription to cancel."
    );
  }

  if (!config.razorpay.mock && subscription.razorpay_subscription_id) {
    assertPaymentsReady();
    await razorpayRequest(
      `/subscriptions/${encodeURIComponent(subscription.razorpay_subscription_id)}/cancel?cancel_at_cycle_end=1`,
      "POST"
    );
  }

  const cancelledAt = nowIso();
  await query(
    `UPDATE subscriptions
     SET auto_renew = FALSE, status = $1, cancelled_at = $2, updated_at = $2
     WHERE id = $3`,
    [config.razorpay.mock ? "cancelled" : "cancel_at_period_end", cancelledAt, subscription.id]
  );
  return {
    cancelled: true,
    effectiveAt: subscription.ends_at ?? user.plus_expires_at,
    status: await getBillingStatus(userId),
  };
}

type RazorpayWebhookPayment = {
  id: string;
  order_id?: string;
  status?: string;
  amount?: number;
};

type RazorpayWebhookSubscription = {
  id: string;
  status?: string;
  current_start?: number;
  current_end?: number;
};

type RazorpayWebhookBody = {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayWebhookPayment };
    order?: { entity?: { id?: string } };
    subscription?: { entity?: RazorpayWebhookSubscription };
  };
};

function asWebhookBody(rawBody: string): RazorpayWebhookBody {
  try {
    return JSON.parse(rawBody) as RazorpayWebhookBody;
  } catch {
    throw badRequest("INVALID_WEBHOOK", "Webhook payload is not valid JSON.");
  }
}

async function extendRecurringSubscription(
  subscription: SubscriptionRow,
  paymentId: string | null
) {
  const plan = getPlan(subscription.plan_id);
  const user = await queryOne<UserRow>("SELECT * FROM users WHERE id = $1", [
    subscription.user_id,
  ]);
  if (!user) throw notFound("USER_NOT_FOUND", "That subscription user no longer exists.");
  const candidates = [
    Date.now(),
    subscription.ends_at ? new Date(subscription.ends_at).getTime() : 0,
    user.plus_expires_at ? new Date(user.plus_expires_at).getTime() : 0,
  ];
  const base = new Date(Math.max(...candidates));
  const endsAt = addMonthsIso(plan.months, base);
  const updatedAt = nowIso();
  await withTransaction(async (tx) => {
    await tx.query(
      `UPDATE users
       SET is_plus = TRUE, plus_expires_at = $1, updated_at = $2
       WHERE id = $3`,
      [endsAt, updatedAt, user.id]
    );
    await tx.query(
      `UPDATE subscriptions
       SET status = 'active', ends_at = $1, razorpay_payment_id = COALESCE($2, razorpay_payment_id),
           auto_renew = TRUE, updated_at = $3
       WHERE id = $4`,
      [endsAt, paymentId, updatedAt, subscription.id]
    );
  });
  logger.info("Recurring Plus subscription renewed", {
    subscriptionId: subscription.id,
    userId: user.id,
    endsAt,
  });
  return { endsAt };
}

export async function handleRazorpayWebhook(
  rawBody: string,
  signature: string | null,
  eventIdHeader: string | null
) {
  if (!config.razorpay.webhookSecret) {
    throw new AppError(
      503,
      "WEBHOOK_NOT_CONFIGURED",
      "RAZORPAY_WEBHOOK_SECRET is not configured."
    );
  }
  if (!signature || !verifyHmac(rawBody, signature, config.razorpay.webhookSecret)) {
    throw new AppError(400, "INVALID_WEBHOOK_SIGNATURE", "Webhook signature verification failed.");
  }

  const body = asWebhookBody(rawBody);
  const eventType = body.event ?? "unknown";
  const eventId = eventIdHeader ?? sha256(rawBody).slice(0, 64);
  const eventRowId = randomId();
  const now = nowIso();

  const inserted = await queryOne<{ id: string }>(
    `INSERT INTO webhook_events
      (id, provider, event_id, event_type, received_at, payload, processed_at, last_error)
     VALUES ($1, 'razorpay', $2, $3, $4, $5, NULL, NULL)
     ON CONFLICT (provider, event_id) DO NOTHING
     RETURNING id`,
    [eventRowId, eventId, eventType, now, rawBody]
  );

  let rowId = inserted?.id ?? null;
  if (!rowId) {
    const existing = await queryOne<{ id: string; processed_at: string | null }>(
      "SELECT id, processed_at FROM webhook_events WHERE provider = 'razorpay' AND event_id = $1",
      [eventId]
    );
    if (existing?.processed_at) {
      return { ok: true, duplicate: true, event: eventType };
    }
    rowId = existing?.id ?? null;
  }

  try {
    await processRazorpayEvent(body);
    if (rowId) {
      await query("UPDATE webhook_events SET processed_at = $1, last_error = NULL WHERE id = $2", [
        nowIso(),
        rowId,
      ]);
    }
    return { ok: true, duplicate: false, event: eventType };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (rowId) {
      await query("UPDATE webhook_events SET last_error = $1 WHERE id = $2", [
        message.slice(0, 2000),
        rowId,
      ]).catch(() => {});
    }
    logger.error("Razorpay webhook processing failed", { eventType, eventId, message });
    throw new AppError(500, "WEBHOOK_PROCESSING_FAILED", "Webhook processing failed.");
  }
}

async function processRazorpayEvent(body: RazorpayWebhookBody) {
  const event = body.event ?? "";
  const payment = body.payload?.payment?.entity;
  const subscriptionEntity = body.payload?.subscription?.entity;

  if (event === "payment.captured" || event === "order.paid") {
    const orderId = payment?.order_id ?? body.payload?.order?.entity?.id;
    if (!orderId || !payment?.id) return;
    const checkout = await queryOne<BillingCheckoutRow>(
      "SELECT * FROM billing_checkouts WHERE provider_order_id = $1",
      [orderId]
    );
    if (!checkout || checkout.status === "completed") return;
    await activateCheckout(checkout.id, {
      paymentId: payment.id,
      orderId,
      subscriptionId: null,
    });
    return;
  }

  if (event === "payment.failed") {
    const orderId = payment?.order_id;
    if (!orderId) return;
    await query(
      `UPDATE billing_checkouts SET status = 'failed'
       WHERE provider_order_id = $1 AND status = 'pending'`,
      [orderId]
    );
    return;
  }

  if (event === "subscription.charged") {
    if (!subscriptionEntity?.id || !payment?.id) return;
    const existing = await queryOne<SubscriptionRow>(
      "SELECT * FROM subscriptions WHERE razorpay_subscription_id = $1",
      [subscriptionEntity.id]
    );
    if (existing) {
      await extendRecurringSubscription(existing, payment.id);
      return;
    }
    const checkout = await queryOne<BillingCheckoutRow>(
      "SELECT * FROM billing_checkouts WHERE provider_subscription_id = $1",
      [subscriptionEntity.id]
    );
    if (checkout && checkout.status === "pending") {
      await activateCheckout(checkout.id, {
        paymentId: payment.id,
        orderId: null,
        subscriptionId: subscriptionEntity.id,
      });
    }
    return;
  }

  if (
    event === "subscription.cancelled" ||
    event === "subscription.halted" ||
    event === "subscription.completed"
  ) {
    if (!subscriptionEntity?.id) return;
    const status =
      event === "subscription.cancelled"
        ? "cancelled"
        : event === "subscription.halted"
          ? "halted"
          : "completed";
    await query(
      `UPDATE subscriptions
       SET status = $1, auto_renew = FALSE, cancelled_at = COALESCE(cancelled_at, $2), updated_at = $2
       WHERE razorpay_subscription_id = $3`,
      [status, nowIso(), subscriptionEntity.id]
    );
    return;
  }

  if (event === "subscription.activated" || event === "subscription.authenticated") {
    if (!subscriptionEntity?.id) return;
    await query(
      `UPDATE subscriptions SET status = 'active', updated_at = $1
       WHERE razorpay_subscription_id = $2`,
      [nowIso(), subscriptionEntity.id]
    );
    return;
  }

  logger.debug("Unhandled Razorpay webhook event", { event });
}
