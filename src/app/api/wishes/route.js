import { NextResponse } from "next/server";
import {
  consumeWishRateLimit,
  parseWishPagination,
  publicWish,
  readWishRequestBody,
  requestAddressKey,
  validateWishInput,
} from "@/lib/guest-wishes";
import { guestWishesCollection, invitationRecipientsCollection, wishRateLimitsCollection } from "@/lib/mongodb";
import { recipientIdFromToken } from "@/lib/admin-auth";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request) {
  const pagination = parseWishPagination(new URL(request.url).searchParams);
  if (!pagination) {
    return NextResponse.json(
      { error: "Tham số phân trang không hợp lệ." },
      { status: 400, headers: NO_STORE }
    );
  }

  try {
    const wishes = await guestWishesCollection();
    const filter = { status: "approved" };
    const [total, results] = await Promise.all([
      wishes.countDocuments(filter),
      wishes
        .find(filter, {
          projection: {
            name: 1,
            message: 1,
            createdAt: 1,
          },
        })
        .sort({ approvedAt: -1, createdAt: -1, _id: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .toArray(),
    ]);

    return NextResponse.json(
      {
        wishes: results.map(publicWish),
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
      { headers: NO_STORE }
    );
  } catch {
    return NextResponse.json(
      { error: "Không thể tải lời chúc. Vui lòng thử lại sau." },
      { status: 503, headers: NO_STORE }
    );
  }
}

export async function POST(request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type phải là application/json." },
      { status: 415, headers: NO_STORE }
    );
  }

  const parsed = await readWishRequestBody(request);
  if (parsed.tooLarge) {
    return NextResponse.json(
      { error: "Dữ liệu gửi lên quá lớn." },
      { status: 413, headers: NO_STORE }
    );
  }
  if (parsed.error) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400, headers: NO_STORE }
    );
  }

  const validation = validateWishInput(parsed.body);
  if (validation.error) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400, headers: NO_STORE }
    );
  }

  try {
    const { name, message, recipientToken } = validation.wish;
    let recipientId;
    if (recipientToken) {
      recipientId = recipientIdFromToken(recipientToken);
      if (!recipientId) {
        return NextResponse.json(
          { error: "Mã người nhận không hợp lệ." },
          { status: 400, headers: NO_STORE }
        );
      }

      const recipients = await invitationRecipientsCollection();
      const recipient = await recipients.findOne(
        { _id: recipientId },
        { projection: { _id: 1 } }
      );
      if (!recipient) {
        return NextResponse.json(
          { error: "Không tìm thấy người nhận thiệp." },
          { status: 400, headers: NO_STORE }
        );
      }
    }

    const rateLimitCollection = await wishRateLimitsCollection();
    const addressKey = requestAddressKey(request);
    if (!(await consumeWishRateLimit(rateLimitCollection, addressKey))) {
      return NextResponse.json(
        { error: "Bạn đã gửi quá nhiều lời chúc. Vui lòng thử lại sau 15 phút." },
        {
          status: 429,
          headers: { ...NO_STORE, "Retry-After": "900" },
        }
      );
    }

    const wishes = await guestWishesCollection();
    const now = new Date();
    const wish = {
      name,
      message,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      approvedAt: null,
      ...(recipientId ? { recipientId } : {}),
    };
    const result = await wishes.insertOne(wish);

    return NextResponse.json(
      {
        success: true,
        message: "Lời chúc đã được gửi và đang chờ Admin duyệt.",
        wish: { id: result.insertedId.toString(), status: "pending" },
      },
      { status: 201, headers: NO_STORE }
    );
  } catch {
    return NextResponse.json(
      { error: "Không thể gửi lời chúc lúc này. Vui lòng thử lại sau." },
      { status: 503, headers: NO_STORE }
    );
  }
}
