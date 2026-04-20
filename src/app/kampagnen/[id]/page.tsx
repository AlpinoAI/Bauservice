"use client";

import { use } from "react";
import { ReviewScreen } from "@/components/review/review-screen";

export default function CampaignReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ReviewScreen campaignId={id} />;
}
