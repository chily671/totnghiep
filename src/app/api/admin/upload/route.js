import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { hasAdminSession, isSameOriginRequest } from "@/lib/admin-auth";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_TYPES = {
  image: /^image\/(jpeg|png|webp|avif)$/,
  audio: /^audio\/(mpeg|mp4|wav|ogg|aac|webm)$/,
};

function cloudinaryConfig() {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } =
    process.env;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const config = cloudinaryConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Thiếu cấu hình Cloudinary trên máy chủ Admin." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");
  if (!(file instanceof File) || !["image", "audio"].includes(kind)) {
    return NextResponse.json({ error: "Tệp tải lên không hợp lệ." }, { status: 400 });
  }
  if (!ACCEPTED_TYPES[kind].test(file.type) || file.size === 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Chỉ nhận ảnh JPEG/PNG/WebP/AVIF hoặc audio phổ biến, tối đa 15 MB." },
      { status: 400 }
    );
  }

  const resourceType = kind === "image" ? "image" : "video";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "graduation-invitations";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${config.apiSecret}`)
    .digest("hex");
  const uploadData = new FormData();
  uploadData.set("file", file);
  uploadData.set("api_key", config.apiKey);
  uploadData.set("timestamp", timestamp);
  uploadData.set("folder", folder);
  uploadData.set("signature", signature);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/${resourceType}/upload`,
      { method: "POST", body: uploadData, signal: AbortSignal.timeout(60000) }
    );
    const result = await response.json();
    if (!response.ok || !result.secure_url) {
      return NextResponse.json(
        { error: "Cloudinary từ chối tệp tải lên. Hãy kiểm tra cấu hình và định dạng tệp." },
        { status: 502 }
      );
    }
    return NextResponse.json({ url: result.secure_url });
  } catch {
    return NextResponse.json({ error: "Không thể kết nối Cloudinary." }, { status: 502 });
  }
}
