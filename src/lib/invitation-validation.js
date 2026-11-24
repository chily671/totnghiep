const FIELD_LIMITS = {
  universityName: 160,
  universityEnglish: 100,
  universityScript: 100,
  city: 100,
  graduateName: 100,
  faculty: 160,
  heroImage: 2048,
  logoImage: 2048,
  eventDate: 64,
  eventTitle: 160,
  venueName: 200,
  venueAddress: 300,
  mapsUrl: 2048,
  closingLine: 180,
  secondaryLine: 120,
  invitationMessage: 1000,
  musicUrl: 2048,
  accentColor: 7,
  graduationYear: 4,
};

const URL_FIELDS = ["heroImage", "logoImage", "mapsUrl", "musicUrl"];
const CLOUDINARY_FIELDS = ["heroImage", "logoImage", "musicUrl"];

function isHttpsUrl(value) {
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function validateInvitation(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Dữ liệu thiệp không hợp lệ." };
  }

  const invitation = {};
  for (const [field, maxLength] of Object.entries(FIELD_LIMITS)) {
    const value = input[field] ?? "";
    if (typeof value !== "string" || value.length > maxLength) {
      return { error: `Trường ${field} không hợp lệ hoặc quá dài.` };
    }
    invitation[field] = value.trim();
  }

  for (const field of URL_FIELDS) {
    const value = invitation[field];
    if (value && !isHttpsUrl(value)) {
      return { error: `Liên kết ${field} phải dùng HTTPS.` };
    }
  }

  for (const field of CLOUDINARY_FIELDS) {
    const value = invitation[field];
    if (value && new URL(value).hostname !== "res.cloudinary.com") {
      return { error: `${field} phải là URL Cloudinary.` };
    }
  }

  if (invitation.eventDate && Number.isNaN(Date.parse(invitation.eventDate))) {
    return { error: "Ngày giờ sự kiện không hợp lệ." };
  }
  if (invitation.accentColor && !/^#[0-9a-fA-F]{6}$/.test(invitation.accentColor)) {
    return { error: "Màu nhấn phải có định dạng hex #RRGGBB." };
  }
  if (invitation.graduationYear && !/^\d{4}$/.test(invitation.graduationYear)) {
    return { error: "Năm tốt nghiệp phải gồm 4 chữ số." };
  }

  return { invitation };
}
