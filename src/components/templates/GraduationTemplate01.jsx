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

export default function GraduationTemplate01({
  invitation,
  preview = false,
  recipientName = "",
}) {
  const data = useMemo(
    () => ({ ...EMPTY_INVITATION, ...(invitation || {}) }),
    [invitation],
  );

  const [opened, setOpened] = useState(preview);
  const [opening, setOpening] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  useRevealOnScroll(opened);

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

          <div className="grad-event-details">
            <div className="grad-detail">
              <span className="grad-detail-label">DATE & TIME</span>
              <span className="grad-detail-value">
                {formatEventDate(data.eventDate) || "Đang cập nhật"}
              </span>
            </div>
            <div className="grad-detail">
              <span className="grad-detail-label">LOCATION</span>
              <span className="grad-detail-value">
                {data.venueName || "Đang cập nhật"}
              </span>
            </div>
          </div>

          {data.venueAddress && (
            <p className="grad-address">{data.venueAddress}</p>
          )}
          {data.mapsUrl && (
            <a
              href={data.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="grad-map-link"
            >
              VIEW LOCATION <span aria-hidden="true">↗</span>
            </a>
          )}

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

        <footer className="grad-footer grad-reveal">
          <GoldDivider />
          <p>WITH GRATITUDE & PRIDE</p>
          <span>✦</span>
        </footer>

        {musicUrl && (
          <>
            <audio ref={audioRef} src={musicUrl} loop preload="none" />
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
                <span>OPEN INVITATION</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
