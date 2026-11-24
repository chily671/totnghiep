"use client";

import { useEffect, useState } from "react";
import GuestInvitationClient from "@/components/GuestInvitationClient";

export default function PublicInvitation() {
  const [invitation, setInvitation] = useState(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/invitation", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Không thể tải thiệp.");
        if (active) setInvitation(result.invitation);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eeedf0] p-6 text-center">
        <p role="alert" className="max-w-md text-sm text-slate-600">{error}</p>
      </main>
    );
  }

  if (invitation === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eeedf0] px-5 py-12">
        <section className="w-full max-w-md border border-white bg-[#fffefa] px-8 py-12 text-center shadow-[0_12px_55px_rgba(20,28,50,0.08)]">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#927d57]">Graduation invitation</p>
          <h1 className="mt-3 font-serif text-2xl text-[#17264b]">Thiệp chưa được xuất bản</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Nội dung thiệp sẽ xuất hiện tại đây sau khi được Admin thiết lập.</p>
        </section>
      </main>
    );
  }

  if (invitation === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eeedf0] text-sm text-slate-500">
        Đang tải thiệp…
      </main>
    );
  }

  return <GuestInvitationClient invitation={invitation} />;
}
