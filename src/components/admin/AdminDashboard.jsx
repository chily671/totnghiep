"use client";

import { useCallback, useEffect, useState } from "react";
import GraduationTemplate01 from "@/components/templates/GraduationTemplate01";

const EMPTY_INVITATION = {
  universityName: "",
  universityEnglish: "",
  universityScript: "",
  city: "",
  graduateName: "",
  faculty: "",
  heroImage: "",
  logoImage: "",
  eventDate: "",
  eventTitle: "",
  venueName: "",
  venueAddress: "",
  mapsUrl: "",
  closingLine: "",
  secondaryLine: "",
  invitationMessage: "",
  musicUrl: "",
  accentColor: "#17264b",
  graduationYear: "",
};

const TEXT_FIELDS = [
  ["universityName", "Tên trường", "Ví dụ: TRƯỜNG ĐẠI HỌC ..."],
  ["universityEnglish", "Tên tiếng Anh", "Dòng chữ lớn trên thiệp"],
  ["universityScript", "Tên cách điệu", "Chữ serif nghiêng"],
  ["city", "Thành phố", "TP. HỒ CHÍ MINH"],
  ["graduateName", "Tên sinh viên", "Tên hiển thị trên dải băng"],
  ["faculty", "Khoa / ngành", "Thông tin bên dưới dải băng"],
  ["eventTitle", "Tên buổi lễ", "LỄ TỐT NGHIỆP"],
  ["venueName", "Địa điểm", "Tên hội trường / địa điểm"],
  ["venueAddress", "Địa chỉ", "Địa chỉ chi tiết"],
  ["mapsUrl", "Liên kết bản đồ", "https://maps.google.com/..."],
  ["closingLine", "Câu kết", "EVERY END IS A NEW BEGINNING"],
  ["secondaryLine", "Dòng phụ", "A NEW CHAPTER BEGINS"],
  ["graduationYear", "Năm tốt nghiệp", "2026"],
];

const TEXTAREA_FIELDS = {
  faculty: {
    rows: 3,
    placeholder: "Ví dụ:\nKHOA CÔNG NGHỆ THÔNG TIN\nNGÀNH KỸ THUẬT PHẦN MỀM",
  },
  venueName: {
    rows: 2,
    placeholder: "Ví dụ:\nHỘI TRƯỜNG A\nTRƯỜNG ĐẠI HỌC ...",
  },
  venueAddress: {
    rows: 3,
    placeholder:
      "Ví dụ:\n12 Nguyễn Văn Bảo,\nPhường 4, Gò Vấp,\nTP. Hồ Chí Minh",
  },
  universityName: {
    rows: 3,
    placeholder: "Ví dụ:\nTRƯỜNG ĐẠI HỌC ...\nKHOA CÔNG NGHỆ THÔNG TIN",
  },
};

async function readJson(response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Đã xảy ra lỗi.");
  return result;
}

function dateTimeInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const fields = Object.fromEntries(
    parts.map(({ type, value: part }) => [type, part]),
  );
  return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`;
}

function eventDateValue(value) {
  if (!value) return "";
  const date = new Date(`${value}:00+07:00`);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children || <input placeholder={hint} className="admin-input" />}
    </label>
  );
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [invitation, setInvitation] = useState(EMPTY_INVITATION);
  const [recipients, setRecipients] = useState([]);
  const [recipientNames, setRecipientNames] = useState("");
  const [hasPublished, setHasPublished] = useState(false);
  const [wishes, setWishes] = useState([]);
  const [wishFilter, setWishFilter] = useState("pending");
  const [wishCounts, setWishCounts] = useState({ pending: 0, approved: 0 });
  const [wishesLoading, setWishesLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const loadDashboardData = useCallback(async () => {
    const [invitationResult, recipientResult, wishesResult] = await Promise.all(
      [
        fetch("/api/admin/invitation", { cache: "no-store" }).then(readJson),
        fetch("/api/admin/recipients", { cache: "no-store" }).then(readJson),
        fetch("/api/admin/wishes?status=pending&page=1&limit=50", {
          cache: "no-store",
        }).then(readJson),
      ],
    );
    setInvitation({
      ...EMPTY_INVITATION,
      ...(invitationResult.invitation || {}),
    });
    setHasPublished(Boolean(invitationResult.invitation?.published));
    setRecipients(recipientResult.recipients);
    setWishes(wishesResult.wishes);
    setWishCounts(wishesResult.counts);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/session", { cache: "no-store" })
      .then(readJson)
      .then(async ({ authenticated: isAuthenticated }) => {
        if (!active) return;
        setAuthenticated(isAuthenticated);
        if (isAuthenticated) await loadDashboardData();
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [loadDashboardData]);

  const updateField = (field, value) => {
    setInvitation((current) => ({ ...current, [field]: value }));
  };

  const login = async (event) => {
    event.preventDefault();
    setBusy("login");
    setError("");
    try {
      await readJson(
        await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        }),
      );
      setAuthenticated(true);
      await loadDashboardData();
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy("");
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy("save");
    setError("");
    setMessage("");
    try {
      await readJson(
        await fetch("/api/admin/invitation", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invitation),
        }),
      );
      setHasPublished(true);
      setMessage("Đã lưu và xuất bản thiệp.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy("");
    }
  };

  const upload = async (field, kind, file) => {
    if (!file) return;
    setBusy(field);
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("kind", kind);
      const result = await readJson(
        await fetch("/api/admin/upload", { method: "POST", body }),
      );
      updateField(field, result.url);
      setMessage("Đã tải tệp lên Cloudinary.");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setBusy("");
    }
  };

  const createRecipientLinks = async () => {
    if (!hasPublished) {
      setError(
        "Hãy lưu và xuất bản nội dung thiệp trước khi tạo link cho khách.",
      );
      return;
    }
    const names = recipientNames
      .split(/\r?\n/)
      .map((name) => name.trim())
      .filter(Boolean);
    if (names.length === 0) {
      setError("Nhập ít nhất một tên người nhận, mỗi người một dòng.");
      return;
    }

    setBusy("recipients");
    setError("");
    setMessage("");
    try {
      const result = await readJson(
        await fetch("/api/admin/recipients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names }),
        }),
      );
      setRecipients(result.recipients);
      setRecipientNames("");
      setMessage(`Đã tạo ${names.length} liên kết riêng.`);
    } catch (recipientError) {
      setError(recipientError.message);
    } finally {
      setBusy("");
    }
  };

  const copyRecipientLink = async (path) => {
    try {
      await navigator.clipboard.writeText(
        new URL(path, window.location.origin).toString(),
      );
      setError("");
      setMessage("Đã sao chép liên kết.");
    } catch {
      setError(
        "Không thể sao chép tự động. Hãy chọn và sao chép URL hiển thị.",
      );
    }
  };

  const deleteRecipientLink = async (recipient) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa link của "${recipient.name}"? Link này sẽ không còn truy cập được nếu máy chủ hỗ trợ thu hồi link.`,
    );
    if (!confirmed) return;

    setBusy(`recipient-${recipient.id}`);
    setError("");
    setMessage("");

    try {
      await readJson(
        await fetch(`/api/admin/recipients/${recipient.id}`, {
          method: "DELETE",
          headers: { Origin: window.location.origin },
        }),
      );

      setRecipients((current) =>
        current.filter((item) => item.id !== recipient.id),
      );
      setMessage(
        `Đã xóa link của ${recipient.name}. Bạn có thể tạo link mới cho người nhận này.`,
      );
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy("");
    }
  };

  const downloadRecipientLinks = () => {
    const rows = [
      ["Tên người nhận", "Liên kết thiệp"],
      ...recipients.map((recipient) => [
        recipient.name,
        new URL(recipient.path, window.location.origin).toString(),
      ]),
    ];
    const csv = `\uFEFF${rows
      .map((row) =>
        row.map((value) => `"${value.replace(/"/g, '""')}"`).join(","),
      )
      .join("\r\n")}`;
    const downloadUrl = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = "links-thiep-tot-nghiep.csv";
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const loadWishes = async (status = wishFilter) => {
    setWishesLoading(true);
    setError("");
    try {
      const result = await readJson(
        await fetch(`/api/admin/wishes?status=${status}&page=1&limit=50`, {
          cache: "no-store",
        }),
      );
      setWishes(result.wishes);
      setWishCounts(result.counts);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setWishesLoading(false);
    }
  };

  const updateWishStatus = async (id, status) => {
    setBusy(`wish-${id}`);
    setError("");
    try {
      await readJson(
        await fetch(`/api/admin/wishes/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Origin: window.location.origin,
          },
          body: JSON.stringify({ status }),
        }),
      );
      await loadWishes();
      setMessage(
        status === "approved"
          ? "Đã duyệt lời chúc."
          : "Đã chuyển lời chúc về chờ duyệt.",
      );
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusy("");
    }
  };

  const deleteWish = async (id) => {
    setBusy(`wish-${id}`);
    setError("");
    try {
      await readJson(
        await fetch(`/api/admin/wishes/${id}`, {
          method: "DELETE",
          headers: { Origin: window.location.origin },
        }),
      );
      await loadWishes();
      setMessage("Đã xóa lời chúc.");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy("");
    }
  };

  const logout = async () => {
    setError("");
    try {
      await readJson(await fetch("/api/admin/logout", { method: "POST" }));
      setAuthenticated(false);
      setCredentials({ username: "", password: "" });
    } catch (logoutError) {
      setError(logoutError.message);
    }
  };

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] text-sm text-slate-500">
        Đang kiểm tra phiên đăng nhập…
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-5 py-12">
        <form
          onSubmit={login}
          className="w-full max-w-md rounded-3xl border border-[#e9e6de] bg-white p-8 shadow-[0_24px_70px_rgba(27,38,61,.08)] sm:p-10"
        >
          <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#17264b] text-lg text-white">
            01
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#927d57]">
            Graduation invitation
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#17264b]">
            Khu vực quản trị
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Đăng nhập để quản lý nội dung và media của thiệp.
          </p>
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {error}
            </p>
          )}
          <label className="mt-6 block text-sm font-medium text-slate-700">
            Tên đăng nhập
            <input
              autoComplete="username"
              required
              value={credentials.username}
              onChange={(event) =>
                setCredentials({ ...credentials, username: event.target.value })
              }
              className="admin-input mt-2"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Mật khẩu
            <input
              type="password"
              autoComplete="current-password"
              required
              value={credentials.password}
              onChange={(event) =>
                setCredentials({ ...credentials, password: event.target.value })
              }
              className="admin-input mt-2"
            />
          </label>
          <button
            disabled={busy === "login"}
            className="mt-7 w-full rounded-xl bg-[#17264b] px-5 py-3.5 text-sm font-medium text-white transition hover:bg-[#263963] disabled:opacity-60"
          >
            {busy === "login" ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-slate-900">
      <header className="border-b border-[#e9e6de] bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 sm:px-8">
          <a href="/admin" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17264b] font-serif text-sm text-white">
              01
            </span>
            <span>
              <span className="block text-sm font-semibold text-[#17264b]">
                Invitation Studio
              </span>
              <span className="block text-xs text-slate-500">
                Template 01 · Graduation
              </span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            <a
              href="#guest-wishes"
              className="text-sm font-medium text-slate-600 transition hover:text-[#17264b]"
            >
              Lời chúc
            </a>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden text-sm font-medium text-slate-600 transition hover:text-[#17264b] sm:inline"
            >
              Mở thiệp ↗
            </a>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#927d57]">
              Nội dung xuất bản
            </p>
            <h1 className="mt-2 font-serif text-3xl text-[#17264b] sm:text-4xl">
              Quản lý thiệp tốt nghiệp
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Cập nhật thông tin, ảnh và nhạc. Bản xem trước thay đổi tức thì;
              nhấn lưu để xuất bản lên trang thiệp.
            </p>
          </div>
          <span className="rounded-full border border-[#d9e7dc] bg-[#f0f7f1] px-3 py-1.5 text-xs font-medium text-[#42684b]">
            ● Template 01 đang hoạt động
          </span>
        </div>

        {(error || message) && (
          <div
            role={error ? "alert" : "status"}
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
          >
            {error || message}
          </div>
        )}

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
          <form onSubmit={save} className="space-y-6">
            <section className="rounded-2xl border border-[#e9e6de] bg-white p-5 shadow-[0_8px_30px_rgba(27,38,61,.035)] sm:p-7">
              <div className="mb-6 border-b border-slate-100 pb-4">
                <h2 className="font-serif text-xl text-[#17264b]">
                  Nhận diện & chân dung
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Thông tin trường, sinh viên và hình ảnh trên bìa.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {TEXT_FIELDS.slice(0, 6).map(([field, label, hint]) => (
                  <Field key={field} label={label}>
                    {TEXTAREA_FIELDS[field] ? (
                      <textarea
                        rows={TEXTAREA_FIELDS[field].rows}
                        value={invitation[field] ?? ""}
                        onChange={(event) =>
                          updateField(field, event.target.value)
                        }
                        placeholder={TEXTAREA_FIELDS[field].placeholder}
                        className="admin-input resize-y whitespace-pre-wrap"
                      />
                    ) : (
                      <input
                        value={invitation[field] ?? ""}
                        onChange={(event) =>
                          updateField(field, event.target.value)
                        }
                        placeholder={hint}
                        className="admin-input"
                      />
                    )}
                  </Field>
                ))}

                <Field label="Màu Navy">
                  <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 px-3">
                    <input
                      type="color"
                      value={invitation.accentColor || "#17264b"}
                      onChange={(event) =>
                        updateField("accentColor", event.target.value)
                      }
                      className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span className="font-mono text-xs text-slate-500">
                      {invitation.accentColor}
                    </span>
                  </div>
                </Field>
                <Field label="Logo trường">
                  <div className="flex gap-2">
                    <input
                      value={invitation.logoImage ?? ""}
                      onChange={(event) =>
                        updateField("logoImage", event.target.value)
                      }
                      placeholder="URL Cloudinary"
                      className="admin-input min-w-0"
                    />
                    <label className="admin-upload-button">
                      {busy === "logoImage" ? "…" : "Tải"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          upload("logoImage", "image", file);
                        }}
                      />
                    </label>
                  </div>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Ảnh tốt nghiệp lớn">
                    <div className="flex gap-2">
                      <input
                        value={invitation.heroImage ?? ""}
                        onChange={(event) =>
                          updateField("heroImage", event.target.value)
                        }
                        placeholder="URL Cloudinary"
                        className="admin-input min-w-0"
                      />
                      <label className="admin-upload-button">
                        {busy === "heroImage" ? "Đang tải…" : "Tải ảnh"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            upload("heroImage", "image", file);
                          }}
                        />
                      </label>
                    </div>
                  </Field>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Ảnh tải lên được chuyển trực tiếp qua máy chủ tới Cloudinary;
                giới hạn 15 MB.
              </p>
            </section>

            <section className="rounded-2xl border border-[#e9e6de] bg-white p-5 shadow-[0_8px_30px_rgba(27,38,61,.035)] sm:p-7">
              <div className="mb-6 border-b border-slate-100 pb-4">
                <h2 className="font-serif text-xl text-[#17264b]">
                  Thông tin buổi lễ
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Ngày giờ, địa điểm và lời mời.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {TEXT_FIELDS.slice(6).map(([field, label, hint]) => (
                  <Field key={field} label={label}>
                    {TEXTAREA_FIELDS[field] ? (
                      <textarea
                        rows={TEXTAREA_FIELDS[field].rows}
                        value={invitation[field] ?? ""}
                        onChange={(event) =>
                          updateField(field, event.target.value)
                        }
                        placeholder={TEXTAREA_FIELDS[field].placeholder}
                        className="admin-input resize-y whitespace-pre-wrap"
                      />
                    ) : (
                      <input
                        value={invitation[field] ?? ""}
                        onChange={(event) =>
                          updateField(field, event.target.value)
                        }
                        placeholder={hint}
                        className="admin-input"
                      />
                    )}
                  </Field>
                ))}

                <Field label="Ngày & giờ">
                  <input
                    type="datetime-local"
                    value={dateTimeInputValue(invitation.eventDate)}
                    onChange={(event) =>
                      updateField(
                        "eventDate",
                        eventDateValue(event.target.value),
                      )
                    }
                    className="admin-input"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Nội dung lời mời">
                    <textarea
                      rows={3}
                      value={invitation.invitationMessage ?? ""}
                      onChange={(event) =>
                        updateField("invitationMessage", event.target.value)
                      }
                      placeholder="Lời nhắn sẽ xuất hiện trên phong thư mở đầu."
                      className="admin-input resize-y"
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e9e6de] bg-white p-5 shadow-[0_8px_30px_rgba(27,38,61,.035)] sm:p-7">
              <div className="mb-6 border-b border-slate-100 pb-4">
                <h2 className="font-serif text-xl text-[#17264b]">Nhạc nền</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Khách có thể bật/tắt nhạc sau khi mở thiệp.
                </p>
              </div>
              <Field label="Tệp nhạc Cloudinary">
                <div className="flex gap-2">
                  <input
                    value={invitation.musicUrl ?? ""}
                    onChange={(event) =>
                      updateField("musicUrl", event.target.value)
                    }
                    placeholder="URL Cloudinary"
                    className="admin-input min-w-0"
                  />
                  <label className="admin-upload-button">
                    {busy === "musicUrl" ? "Đang tải…" : "Tải nhạc"}
                    <input
                      type="file"
                      accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/aac,audio/webm"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        upload("musicUrl", "audio", file);
                      }}
                    />
                  </label>
                </div>
              </Field>
            </section>

            <section className="rounded-2xl border border-[#e9e6de] bg-white p-5 shadow-[0_8px_30px_rgba(27,38,61,.035)] sm:p-7">
              <div className="mb-6 border-b border-slate-100 pb-4">
                <h2 className="font-serif text-xl text-[#17264b]">
                  Link riêng cho từng khách
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Nhập mỗi tên một dòng. Mỗi khách sẽ có URL riêng chứa tên dễ
                  nhận diện và mã bảo mật duy nhất.
                </p>
              </div>
              {!hasPublished && (
                <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                  Cần lưu và xuất bản thiệp trước, sau đó mới tạo link hoạt động
                  cho khách.
                </p>
              )}
              <textarea
                rows={3}
                value={recipientNames}
                onChange={(event) => setRecipientNames(event.target.value)}
                placeholder={"Nguyễn Minh Anh\nTrần Quốc Bảo\nLê Thu Hà"}
                className="admin-input resize-y"
                aria-label="Danh sách tên người nhận"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={busy !== ""}
                  onClick={createRecipientLinks}
                  className="rounded-xl bg-[#17264b] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#263963] disabled:opacity-50"
                >
                  {busy === "recipients" ? "Đang tạo…" : "Tạo link riêng"}
                </button>
                <button
                  type="button"
                  disabled={recipients.length === 0}
                  onClick={downloadRecipientLinks}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Tải danh sách CSV
                </button>
              </div>
              {recipients.length > 0 && (
                <ul className="mt-4 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
                  {recipients.map((recipient) => {
                    const link = new URL(
                      recipient.path,
                      typeof window === "undefined"
                        ? "http://localhost"
                        : window.location.origin,
                    ).toString();
                    return (
                      <li
                        key={recipient.id}
                        className="flex items-center justify-between gap-3 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {recipient.name}
                          </p>
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-[10px] font-medium text-[#927d57] hover:text-[#17264b]"
                          >
                            Mở thiệp ↗
                          </a>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            disabled={busy !== ""}
                            onClick={() => copyRecipientLink(recipient.path)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            aria-label={`Sao chép link của ${recipient.name}`}
                          >
                            Sao chép
                          </button>
                          <button
                            type="button"
                            disabled={busy !== ""}
                            onClick={() => deleteRecipientLink(recipient)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            aria-label={`Xóa link của ${recipient.name}`}
                          >
                            {busy === `recipient-${recipient.id}`
                              ? "Đang xóa…"
                              : "Xóa"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <div className="sticky bottom-3 z-20 flex items-center justify-between gap-4 rounded-2xl border border-[#e9e6de] bg-white/95 p-3 shadow-[0_12px_35px_rgba(27,38,61,.12)] backdrop-blur">
              <p className="hidden pl-2 text-xs text-slate-500 sm:block">
                Lưu sẽ xuất bản ngay lên trang chủ.
              </p>
              <button
                disabled={busy !== ""}
                className="ml-auto rounded-xl bg-[#17264b] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#263963] disabled:opacity-60"
              >
                {busy === "save" ? "Đang lưu…" : "Lưu & xuất bản"}
              </button>
            </div>
          </form>

          <aside className="xl:sticky xl:top-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#927d57]">
                  Live preview
                </p>
                <h2 className="mt-1 font-serif text-lg text-[#17264b]">
                  Mẫu thiệp dọc 9:16
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">Chưa lưu</span>
            </div>
            <div className="max-h-[80vh] overflow-y-auto rounded-[28px] border border-white bg-[#eeedf0] p-1 shadow-[0_20px_60px_rgba(27,38,61,.12)]">
              <GraduationTemplate01 invitation={invitation} preview />
            </div>
          </aside>
        </div>

        <section
          id="guest-wishes"
          className="mt-10 scroll-mt-6 rounded-2xl border border-[#e9e6de] bg-white p-5 shadow-[0_8px_30px_rgba(27,38,61,.035)] sm:p-7"
        >
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#927d57]">
                Moderation
              </p>
              <h2 className="mt-1 font-serif text-2xl text-[#17264b]">
                Lời chúc từ khách mời
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Lời chúc mới luôn ở trạng thái chờ duyệt và chưa hiển thị công
                khai.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setWishFilter("pending");
                  loadWishes("pending");
                }}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${wishFilter === "pending" ? "bg-[#17264b] text-white" : "border border-slate-200 text-slate-600"}`}
              >
                Chờ duyệt ({wishCounts.pending})
              </button>
              <button
                type="button"
                onClick={() => {
                  setWishFilter("approved");
                  loadWishes("approved");
                }}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${wishFilter === "approved" ? "bg-[#17264b] text-white" : "border border-slate-200 text-slate-600"}`}
              >
                Đã duyệt ({wishCounts.approved})
              </button>
              <button
                type="button"
                onClick={() => loadWishes()}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
                disabled={wishesLoading}
              >
                Làm mới
              </button>
            </div>
          </div>
          {wishesLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Đang tải lời chúc…
            </p>
          ) : wishes.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Chưa có lời chúc trong nhóm này.
            </p>
          ) : (
            <div className="mt-5 grid gap-3">
              {wishes.map((wish) => (
                <article
                  key={wish.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {wish.name}
                      </p>
                      <time className="mt-1 block text-[11px] text-slate-400">
                        {new Date(wish.createdAt).toLocaleString("vi-VN")}
                      </time>
                    </div>
                    <div className="flex gap-2">
                      {wish.status === "pending" && (
                        <button
                          type="button"
                          disabled={busy === `wish-${wish.id}`}
                          onClick={() => updateWishStatus(wish.id, "approved")}
                          className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                        >
                          Duyệt
                        </button>
                      )}
                      {wish.status === "approved" && (
                        <button
                          type="button"
                          disabled={busy === `wish-${wish.id}`}
                          onClick={() => updateWishStatus(wish.id, "pending")}
                          className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-medium text-amber-700 disabled:opacity-50"
                        >
                          Ẩn
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy === `wish-${wish.id}`}
                        onClick={() => deleteWish(wish.id)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {wish.message}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
