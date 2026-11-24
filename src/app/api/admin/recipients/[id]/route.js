import { NextResponse } from "next/server";
import { hasAdminSession, isSameOriginRequest } from "@/lib/admin-auth";
import { invitationRecipientsCollection } from "@/lib/mongodb";
import { mongoAdminError } from "@/lib/mongo-error";

export async function DELETE(request, { params }) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Yêu cầu không hợp lệ." },
      { status: 403 },
    );
  }

  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID khách mời không hợp lệ." },
        { status: 400 },
      );
    }

    const collection = await invitationRecipientsCollection();

    const result = await collection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy khách mời hoặc liên kết đã bị xóa." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa liên kết khách mời.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: mongoAdminError(error, "xóa liên kết khách mời") },
      { status: 503 },
    );
  }
}
