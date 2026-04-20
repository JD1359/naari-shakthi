// client/src/pages/AdminDashboard.jsx
// Admin dashboard: user management, system overview, audit logs

import { useState, useEffect } from "react";
import InventoryTable from "../components/InventoryTable";
import AlertPanel from "../components/AlertPanel";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const ROLE_COLORS = {
  patient:    { bg: "#eff6ff", text: "#1d4ed8" },
  pharmacist: { bg: "#f0fdf4", text: "#166534" },
  admin:      { bg: "#fdf4ff", text: "#7e22ce" },
};

export default function AdminDashboard({ user, token }) {
  const [activeTab, setActiveTab]   = useState("overview");
  const [users, setUsers]           = useState([]);
  const [healthLogs, setHealthLogs] = useState([]);
  const [auditLogs, setAuditLogs]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  // Fetch data per tab
  useEffect(() => {
    if (activeTab === "users")   fetchUsers();
    if (activeTab === "health")  fetchHealthLogs();
    if (activeTab === "audit")   fetchAuditLogs();
  }, [activeTab]); // eslint-disable-line

  async function apiFetch(path) {
    const res = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/auth/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load users.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchHealthLogs() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/health/all");
      setHealthLogs(data.logs || []);
    } catch {
      setError("Could not load health logs.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAuditLogs() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/audit");
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserActive(userId, isActive) {
    try {
      await fetch(`${API}/auth/users/${userId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ isActive: !isActive }),
      });
      fetchUsers();
    } catch {
      setError("Failed to update user status.");
    }
  }

  const TABS = [
    { id: "overview",   label: "Overview"    },
    { id: "users",      label: "Users"        },
    { id: "health",     label: "Health Logs"  },
    { id: "inventory",  label: "Inventory"    },
    { id: "alerts",     label: "Alerts"       },
    { id: "audit",      label: "Audit Log"    },
  ];

  const roleCount = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a2a4a" }}>
          🛡️ Welcome, {user?.name}
        </h1>
        <p style={{ color: "#6b7280", marginTop: 4 }}>System Administrator</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 13,
              background: activeTab === tab.id ? "#2563eb" : "#f3f4f6",
              color:      activeTab === tab.id ? "white"   : "#374151",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
        </div>
      )}

      {/* ── Overview ── */}
      {activeTab === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total Users",     value: users.length || "—", bg: "#eff6ff", text: "#1d4ed8", icon: "👥" },
              { label: "Health Analyses", value: healthLogs.length || "—", bg: "#f0fdf4", text: "#166534", icon: "🩺" },
              { label: "Audit Events",    value: auditLogs.length || "—", bg: "#fdf4ff", text: "#7e22ce", icon: "📋" },
            ].map(card => (
              <div key={card.label} style={{ background: card.bg, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontSize: 22 }}>{card.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: card.text, marginTop: 6 }}>{card.value}</div>
                <div style={{ fontSize: 12, color: card.text, marginTop: 2, fontWeight: 500 }}>{card.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>System Summary</h2>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              Navigate the tabs above to manage users, review health submissions, monitor inventory,
              send alerts, or inspect the audit trail.
            </p>
            <p style={{ color: "#6b7280", fontSize: 14, marginTop: 8 }}>
              Logged in as <strong>{user?.email}</strong> with role <strong>admin</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Users ── */}
      {activeTab === "users" && (
        <div style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          {loading ? (
            <p style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Loading users…</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Name", "Email", "Role", "Joined", "Status", "Action"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No users found.</td></tr>
                ) : users.map(u => {
                  const rc = ROLE_COLORS[u.role] || ROLE_COLORS.patient;
                  return (
                    <tr key={u._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={tdStyle}>{u.name}</td>
                      <td style={{ ...tdStyle, color: "#6b7280" }}>{u.email}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: rc.bg, color: rc.text }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: "#6b7280" }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: u.isActive ? "#d1fae5" : "#fee2e2",
                          color:      u.isActive ? "#065f46" : "#991b1b",
                        }}>
                          {u.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {u._id !== user?.id && (
                          <button
                            onClick={() => toggleUserActive(u._id, u.isActive)}
                            style={{
                              padding: "5px 12px", border: "none", borderRadius: 6,
                              fontSize: 12, fontWeight: 600, cursor: "pointer",
                              background: u.isActive ? "#fee2e2" : "#d1fae5",
                              color:      u.isActive ? "#991b1b" : "#065f46",
                            }}
                          >
                            {u.isActive ? "Disable" : "Enable"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Health Logs ── */}
      {activeTab === "health" && (
        <div style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          {loading ? (
            <p style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Loading health logs…</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["User ID", "Symptoms", "Risk Level", "Risk Score", "Date"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {healthLogs.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No health logs yet.</td></tr>
                ) : healthLogs.map((log, i) => {
                  const risk = log.recommendation?.recommendation || "—";
                  const riskColor = { LOW: "#065f46", MODERATE: "#92400e", HIGH: "#991b1b", CRITICAL: "#831843" }[risk] || "#374151";
                  const riskBg   = { LOW: "#d1fae5", MODERATE: "#fef3c7", HIGH: "#fee2e2", CRITICAL: "#fce7f3" }[risk] || "#f3f4f6";
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ ...tdStyle, color: "#9ca3af", fontSize: 11 }}>{String(log.userId).slice(-8)}…</td>
                      <td style={{ ...tdStyle, color: "#6b7280" }}>{log.input?.symptoms?.join(", ") || "—"}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: riskBg, color: riskColor }}>
                          {risk}
                        </span>
                      </td>
                      <td style={tdStyle}>{log.recommendation?.riskScore ?? "—"}</td>
                      <td style={{ ...tdStyle, color: "#6b7280" }}>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Inventory ── */}
      {activeTab === "inventory" && <InventoryTable token={token} />}

      {/* ── Alerts ── */}
      {activeTab === "alerts" && <AlertPanel token={token} />}

      {/* ── Audit Log ── */}
      {activeTab === "audit" && (
        <div style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          {loading ? (
            <p style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Loading audit log…</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Action", "Performed By", "Target", "Details", "Timestamp"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No audit events found.</td></tr>
                ) : auditLogs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{log.action}</td>
                    <td style={{ ...tdStyle, color: "#6b7280" }}>{log.performedBy}</td>
                    <td style={{ ...tdStyle, color: "#6b7280" }}>{log.targetModel} / {String(log.targetId).slice(-6)}</td>
                    <td style={{ ...tdStyle, color: "#9ca3af", fontSize: 11 }}>{JSON.stringify(log.details)}</td>
                    <td style={{ ...tdStyle, color: "#6b7280" }}>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e5e7eb" };
const tdStyle = { padding: "12px 16px", fontWeight: 400, color: "#111" };
