import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import GuestInvitationClient from "@/components/GuestInvitationClient";
import { normalizeRecipientName } from "@/lib/invitation-recipients";
import {
  invitationRecipientsCollection,
  invitationsCollection,
} from "@/lib/mongodb";
import { connection } from "next/server";

export async function generateMetadata() {
  return {
    title: "Thiệp mời tốt nghiệp",
    robots: { index: false, follow: false },
  };
}

function InvitationLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eeedf0] text-sm text-slate-500">
      Đang tải thiệp…
    </main>
  );
}

export default function RecipientInvitationPage({ params }) {
  return (
    <Suspense fallback={<InvitationLoading />}>
      <RecipientInvitationDetails params={params} />
    </Suspense>
  );
}

async function RecipientInvitationDetails({ params }) {
  // Yêu cầu Next.js render tại thời điểm có request
  await connection();

  const { slug, token } = await params;

  const [recipients, invitations] = await Promise.all([
    invitationRecipientsCollection(),
    invitationsCollection(),
  ]);

  const [recipient, invitation] = await Promise.all([
    recipients.findOne({ token }, { projection: { name: 1, slug: 1 } }),
    invitations.findOne(
      { _id: "template-01", published: true },
      { projection: { _id: 0, published: 0, updatedAt: 0 } },
    ),
  ]);

  if (!recipient || !invitation) notFound();

  const canonicalSlug =
    recipient.slug || normalizeRecipientName(recipient.name);

  if (slug !== canonicalSlug) {
    permanentRedirect(
      `/invite/${encodeURIComponent(canonicalSlug)}/${encodeURIComponent(token)}`,
    );
  }

  return (
    <GuestInvitationClient
      invitation={invitation}
      recipientName={recipient.name}
      recipientToken={token}
    />
  );
}
