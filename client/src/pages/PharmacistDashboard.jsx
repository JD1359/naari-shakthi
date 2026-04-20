// client/src/pages/PharmacistDashboard.jsx
// Pharmacist dashboard: manage inventory + send alerts

import { useState, useEffect } from "react";
import InventoryTable from "../components/InventoryTable";
import AlertPanel from "../components/AlertPanel";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function PharmacistDashboard({ user, token }) {
  const [activeTab, setActiveTab] = useState("inventory");
  const [stats, setStats]         = useState({ total: 0, lowStock: 0, outOfStock: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoadingStats(true);
      try {
        const [allRes, lowRes] = await Promise.all([
          fetch(`${API}/inventory`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/inventory/low`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const allData = await allRes.json();
        const lowData = await lowRes.json();
        const all = Array.isArray(allData) ? allData : [];
        setStats({
          total:      all.length,
          lowStock:   lowData.count || 0,
          outOfStock: all.filter(m => m.quantity === 0).length,
        });
      } catch {
        // keep defaults
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, [token]);

  const TABS = [
    { id: "inventory", label: " Inventory" },
    { id: "alerts",    label: " Alerts" },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a2a4a" }}>
            Welcome, {user?.name}
        </h1>
        <p style={{ color: "#6b7280", marginTop: 4 }}>Pharmacist Dashboard</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Medicines",  value: loadingStats ? "…" : stats.total,      bg: "#eff6ff", text: "#1d4ed8", icon: "📦" },
          { label: "Low Stock Items",  value: loadingStats ? "…" : stats.lowStock,   bg: "#fef3c7", text: "#92400e", icon: "⚠️"  },
          { label: "Out of Stock",     value: loadingStats ? "…" : stats.outOfStock, bg: "#fee2e2", text: "#991b1b", icon: "🚫" },
        ].map(card => (
          <div key={card.label} style={{ background: card.bg, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 22 }}>{card.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: card.text, marginTop: 6 }}>{card.value}</div>
            <div style={{ fontSize: 12, color: card.text, marginTop: 2, fontWeight: 500 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 14,
              background: activeTab === tab.id ? "#2563eb" : "#f3f4f6",
              color:      activeTab === tab.id ? "white"   : "#374151",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "inventory" && <InventoryTable token={token} />}
      {activeTab === "alerts"    && <AlertPanel    token={token} />}
    </div>
  );
}
