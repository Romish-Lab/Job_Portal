import { Link } from "react-router-dom";
import PageBanner from "../components/PageBanner";

const FAQS = [
  {
    q: "How do I create an account?",
    a: "Click Sign Up, choose whether you are looking for a job or hiring, and fill in the form. Employers can also add a company name.",
  },
  {
    q: "How do I apply for a job?",
    a: "Log in as a candidate, open a job from the home page, attach your resume and, if you like, write a cover letter. Then press Submit application.",
  },
  {
    q: "Which resume files can I upload?",
    a: "PDF, DOC and DOCX files up to 5 MB.",
  },
  {
    q: "How do I check my application status?",
    a: "Open My applications from the top menu. Each application shows whether it is pending, reviewed, accepted or not selected and you'll get an email when the status changes.",
  },
  {
    q: "How do I post a job?",
    a: "Log in as an employer and choose Post a job. You can add a company logo (PNG, JPG or WEBP up to 2 MB) along with the role details.",
  },
  {
    q: "Why can't I apply to a job?",
    a: "Only candidate accounts can apply. If you are logged in as an employer, create a separate candidate account to apply for roles.",
  },
];

export default function Help() {
  return (
    <>
      <PageBanner
        title="Help centre"
        subtitle="Quick answers to the questions we hear most."
      />

      <div className="content-page">
        <div className="faq">
          {FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>

        <p className="help-more">
          Still stuck? <Link to="/contact">Contact us</Link> and we will help.
        </p>
      </div>
    </>
  );
}
