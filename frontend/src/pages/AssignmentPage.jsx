import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getAllAssignments, assignAsset, returnAsset } from "../api/assignmentApi";
import { getAllEmployees } from "../api/employeeApi";
import { getAllAssets } from "../api/assetApi";
import { useAuth } from "../context/AuthContext";
import { useTheme, getTheme } from "../context/ThemeContext";


const AssignmentPage = () => {
  const { isAdmin } = useAuth();
  const { isDark } = useTheme();
  const t = getTheme(isDark);
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterTab, setFilterTab] = useState("all");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const today = new Date(). toISOString().split("T") [0];

  const [form,setForm]=useState({
    EmployeeID: "", AssignedDate: today , Remark:"",

  });
  const [selectedAssets,setSelectedAssets ] = useState([]);




  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [a, e, ast] = await Promise.all([
        getAllAssignments(), getAllEmployees(), getAllAssets("Available"),
      ]);
      setAssignments(a); setEmployees(e); setAssets(ast);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

const handleAssign = async (e) => {
  e.preventDefault();
  setFormError(""); setFormSuccess("");
  if (selectedAssets.length === 0) {
    setFormError("Please select at least one asset.");
    return;
  }
  try {
    for (const assetId of selectedAssets) {
      await assignAsset({
        EmployeeID:   parseInt(form.EmployeeID),
        AssetID:      assetId,
        AssignedDate: form.AssignedDate,
        Remarks:      form.Remarks,
      });
    }
    setFormSuccess(`${selectedAssets.length} asset(s) assigned successfully`);
    setForm({ EmployeeID: "", AssignedDate: today, Remarks: "" });
    setSelectedAssets([]);
    fetchAll();
    setTimeout(() => { setShowForm(false); setFormSuccess(""); }, 1500);
  } catch (err) {
    setFormError(err.response?.data?.detail || "Assignment failed");
  }
};

  const handleReturn = async (assignmentId) => {
    if (!window.confirm("Mark this asset as returned?")) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      await returnAsset(assignmentId, { ReturnedDate: today, Remarks: "Returned via dashboard" });
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const toggleAsset = (assetId) => {
  setSelectedAssets((prev) =>
    prev.includes(assetId)
      ? prev.filter((id) => id !== assetId)
      : [...prev, assetId]
  );
};

  const filteredAssignments = assignments.filter((a) => {
    if (filterTab === "active") return !a.IsReturned;
    if (filterTab === "returned") return a.IsReturned;
    return true;
  });

  const activeCount = assignments.filter((a) => !a.IsReturned).length;
  const returnedCount = assignments.filter((a) => a.IsReturned).length;

  const tabs = [
    { key: "all", label: `All (${assignments.length})` },
    { key: "active", label: `Active (${activeCount})` },
    { key: "returned", label: `Returned (${returnedCount})` },
  ];

  const s = {
    page: { minHeight: "100vh", backgroundColor: t.pageBg, transition: "background 0.3s" },
    content: { maxWidth: "1400px", margin: "0 auto", padding: "28px 32px" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" },
    pageTitle: { fontSize: "26px", fontWeight: "800", color: t.textPrimary, margin: 0, letterSpacing: "-0.5px" },
    pageSubtitle: { fontSize: "13px", color: t.textSecondary, marginTop: "4px" },
    btnPrimary: {
      padding: "12px 24px", background: "linear-gradient(135deg, #2563eb, #1e3a8a)",
      color: "#fff", border: "none", borderRadius: "9px", fontSize: "13px",
      fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
    },
    formCard: {
      background: t.surface, border: `1.5px solid ${t.border}`, borderRadius: "14px",
      padding: "28px", marginBottom: "24px", boxShadow: `0 1px 6px ${t.shadow}`,
    },
    formTitle: { fontSize: "16px", fontWeight: "800", color: t.textPrimary, marginBottom: "20px" },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    label: { fontSize: "11px", fontWeight: "700", color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em" },
    input: {
      height: "46px", padding: "0 14px", backgroundColor: t.inputBg, border: `1.5px solid ${t.border}`,
      borderRadius: "9px", color: t.inputColor, fontSize: "13px", outline: "none", boxSizing: "border-box", width: "100%",
    },
    errorMsg: { color: "#dc2626", fontSize: "13px", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "9px", marginBottom: "12px" },
    successMsg: { color: "#059669", fontSize: "13px", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "9px", marginBottom: "12px" },
    tabTrack: {
      display: "inline-flex", gap: "4px", marginBottom: "16px", padding: "4px",
      backgroundColor: isDark ? "#3f3f46" : "#dbeafe", borderRadius: "10px",
    },
    tabBtn: {
      padding: "8px 20px", borderRadius: "7px", border: "none",
      background: "transparent", color: t.textSecondary, fontSize: "13px",
      fontWeight: "600", cursor: "pointer", transition: "all 0.15s",
    },
    tabBtnActive: {
      background: t.surface, color: t.textPrimary, fontWeight: "700",
      boxShadow: isDark ? "0 1px 4px rgba(0,0,0,0.4)" : "0 1px 4px rgba(37,99,235,0.15)",
    },
    tableCard: {
      background: t.surface, border: `1.5px solid ${t.border}`, borderRadius: "14px",
      overflow: "hidden", boxShadow: `0 1px 6px ${t.shadow}`,
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      padding: "13px 18px", textAlign: "left", fontSize: "11px", fontWeight: "700",
      color: t.textPrimary, textTransform: "uppercase", letterSpacing: "0.08em",
      borderBottom: `1.5px solid ${t.border}`, background: t.thBg,
    },
    tr: { borderBottom: `1px solid ${t.rowBorder}` },
    td: { padding: "13px 18px", fontSize: "13px", color: t.textBody },
    typePill: { padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", background: t.codeBg, color: t.codeColor },
    remarksText: { fontSize: "12px", color: t.textSecondary, fontStyle: "italic" },
    badgeActive: { padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: t.badgeActiveBg, color: t.badgeActiveColor },
    badgeReturned: { padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: t.codeBg, color: t.codeColor },
    btnReturn: { padding: "6px 14px", borderRadius: "7px", border: "1.5px solid #bbf7d0", background: "#f0fdf4", color: "#059669", fontSize: "12px", fontWeight: "700", cursor: "pointer" },
    emptyState: { padding: "60px 24px", textAlign: "center" },
    emptyIcon: { fontSize: "40px", marginBottom: "12px" },
    emptyTitle: { fontSize: "16px", fontWeight: "700", color: t.textPrimary, marginBottom: "4px" },
    emptyDesc: { fontSize: "13px", color: t.textSecondary },
    loadingText: { padding: "24px", color: t.textSecondary, textAlign: "center", fontSize: "13px" },
  };

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.content}>
        {/* Header */}
        <div style={s.headerRow}>
          <div>
            <h2 style={s.pageTitle}>Assignments</h2>
            <p style={s.pageSubtitle}>
              {assignments.length} total — {activeCount} active, {returnedCount} returned
            </p>
          </div>
          {isAdmin && (
            <button style={s.btnPrimary} onClick={() => setShowForm(!showForm)}>
              {showForm ? "✕" : "+ Assign Asset"}
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && isAdmin && (
          <div style={s.formCard}>
            <h3 style={s.formTitle}>Assign Asset to Employee</h3>
            <form onSubmit={handleAssign}>
              <div style={s.formGrid}>
                <div style={s.formGroup}>
                  <label style={s.label}>Employee</label>
                  <select style={s.input} value={form.EmployeeID}
                    onChange={(e) => setForm({ ...form, EmployeeID: e.target.value })} required>
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.EmployeeID} value={emp.EmployeeID}>
                        {emp.EmployeeName} — {emp.Department}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ ...s.formGroup, gridColumn: "span 3" }}>
  <label style={s.label}>
    Available Assets{" "}
    {selectedAssets.length > 0 && (
      <span style={{ color: "#2563eb", fontWeight: "700" }}>
        ({selectedAssets.length} selected)
      </span>
    )}
  </label>
  <div style={{
    border: `1.5px solid ${t.border}`, borderRadius: "9px",
    background: t.inputBg, maxHeight: "200px", overflowY: "auto", padding: "8px",
  }}>
    {assets.length === 0 ? (
      <p style={{ padding: "12px", color: t.textSecondary, fontSize: "13px", margin: 0 }}>
        No available assets
      </p>
    ) : (
      assets.map((ast) => (
        <label key={ast.AssetID} style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "8px 10px", borderRadius: "7px", cursor: "pointer",
          background: selectedAssets.includes(ast.AssetID) ? (isDark ? "#1e3a5f" : "#eff6ff") : "transparent",
        }}>
          <input
            type="checkbox"
            checked={selectedAssets.includes(ast.AssetID)}
            onChange={() => toggleAsset(ast.AssetID)}
            style={{ width: "15px", height: "15px", cursor: "pointer" }}
          />
          <span style={{ fontSize: "13px", color: t.textBody, fontWeight: selectedAssets.includes(ast.AssetID) ? "700" : "400" }}>
            {ast.AssetName} — {ast.AssetCode}
          </span>
        </label>
      ))
    )}
  </div>
</div>
                <div style={s.formGroup}>
                  <label style={s.label}>Assigned Date</label>
                  <input type="date" style={s.input} value={form.AssignedDate}
                    onChange={(e) => setForm({ ...form, AssignedDate: e.target.value })} required />
                </div>
                <div style={{ ...s.formGroup, gridColumn: "span 3" }}>
                  <label style={s.label}>Remarks</label>
                  <input type="text" style={s.input} placeholder="Optional remarks"
                    value={form.Remarks} onChange={(e) => setForm({ ...form, Remarks: e.target.value })} />
                </div>
              </div>
              {formError && <p style={s.errorMsg}>{formError}</p>}
              {formSuccess && <p style={s.successMsg}>{formSuccess}</p>}
              <button type="submit" style={s.btnPrimary}>Assign Asset</button>
            </form>
          </div>
        )}

        {/* Tab Switcher */}
        <div style={s.tabTrack}>
          {tabs.map((tab) => (
            <button key={tab.key}
              style={{ ...s.tabBtn, ...(filterTab === tab.key ? s.tabBtnActive : {}) }}
              onClick={() => setFilterTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={s.tableCard}>
          {loading ? (
            <p style={s.loadingText}>Loading assignments...</p>
          ) : filteredAssignments.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>{"\uD83D\uDD17"}</div>
              <p style={s.emptyTitle}>No assignments found</p>
              <p style={s.emptyDesc}>
                {filterTab !== "all" ? "Try switching to a different tab" : "Start by assigning assets to employees"}
              </p>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {["Employee", "Department", "Asset", "Type", "Assigned Date", "Returned Date", "Remarks", "Status", isAdmin ? "Actions" : ""].filter(Boolean).map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a) => (
                  <tr key={a.AssignmentID} style={s.tr}>
                    <td style={{ ...s.td, fontWeight: "600", color: "#1e3a8a" }}>
                      {a.EmployeeName || `Emp #${a.EmployeeID}`}
                    </td>
                    <td style={s.td}>{a.Department || "-"}</td>
                    <td style={s.td}>{a.AssetName || `Asset #${a.AssetID}`}</td>
                    <td style={s.td}><span style={s.typePill}>{a.AssetType || "-"}</span></td>
                    <td style={s.td}>{a.AssignedDate}</td>
                    <td style={s.td}>{a.ReturnedDate || "-"}</td>
                    <td style={s.td}><span style={s.remarksText}>{a.Remarks || "-"}</span></td>
                    <td style={s.td}>
                      <span style={a.IsReturned ? s.badgeReturned : s.badgeActive}>
                        {a.IsReturned ? "Returned" : "Active"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={s.td}>
                        {!a.IsReturned && (
                          <button style={s.btnReturn} onClick={() => handleReturn(a.AssignmentID)}>Return</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentPage;
