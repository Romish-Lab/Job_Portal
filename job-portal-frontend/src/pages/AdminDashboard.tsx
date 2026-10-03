import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import BarChart from "../components/BarChart";
import { formatMoney } from "../utils/money";

interface Point {
  label: string;
  value: number;
}
interface Stats {
  totals: {
    users: number;
    suspendedUsers: number;
    pendingJobs: number;
    activeAds: number;
    paidAds: number;
    applications: number;
    unreadMessages: number;
    messages: number;
    revenue: Record<string, number>;
  };
  charts: {
    revenueCurrency: string;
    revenueByMonth: Point[];
    signupsByMonth: Point[];
    usersByRole: Point[];
    jobsByStatus: Point[];
  };
}

const REPORTS = [
  { value: "users", label: "Users" },
  { value: "jobs", label: "Jobs" },
  { value: "payments", label: "Payments / revenue" },
  { value: "applications", label: "Applications" },
  { value: "messages", label: "Contact messages" },
  { value: "audit", label: "Audit log" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [report, setReport] = useState("users");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    client
      .get("/admin/stats")
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.response?.data?.message || "Couldn't load dashboard."));
  }, []);

  const download = async () => {
    setDownloading(true);
    setError("");
    try {
      const { data } = await client.get(`/admin/reports/${report}`, {
        params: { from: from || undefined, to: to || undefined },
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Couldn't download the report.");
    } finally {
      setDownloading(false);
    }
  };

  if (error && !stats) return <div className="page"><div className="form-error">{error}</div></div>;
  if (!stats) return <div className="page-loading">Loading…</div>;

  const { totals, charts } = stats;
  const revenueText = Object.keys(totals.revenue).length
    ? Object.entries(totals.revenue).map(([c, a]) => formatMoney(a, c)).join(", ")
    : "—";

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin dashboard</h1>
        <p className="page-subtitle">Platform overview and reports.</p>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="admin-stats">
        <div className="dashboard-stat"><span>Total users</span><strong>{totals.users}</strong></div>
        <Link to="/admin/jobs" className="dashboard-stat stat-link">
          <span>Jobs pending approval</span><strong>{totals.pendingJobs}</strong>
        </Link>
        <div className="dashboard-stat"><span>Active ads</span><strong>{totals.activeAds}</strong></div>
        <div className="dashboard-stat"><span>Revenue</span><strong>{revenueText}</strong></div>
        <Link to="/admin/messages" className="dashboard-stat stat-link">
          <span>Unread messages</span><strong>{totals.unreadMessages}</strong>
        </Link>
        <div className="dashboard-stat"><span>Applications</span><strong>{totals.applications}</strong></div>
        <Link to="/admin/users" className="dashboard-stat stat-link">
          <span>Suspended users</span><strong>{totals.suspendedUsers}</strong>
        </Link>
        <div className="dashboard-stat"><span>Paid ads (all time)</span><strong>{totals.paidAds}</strong></div>
      </div>

      <div className="chart-grid">
        <BarChart
          title={`Ad revenue, last 6 months (${charts.revenueCurrency.toUpperCase()})`}
          data={charts.revenueByMonth}
          format={(n) => (n === 0 ? "0" : formatMoney(n, charts.revenueCurrency))}
        />
        <BarChart title="New users, last 6 months" data={charts.signupsByMonth} />
        <BarChart title="Jobs by approval status" data={charts.jobsByStatus} />
        <BarChart title="Users by role" data={charts.usersByRole} />
      </div>

      <div className="report-box">
        <h2>Download a report</h2>
        <p className="page-subtitle">CSV files that open in Excel or Google Sheets. Dates are optional.</p>
        <div className="filter-bar">
          <select value={report} onChange={(e) => setReport(e.target.value)} aria-label="Report type">
            {REPORTS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
          <button className="btn-primary-sm" onClick={download} disabled={downloading}>
            {downloading ? "Preparing…" : "Download CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}
