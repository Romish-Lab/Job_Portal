import CtaBand from "../components/CtaBand";
import Picture from "../components/Picture";
import PageBanner from "../components/PageBanner";

const VALUES = [
  {
    icon: "🎯",
    title: "Simple by design",
    text: "Clean pages and honest listings, so you can focus on the opportunity instead of the interface.",
  },
  {
    icon: "🤝",
    title: "Fair to everyone",
    text: "Candidates and employers get the same clear status updates, and nobody is left guessing.",
  },
  {
    icon: "⚡",
    title: "Fast to use",
    text: "Search, apply and review applicants in a few clicks, on any device.",
  },
];

export default function About() {
  return (
    <>
      <PageBanner
        title="About Trailhead Jobs"
        subtitle="We help people find work they care about, and help employers find the right people."
        image="/images/about.jpg"
      />

      <div className="content-page">
        <section className="split">
          <div>
            <h2>Our story</h2>
            <p>
              Trailhead Jobs started with a simple idea: looking for a job, or
              hiring someone, should not feel like a maze. Too many portals bury
              the useful details under clutter.
            </p>
            <p>
              So we built a straightforward place where employers post clear
              roles, candidates apply with a resume and a cover letter, and
              everyone can see where an application stands.
            </p>
          </div>
          <Picture
            className="split-img"
            src="/uploads/about.jpg"
            alt="Colleagues working together"
            tone={1}
          />
        </section>

        <section>
          <h2>What we value</h2>
          <div className="card-grid">
            {VALUES.map((v) => (
              <div className="info-card" key={v.title}>
                <div className="info-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </section>

        <CtaBand />
      </div>
    </>
  );
}
