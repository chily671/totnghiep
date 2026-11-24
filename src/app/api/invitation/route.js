import { NextResponse } from "next/server";
import { invitationsCollection } from "@/lib/mongodb";

export async function GET() {
  try {
    const collection = await invitationsCollection();
    const invitation = await collection.findOne(
      { _id: "template-01", published: true },
      { projection: { _id: 0, published: 0, updatedAt: 0 } }
    );
    return NextResponse.json({ invitation: invitation || null });
  } catch {
    return NextResponse.json(
      { error: "Không thể tải thiệp. Vui lòng kiểm tra kết nối MongoDB." },
      { status: 503 }
    );
  }
}
