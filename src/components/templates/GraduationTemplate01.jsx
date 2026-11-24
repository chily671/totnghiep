"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./graduation-template-01.css";

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
  contactPhone: "",
  closingLine: "",
  secondaryLine: "",
  invitationMessage: "",
  musicUrl: "",
  accentColor: "#C6A45B",
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

function getInvitationDateParts(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return {
    weekday: get("weekday").toLocaleUpperCase("vi-VN"),
    day: get("day"),
    month: get("month"),
    year: get("year"),
    time: `${get("hour")}:${get("minute")}`,
  };
}

function GraduationDateCard({
  eventDate,
  venueName,
  venueAddress,
  mapsUrl,
  contactPhone,
}) {
  const date = getInvitationDateParts(eventDate);

  return (
    <section
      className="grad-date-card grad-reveal"
      aria-label="Thông tin ngày và địa điểm tổ chức"
    >
      <div className="grad-date-card-top">
        <span className="grad-date-card-kicker">THÂN MỜI</span>
        <span className="grad-date-card-time">
          {date ? `${date.time} · ${date.weekday}` : "THỜI GIAN TỔ CHỨC"}
        </span>
      </div>

      <div
        className="grad-date-display"
        aria-label={
          date
            ? `${date.day} tháng ${date.month} năm ${date.year}`
            : "Ngày tổ chức đang cập nhật"
        }
      >
        <span className="grad-date-month">
          {date ? `THÁNG ${date.month}` : "NGÀY"}
        </span>
        <strong className="grad-date-day">{date ? date.day : "--"}</strong>
        <span className="grad-date-year">
          {date ? `NĂM ${date.year}` : "ĐANG CẬP NHẬT"}
        </span>
      </div>

      <div className="grad-date-venue">
        <span className="grad-date-at">TẠI ĐIỂM</span>
        <strong>{venueName || "ĐỊA ĐIỂM ĐANG CẬP NHẬT"}</strong>
        {venueAddress && (
          <span className="grad-date-address">{venueAddress}</span>
        )}
      </div>

      <div className="grad-date-pin" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="presentation">
          <path d="M12 22s8-8.2 8-13A8 8 0 1 0 4 9c0 4.8 8 13 8 13Z" />
          <circle cx="12" cy="9" r="2.7" />
        </svg>
      </div>

      <div className="grad-date-actions">
        <div className="grad-date-action">
          <span className="grad-date-action-label">CHỈ ĐƯỜNG</span>
          {mapsUrl ? (
            <a
              className="grad-date-map-link"
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              XEM BẢN ĐỒ <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className="grad-date-map-hint">ĐANG CẬP NHẬT</span>
          )}
        </div>

        <div className="grad-date-action grad-date-contact">
          <span className="grad-date-action-label">LIÊN HỆ</span>
          {contactPhone ? (
            <a
              className="grad-date-contact-link"
              href={`tel:${contactPhone.replace(/[^+\d]/g, "")}`}
            >
              {contactPhone}
            </a>
          ) : (
            <span className="grad-date-map-hint">0869834020</span>
          )}
        </div>
      </div>
    </section>
  );
}

function isCloudinaryUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function useRevealOnScroll(opened) {
  useEffect(() => {
    if (!opened) return undefined;

    const elements = document.querySelectorAll(".grad-reveal:not(.is-visible)");

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -35px 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [opened]);
}

function GraduationCountdown({ eventDate }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!eventDate) {
      setRemaining(null);
      return undefined;
    }

    const target = new Date(eventDate).getTime();
    if (Number.isNaN(target)) {
      setRemaining(null);
      return undefined;
    }

    const update = () => {
      const distance = target - Date.now();
      if (distance <= 0) {
        setRemaining({ finished: true });
        return;
      }

      setRemaining({
        days: Math.floor(distance / 86400000),
        hours: Math.floor((distance % 86400000) / 3600000),
        minutes: Math.floor((distance % 3600000) / 60000),
        seconds: Math.floor((distance % 60000) / 1000),
      });
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [eventDate]);

  if (!eventDate || !remaining) return null;
  if (remaining.finished) {
    return <p className="grad-countdown-finished">THE DAY HAS ARRIVED</p>;
  }

  const units = [
    ["DAYS", remaining.days],
    ["HOURS", remaining.hours],
    ["MIN", remaining.minutes],
    ["SEC", remaining.seconds],
  ];

  return (
    <div className="grad-countdown">
      {units.map(([label, value]) => (
        <div className="grad-countdown-unit" key={label}>
          <span className="grad-countdown-number" key={`${label}-${value}`}>
            {String(value).padStart(2, "0")}
          </span>
          <span className="grad-countdown-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

function GoldDivider() {
  return (
    <div className="grad-gold-divider" aria-hidden="true">
      <span>✦</span>
    </div>
  );
}

function GraduationWishes({ onSubmitWish }) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedContent = content.trim();

    if (!trimmedName || !trimmedContent) {
      setStatus("Vui lòng nhập tên và nội dung lời chúc.");
      return;
    }

    if (trimmedName.length > 80 || trimmedContent.length > 500) {
      setStatus("Tên tối đa 80 ký tự, lời chúc tối đa 500 ký tự.");
      return;
    }

    if (typeof onSubmitWish !== "function") {
      setStatus("Chức năng gửi lời chúc đang được cập nhật.");
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      await onSubmitWish({
        name: trimmedName,
        message: trimmedContent,
      });

      setName("");
      setContent("");
      setStatus("Lời chúc đã được gửi. Cảm ơn bạn rất nhiều!");
    } catch (error) {
      setStatus(error?.message || "Không thể gửi lời chúc. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="grad-wishes grad-reveal">
      <div className="grad-wishes-heading">
        <span className="grad-wishes-kicker">A NOTE FROM YOU</span>
        <h2>Leave Your Wishes</h2>
        <p>
          Một lời chúc nhỏ của bạn sẽ làm cho ngày đặc biệt này trở nên đáng nhớ
          hơn.
        </p>
      </div>

      <form className="grad-wishes-form" onSubmit={handleSubmit}>
        <label className="grad-wishes-field">
          <span>TÊN CỦA BẠN</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nhập tên của bạn"
            maxLength={80}
            autoComplete="name"
            required
            disabled={busy}
          />
        </label>

        <label className="grad-wishes-field">
          <span>LỜI CHÚC</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Gửi đôi lời chúc mừng đến tân cử nhân..."
            maxLength={500}
            rows={4}
            required
            disabled={busy}
          />
          <span className="grad-wishes-counter">{content.length}/500</span>
        </label>

        <button
          type="submit"
          className="grad-wishes-submit"
          disabled={busy || !onSubmitWish}
        >
          {busy ? "ĐANG GỬI..." : "GỬI LỜI CHÚC"}
          <span aria-hidden="true">✦</span>
        </button>

        {status && (
          <p className="grad-wishes-status" role="status" aria-live="polite">
            {status}
          </p>
        )}
      </form>
    </section>
  );
}

export default function GraduationTemplate01({
  invitation,
  preview = false,
  recipientName = "",
  onSubmitWish,
}) {
  const data = useMemo(
    () => ({ ...EMPTY_INVITATION, ...(invitation || {}) }),
    [invitation],
  );

  const [opened, setOpened] = useState(preview);
  const [opening, setOpening] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  const handleOpenInvitation = async () => {
    try {
      await audioRef.current?.play();
    } catch (error) {
      console.log("Không thể phát nhạc:", error);
    }

    setIsOpened(true);
  };

  useRevealOnScroll(opened);

  // Keep the opening cover fixed to the viewport; the long invitation page
  // must not be scrollable until the guest opens the invitation.
  useEffect(() => {
    if (opened) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousOverscroll =
      document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overscrollBehavior = previousOverscroll;
    };
  }, [opened]);

  useEffect(() => {
    if (!opening || opened) return undefined;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timer = window.setTimeout(
      () => setOpened(true),
      reducedMotion ? 0 : 1050,
    );
    return () => window.clearTimeout(timer);
  }, [opening, opened]);

  const logoImage = isCloudinaryUrl(data.logoImage) ? data.logoImage : "";
  const heroImage = isCloudinaryUrl(data.heroImage) ? data.heroImage : "";
  const musicUrl = isCloudinaryUrl(data.musicUrl) ? data.musicUrl : "";
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
    <main className="grad-page" style={{ "--grad-gold": accentColor }}>
      <article className={`grad-card ${opened ? "grad-card--opened" : ""}`}>
        <div className="grad-card-grain" aria-hidden="true" />

        <header className="grad-header">
          <div className="grad-university-lockup">
            {logoImage ? (
              <img
                src={logoImage}
                alt={
                  data.universityName
                    ? `Logo ${data.universityName}`
                    : "University logo"
                }
                className="grad-university-logo"
              />
            ) : (
              <div className="grad-logo-placeholder" aria-hidden="true">
                ✦
              </div>
            )}
            <div className="grad-university-name">
              {data.universityName}
              {data.city && <span>{data.city}</span>}
            </div>
          </div>

          {data.universityEnglish && (
            <h1 className="grad-title grad-reveal">{data.universityEnglish}</h1>
          )}
          {data.universityScript && (
            <p className="grad-script grad-reveal">{data.universityScript}</p>
          )}
          {data.city && <p className="grad-city grad-reveal">{data.city}</p>}
          <GoldDivider />
        </header>

        {data.graduateName && (
          <aside
            className="grad-ribbon"
            aria-label={`Graduate: ${data.graduateName}`}
          >
            <span className="grad-ribbon-inner">
              <span className="grad-ribbon-name">{data.graduateName}</span>
              {data.faculty && (
                <span className="grad-ribbon-faculty">{data.faculty}</span>
              )}
            </span>
          </aside>
        )}

        <section className="grad-hero grad-reveal">
          <div className="grad-photo-frame">
            {heroImage ? (
              <img
                src={heroImage}
                alt={
                  data.graduateName
                    ? `Ảnh tốt nghiệp của ${data.graduateName}`
                    : "Ảnh tốt nghiệp"
                }
                className="grad-hero-image"
                fetchPriority="high"
              />
            ) : (
              <div className="grad-photo-placeholder">
                <span>YOUR GRADUATION MOMENT</span>
              </div>
            )}
            <div className="grad-photo-shade" />
            {data.graduationYear && (
              <div className="grad-year">CLASS OF {data.graduationYear}</div>
            )}
            <div className="grad-photo-caption">
              <span>THE BEGINNING OF</span>
              <strong>A NEW CHAPTER</strong>
            </div>
          </div>
        </section>

        <section className="grad-invitation grad-reveal">
          {data.closingLine && (
            <p className="grad-closing">{data.closingLine}</p>
          )}
          {data.secondaryLine && (
            <p className="grad-secondary">{data.secondaryLine}</p>
          )}

          <GoldDivider />

          <p className="grad-eyebrow">YOU ARE CORDIALLY INVITED</p>
          {recipientName && (
            <>
              <p className="grad-recipient-label">TRÂN TRỌNG KÍNH MỜI</p>
              <h2 className="grad-recipient">{recipientName}</h2>
            </>
          )}
          {data.eventTitle && (
            <h3 className="grad-event-title">{data.eventTitle}</h3>
          )}
          {data.graduateName && (
            <p className="grad-graduate-subtitle">{data.graduateName}</p>
          )}

          <GraduationDateCard
            eventDate={data.eventDate}
            venueName={data.venueName}
            venueAddress={data.venueAddress}
            mapsUrl={data.mapsUrl}
            contactPhone={data.contactPhone}
          />

          {data.invitationMessage && (
            <p className="grad-message">{data.invitationMessage}</p>
          )}

          {data.eventDate && (
            <div className="grad-countdown-wrap">
              <p className="grad-countdown-heading">COUNTING DOWN TO THE DAY</p>
              <GraduationCountdown eventDate={data.eventDate} />
            </div>
          )}
        </section>
        <GraduationWishes onSubmitWish={onSubmitWish} />

        <footer className="grad-footer grad-reveal">
          <GoldDivider />
          <p>WITH GRATITUDE & PRIDE</p>
          <span>✦</span>
        </footer>

        {musicUrl && (
          <>
            <audio
              ref={audioRef}
              src="/music/background-music.mp3"
              loop
              preload="auto"
            />
            <button
              type="button"
              onClick={toggleMusic}
              aria-label={musicPlaying ? "Pause music" : "Play music"}
              aria-pressed={musicPlaying}
              className={`grad-music-button ${musicPlaying ? "is-playing" : ""}`}
            >
              <span>{musicPlaying ? "Ⅱ" : "♫"}</span>
            </button>
          </>
        )}

        {!opened && (
          <div className={`grad-cover ${opening ? "grad-cover--opening" : ""}`}>
            <div className="grad-cover-content">
              <div className="grad-cover-emblem">
                {logoImage ? <img src={logoImage} alt="" /> : <span>✦</span>}
              </div>
              <p className="grad-cover-kicker">A MOMENT TO REMEMBER</p>
              <p className="grad-cover-title">
                Graduation
                <br />
                Celebration
              </p>
              <div className="grad-cover-line" />
              <p className="grad-cover-recipient">
                {recipientName
                  ? `PREPARED FOR ${recipientName}`
                  : "A PERSONAL INVITATION"}
              </p>
              {data.invitationMessage && (
                <p className="grad-cover-message">{data.invitationMessage}</p>
              )}
              <button
                type="button"
                onClick={openInvitation}
                className="grad-open-button"
                disabled={opening}
              >
                <span>MỞ THIỆP</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
