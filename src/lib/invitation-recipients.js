import { randomUUID } from "node:crypto";
import { createRecipientToken } from "@/lib/admin-auth";

export function normalizeRecipientName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "khach-moi";
}

export function createRecipientRecord(name) {
  const id = randomUUID();
  return {
    _id: id,
    name,
    createdAt: new Date(),
    token: createRecipientToken(id),
    slug: normalizeRecipientName(name),
  };
}

export function recipientPath(recipient) {
  return `/invite/${encodeURIComponent(recipient.slug)}/${encodeURIComponent(recipient.token)}`;
}
