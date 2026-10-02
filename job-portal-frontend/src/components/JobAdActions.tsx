import { Link } from "react-router-dom";
import { AdState } from "../types";

// Edit is allowed in every state where the ad is NOT live (the server refuses live ads)
const EDITABLE: AdState[] = ["pending_approval", "rejected", "payment_required", "awaiting_payment", "expired"];
const EDIT_LABEL: Partial<Record<AdState, string>> = {
  expired: "Edit & repost",
  rejected: "Edit & resubmit",
};

// The pay / renew / edit buttons for one job. Rendered inside a `.my-job-actions` container.
export default function JobAdActions({ job }: { job: { _id: string; adState?: AdState } }) {
  const state = job.adState;
  if (!state) return null;

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
      {EDITABLE.includes(state) && (
        <Link className="btn-ghost" to={`/jobs/${job._id}/edit`}>
          {EDIT_LABEL[state] ?? "Edit"}
        </Link>
      )}
    </>
  );
}