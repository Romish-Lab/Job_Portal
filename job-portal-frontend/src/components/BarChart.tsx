interface Bar {
  label: string;
  value: number;
}

interface Props {
  title: string;
  data: Bar[];
  format?: (n: number) => string;
}

// Dependency-free bar chart (CSS only)
export default function BarChart({ title, data, format = (n) => String(n) }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const empty = data.every((d) => d.value === 0);

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <div className="bar-chart" role="img" aria-label={title}>
        {data.map((d) => (
          <div className="bar-col" key={d.label} title={`${d.label}: ${format(d.value)}`}>
            <span className="bar-value">{format(d.value)}</span>
            <div className="bar-track">
              <div className="bar" style={{ height: `${(d.value / max) * 100}%` }} />
            </div>
            <span className="bar-label">{d.label}</span>
          </div>
        ))}
      </div>
      {empty && <p className="chart-empty">No data yet</p>}
    </div>
  );
}
