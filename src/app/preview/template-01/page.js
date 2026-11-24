import GraduationTemplate01 from "@/components/templates/GraduationTemplate01";

const SAMPLE_INVITATION = Object.freeze({
  universityName: "TRƯỜNG ĐẠI HỌC MẪU",
  universityEnglish: "UNIVERSITY",
  universityScript: "Graduation",
  city: "TP. HỒ CHÍ MINH",
  graduateName: "NGUYỄN ANH THƯ",
  faculty: "KHOA CÔNG NGHỆ THÔNG TIN",
  heroImage:
    "https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,w_900,h_1250,q_auto,f_auto/cld-sample.jpg",
  logoImage:
    "https://res.cloudinary.com/demo/image/upload/c_pad,w_180,h_180,q_auto,f_auto/cloudinary_icon.png",
  eventDate: "2027-01-15T08:00:00+07:00",
  eventTitle: "LỄ TỐT NGHIỆP",
  venueName: "Hội trường Trường Đại học Mẫu",
  venueAddress: "Khu phố 6, phường Linh Trung, TP. Thủ Đức",
  mapsUrl: "https://maps.google.com/",
  closingLine: "EVERY END IS A NEW BEGINNING",
  invitationMessage: "Trân trọng kính mời bạn đến chung vui trong ngày tốt nghiệp.",
  musicUrl: "",
  accentColor: "#17264b",
  graduationYear: "2027",
});

export default function Template01PreviewPage() {
  return <GraduationTemplate01 invitation={SAMPLE_INVITATION} />;
}