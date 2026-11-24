"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const EMPTY_INVITATION = Object.freeze({
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
});

function formatEventDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function isCloudinaryImageUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function isCloudinaryMediaUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function GraduationCountdown({ eventDate }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!eventDate) return;
    const target = new Date(eventDate).getTime();
    if (Number.isNaN(target)) return;
    let timer;
    const update = () => {
      const distance = target - Date.now();
      if (distance <= 0) {
        setRemaining({ finished: true });
        window.clearInterval(timer);
        return;
      }
      setRemaining({
        days: Math.floor(distance / 86400000),
        hours: Math.floor((distance % 86400000) / 3600000),
        minutes: Math.floor((distance % 3600000) / 60000),
        seconds: Math.floor((distance % 60000) / 1000),
      });
    };

    const firstUpdate = window.setTimeout(update, 0);
    timer = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(firstUpdate);
      window.clearInterval(timer);
    };
  }, [eventDate]);

  if (!eventDate || !remaining) return null;
  if (remaining.finished) {
    return <p className="text-center text-xs tracking-[0.22em] text-slate-600">THE DAY HAS ARRIVED</p>;
  }

  const units = [
    ["DAYS", remaining.days],
    ["HOURS", remaining.hours],
    ["MIN", remaining.minutes],
    ["SEC", remaining.seconds],
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {units.map(([label, value]) => (
        <div key={label} className="border border-slate-200/80 bg-white/65 px-1 py-3 text-center">
          <div className="font-serif text-xl leading-none text-slate-800 tabular-nums">
            {String(value).padStart(2, "0")}
          </div>
          <div className="mt-2 text-[8px] tracking-[0.18em] text-slate-500">{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function GraduationTemplate01({
  invitation,
  preview = false,
  recipientName = "",
}) {
  const data = useMemo(
    () => ({ ...EMPTY_INVITATION, ...(invitation || {}) }),
    [invitation]
  );
  const [opened, setOpened] = useState(preview);
  const [opening, setOpening] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!opening || opened) return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 50
      : 900;
    const timer = window.setTimeout(() => setOpened(true), delay);
    return () => window.clearTimeout(timer);
  }, [opened, opening]);

  const logoImage = isCloudinaryImageUrl(data.logoImage) ? data.logoImage : "";
  const heroImage = isCloudinaryImageUrl(data.heroImage) ? data.heroImage : "";
  const musicUrl = isCloudinaryMediaUrl(data.musicUrl) ? data.musicUrl : "";
  const accentColor = /^#[0-9A-Fa-f]{6}$/.test(data.accentColor)
    ? data.accentColor
    : EMPTY_INVITATION.accentColor;

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio || !musicUrl) return;

    try {
      if (musicPlaying) {
        audio.pause();
        setMusicPlaying(false);
      } else {
        await audio.play();
        setMusicPlaying(true);
      }
    } catch (error) {
      console.error("Unable to play invitation music:", error);
    }
  };

  const openInvitation = () => setOpening(true);

  return (
    <main
      className="w-full overflow-x-hidden bg-[#eeedf0] px-2 py-3 sm:px-5 sm:py-6"
      style={{ "--grad-navy": accentColor }}
    >
      <div className="invitation-paper relative mx-auto min-h-[calc(100svh-24px)] w-full max-w-[520px] overflow-hidden border border-white/90 bg-[#fffefa] shadow-[0_12px_55px_rgba(20,28,50,0.12)] sm:min-h-[900px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent 0px, transparent 90px, rgba(223,224,230,.26) 91px, transparent 93px)",
          }}
        />

        <header className="invitation-enter relative z-10 flex min-h-[112px] items-center justify-center px-5 pb-3 pt-5 sm:min-h-[150px]">
          <div className="flex max-w-[82%] items-center justify-center gap-3">
            {logoImage ? (
              // Cloudinary delivery is validated before rendering.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoImage}
                alt={data.universityName ? `Logo ${data.universityName}` : "University logo"}
                className="h-12 w-16 object-contain sm:h-16 sm:w-20"
              />
            ) : (
              <div className="h-12 w-16 sm:h-16 sm:w-20" aria-hidden="true" />
            )}
            <div className="max-w-[190px] text-[10px] font-medium uppercase leading-[1.25] tracking-[0.04em] text-slate-800 sm:max-w-[230px] sm:text-[13px]">
              {data.universityName}
              {data.city && (
                <span className="mt-1 block text-[8px] tracking-[0.08em] text-slate-500 sm:text-[10px]">
                  {data.city}
                </span>
              )}
            </div>
          </div>
        </header>

        <section className="invitation-enter relative z-10 mx-auto max-w-[90%] pb-4 text-center [animation-delay:120ms]">
          {data.universityEnglish && (
            <p className="font-serif text-[34px] font-bold uppercase leading-[0.95] tracking-[0.06em] text-[#343650] sm:text-[48px]">
              {data.universityEnglish}
            </p>
          )}
          {data.universityScript && (
            <p className="mt-[-1px] font-serif text-[24px] italic leading-tight text-[#252941] sm:text-[34px]">
              {data.universityScript}
            </p>
          )}
        </section>

        {data.graduateName && (
          <aside className="invitation-ribbon absolute left-[3.5%] top-0 z-30 h-[39%] w-[22%] max-w-[116px] min-w-[78px]">
            <div
              className="relative flex h-full w-full justify-center border-x-[5px] border-b-[5px] border-white bg-[var(--grad-navy)] shadow-[0_5px_14px_rgba(10,20,45,.25)]"
              style={{ clipPath: "polygon(0 0,100% 0,100% 88%,50% 100%,0 88%)" }}
            >
              <div className="absolute inset-[5px] border border-white/80" style={{ clipPath: "polygon(0 0,100% 0,100% 87%,50% 99%,0 87%)" }} />
              <div className="relative z-10 flex h-[83%] items-center justify-center px-1 pt-3">
                <span
                  className="font-serif text-[15px] font-medium uppercase tracking-[0.16em] text-white sm:text-[19px]"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  {data.graduateName}
                </span>
              </div>
              {data.faculty && (
                <div className="absolute bottom-[13%] z-10 max-w-[78%] text-center text-[5px] uppercase leading-tight tracking-[0.08em] text-white/80 sm:text-[6px]">
                  {data.faculty}
                </div>
              )}
            </div>
          </aside>
        )}

        <section className="relative z-10 mx-auto w-[88%]">
          <div className="invitation-photo relative aspect-[9/16] overflow-hidden rounded-[24px] bg-slate-200 sm:rounded-[30px]">
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImage}
                alt={data.graduateName ? `Ảnh tốt nghiệp của ${data.graduateName}` : "Ảnh tốt nghiệp"}
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-slate-200 via-stone-100 to-slate-300" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5" />
            {data.graduationYear && (
              <div className="absolute bottom-4 right-4 rounded-full border border-white/70 bg-white/65 px-3 py-1 text-[8px] tracking-[0.12em] text-slate-700 backdrop-blur-sm">
                CLASS OF {data.graduationYear}
              </div>
            )}
          </div>
        </section>

        <footer className="invitation-enter relative z-10 px-5 pb-5 pt-3 text-center [animation-delay:240ms]">
          {data.closingLine && (
            <p className="font-serif text-[12px] uppercase tracking-[0.06em] text-slate-800 sm:text-sm">
              {data.closingLine}
            </p>
          )}
          {data.secondaryLine && (
            <p className="mt-1 text-[8px] tracking-[0.18em] text-slate-400">{data.secondaryLine}</p>
          )}
        </footer>

        <section className="invitation-enter relative z-10 mx-auto w-[88%] border-t border-slate-200/80 px-2 py-10 [animation-delay:340ms]">
          <div className="text-center">
            <p className="text-[9px] tracking-[0.28em] text-slate-500">YOU ARE CORDIALLY INVITED</p>
            {recipientName && (
              <>
                <p className="mt-3 text-[9px] tracking-[0.2em] text-slate-500">TRÂN TRỌNG KÍNH MỜI</p>
                <p className="mt-1 font-serif text-lg text-[#343650]">{recipientName}</p>
              </>
            )}
            {data.eventTitle && <h2 className="mt-3 font-serif text-2xl text-[#343650] sm:text-3xl">{data.eventTitle}</h2>}
            {data.graduateName && <p className="mt-2 text-sm text-slate-600">{data.graduateName}</p>}
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 text-center">
            <div className="border border-slate-200 bg-white/70 p-4">
              <p className="text-[9px] tracking-[0.2em] text-slate-400">DATE & TIME</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-700">
                {formatEventDate(data.eventDate) || "Đang cập nhật"}
              </p>
            </div>
            <div className="border border-slate-200 bg-white/70 p-4">
              <p className="text-[9px] tracking-[0.2em] text-slate-400">LOCATION</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-700">{data.venueName || "Đang cập nhật"}</p>
            </div>
          </div>

          {data.venueAddress && (
            <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">{data.venueAddress}</p>
          )}
          {data.mapsUrl && (
            <a
              href={data.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mx-auto mt-4 flex w-fit items-center gap-2 border border-[#17264b] px-5 py-2.5 text-[9px] tracking-[0.16em] text-[#17264b] transition hover:bg-[#17264b] hover:text-white"
            >
              VIEW LOCATION ↗
            </a>
          )}

          <div className="mx-auto mt-9 max-w-[330px]">
            <p className="mb-4 text-center text-[9px] tracking-[0.25em] text-slate-500">COUNTING DOWN TO THE DAY</p>
            <GraduationCountdown eventDate={data.eventDate} />
          </div>
        </section>

        {musicUrl && (
          <>
            <audio ref={audioRef} src={musicUrl} loop preload="none" />
            <button
              type="button"
              onClick={toggleMusic}
              aria-label={musicPlaying ? "Pause music" : "Play music"}
              className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-[var(--grad-navy)] text-white shadow-lg transition hover:scale-105"
            >
              {musicPlaying ? "Ⅱ" : "♫"}
            </button>
          </>
        )}

        {!opened && (
          <div
            onTransitionEnd={(event) => {
              if (event.target === event.currentTarget) setOpened(true);
            }}
            className={`invitation-cover absolute inset-0 z-40 flex items-center justify-center bg-[#fffefa]/95 px-8 text-center backdrop-blur-[2px] ${opening ? "invitation-cover--opening" : ""}`}
          >
            <div className="max-w-[300px]">
              <div className="mx-auto mb-6 flex h-24 w-28 items-center justify-center border border-[#17264b]/30 bg-[#f5f3ee] shadow-sm">
                <span className="font-serif text-4xl text-[#17264b]">✉</span>
              </div>
              <p className="text-[9px] tracking-[0.3em] text-slate-500">
                {recipientName ? "A PERSONAL INVITATION FOR" : "A SPECIAL INVITATION"}
              </p>
              {(recipientName || data.graduateName) && (
                <h1 className="mt-3 font-serif text-2xl text-[#343650]">
                  {recipientName || data.graduateName}
                </h1>
              )}
              {data.invitationMessage && (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {data.invitationMessage}
                </p>
              )}
              <button
                type="button"
                onClick={openInvitation}
                className="mt-7 border border-[#17264b] bg-[#17264b] px-7 py-3 text-[10px] tracking-[0.2em] text-white transition hover:bg-transparent hover:text-[#17264b]"
              >
                OPEN INVITATION
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
