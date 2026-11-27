import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { authUser, requireAuth } from "../middleware/auth";
import {
  forgotPassword,
  login,
  register,
  resetPassword,
  resendOtp,
  verifyEmail,
  verifyLoginOtp,
} from "../services/email-auth";
import { googleSignIn } from "../services/google-auth";
import { revokeRefreshToken, rotateRefreshToken } from "../services/tokens";
import { findUserById, serializeOwnProfile } from "../services/users";
import { unauthorized } from "../utils/errors";
import { parseBody } from "../utils/validate";

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
const codeField = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.");

const registerSchema = z.object({
  email: emailField,
  password: passwordField,
  name: z.string().trim().min(1).max(80).optional(),
  age: z.number().int().min(18).max(120).optional(),
  gender: z.enum(["woman", "man", "other"]).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  interestedIn: z.enum(["women", "men", "everyone"]).optional(),
});
const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(128),
});
const emailOnlySchema = z.object({ email: emailField });
const verifySchema = z.object({ email: emailField, code: codeField });
const resendSchema = z.object({
  email: emailField,
  purpose: z.enum(["verify_email", "login"]),
});
const resetSchema = z.object({
  token: z.string().trim().min(20).max(200),
  password: passwordField,
});
const refreshSchema = z.object({
  refreshToken: z.string().trim().min(20).max(500),
});
const googleSchema = z.object({ idToken: z.string().trim().min(10) });

authRouter.use(authLimiter);

authRouter.post("/google", credentialLimiter, async (req, res) => {
  const { idToken } = parseBody(googleSchema, req.body);
  res.json(await googleSignIn(idToken));
});

authRouter.post("/register", credentialLimiter, async (req, res) => {
  res.status(201).json(await register(parseBody(registerSchema, req.body)));
});

authRouter.post("/verify-email", credentialLimiter, async (req, res) => {
  const { email, code } = parseBody(verifySchema, req.body);
  res.json(await verifyEmail(email, code));
});

authRouter.post("/verify-login-otp", credentialLimiter, async (req, res) => {
  const { email, code } = parseBody(verifySchema, req.body);
  res.json(await verifyLoginOtp(email, code));
});

authRouter.post("/resend-otp", credentialLimiter, async (req, res) => {
  const { email, purpose } = parseBody(resendSchema, req.body);
  res.json(await resendOtp(email, purpose));
});

authRouter.post("/login", credentialLimiter, async (req, res) => {
  res.json(await login(parseBody(loginSchema, req.body)));
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
  res.json({ user: await serializeOwnProfile(authUser(req)) });
});
