import { AdState } from "../types";

const LABELS: Record<AdState, string> = {
  pending_approval: "Pending Approval",
  rejected: "Rejected",
  payment_required: "Payment Required",
  awaiting_payment: "Awaiting Payment",
  active: "Active",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
};

export default function AdStatusBadge({ state }: { state?: AdState }) {
  if (!state) return null;
  return <span className={`status-badge ad-badge ad-${state}`}>{LABELS[state]}</span>;
}
