import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_JWT_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function sign(payload) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isSameOriginRequest(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function credentialsMatch(username, password) {
  const configuredUsername = process.env.ADMIN_USERNAME;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredUsername || !configuredPassword) return false;
  return safeEqual(username, configuredUsername) && safeEqual(password, configuredPassword);
}

export function sessionDurationSeconds() {
  const configuredMinutes = Number.parseInt(process.env.SESSION_DURATION_MINUTES || "", 10);
  const defaultMinutes = 60 * 24 * 30;
  const minimumMinutes = 60 * 24 * 30;
  const maximumMinutes = 60 * 24 * 90;
  const minutes = Number.isFinite(configuredMinutes) && configuredMinutes > 0
    ? configuredMinutes
    : defaultMinutes;
  return Math.min(Math.max(minutes, minimumMinutes), maximumMinutes) * 60;
}

export function createSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + sessionDurationSeconds() * 1000 })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function createRecipientToken(id) {
  return `${id}.${sign(id)}`;
}

export function recipientIdFromToken(token) {
  const [id, signature, extra] = token.split(".");
  if (!id || !signature || extra || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return safeEqual(signature, sign(id)) ? id : null;
}

export async function setAdminSession(token) {
  const cookieStore = await cookies();
  const maxAge = sessionDurationSeconds();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;
  try {
    if (!safeEqual(signature, sign(payload))) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(data.exp) && data.exp > Date.now();
  } catch {
    return false;
  }
}
