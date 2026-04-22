"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type CampaignStep = "auswahl" | "review" | "versand";

type Props = {
  activeStep: CampaignStep;
  campaignId?: string;
  /** Decides which Auswahl route the step-1 label links to. */
  origin?: "recipient" | "item";
};

const stepOrder: CampaignStep[] = ["auswahl", "review", "versand"];

const labels: Record<CampaignStep, string> = {
  auswahl: "Auswahl",
  review: "Review",
  versand: "Versand",
};

export function CampaignStepper({ activeStep, campaignId, origin }: Props) {
  const activeIndex = stepOrder.indexOf(activeStep);

  const hrefFor = (step: CampaignStep): string | null => {
    if (step === "auswahl")
      return origin === "item" ? "/kampagnen/neu-aus-item" : "/kampagnen/neu-aus-kontakt";
    if (!campaignId) return null;
    if (step === "review") return `/kampagnen/${campaignId}`;
    return `/kampagnen/${campaignId}/versand`;
  };

  return (
    <nav
      aria-label="Kampagnen-Fortschritt"
      className="mb-6 flex items-center gap-0 overflow-x-auto"
    >
      {stepOrder.map((step, idx) => {
        const isActive = step === activeStep;
        const isCompleted = idx < activeIndex;
        const isFuture = idx > activeIndex;
        const href = isFuture ? null : hrefFor(step);

        const body = (
          <span
            className={cn(
              "flex items-center gap-2 whitespace-nowrap",
              isFuture && "text-zinc-400"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                isActive && "bg-blue-600 text-white",
                isCompleted && "bg-emerald-600 text-white",
                isFuture && "border border-zinc-300 bg-white text-zinc-400"
              )}
            >
              {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                isActive && "text-zinc-900",
                isCompleted && "text-zinc-700"
              )}
            >
              {labels[step]}
            </span>
          </span>
        );

        return (
          <div key={step} className="flex items-center">
            {href ? (
              <Link
                href={href}
                className="rounded-md px-3 py-1.5 transition hover:bg-zinc-100"
              >
                {body}
              </Link>
            ) : (
              <span
                aria-disabled={isFuture || undefined}
                className={cn(
                  "px-3 py-1.5",
                  isFuture && "cursor-not-allowed"
                )}
              >
                {body}
              </span>
            )}
            {idx < stepOrder.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px w-6 shrink-0 md:w-12",
                  isCompleted ? "bg-emerald-300" : "bg-zinc-200"
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
