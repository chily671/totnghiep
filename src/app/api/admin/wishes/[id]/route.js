import { NextResponse } from "next/server";
import { hasAdminSession, isSameOriginRequest } from "@/lib/admin-auth";
import { parseWishObjectId, WISH_STATUSES } from "@/lib/guest-wishes";
import { guestWishesCollection } from "@/lib/mongodb";

const NO_STORE = { "Cache-Control": "no-store" };

export async function PATCH(request, { params }) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Yêu cầu không hợp lệ." },
      { status: 403, headers: NO_STORE }
    );
  }
  if (!(await hasAdminSession())) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập Admin." },
      { status: 401, headers: NO_STORE }
    );
  }

  const { id } = await params;
  const objectId = parseWishObjectId(id);
  if (!objectId) {
    return NextResponse.json(
      { error: "ID lời chúc không hợp lệ." },
      { status: 400, headers: NO_STORE }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request phải chứa JSON hợp lệ." },
      { status: 400, headers: NO_STORE }
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    Object.keys(body)[0] !== "status" ||
    !WISH_STATUSES.includes(body.status)
  ) {
    return NextResponse.json(
      { error: 'Chỉ được cập nhật status thành "pending" hoặc "approved".' },
      { status: 400, headers: NO_STORE }
    );
  }

  try {
    const wishes = await guestWishesCollection();
    const now = new Date();
    const update = {
      status: body.status,
      updatedAt: now,
      approvedAt: body.status === "approved" ? now : null,
    };
    const result = await wishes.updateOne({ _id: objectId }, { $set: update });
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy lời chúc." },
        { status: 404, headers: NO_STORE }
      );
    }
    return NextResponse.json(
      { success: true, message: "Đã cập nhật trạng thái lời chúc.", status: body.status },
      { headers: NO_STORE }
    );
  } catch {
    return NextResponse.json(
      { error: "Không thể cập nhật lời chúc." },
      { status: 503, headers: NO_STORE }
    );
  }
}

export async function DELETE(request, { params }) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Yêu cầu không hợp lệ." },
      { status: 403, headers: NO_STORE }
    );
  }
  if (!(await hasAdminSession())) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập Admin." },
      { status: 401, headers: NO_STORE }
    );
  }

  const { id } = await params;
  const objectId = parseWishObjectId(id);
  if (!objectId) {
    return NextResponse.json(
      { error: "ID lời chúc không hợp lệ." },
      { status: 400, headers: NO_STORE }
    );
  }

  try {
    const wishes = await guestWishesCollection();
    const result = await wishes.deleteOne({ _id: objectId });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy lời chúc." },
        { status: 404, headers: NO_STORE }
      );
    }
    return NextResponse.json(
      { success: true, message: "Đã xóa lời chúc." },
      { headers: NO_STORE }
    );
  } catch {
    return NextResponse.json(
      { error: "Không thể xóa lời chúc." },
      { status: 503, headers: NO_STORE }
    );
  }
}
