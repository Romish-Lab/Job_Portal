import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../api/client";
import { AdPricing, Job } from "../types";
import { formatMoney } from "../utils/money";

export default function PayForAd() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [pricing, setPricing] = useState<AdPricing | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([client.get(`/jobs/${id}`), client.get("/payments/pricing")])
      .then(([j, p]) => {
        setJob(j.data.job);
        setPricing(p.data);
        // pre-select the middle option
        const tiers = p.data.tiers;
        setDays(tiers[Math.floor(tiers.length / 2)]?.days ?? null);
      })
      .catch((err) => setError(err.response?.data?.message || "Couldn't load this page."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!job || !pricing) return <div className="page"><div className="form-error">{error || "Job not found."}</div></div>;

  const canPay = job.approvalStatus === "approved" || job.approvalStatus === "expired";
  const selected = pricing.tiers.find((t) => t.days === days);

  const onPay = async () => {
    if (!days) return;
    setError("");
    setBusy(true);
    try {
      // Only the job id and the number of days are sent; the server decides the price.
      const { data } = await client.post("/payments/checkout", { jobId: job._id, days });
      window.location.href = data.url; // Stripe-hosted checkout page
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't start the payment.");
      setBusy(false);
    }
  };

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <h1>Advertise “{job.title}”</h1>
        <p className="page-subtitle">Choose how long this job should be visible to candidates.</p>
      </div>

      {error && <div className="form-error">{error}</div>}

      {!canPay ? (
        <div className="empty-state">
          {job.approvalStatus === "pending"
            ? "This job is still waiting for admin approval. You can pay once it's approved."
            : "This job was rejected and can't be advertised."}{" "}
          <Link to="/my-jobs">Back to my postings</Link>
        </div>
      ) : (
        <>
          <div className="ad-tiers">
            {pricing.tiers.map((t) => (
              <label key={t.days} className={`ad-tier${days === t.days ? " ad-tier--selected" : ""}`}>
                <input type="radio" name="duration" checked={days === t.days} onChange={() => setDays(t.days)} />
                <span className="ad-tier-days">{t.days} days</span>
                <span className="ad-tier-price">{formatMoney(t.price, pricing.currency)}</span>
              </label>
            ))}
          </div>

          {selected && (
            <div className="ad-summary">
              <h3>Payment summary</h3>
              <div className="ad-summary-row">
                <span>Job</span>
                <span>{job.title}</span>
              </div>
              <div className="ad-summary-row">
                <span>Advertisement period</span>
                <span>{selected.days} days, starting when payment is confirmed</span>
              </div>
              <div className="ad-summary-row ad-summary-total">
                <span>Total</span>
                <span>{formatMoney(selected.price, pricing.currency)}</span>
              </div>
            </div>
          )}

          <div className="my-job-actions">
            <button className="btn-primary" disabled={busy || !selected} onClick={onPay}>
              {busy ? "Redirecting to Stripe…" : selected ? `Pay ${formatMoney(selected.price, pricing.currency)}` : "Pay"}
            </button>
            <Link className="btn-ghost" to="/my-jobs">Cancel</Link>
          </div>
          <p className="ad-fineprint">Payments are processed securely by Stripe. Card details never touch our servers.</p>
        </>
      )}
    </div>
  );
}
