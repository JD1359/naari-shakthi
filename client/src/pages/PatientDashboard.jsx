// client/src/pages/PatientDashboard.jsx
// Patient-facing dashboard: health form submission + history

import { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const SYMPTOMS_LIST = [
  "Fever", "Cough", "Headache", "Fatigue", "Chest Pain",
  "Shortness of Breath", "Nausea", "Vomiting", "Diarrhea",
  "Abdominal Pain", "Dizziness", "Rash", "Joint Pain", "Back Pain",
];

const RISK_COLORS = {
  LOW:      { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  MODERATE: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  HIGH:     { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  CRITICAL: { bg: "#fce7f3", text: "#831843", border: "#f9a8d4" },
};

export default function PatientDashboard({ user, token }) {
  const [form, setForm]         = useState({ age: "", bloodPressure: "normal", heartRate: "", symptoms: [] });
  const [result, setResult]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [activeTab, setActiveTab] = useState("analyze");

  // Fetch health history on mount
  useEffect(() => {
    fetch(`${API}/health/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setHistory(data.history || []))
      .catch(() => {});
  }, [token]);

  function toggleSymptom(symptom) {
    setForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!form.age || form.symptoms.length === 0) {
      setError("Please enter your age and select at least one symptom.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/health/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          age:           parseInt(form.age),
          symptoms:      form.symptoms.map(s => s.toLowerCase().replace(" ", "_")),
          bloodPressure: form.bloodPressure,
          heartRate:     form.heartRate ? parseInt(form.heartRate) : 72,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const riskStyle = result ? RISK_COLORS[result.recommendation] || RISK_COLORS.MODERATE : {};

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a2a4a" }}>
            Welcome, {user?.name}
        </h1>
        <p style={{ color: "#6b7280", marginTop: 4 }}>Patient Health Dashboard</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["analyze", "history"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 14,
              background: activeTab === tab ? "#2563eb" : "#f3f4f6",
              color: activeTab === tab ? "white" : "#374151",
            }}
          >
            {tab === "analyze" ? "🩺 Analyze Symptoms" : "📋 History"}
          </button>
        ))}
      </div>

      {/* ── Analyze Tab ── */}
      {activeTab === "analyze" && (
        <form onSubmit={handleSubmit}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Basic Information</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Age</label>
                <input
                  type="number" min="1" max="120"
                  value={form.age}
                  onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
                  style={inputStyle}
                  placeholder="e.g. 28"
                />
              </div>
              <div>
                <label style={labelStyle}>Blood Pressure</label>
                <select
                  value={form.bloodPressure}
                  onChange={e => setForm(p => ({ ...p, bloodPressure: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="elevated">Elevated</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Heart Rate (BPM)</label>
                <input
                  type="number" min="30" max="220"
                  value={form.heartRate}
                  onChange={e => setForm(p => ({ ...p, heartRate: e.target.value }))}
                  style={inputStyle}
                  placeholder="e.g. 72"
                />
              </div>
            </div>
          </div>

          <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Select Symptoms <span style={{ color: "#6b7280", fontWeight: 400 }}>({form.symptoms.length} selected)</span>
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {SYMPTOMS_LIST.map(symptom => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  style={{
                    padding: "8px 16px", borderRadius: 20, border: "2px solid",
                    cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s",
                    borderColor: form.symptoms.includes(symptom) ? "#2563eb" : "#e5e7eb",
                    background: form.symptoms.includes(symptom) ? "#eff6ff" : "white",
                    color: form.symptoms.includes(symptom) ? "#2563eb" : "#374151",
                  }}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: 10, border: "none",
              background: loading ? "#93c5fd" : "#2563eb", color: "white",
              fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? " Analyzing..." : " Analyze My Symptoms"}
          </button>
        </form>
      )}

      {/* ── Result Card ── */}
      {result && activeTab === "analyze" && (
        <div style={{
          marginTop: 24, padding: 24, borderRadius: 12,
          border: `2px solid ${riskStyle.border}`,
          background: riskStyle.bg,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: riskStyle.text }}>
              Risk Level: {result.recommendation}
            </h2>
            <span style={{ fontSize: 24, fontWeight: 800, color: riskStyle.text }}>
              {Math.round(result.riskScore * 100)}%
            </span>
          </div>

          <p style={{ color: riskStyle.text, marginBottom: 16, fontSize: 14 }}>{result.advice}</p>

          {result.medicines?.length > 0 && (
            <div>
              <p style={{ fontWeight: 600, color: riskStyle.text, marginBottom: 8, fontSize: 14 }}>
                  Suggested Medicines:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                {result.medicines.map((m, i) => (
                  <li key={i} style={{ color: riskStyle.text, fontSize: 13, marginBottom: 4 }}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === "history" && (
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Your Health Analysis History</h2>
          {history.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "40px 0" }}>
              No history yet. Submit your symptoms to get started.
            </p>
          ) : (
            history.map((log, i) => (
              <div key={i} style={{ borderBottom: "1px solid #f3f4f6", padding: "12px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    Risk: {log.recommendation?.recommendation}
                  </span>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ color: "#6b7280", fontSize: 12 }}>
                  Symptoms: {log.input?.symptoms?.join(", ")}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" };
const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" };
