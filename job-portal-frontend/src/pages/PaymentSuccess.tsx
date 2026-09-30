import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import client from "../api/client";
import { formatDate } from "../utils/money";

type Phase = "checking" | "paid" | "unconfirmed" | "error";

// Stripe sends the employer back here. We never trust the URL: the server asks
// Stripe whether the session was actually paid before activating anything.
export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [phase, setPhase] = useState<Phase>("checking");
  const [expiry, setExpiry] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setPhase("error");
      setMessage("Missing payment session.");
      return;
    }
    let cancelled = false;
    let tries = 0;

    const check = async () => {
      try {
        const { data } = await client.post("/payments/confirm", { sessionId });
        if (cancelled) return;
        if (data.status === "paid") {
          setExpiry(data.adExpiryDate);
          setPhase("paid");
        } else if (++tries < 8) {
          setTimeout(check, 2000); // payment may still be settling
        } else {
          setPhase("unconfirmed");
        }
      } catch (err: any) {
        if (cancelled) return;
        setMessage(err.response?.data?.message || "Couldn't verify the payment.");
        setPhase("error");
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="page page-narrow">
      {phase === "checking" && <div className="page-loading">Confirming your payment…</div>}
      {phase === "paid" && (
        <>
          <div className="page-header">
            <h1>Payment successful</h1>
            <p className="page-subtitle">Your advertisement is now live.</p>
          </div>
          <div className="form-success">
            Advertisement Active · Expires: {formatDate(expiry)}
          </div>
          <p><Link className="btn-primary" to="/my-jobs">Back to my postings</Link></p>
        </>
      )}
      {phase === "unconfirmed" && (
        <>
          <div className="page-header"><h1>Still processing</h1></div>
          <div className="empty-state">
            We haven't received confirmation from Stripe yet. Your job will go live automatically as soon as the payment
            is confirmed. <Link to="/my-jobs">Check my postings</Link>
          </div>
        </>
      )}
      {phase === "error" && (
        <>
          <div className="form-error">{message}</div>
          <p><Link to="/my-jobs">Back to my postings</Link></p>
        </>
      )}
    </div>
  );
}
