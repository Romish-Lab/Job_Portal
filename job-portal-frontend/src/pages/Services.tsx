import PageBanner from "../components/PageBanner";
import CtaBand from "../components/CtaBand";

const FOR_SEEKERS = [
  {
    icon: "🔎",
    title: "Smart job search",
    text: "Filter open roles by title, company, category and location.",
  },
  {
    icon: "📄",
    title: "Easy applications",
    text: "Upload your resume and add a cover letter in a single step.",
  },
  {
    icon: "📊",
    title: "Status tracking",
    text: "See whether each application is pending, reviewed, accepted or not selected.",
  },
];

const FOR_EMPLOYERS = [
  {
    icon: "📢",
    title: "Post jobs in minutes",
    text: "Describe the role, requirements, salary and location, then publish.",
  },
  {
    icon: "🖼️",
    title: "Your company brand",
    text: "Upload your logo so your postings stand out in the job list.",
  },
  {
    icon: "✅",
    title: "Review applicants",
    text: "Read cover letters, open resumes and update each candidate's status.",
  },
];

export default function Services() {
  return (
    <>
      <PageBanner
        title="Our services"
        subtitle="Everything you need to find a job or hire someone, in one place."
      />

      <div className="content-page">
        <section>
          <h2>For job seekers</h2>
          <div className="card-grid">
            {FOR_SEEKERS.map((s) => (
              <div className="info-card" key={s.title}>
                <div className="info-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>For employers</h2>
          <div className="card-grid">
            {FOR_EMPLOYERS.map((s) => (
              <div className="info-card" key={s.title}>
                <div className="info-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <CtaBand />
      </div>
    </>
  );
}
