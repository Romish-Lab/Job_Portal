import { Link } from "react-router-dom";
import { AdState } from "../types";
import { formatDate } from "../utils/money";

// Edit is allowed in every state where the ad is NOT live (the server refuses live ads)
const EDITABLE: AdState[] = ["pending_approval", "rejected", "payment_required", "awaiting_payment", "expired"];
const EDIT_LABEL: Partial<Record<AdState, string>> = {
  expired: "Edit & repost",
  rejected: "Edit & resubmit",
};

// The pay / renew / edit buttons for one job. Rendered inside a `.my-job-actions` container.
export default function JobAdActions({
  job,
}: {
  job: { _id: string; adState?: AdState; hotJobExpiryDate?: string | null };
}) {
  const state = job.adState;
  if (!state) return null;
  const isHot = !!job.hotJobExpiryDate && new Date(job.hotJobExpiryDate).getTime() > Date.now();

  return (
    <>
      {(state === "payment_required" || state === "awaiting_payment") && (
        <Link className="btn-primary-sm" to={`/jobs/${job._id}/advertise`}>
          Pay for Advertisement
        </Link>
      )}
      {state === "expired" && (
        <Link className="btn-primary-sm" to={`/jobs/${job._id}/advertise`}>
          Renew ad
        </Link>
      )}
      {(state === "active" || state === "expiring_soon") &&
        (isHot ? (
          <span className="ad-note ad-note--ok">Hot Jobs promotion · until {formatDate(job.hotJobExpiryDate)}</span>
        ) : (
          <Link className="btn-primary-sm" to={`/jobs/${job._id}/promote`}>
            Promote job
          </Link>
        ))}
      {EDITABLE.includes(state) && (
        <Link className="btn-ghost" to={`/jobs/${job._id}/edit`}>
          {EDIT_LABEL[state] ?? "Edit"}
        </Link>
      )}
    </>
  );
}