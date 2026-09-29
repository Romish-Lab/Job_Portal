import Picture from "./picture";

export default function PageBanner({
  title,
  subtitle,
  image,
}: {
  title: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <section className={image ? "page-banner has-image" : "page-banner"}>
      {image && <Picture className="banner-bg" src={image} alt="" />}
      <div className="banner-inner">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}