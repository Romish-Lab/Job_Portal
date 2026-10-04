// Compact salary text for cards: 1200 -> "1.2k", 12000 -> "12k", 1500000 -> "1.5M".
// (The old Math.round version turned $1.2k-$1.4k into "$1k–1k".)
const trim = (n: number) => String(Math.round(n * 10) / 10);

const compact = (n: number) => {
  if (n >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (n >= 1_000) return `${trim(n / 1_000)}k`;
  return String(n);
};

export function compactSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  // a range only when the two ends differ; otherwise a single figure
  if (min && max && min !== max) return `$${compact(min)}–${compact(max)}`;
  return `$${compact(min || max || 0)}`;
}