import { NextResponse } from "next/server";
import {
  createSessionToken,
  credentialsMatch,
  isSameOriginRequest,
  setAdminSession,
} from "@/lib/admin-auth";

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  }

  let credentials;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  const username = typeof credentials?.username === "string" ? credentials.username : "";
  const password = typeof credentials?.password === "string" ? credentials.password : "";
  if (!credentialsMatch(username, password)) {
    return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không đúng." }, { status: 401 });
  }

  try {
    await setAdminSession(createSessionToken());
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json(
      { error: "Cấu hình đăng nhập Admin chưa hợp lệ." },
      { status: 503 }
    );
  }
}
