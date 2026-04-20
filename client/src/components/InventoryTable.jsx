// client/src/components/InventoryTable.jsx
// Pharmacist dashboard: live inventory view with low-stock alerts

import { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function InventoryTable({ token }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("all");
  const [editItem, setEditItem]   = useState(null);
  const [newQty, setNewQty]       = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMedicines(Array.isArray(data) ? data : []);
    } catch {
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStock(id) {
    if (!newQty || isNaN(newQty)) return;
    await fetch(`${API}/inventory/${id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ quantity: parseInt(newQty) }),
    });
    setEditItem(null);
    setNewQty("");
    fetchInventory();
  }

  const filtered = medicines.filter(m => {
    const matchSearch = m.medicineName.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all"      ? true :
      filter === "low"      ? m.quantity <= m.threshold :
      filter === "ok"       ? m.quantity > m.threshold : true;
    return matchSearch && matchFilter;
  });

  const lowCount = medicines.filter(m => m.quantity <= m.threshold).length;

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1a2a4a" }}>💊 Medicine Inventory</h1>
          {lowCount > 0 && (
            <div style={{ marginTop: 6, padding: "6px 14px", background: "#fee2e2", borderRadius: 6, display: "inline-block" }}>
              <span style={{ color: "#991b1b", fontSize: 13, fontWeight: 600 }}>
                  {lowCount} item{lowCount > 1 ? "s" : ""} below threshold
              </span>
            </div>
          )}
        </div>
        <button onClick={fetchInventory} style={btnStyle}> Refresh</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search medicine..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: "8px 14px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
        />
        {["all", "low", "ok"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              background: filter === f ? "#2563eb" : "#f3f4f6",
              color: filter === f ? "white" : "#374151",
            }}
          >
            {f === "all" ? "All" : f === "low" ? " Low Stock" : " OK"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#6b7280", padding: 40 }}>Loading inventory...</p>
      ) : (
        <div style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Medicine", "Category", "Stock", "Threshold", "Expiry", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e5e7eb" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                    No medicines found.
                  </td>
                </tr>
              ) : filtered.map(m => {
                const isLow    = m.quantity <= m.threshold;
                const isCrit   = m.quantity === 0;
                const isEdit   = editItem === m._id;
                const expiring = m.expiryDate && new Date(m.expiryDate) < new Date(Date.now() + 30 * 86400000);

                return (
                  <tr key={m._id} style={{ borderBottom: "1px solid #f3f4f6", background: isCrit ? "#fff5f5" : isLow ? "#fffbeb" : "white" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111" }}>{m.medicineName}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", textTransform: "capitalize" }}>{m.category}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: isCrit ? "#dc2626" : isLow ? "#d97706" : "#059669" }}>
                      {isEdit ? (
                        <input
                          type="number" min="0"
                          value={newQty}
                          onChange={e => setNewQty(e.target.value)}
                          style={{ width: 70, padding: "4px 8px", border: "1px solid #2563eb", borderRadius: 6, fontSize: 13 }}
                          autoFocus
                        />
                      ) : (
                        `${m.quantity} ${m.unit}`
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{m.threshold} {m.unit}</td>
                    <td style={{ padding: "12px 16px", color: expiring ? "#dc2626" : "#6b7280", fontSize: 12 }}>
                      {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : "—"}
                      {expiring && " Expiring Soon!"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: isCrit ? "#fee2e2" : isLow ? "#fef3c7" : "#d1fae5",
                        color:      isCrit ? "#991b1b" : isLow ? "#92400e" : "#065f46",
                      }}>
                        {isCrit ? "OUT OF STOCK" : isLow ? "LOW STOCK" : "IN STOCK"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {isEdit ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => updateStock(m._id)} style={{ ...smallBtn, background: "#2563eb", color: "white" }}>Save</button>
                          <button onClick={() => { setEditItem(null); setNewQty(""); }} style={{ ...smallBtn, background: "#f3f4f6" }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditItem(m._id); setNewQty(m.quantity); }} style={{ ...smallBtn, background: "#eff6ff", color: "#2563eb" }}>
                          Update Stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const btnStyle  = { padding: "8px 18px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const smallBtn  = { padding: "5px 12px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" };
