"use client";

import { useCallback } from "react";
import GraduationTemplate01 from "@/components/templates/GraduationTemplate01";

async function submitWish(payload) {
  const response = await fetch("/api/wishes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Máy chủ trả về phản hồi không hợp lệ.");
  }
  if (!response.ok) throw new Error(result.error || "Không thể gửi lời chúc.");
  return result;
}

export default function GuestInvitationClient({
  invitation,
  recipientName = "",
  recipientToken = "",
  preview = false,
}) {
  const onSubmitWish = useCallback(
    (wish) => submitWish({ ...wish, ...(recipientToken ? { recipientToken } : {}) }),
    [recipientToken],
  );

  return (
    <GraduationTemplate01
      invitation={invitation}
      recipientName={recipientName}
      preview={preview}
      onSubmitWish={onSubmitWish}
    />
  );
}
