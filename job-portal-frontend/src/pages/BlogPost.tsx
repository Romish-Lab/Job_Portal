import { Link, useParams } from "react-router-dom";
import Picture from "../components/Picture";
import { POSTS } from "../Data/blog";

export default function BlogPost() {
  const { slug } = useParams();
  const index = POSTS.findIndex((p) => p.slug === slug);
  const post = POSTS[index];

  if (!post) {
    return (
      <div className="post">
        <p>We couldn't find that article.</p>
        <Link to="/blog">← Back to the blog</Link>
      </div>
    );
  }

  return (
    <article className="post">
      <Link to="/blog" className="back-link">
        ← Back to the blog
      </Link>

      <div className="blog-meta">
        <span className="blog-tag">{post.category}</span>
        <span>
          {post.date} · {post.readTime}
        </span>
      </div>
      <h1>{post.title}</h1>

      <Picture className="post-cover" src={post.image} alt={post.title} tone={index} />

      {post.content.map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </article>
  );
}