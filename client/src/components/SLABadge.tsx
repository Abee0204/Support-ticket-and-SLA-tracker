import { SLAStatus } from "../types";

interface SLABadgeProps {
  status: SLAStatus;
}

const badgeStyles: Record<SLAStatus, string> = {
  ON_TRACK: "bg-green-100 text-green-800",
  AT_RISK: "bg-yellow-100 text-yellow-800",
  BREACHED: "bg-red-100 text-red-800",
};

const badgeLabels: Record<SLAStatus, string> = {
  ON_TRACK: "On Track",
  AT_RISK: "At Risk",
  BREACHED: "Breached",
};

export default function SLABadge({ status }: SLABadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[status]}`}
    >
      {badgeLabels[status]}
    </span>
  );
}
