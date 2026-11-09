import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../api/client";
import { AdPricing, Job } from "../types";
import { formatMoney } from "../utils/money";

const PROMOTION_DAYS = 7;

export default function PromoteJob() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [pricing, setPricing] = useState<AdPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([client.get(`/jobs/${id}`), client.get("/payments/pricing")])
      .then(([jobResponse, pricingResponse]) => {
        setJob(jobResponse.data.job);
        setPricing(pricingResponse.data);
      })
      .catch((err) => setError(err.response?.data?.message || "Couldn't load this page."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!job || !pricing) {
    return <div className="page"><div className="form-error">{error || "Job not found."}</div></div>;
  }

  const tier = pricing.tiers.find((price) => price.days === PROMOTION_DAYS);
  const isLive =
    job.approvalStatus === "approved" &&
    job.paymentStatus === "paid" &&
    job.isActive &&
    !!job.adExpiryDate &&
    new Date(job.adExpiryDate).getTime() > Date.now();
  const isAlreadyPromoted =
    !!job.hotJobExpiryDate && new Date(job.hotJobExpiryDate).getTime() > Date.now();

  const onPromote = async () => {
    setError("");
    setBusy(true);
    try {
      const { data } = await client.post("/payments/hot-checkout", { jobId: job._id });
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't start the promotion payment.");
      setBusy(false);
    }
  };

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <h1>Promote “{job.title}”</h1>
        <p className="page-subtitle">
          Get priority placement in Hot Jobs for up to 7 days while your advertisement is active.
        </p>
      </div>

      {error && <div className="form-error">{error}</div>}

      {!isLive ? (
        <div className="empty-state">
          This job must be live before it can be promoted. <Link to="/my-jobs">Back to my postings</Link>
        </div>
      ) : isAlreadyPromoted ? (
        <div className="empty-state">
          This job is already promoted until {new Date(job.hotJobExpiryDate!).toLocaleDateString()}.{" "}
          <Link to="/my-jobs">Back to my postings</Link>
        </div>
      ) : !tier ? (
        <div className="empty-state">
          Hot Jobs promotion is unavailable because a 7-day ad price is not configured. Please contact the site
          administrator. <Link to="/my-jobs">Back to my postings</Link>
        </div>
      ) : (
        <>
          <div className="ad-summary">
            <h3>Hot Jobs promotion</h3>
            <div className="ad-summary-row">
              <span>Job</span>
              <span>{job.title}</span>
            </div>
            <div className="ad-summary-row">
              <span>Priority placement</span>
              <span>Up to 7 days in Hot Jobs while this job is active</span>
            </div>
            <div className="ad-summary-row ad-summary-total">
              <span>Total</span>
              <span>{formatMoney(tier.price, pricing.currency)}</span>
            </div>
          </div>
          <div className="my-job-actions">
            <button className="btn-primary" disabled={busy} onClick={onPromote}>
              {busy ? "Redirecting to Stripe…" : `Promote for ${formatMoney(tier.price, pricing.currency)}`}
            </button>
            <Link className="btn-ghost" to="/my-jobs">Cancel</Link>
          </div>
          <p className="ad-fineprint">
            Promotion begins when payment is confirmed. Payments are processed securely by Stripe.
          </p>
        </>
      )}
    </div>
  );
}
