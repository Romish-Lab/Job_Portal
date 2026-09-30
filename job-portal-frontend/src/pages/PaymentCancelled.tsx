import { Link, useSearchParams } from "react-router-dom";

export default function PaymentCancelled() {
  const [params] = useSearchParams();
  const jobId = params.get("job");
  return (
    <div className="page page-narrow">
      <div className="page-header">
        <h1>Payment cancelled</h1>
        <p className="page-subtitle">You haven't been charged, and your job is not live yet.</p>
      </div>
      <div className="my-job-actions">
        {jobId && <Link className="btn-primary" to={`/jobs/${jobId}/advertise`}>Try again</Link>}
        <Link className="btn-ghost" to="/my-jobs">My postings</Link>
      </div>
    </div>
  );
}
