import { NextResponse } from "next/server";
import { hasAdminSession, isSameOriginRequest } from "@/lib/admin-auth";
import {
  invitationRecipientsCollection,
  invitationsCollection,
} from "@/lib/mongodb";
import { createRecipientRecord, recipientPath } from "@/lib/invitation-recipients";
import { mongoAdminError } from "@/lib/mongo-error";

const MAX_RECIPIENTS = 300;

async function listRecipients(collection) {
  const recipients = await collection
    .find({}, { projection: { name: 1, slug: 1, token: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(MAX_RECIPIENTS)
    .toArray();
  return recipients.map((recipient) => ({
    id: recipient._id,
    name: recipient.name,
    path: recipientPath(recipient),
    createdAt: recipient.createdAt,
  }));
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  try {
    const collection = await invitationRecipientsCollection();
    return NextResponse.json({ recipients: await listRecipients(collection) });
  } catch (error) {
    return NextResponse.json(
      { error: mongoAdminError(error, "tải danh sách khách mời") },
      { status: 503 }
    );
  }
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  let names;
  try {
    ({ names } = await request.json());
  } catch {
    return NextResponse.json({ error: "Danh sách tên không hợp lệ." }, { status: 400 });
  }

  if (!Array.isArray(names) || names.length === 0 || names.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { error: `Nhập từ 1 đến ${MAX_RECIPIENTS} tên mỗi lần.` },
      { status: 400 }
    );
  }

  const normalizedNames = names.map((name) =>
    typeof name === "string" ? name.trim() : ""
  );
  if (normalizedNames.some((name) => !name || name.length > 100)) {
    return NextResponse.json(
      { error: "Mỗi tên phải có từ 1 đến 100 ký tự." },
      { status: 400 }
    );
  }

  try {
    const [collection, invitations] = await Promise.all([
      invitationRecipientsCollection(),
      invitationsCollection(),
    ]);
    const published = await invitations.findOne(
      { _id: "template-01", published: true },
      { projection: { _id: 1 } }
    );
    if (!published) {
      return NextResponse.json(
        { error: "Hãy xuất bản thiệp trước khi tạo link khách mời." },
        { status: 409 }
      );
    }

    const count = await collection.countDocuments();
    if (count + normalizedNames.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Danh sách tối đa ${MAX_RECIPIENTS} khách mời.` },
        { status: 400 }
      );
    }

    await collection.insertMany(normalizedNames.map(createRecipientRecord));
    return NextResponse.json(
      { recipients: await listRecipients(collection) },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: mongoAdminError(error, "tạo liên kết khách mời") },
      { status: 503 }
    );
  }
}
