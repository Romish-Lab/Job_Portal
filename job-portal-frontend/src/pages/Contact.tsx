import { FormEvent, useState } from "react";
import PageBanner from "../components/PageBanner";
import client from "../api/client";

const INFO = [
  { icon: "📍", title: "Address", text: "Bhaktapur, Nepal" },
  { icon: "✉️", title: "Email", text: "helptrialhead@gmail.com" },
  { icon: "📞", title: "Phone", text: "+977 9800000000" },
  { icon: "🕘", title: "Opening hours", text: "Sunday to Friday, 9:00 AM to 5:00 PM" },
];

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const { data } = await client.post("/contact", { name, email, subject, message });
      setSuccess(data.message || "Thanks! We will get back to you soon.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't send your message. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageBanner title="Contact us" subtitle="Questions, feedback or partnership ideas? We'd love to hear from you." />

      <div className="content-page">
        <div className="contact-grid">
          <form className="contact-form" onSubmit={onSubmit}>
            <h2>Send us a message</h2>
            {success && <div className="form-success">{success}</div>}
            {error && <div className="form-error">{error}</div>}

            <div className="form-row">
              <label>
                Your name
                <input required value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>
                Email
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
            </div>

            <label>
              Subject
              <input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>

            <label>
              Message
              <textarea
                rows={6}
                required
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>

            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send message"}
            </button>
          </form>

          <div className="contact-info">
            {INFO.map((i) => (
              <div className="contact-item" key={i.title}>
                <div className="info-icon">{i.icon}</div>
                <div>
                  <h3>{i.title}</h3>
                  <p>{i.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}