import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Bell, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X } from "lucide-react";
import "../styles/JobAlerts.css";

interface JobAlert {
  _id: string;
  keywords: string[];
  location?: string;
  jobType?: string[];
  salaryMin?: number;
  isActive: boolean;
  frequency: "instant" | "daily" | "weekly";
  createdAt: string;
}

interface AlertFormData {
  keywords: string[];
  location: string;
  jobType: string[];
  salaryMin: string;
  frequency: "instant" | "daily" | "weekly";
}

const JobAlerts = () => {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);
  const [formData, setFormData] = useState<AlertFormData>({
    keywords: [],
    location: "",
    jobType: [],
    salaryMin: "",
    frequency: "daily",
  });
  const [keywordInput, setKeywordInput] = useState("");

  const jobTypes = ["full-time", "part-time", "contract", "internship", "remote"];

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/job-alerts`, {
        withCredentials: true,
      });
      setAlerts(data.alerts);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch job alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.keywords.length === 0) {
      toast.error("Please add at least one keyword");
      return;
    }

    try {
      const payload = {
        keywords: formData.keywords,
        location: formData.location || undefined,
        jobType: formData.jobType.length > 0 ? formData.jobType : undefined,
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
        frequency: formData.frequency,
      };

      if (editingAlert) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/job-alerts/${editingAlert._id}`,
          payload,
          { withCredentials: true }
        );
        toast.success("Job alert updated successfully");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/job-alerts`, payload, {
          withCredentials: true,
        });
        toast.success("Job alert created successfully");
      }

      resetForm();
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save job alert");
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!confirm("Are you sure you want to delete this job alert?")) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/job-alerts/${alertId}`, {
        withCredentials: true,
      });
      toast.success("Job alert deleted");
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete job alert");
    }
  };

  const handleToggle = async (alertId: string) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/job-alerts/${alertId}/toggle`,
        {},
        { withCredentials: true }
      );
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to toggle job alert");
    }
  };

  const handleEdit = (alert: JobAlert) => {
    setEditingAlert(alert);
    setFormData({
      keywords: alert.keywords,
      location: alert.location || "",
      jobType: alert.jobType || [],
      salaryMin: alert.salaryMin?.toString() || "",
      frequency: alert.frequency,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      keywords: [],
      location: "",
      jobType: [],
      salaryMin: "",
      frequency: "daily",
    });
    setKeywordInput("");
    setEditingAlert(null);
    setShowForm(false);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData({ ...formData, keywords: [...formData.keywords, keywordInput.trim()] });
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((k) => k !== keyword),
    });
  };

  const toggleJobType = (type: string) => {
    setFormData({
      ...formData,
      jobType: formData.jobType.includes(type)
        ? formData.jobType.filter((t) => t !== type)
        : [...formData.jobType, type],
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="job-alerts-page">
      <div className="job-alerts-container">
        {/* Header */}
        <div className="job-alerts-header">
          <div className="job-alerts-header-content">
            <h1>
              <Bell className="alert-icon" size={32} />
              Job Alerts
            </h1>
            <p>Get notified when jobs matching your criteria are posted</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-create-alert">
            <Plus size={20} />
            Create Alert
          </button>
        </div>

        {/* Alert Form */}
        {showForm && (
          <div className="alert-form-card">
            <div className="alert-form-header">
              <h2>{editingAlert ? "Edit Alert" : "Create New Alert"}</h2>
              <button onClick={resetForm} className="btn-close">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="alert-form">
              {/* Keywords */}
              <div className="form-group">
                <label>Keywords *</label>
                <div className="keywords-input-group">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                    placeholder="e.g., React, Node.js, Developer"
                  />
                  <button type="button" onClick={addKeyword} className="btn-add-keyword">
                    Add
                  </button>
                </div>
                <div className="keywords-tags">
                  {formData.keywords.map((keyword) => (
                    <span key={keyword} className="keyword-tag">
                      {keyword}
                      <button type="button" onClick={() => removeKeyword(keyword)}>
                        <X size={16} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., New York, Remote"
                />
              </div>

              {/* Job Type */}
              <div className="form-group">
                <label>Job Type</label>
                <div className="job-type-buttons">
                  {jobTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleJobType(type)}
                      className={`job-type-btn ${formData.jobType.includes(type) ? "selected" : ""}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum Salary */}
              <div className="form-group">
                <label>Minimum Salary</label>
                <input
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                  placeholder="e.g., 50000"
                />
              </div>

              {/* Frequency */}
              <div className="form-group">
                <label>Alert Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      frequency: e.target.value as "instant" | "daily" | "weekly",
                    })
                  }
                >
                  <option value="instant">Instant</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingAlert ? "Update Alert" : "Create Alert"}
                </button>
                <button type="button" onClick={resetForm} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <div className="empty-state">
            <Bell className="empty-state-icon" size={64} />
            <h3>No job alerts yet</h3>
            <p>Create your first job alert and get notified about relevant opportunities</p>
          </div>
        ) : (
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div key={alert._id} className={`alert-card ${!alert.isActive ? "inactive" : ""}`}>
                <div className="alert-card-content">
                  <div className="alert-card-info">
                    <div className="alert-card-header">
                      <h3>{alert.keywords.join(", ")}</h3>
                      <span className={`alert-status-badge ${alert.isActive ? "active" : "paused"}`}>
                        {alert.isActive ? "Active" : "Paused"}
                      </span>
                    </div>

                    <div className="alert-card-details">
                      {alert.location && <p>📍 Location: {alert.location}</p>}
                      {alert.jobType && alert.jobType.length > 0 && (
                        <p>💼 Type: {alert.jobType.join(", ")}</p>
                      )}
                      {alert.salaryMin && <p>💰 Min Salary: ${alert.salaryMin.toLocaleString()}</p>}
                      <p>
                        🔔 Frequency: {alert.frequency.charAt(0).toUpperCase() + alert.frequency.slice(1)}
                      </p>
                    </div>
                  </div>

                  <div className="alert-actions">
                    <button
                      onClick={() => handleToggle(alert._id)}
                      className="alert-action-btn toggle"
                      title={alert.isActive ? "Pause alert" : "Activate alert"}
                    >
                      {alert.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                    <button
                      onClick={() => handleEdit(alert)}
                      className="alert-action-btn edit"
                      title="Edit alert"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(alert._id)}
                      className="alert-action-btn delete"
                      title="Delete alert"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobAlerts;
