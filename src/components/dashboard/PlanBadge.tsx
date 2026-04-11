"use client";

import { getPlan } from "@/lib/subscriptions/plans";

interface PlanBadgeProps {
  planSlug: string;
}

export function PlanBadge({ planSlug }: PlanBadgeProps) {
  const plan = getPlan(planSlug);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        background: plan.color + "18",
        color: plan.color,
        border: `1.5px solid ${plan.color}40`,
        borderRadius: "20px",
        padding: "3px 12px",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: plan.color,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {plan.name} Plan
    </span>
  );
}
