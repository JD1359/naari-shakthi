// client/src/components/AlertPanel.jsx
// Pharmacist / Admin panel for sending manual SMS and email alerts.

import { useState } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const ALERT_TYPES = [
  { value: "low_stock",      label: "Low Stock"          },
  { value: "expiry_warning", label: "Expiry Warning"      },
  { value: "maintenance",    label: "Maintenance Due"     },
  { value: "general",        label: "General Announcement" },
];

export default function AlertPanel({ token }) {
  const [form, setForm] = useState({
    type:    "low_stock",
    message: "",
    email:   "",
    phone:   "",
  });
  const [status, setStatus]   = useState(null); // "success" | "error"
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    setStatus(null);
    setFeedback("");

    if (!form.message.trim()) {
      setStatus("error");
      setFeedback("Message is required.");
      return;
    }
    if (!form.email && !form.phone) {
      setStatus("error");
      setFeedback("Provide at least one recipient — email or phone.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API}/notifications/send`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          type:    form.type,
          message: form.message.trim(),
          email:   form.email.trim() || undefined,
          phone:   form.phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send alert");

      setStatus("success");
      setFeedback(" Alert sent successfully!");
      setForm(prev => ({ ...prev, message: "", email: "", phone: "" }));
    } catch (err) {
      setStatus("error");
      setFeedback(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1a2a4a" }}> Send Alert</h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
          Send an SMS or email notification to staff or contacts.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Form */}
        <form onSubmit={handleSend}>
          <div style={cardStyle}>
            {/* Alert type */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Alert Type</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                style={inputStyle}
              >
                {ALERT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Message</label>
              <textarea
                rows={5}
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Enter your alert message…"
                style={{ ...inputStyle, resize: "vertical" }}
              />
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                {form.message.length} / 160 chars recommended for SMS
              </p>
            </div>

            {/* Recipients */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Email Recipient</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="pharmacist@example.com"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Phone Number (SMS)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                style={inputStyle}
              />
            </div>

            {/* Feedback */}
            {status && (
              <div style={{
                padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14,
                background: status === "success" ? "#d1fae5" : "#fee2e2",
                color:      status === "success" ? "#065f46" : "#991b1b",
              }}>
                {feedback}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              style={{
                width: "100%", padding: "13px", borderRadius: 10, border: "none",
                background: sending ? "#93c5fd" : "#2563eb", color: "white",
                fontSize: 14, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              {sending ? "Sending…" : "📤 Send Alert"}
            </button>
          </div>
        </form>

        {/* Tips */}
        <div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#374151" }}> When to send alerts</h3>
            <ul style={{ paddingLeft: 18, color: "#6b7280", fontSize: 13, lineHeight: 1.8 }}>
              <li>A medicine falls below its threshold quantity.</li>
              <li>A batch is expiring within 30 days.</li>
              <li>A scheduled maintenance window is due.</li>
              <li>An emergency announcement needs to reach staff.</li>
            </ul>
          </div>

          <div style={{ ...cardStyle, background: "#fffbeb", border: "1px solid #fcd34d" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#92400e" }}>⚙️ SMS Configuration</h3>
            <p style={{ fontSize: 13, color: "#92400e" }}>
              SMS alerts require Twilio credentials in <code>.env</code>:{" "}
              <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code>, and{" "}
              <code>TWILIO_PHONE</code>. If not configured, only email alerts will be sent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle  = { background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 16 };
const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" };
const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" };
