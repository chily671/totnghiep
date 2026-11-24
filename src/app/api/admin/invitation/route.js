import { NextResponse } from "next/server";
import { hasAdminSession, isSameOriginRequest } from "@/lib/admin-auth";
import { invitationsCollection } from "@/lib/mongodb";
import { mongoAdminError } from "@/lib/mongo-error";
import { validateInvitation } from "@/lib/invitation-validation";

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  try {
    const collection = await invitationsCollection();
    const invitation = await collection.findOne(
      { _id: "template-01" },
      { projection: { _id: 0, updatedAt: 0 } }
    );
    return NextResponse.json({ invitation: invitation || null });
  } catch (error) {
    return NextResponse.json(
      { error: mongoAdminError(error, "đọc") },
      { status: 503 }
    );
  }
}

export async function PUT(request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const result = validateInvitation(body);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    const collection = await invitationsCollection();
    await collection.updateOne(
      { _id: "template-01" },
      {
        $set: {
          ...result.invitation,
          published: true,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    return NextResponse.json({ saved: true });
  } catch (error) {
    return NextResponse.json(
      { error: mongoAdminError(error, "lưu") },
      { status: 503 }
    );
  }
}
