import { NextResponse } from "next/server";
import { clearAdminSession, isSameOriginRequest } from "@/lib/admin-auth";

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  await clearAdminSession();
  return NextResponse.json({ authenticated: false });
}
