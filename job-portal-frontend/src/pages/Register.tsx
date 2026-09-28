import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Extract<UserRole, "candidate" | "employer">>("candidate");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ name, email, password, role, company: role === "employer" ? company : undefined });
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Create your account</h1>
        <p className="auth-subtitle">Join as a candidate looking for work, or an employer hiring.</p>

        {error && <div className="form-error">{error}</div>}

        <div className="role-toggle">
          <button
            type="button"
            className={role === "candidate" ? "role-option active" : "role-option"}
            onClick={() => setRole("candidate")}
          >
            I'm looking for a job
          </button>
          <button
            type="button"
            className={role === "employer" ? "role-option active" : "role-option"}
            onClick={() => setRole("employer")}
          >
            I'm hiring
          </button>
        </div>

        <label>
          Full name
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {role === "employer" && (
          <label>
            Company name
            <input value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>
        )}

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
