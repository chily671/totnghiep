export function mongoAdminError(error, operation) {
  const name = error instanceof Error ? error.name : "UnknownError";
  const code = error && typeof error === "object" ? error.code : undefined;
  console.error(`MongoDB ${operation} failed (${name}${code ? `, code ${code}` : ""}).`);

  if (code === 13 || error?.codeName === "Unauthorized") {
    return "Tài khoản MongoDB chưa có quyền đọc/ghi trên database đã cấu hình.";
  }
  if (name === "MongoServerSelectionError") {
    return "Không kết nối được MongoDB. Kiểm tra MONGODB_URI và IP access list.";
  }
  return `Không thể ${operation} dữ liệu MongoDB. Kiểm tra cấu hình kết nối và quyền readWrite.`;
}
