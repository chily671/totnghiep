import { createHmac } from "node:crypto";
import { ObjectId } from "mongodb";

export const WISH_STATUSES = Object.freeze(["pending", "approved"]);
export const DEFAULT_WISH_PAGE_SIZE = 20;
export const MAX_WISH_PAGE_SIZE = 50;

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_BODY_BYTES = 8192;

export async function readWishRequestBody(request) {
  if (isWishBodyTooLarge(request)) return { tooLarge: true };
  if (!request.body) return { error: "Request phải chứa JSON hợp lệ." };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return { tooLarge: true };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return { body: JSON.parse(text) };
  } catch {
    return { error: "Request phải chứa JSON hợp lệ." };
  } finally {
    reader.releaseLock();
  }
}

export function validateWishInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Dữ liệu lời chúc không hợp lệ." };
  }
  if (Object.keys(body).some((key) => !["name", "message", "recipientToken"].includes(key))) {
    return { error: "Request chỉ được chứa name, message và recipientToken." };
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!name) return { error: "Vui lòng nhập tên người gửi." };
  if (name.length > 80) return { error: "Tên người gửi tối đa 80 ký tự." };
  if (!message) return { error: "Vui lòng nhập nội dung lời chúc." };
  if (message.length > 500) return { error: "Lời chúc tối đa 500 ký tự." };

  const containsUnsafeMarkup = (value) => /[<>]/.test(value);
  const containsControlCharacters = (value) => /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value);
  if (containsUnsafeMarkup(name) || containsUnsafeMarkup(message)) {
    return { error: "Tên và lời chúc chỉ nhận văn bản thuần, không chấp nhận HTML." };
  }
  if (containsControlCharacters(name) || containsControlCharacters(message)) {
    return { error: "Tên và lời chúc chứa ký tự không hợp lệ." };
  }

  if (
    body.recipientToken !== undefined &&
    (typeof body.recipientToken !== "string" || body.recipientToken.length > 256)
  ) {
    return { error: "Mã người nhận không hợp lệ." };
  }

  return {
    wish: {
      name,
      message: message.replace(/\r\n?/g, "\n"),
      recipientToken: body.recipientToken || "",
    },
  };
}

export function parseWishPagination(searchParams) {
  const pageValue = searchParams.get("page") || "1";
  const limitValue = searchParams.get("limit") || String(DEFAULT_WISH_PAGE_SIZE);
  if (!/^\d+$/.test(pageValue) || !/^\d+$/.test(limitValue)) return null;

  const page = Number(pageValue);
  const requestedLimit = Number(limitValue);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return null;
  if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1) return null;

  return {
    page,
    limit: Math.min(requestedLimit, MAX_WISH_PAGE_SIZE),
    skip: (page - 1) * Math.min(requestedLimit, MAX_WISH_PAGE_SIZE),
  };
}

export function parseAdminWishStatus(value) {
  if (!value || value === "all") return "all";
  return WISH_STATUSES.includes(value) ? value : null;
}

export function parseWishObjectId(value) {
  return typeof value === "string" && /^[0-9a-f]{24}$/i.test(value)
    ? new ObjectId(value)
    : null;
}

export function requestAddressKey(request) {
  const address =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_JWT_SECRET must contain at least 32 characters.");
  }
  return createHmac("sha256", secret).update(address).digest("hex");
}

export async function consumeWishRateLimit(collection, addressKey, now = Date.now()) {
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
  const key = `${addressKey}:${windowStart}`;
  const update = {
    $setOnInsert: {
      windowStart: new Date(windowStart),
      expiresAt: new Date(windowStart + RATE_LIMIT_WINDOW_MS * 2),
    },
    $inc: { count: 1 },
  };
  try {
    await collection.updateOne({ _id: key }, update, { upsert: true });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    await collection.updateOne({ _id: key }, { $inc: { count: 1 } });
  }
  const rateLimit = await collection.findOne({ _id: key }, { projection: { count: 1 } });
  return typeof rateLimit?.count === "number" && rateLimit.count <= RATE_LIMIT_MAX_REQUESTS;
}

export function publicWish(wish) {
  return {
    id: wish._id.toString(),
    name: wish.name,
    message: wish.message,
    createdAt: wish.createdAt,
  };
}

export function adminWish(wish) {
  return {
    ...publicWish(wish),
    status: wish.status,
    updatedAt: wish.updatedAt,
    recipientId: wish.recipientId || null,
  };
}

export function isWishBodyTooLarge(request) {
  const contentLength = Number(request.headers.get("content-length"));
  return Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES;
}
