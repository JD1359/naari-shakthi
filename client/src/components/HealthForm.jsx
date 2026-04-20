// client/src/components/HealthForm.jsx
// Reusable health symptom submission form.
// Used by PatientDashboard to collect and submit symptom data.

import { useState } from "react";

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

/**
 * HealthForm
 *
 * Props:
 *   token    {string}   - JWT access token
 *   onResult {function} - Callback called with the prediction result object
 */
export default function HealthForm({ token, onResult }) {
  const [form, setForm]     = useState({ age: "", bloodPressure: "normal", heartRate: "", symptoms: [] });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

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

    if (!form.age) {
      setError("Please enter your age.");
      return;
    }
    if (form.symptoms.length === 0) {
      setError("Please select at least one symptom.");
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
      if (onResult) onResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setForm({ age: "", bloodPressure: "normal", heartRate: "", symptoms: [] });
    setResult(null);
    setError("");
  }

  const riskStyle = result ? RISK_COLORS[result.recommendation] || RISK_COLORS.MODERATE : {};

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Basic vitals */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>Basic Information</h2>
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

        {/* Symptoms */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>
            Select Symptoms{" "}
            <span style={{ color: "#6b7280", fontWeight: 400 }}>({form.symptoms.length} selected)</span>
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {SYMPTOMS_LIST.map(symptom => {
              const selected = form.symptoms.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  style={{
                    padding: "8px 16px", borderRadius: 20, border: "2px solid",
                    cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s",
                    borderColor: selected ? "#2563eb" : "#e5e7eb",
                    background:  selected ? "#eff6ff"  : "white",
                    color:       selected ? "#2563eb"  : "#374151",
                  }}
                >
                  {symptom}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
              {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1, padding: "14px", borderRadius: 10, border: "none",
              background: loading ? "#93c5fd" : "#2563eb", color: "white",
              fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? " Analyzing..." : " Analyze My Symptoms"}
          </button>
          {result && (
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: "14px 20px", borderRadius: 10, border: "1px solid #e5e7eb",
                background: "white", color: "#374151", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Result */}
      {result && (
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
    </div>
  );
}

const cardStyle    = { background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 20 };
const sectionTitle = { fontSize: 16, fontWeight: 600, marginBottom: 16 };
const labelStyle   = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" };
const inputStyle   = { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" };
