import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { authUser, requireAuth } from "../middleware/auth";
import {
  forgotPassword,
  login,
  register,
  resetPassword,
  resendVerification,
  verifyEmail,
} from "../services/email-auth";
import { revokeRefreshToken, rotateRefreshToken } from "../services/tokens";
import { findUserById, serializeOwnProfile } from "../services/users";
import { unauthorized } from "../utils/errors";
import { parseBody, parseQuery } from "../utils/validate";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many attempts. Try again shortly." } },
});

const credentialLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many attempts. Try again shortly." } },
});

const emailField = z.string().trim().email("Enter a valid email address.").max(254);
const passwordField = z.string().min(8, "Password must be at least 8 characters.").max(128);
const tokenField = z.string().trim().min(20).max(200);

const registerSchema = z.object({
  email: emailField,
  password: passwordField,
  name: z.string().trim().min(1).max(80).optional(),
});
const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(128),
});
const emailOnlySchema = z.object({ email: emailField });
const verifyBodySchema = z.object({ token: tokenField });
const verifyQuerySchema = z.object({ token: tokenField });
const resetSchema = z.object({ token: tokenField, password: passwordField });
const refreshSchema = z.object({
  refreshToken: z.string().trim().min(20).max(500),
});

authRouter.use(authLimiter);

authRouter.post("/register", credentialLimiter, async (req, res) => {
  const input = parseBody(registerSchema, req.body);
  res.status(201).json(await register(input));
});

authRouter.post("/verify-email", credentialLimiter, async (req, res) => {
  const { token } = parseBody(verifyBodySchema, req.body);
  res.json(await verifyEmail(token));
});

// Direct browser links from the verification email can hit this endpoint too.
authRouter.get("/verify-email", credentialLimiter, async (req, res) => {
  const { token } = parseQuery(verifyQuerySchema, req.query);
  res.json(await verifyEmail(token));
});

authRouter.post("/resend-verification", credentialLimiter, async (req, res) => {
  const { email } = parseBody(emailOnlySchema, req.body);
  res.json(await resendVerification(email));
});

authRouter.post("/login", credentialLimiter, async (req, res) => {
  const input = parseBody(loginSchema, req.body);
  res.json(await login(input));
});

authRouter.post("/forgot-password", credentialLimiter, async (req, res) => {
  const { email } = parseBody(emailOnlySchema, req.body);
  res.json(await forgotPassword(email));
});

authRouter.post("/reset-password", credentialLimiter, async (req, res) => {
  const { token, password } = parseBody(resetSchema, req.body);
  res.json(await resetPassword(token, password));
});

authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = parseBody(refreshSchema, req.body);
  const result = await rotateRefreshToken(refreshToken);
  const user = await findUserById(result.userId);
  if (!user) throw unauthorized("USER_NOT_FOUND", "Your account could not be found.");
  res.json({ tokens: result.tokens, user: await serializeOwnProfile(user) });
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  const { refreshToken } = parseBody(refreshSchema, req.body);
  await revokeRefreshToken(refreshToken);
  res.json({ ok: true });
});

authRouter.get("/session", requireAuth, async (req, res) => {
  const user = authUser(req);
  res.json({ user: await serializeOwnProfile(user) });
});
