import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import {
  adminWish,
  parseAdminWishStatus,
  parseWishPagination,
} from "@/lib/guest-wishes";
import { guestWishesCollection } from "@/lib/mongodb";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập Admin." },
      { status: 401, headers: NO_STORE }
    );
  }

  const url = new URL(request.url);
  const status = parseAdminWishStatus(url.searchParams.get("status"));
  const pagination = parseWishPagination(url.searchParams);
  if (!status || !pagination) {
    return NextResponse.json(
      { error: "Bộ lọc hoặc tham số phân trang không hợp lệ." },
      { status: 400, headers: NO_STORE }
    );
  }

  try {
    const wishes = await guestWishesCollection();
    const filter = status === "all" ? {} : { status };
    const [total, results, counts] = await Promise.all([
      wishes.countDocuments(filter),
      wishes
        .find(filter, {
          projection: {
            name: 1,
            message: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            approvedAt: 1,
            recipientId: 1,
          },
        })
        .sort({ createdAt: -1, _id: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .toArray(),
      wishes
        .aggregate([
          { $match: { status: { $in: ["pending", "approved"] } } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ])
        .toArray(),
    ]);
    const byStatus = { pending: 0, approved: 0 };
    for (const item of counts) byStatus[item._id] = item.count;

    return NextResponse.json(
      {
        wishes: results.map(adminWish),
        counts: byStatus,
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
      { error: "Không thể tải danh sách lời chúc." },
      { status: 503, headers: NO_STORE }
    );
  }
}
