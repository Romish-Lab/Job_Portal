import { Link } from "react-router-dom";

export default function CtaBand() {
  return (
    <section className="cta-band">
      <h2>Ready to get started?</h2>
      <p>Create a free account as a candidate or as an employer.</p>
      <div className="cta-actions">
        <Link className="btn-signup" to="/register">
          Create an account
        </Link>
        <Link className="btn-login" to="/">
          Browse jobs
        </Link>
      </div>
    </section>
  );
}