// client/src/App.jsx
// Root application component.
// Handles authentication state, token refresh, and role-based routing.

import { useState, useEffect, useCallback } from "react";
import PatientDashboard    from "./pages/PatientDashboard";
import PharmacistDashboard from "./pages/PharmacistDashboard";
import AdminDashboard      from "./pages/AdminDashboard";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ── Login Page ────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }) {
  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [form, setForm]       = useState({ name: "", email: "", password: "", role: "patient" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    const body     = mode === "login"
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password, role: form.role };

    try {
      const res  = await fetch(`${API}${endpoint}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.errors?.[0]?.msg || data.error || "Something went wrong";
        throw new Error(msg);
      }

      if (mode === "register") {
        setMode("login");
        setError(""); // clear so we don't show error after register
        setForm(p => ({ ...p, name: "", password: "" }));
        return;
      }

      // Store tokens
      localStorage.setItem("accessToken",  data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      onLogin(data.accessToken, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function set(field) {
    return e => setForm(p => ({ ...p, [field]: e.target.value }));
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
      fontFamily: "sans-serif",
    }}>
      <div style={{ background: "white", borderRadius: 16, padding: 40, width: 380, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40 }}>💊</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2a4a", marginTop: 8 }}>Naari Shakthi</h1>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Healthcare Management Platform</p>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {["login", "register"].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{
                flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer",
                fontWeight: 600, fontSize: 13, transition: "all 0.15s",
                background: mode === m ? "white"   : "transparent",
                color:      mode === m ? "#111827" : "#6b7280",
                boxShadow:  mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text" required
                value={form.name} onChange={set("name")}
                placeholder="Priya Sharma"
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email" required
              value={form.email} onChange={set("email")}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: mode === "register" ? 14 : 24 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password" required
              value={form.password} onChange={set("password")}
              placeholder="••••••••"
              style={inputStyle}
              minLength={8}
            />
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Role</label>
              <select value={form.role} onChange={set("role")} style={inputStyle}>
                <option value="patient">Patient</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {error && (
            <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "13px", borderRadius: 10, border: "none",
              background: loading ? "#93c5fd" : "#2563eb", color: "white",
              fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser]   = useState(null);

  // Restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (!storedToken) return;

    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${storedToken}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u => {
        setToken(storedToken);
        setUser(u);
      })
      .catch(() => {
        // Try refresh token
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) return;

        fetch(`${API}/auth/refresh`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ refreshToken }),
        })
          .then(r => r.ok ? r.json() : Promise.reject())
          .then(async data => {
            localStorage.setItem("accessToken", data.accessToken);
            const me = await fetch(`${API}/auth/me`, {
              headers: { Authorization: `Bearer ${data.accessToken}` },
            }).then(r => r.json());
            setToken(data.accessToken);
            setUser(me);
          })
          .catch(() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          });
      });
  }, []);

  const handleLogin = useCallback((accessToken, userData) => {
    setToken(accessToken);
    setUser(userData);
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setUser(null);
  }

  if (!token || !user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const ROLE_LABELS = { patient: "Patient", pharmacist: "Pharmacist", admin: "Administrator" };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "sans-serif" }}>
      {/* Top Nav */}
      <nav style={{
        background: "white", borderBottom: "1px solid #e5e7eb",
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 56,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>💊</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#1a2a4a" }}>Naari Shakthi</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>
            {user.name}{" "}
            <span style={{
              background: "#eff6ff", color: "#2563eb", padding: "2px 8px",
              borderRadius: 10, fontSize: 11, fontWeight: 600,
            }}>
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 16px", border: "1px solid #e5e7eb", borderRadius: 8,
              background: "white", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Dashboard by role */}
      <main style={{ padding: "24px 0" }}>
        {user.role === "patient"    && <PatientDashboard    user={user} token={token} />}
        {user.role === "pharmacist" && <PharmacistDashboard user={user} token={token} />}
        {user.role === "admin"      && <AdminDashboard      user={user} token={token} />}

        {!["patient", "pharmacist", "admin"].includes(user.role) && (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            Unknown role: <strong>{user.role}</strong>. Please contact support.
          </div>
        )}
      </main>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" };
const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" };
