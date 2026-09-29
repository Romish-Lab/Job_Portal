import { useState } from "react";

const TONES = [
  "linear-gradient(135deg, #4338ca, #22d3ee)",
  "linear-gradient(135deg, #ffb020, #e0567a)",
  "linear-gradient(135deg, #1e3a8a, #7c3aed)",
  "linear-gradient(135deg, #0d9488, #4338ca)",
];

// Shows the image; if the file is missing, a colorful gradient is shown instead.
export default function Picture({
  src,
  alt,
  className = "",
  tone = 0,
}: {
  src: string;
  alt: string;
  className?: string;
  tone?: number;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`picture ${className}`} style={{ background: TONES[tone % TONES.length] }}>
      {!failed && <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />}
    </div>
  );
}