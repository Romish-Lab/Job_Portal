import { Link } from "react-router-dom";
import PageBanner from "../components/PageBanner";
import Picture from "../components/Picture";
import { POSTS } from "../Data/blog";

export default function Blog() {
  const [featured, ...rest] = POSTS;

  return (
    <>
      <PageBanner
        title="Career blog"
        subtitle="Advice on resumes, interviews and hiring, from the Trailhead team."
        image="/images/blog-hero.jpg"
      />

      <div className="content-page">
        <Link to={`/blog/${featured.slug}`} className="blog-featured">
          <Picture src={featured.image} alt={featured.title} tone={0} />
          <div className="blog-featured-body">
            <div className="blog-meta">
              <span className="blog-tag">{featured.category}</span>
              <span>{featured.date}</span>
            </div>
            <h2>{featured.title}</h2>
            <p>{featured.excerpt}</p>
            <span className="read-more">Read article →</span>
          </div>
        </Link>

        <div className="blog-grid">
          {rest.map((p, i) => (
            <Link to={`/blog/${p.slug}`} className="blog-card" key={p.slug}>
              <Picture src={p.image} alt={p.title} tone={i + 1} />
              <div className="blog-card-body">
                <div className="blog-meta">
                  <span className="blog-tag">{p.category}</span>
                  <span>{p.readTime}</span>
                </div>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}