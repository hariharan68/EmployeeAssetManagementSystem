import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getAllEmployees, createEmployee, deleteEmployee } from "../api/employeeApi";
import { getAssignmentsByEmployee, submitReturnRequest, getMyReturnRequests } from "../api/assignmentApi";
import { downloadEmployeeReport, downloadEmployeesReport } from "../api/reportApi";
import { useAuth } from "../context/AuthContext";
import { useTheme, getTheme } from "../context/ThemeContext";
import { generateEmployeeLogin, getEmployeesWithLogins } from "../api/authApi";

const EmployeePage = () => {
  const { isAdmin } = useAuth();
  const { isDark } = useTheme();
  const t = getTheme(isDark);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [search, setSearch] = useState("");
  const [loggedInEmps, setLoggedInEmps] = useState(new Set());
  const [toast, setToast] = useState(null); // { msg, type: "success"|"error" }
  // Return request state (for non-admin users)
  const [myReturnRequests, setMyReturnRequests] = useState([]); // [{AssignmentID, Status}]
  const [returnModal, setReturnModal] = useState(null); // employee whose assets to show for return
  const [returnModalAssignments, setReturnModalAssignments] = useState([]);
  const [returnModalLoading, setReturnModalLoading] = useState(false);

  const [confirmModal, setConfirmModal]   = useState(null); // { assignmentId, assetName }
  const [returnReason, setReturnReason]   = useState("");
  const [reasonError, setReasonError]     = useState("");

  const [form, setForm] = useState({
    EmployeeCode: "", EmployeeName: "", Department: "",
    Designation: "", Email: "", Mobile: "", JoiningDate: "",
  });

  useEffect(() => {
  fetchEmployees();
  if (isAdmin) fetchLoggedInEmps();
  else fetchMyReturnRequests();
}, []);

// Re-check return-request statuses when the user comes back to this tab,
// so an admin's approval clears the "Pending" badge without a manual refresh.
useEffect(() => {
  if (isAdmin) return;
  const refresh = () => fetchMyReturnRequests();
  window.addEventListener("focus", refresh);
  return () => window.removeEventListener("focus", refresh);
}, [isAdmin]);

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    fetchEmployees();
    if (isAdmin) fetchLoggedInEmps();
    else fetchMyReturnRequests();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getAllEmployees();
      setEmployees(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchLoggedInEmps = async () => {
    try {
      const ids = await getEmployeesWithLogins();
      setLoggedInEmps(new Set(ids));
    } catch (err) { console.error(err); }
  };

  const fetchMyReturnRequests = async () => {
    try {
      const data = await getMyReturnRequests();
      setMyReturnRequests(data);
    } catch (err) { console.error(err); }
  };

  const handleOpenReturnModal = async (emp) => {
    setReturnModal(emp);
    setReturnModalLoading(true);
    try {
      const data = await getAssignmentsByEmployee(emp.EmployeeID);
      setReturnModalAssignments(data.filter((a) => !a.IsReturned));
    } catch { setReturnModalAssignments([]); }
    finally { setReturnModalLoading(false); }
  };

  const handleSubmitReturnRequest = async () => {
  if (!returnReason.trim()) {
    setReasonError("Please enter a reason for return.");
    return;
  }
  try {
    await submitReturnRequest(confirmModal.assignmentId, returnReason.trim());
    showToast("Return request sent to admin!", "success");
    setConfirmModal(null);
    setReturnReason("");
    await fetchMyReturnRequests();
  } catch (err) {
    showToast(err.response?.data?.detail || "Failed to submit request", "error");
  }
};

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setFormError(""); setFormSuccess("");
    try {
      await createEmployee(form);
      setFormSuccess("Employee created successfully");
      setForm({ EmployeeCode: "", EmployeeName: "", Department: "", Designation: "", Email: "", Mobile: "", JoiningDate: "" });
      fetchEmployees();
      setTimeout(() => { setShowForm(false); setFormSuccess(""); }, 1500);
    } catch (err) { setFormError(err.response?.data?.detail || "Failed to create employee"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this employee?")) return;
    try { await deleteEmployee(id); fetchEmployees(); }
    catch (err) { console.error(err); }
  };

  const handleViewAssets = async (employee) => {
    setSelectedEmployee(employee);
    setLoadingAssets(true);
    try {
      const data = await getAssignmentsByEmployee(employee.EmployeeID);
      setAssignments(data);
    } catch { setAssignments([]); }
    finally { setLoadingAssets(false); }
  };

  const handleGenerateLogin = async (emp) => {
    if (loggedInEmps.has(emp.EmployeeID)) {
      showToast(`Login already exists for ${emp.EmployeeName}`, "error");
      return;
    }
    if (!window.confirm(`Create login account for ${emp.EmployeeName} (${emp.Email})?`)) return;
    try {
      const res = await generateEmployeeLogin(emp.EmployeeID);
      setLoggedInEmps(prev => new Set([...prev, emp.EmployeeID]));
      showToast(res.message, "success");
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to create login", "error");
    }
  };

  const filtered = employees.filter((e) =>
    (e.EmployeeName || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.EmployeeCode || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.Department || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.Email || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = employees.filter((e) => e.IsActive).length;

  const s = {
    page: { minHeight: "100vh", backgroundColor: t.pageBg, transition: "background 0.3s" },
    content: { maxWidth: "1400px", margin: "0 auto", padding: "28px 32px" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" },
    pageTitle: { fontSize: "26px", fontWeight: "800", color: t.textPrimary, margin: 0, letterSpacing: "-0.5px" },
    pageSubtitle: { fontSize: "13px", color: t.textSecondary, marginTop: "4px" },
    headerActions: { display: "flex", gap: "12px", alignItems: "center" },
    searchWrap: { position: "relative" },
    searchInput: {
      width: "260px", height: "46px", padding: "0 16px", borderRadius: "9px",
      border: `1.5px solid ${t.border}`, background: t.inputBg, color: t.inputColor,
      fontSize: "13px", outline: "none", boxSizing: "border-box",
    },
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
      borderRadius: "9px", color: t.inputColor, fontSize: "13px", outline: "none", boxSizing: "border-box",
    },
    errorMsg: {
      color: "#dc2626", fontSize: "13px", padding: "10px 14px",
      background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "9px", marginBottom: "12px",
    },
    successMsg: {
      color: "#059669", fontSize: "13px", padding: "10px 14px",
      background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "9px", marginBottom: "12px",
    },
    mainLayout: { display: "flex", gap: "24px", alignItems: "flex-start" },
    tableCard: {
      flex: 1, background: t.surface, border: `1.5px solid ${t.border}`, borderRadius: "14px",
      overflow: "hidden", boxShadow: `0 1px 6px ${t.shadow}`,
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      padding: "13px 18px", textAlign: "left", fontSize: "11px", fontWeight: "700",
      color: t.textPrimary, textTransform: "uppercase", letterSpacing: "0.08em",
      borderBottom: `1.5px solid ${t.border}`, background: t.thBg,
    },
    tr: { borderBottom: `1px solid ${t.rowBorder}` },
    trSelected: { background: isDark ? "rgba(96,165,250,0.08)" : "rgba(37,99,235,0.06)" },
    td: { padding: "13px 18px", fontSize: "13px", color: t.textBody },
    codeBadge: {
      padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
      background: t.codeBg, color: t.codeColor, fontFamily: "monospace",
    },
    badgeActive: {
      padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
      background: t.badgeActiveBg, color: t.badgeActiveColor,
    },
    badgeInactive: {
      padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
      background: t.badgeInactiveBg, color: t.badgeInactiveColor,
    },
    actionBtns: { display: "flex", gap: "6px" },
    btnView: {
      padding: "6px 12px", borderRadius: "7px", border: `1.5px solid ${t.border}`,
      background: t.surfaceAlt, color: t.textPrimary, fontSize: "12px", fontWeight: "700", cursor: "pointer",
    },
    btnDelete: {
      padding: "6px 12px", borderRadius: "7px", border: "1.5px solid #fecaca",
      background: "#fef2f2", color: "#dc2626", fontSize: "12px", fontWeight: "700", cursor: "pointer",
    },
    btnReport: {
      padding: "6px 12px", borderRadius: "7px", border: `1.5px solid ${t.border}`,
      background: t.codeBg, color: t.codeColor, fontSize: "12px", fontWeight: "700", cursor: "pointer",
    },
    btnGenLogin: {
      padding: "6px 14px", borderRadius: "7px", border: "none",
      background: "#16a34a", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer",
    },
    btnLoginDone: {
      padding: "6px 14px", borderRadius: "7px",
      background: "#fef2f2", color: "#991b1b", border: "1.5px solid #fecaca",
      fontSize: "12px", fontWeight: "700", cursor: "pointer",
    },
    emptyState: { padding: "60px 24px", textAlign: "center" },
    emptyIcon: { fontSize: "40px", marginBottom: "12px" },
    emptyTitle: { fontSize: "16px", fontWeight: "700", color: t.textPrimary, marginBottom: "4px" },
    emptyDesc: { fontSize: "13px", color: t.textSecondary },
    emptySmall: { padding: "24px", color: t.textSecondary, fontSize: "13px", textAlign: "center" },
    loadingText: { padding: "24px", color: t.textSecondary, textAlign: "center", fontSize: "13px" },
    sidePanel: {
      width: "340px", background: t.surface, border: `1.5px solid ${t.border}`, borderRadius: "14px",
      padding: "20px", flexShrink: 0, boxShadow: `0 1px 6px ${t.shadow}`,
    },
    sidePanelHeader: {
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      marginBottom: "18px", paddingBottom: "14px", borderBottom: `1.5px solid ${t.border}`,
    },
    spTopBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" },
    spAvatar: {
      width: "52px", height: "52px", borderRadius: "14px",
      background: "linear-gradient(135deg, #2563eb, #1e3a8a)",
      color: "#fff", fontSize: "22px", fontWeight: "800",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
    },
    spNameBlock: { marginBottom: "16px" },
    sidePanelTitle: { fontSize: "17px", fontWeight: "800", color: t.textPrimary, margin: "0 0 4px" },
    sidePanelSub: { fontSize: "12px", color: t.textSecondary, margin: "0 0 8px" },
    spDeptBadge: {
      display: "inline-block", padding: "3px 10px", borderRadius: "20px",
      background: t.codeBg, color: t.codeColor, fontSize: "11px", fontWeight: "700",
    },
    spDivider: { height: "1.5px", background: t.border, marginBottom: "16px" },
    spEmpty: {
      textAlign: "center", padding: "28px 16px", background: t.surfaceAlt,
      borderRadius: "12px", border: `1.5px dashed ${t.border}`,
    },
    spAssetList: { display: "flex", flexDirection: "column", gap: "10px" },
    spListLabel: { fontSize: "11px", fontWeight: "700", color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" },
    assetIconWrap: {
      width: "36px", height: "36px", borderRadius: "10px", background: t.codeBg,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    btnClose: {
      background: t.surfaceAlt, border: `1.5px solid ${t.border}`, borderRadius: "7px",
      color: t.textPrimary, cursor: "pointer", fontSize: "13px",
      width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
    },
    statRow: { display: "flex", gap: "8px", marginBottom: "16px" },
    statBox: {
      flex: 1, background: t.surfaceAlt, borderRadius: "10px", padding: "12px", textAlign: "center",
      border: `1.5px solid ${t.border}`,
    },
    statNum: { fontSize: "20px", fontWeight: "800" },
    statLabel: { fontSize: "10px", color: t.textSecondary, marginTop: "2px", fontWeight: "700", letterSpacing: "0.06em" },
    assetItem: {
      display: "flex", alignItems: "center", gap: "12px",
      padding: "12px 14px", background: t.surface, borderRadius: "12px",
      border: `1.5px solid ${t.border}`, boxShadow: `0 1px 4px ${t.shadow}`,
    },
    assetName: { fontSize: "13px", fontWeight: "600", color: t.textPrimary, marginBottom: "2px" },
    assetMeta: { fontSize: "11px", color: t.textSecondary },
    miniBadgeHolding: {
      padding: "3px 8px", borderRadius: "5px", fontSize: "10px", fontWeight: "700",
      background: t.badgeActiveBg, color: t.badgeActiveColor,
    },
    miniBadgeReturned: {
      padding: "3px 8px", borderRadius: "5px", fontSize: "10px", fontWeight: "700",
      background: t.codeBg, color: t.codeColor,
    },
    toastOverlay: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, pointerEvents: "none",
    },
    toastBox: {
      display: "flex", alignItems: "center", gap: "12px",
      padding: "18px 28px", borderRadius: "14px", fontSize: "15px", fontWeight: "600",
      boxShadow: "0 8px 32px rgba(0,0,0,0.18)", pointerEvents: "auto",
    },
    toastSuccess: { background: "#f0fdf4", border: "1.5px solid #86efac", color: "#166534" },
    toastError:   { background: "#fef2f2", border: "1.5px solid #fca5a5", color: "#991b1b" },
    toastIcon: { fontSize: "20px" },
    toastMsg:  { fontSize: "14px" },
  };

  return (
    <div style={s.page}>
      <Navbar />

      {/* CENTERED TOAST */}
      {toast && (
        <div style={s.toastOverlay}>
          <div style={{ ...s.toastBox, ...(toast.type === "error" ? s.toastError : s.toastSuccess) }}>
            <span style={s.toastIcon}>{toast.type === "error" ? "⚠️" : "✅"}</span>
            <span style={s.toastMsg}>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returnModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: t.surface, borderRadius: "16px", padding: "28px", width: "460px", maxWidth: "95vw", boxShadow: "0 8px 40px rgba(0,0,0,0.22)", border: `1.5px solid ${t.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: t.textPrimary }}>Return Request</h3>
              <button onClick={() => setReturnModal(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: t.textSecondary }}>✕</button>
            </div>
            <p style={{ fontSize: "13px", color: t.textSecondary, marginBottom: "16px" }}>Select which asset you want to request a return for:</p>
            {returnModalLoading ? (
              <p style={{ color: t.textSecondary, fontSize: "13px" }}>Loading assets...</p>
            ) : returnModalAssignments.length === 0 ? (
              <p style={{ color: t.textSecondary, fontSize: "13px" }}>No currently held assets found.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {returnModalAssignments.map((a) => {
                  const alreadyRequested = myReturnRequests.some(
                    (r) => r.AssignmentID === a.AssignmentID && r.Status === "Pending"
                  );
                  return (
                    <div key={a.AssignmentID} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, background: t.surfaceAlt }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: t.textPrimary }}>{a.AssetName || `Asset #${a.AssetID}`}</div>
                        <div style={{ fontSize: "11px", color: t.textSecondary }}>{a.AssetType}{a.Brand ? ` — ${a.Brand}` : ""}</div>
                      </div>
                      {alreadyRequested ? (
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#dc2626", background: "#fef2f2", padding: "3px 8px", borderRadius: "5px" }}>Pending</span>
                      ) : (
                        <button
                          style={{ padding: "6px 14px", borderRadius: "7px", border: "none", background: "#16a34a", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                          onClick={() => {
                            setConfirmModal({ assignmentId: a.AssignmentID, assetName: a.AssetName });
                            setReturnReason("");
                            setReasonError("");
                            setReturnModal(null);
                          }}
                        >
                          Return
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={s.content}>
        {/* Header */}
        <div style={s.headerRow}>
          <div>
            <h2 style={s.pageTitle}>Employees</h2>
            <p style={s.pageSubtitle}>{activeCount} active of {employees.length} total employees</p>
          </div>
          <div style={s.headerActions}>
            <div style={s.searchWrap}>
              <input type="text" placeholder="Search employees..." value={search}
                onChange={(e) => setSearch(e.target.value)} style={s.searchInput} />
            </div>
            {isAdmin && (
              <button style={s.btnReport} onClick={() => downloadEmployeesReport()}>
                ⬇ Download All (PDF)
              </button>
            )}
            {isAdmin && (
              <button style={s.btnPrimary} onClick={() => setShowForm(!showForm)}>
                {showForm ? "✕" : "+ Add Employee"}
              </button>
            )}
          </div>
        </div>

        {/* Confirmation + Reason Modal */}
{confirmModal && (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    zIndex: 2001, display: "flex", alignItems: "center", justifyContent: "center"
  }}>
    <div style={{
      background: t.surface, borderRadius: "16px", padding: "28px",
      width: "460px", maxWidth: "95vw",
      boxShadow: "0 8px 40px rgba(0,0,0,0.22)", border: `1.5px solid ${t.border}`
    }}>
      {/* Header */}
      <h3 style={{ margin: "0 0 8px", fontSize: "17px", fontWeight: "800", color: t.textPrimary }}>
        Confirm Return Request
      </h3>
      <p style={{ margin: "0 0 20px", fontSize: "13px", color: t.textSecondary }}>
        Do you want to return <strong>{confirmModal.assetName}</strong>?
      </p>

      {/* Reason Textarea */}
      <label style={{ fontSize: "11px", fontWeight: "700", color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Reason for Return
      </label>
      <div style={{ position: "relative", marginTop: "6px", marginBottom: "16px" }}>
        <textarea
          maxLength={200}
          rows={4}
          value={returnReason}
          onChange={(e) => { setReturnReason(e.target.value); setReasonError(""); }}
          placeholder="Enter reason for returning this asset..."
          style={{
            width: "100%", padding: "12px 14px", borderRadius: "9px",
            border: `1.5px solid ${reasonError ? "#fca5a5" : t.border}`,
            background: t.inputBg, color: t.inputColor, fontSize: "13px",
            outline: "none", resize: "none", boxSizing: "border-box",
          }}
        />
        <span style={{
          position: "absolute", bottom: "10px", right: "12px",
          fontSize: "11px", color: t.textSecondary
        }}>
          {returnReason.length}/200
        </span>
      </div>

      {reasonError && (
        <p style={{ color: "#dc2626", fontSize: "12px", margin: "-8px 0 12px" }}>
          {reasonError}
        </p>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button
          onClick={() => setConfirmModal(null)}
          style={{
            padding: "10px 20px", borderRadius: "8px", border: `1.5px solid ${t.border}`,
            background: t.surfaceAlt, color: t.textPrimary, fontSize: "13px",
            fontWeight: "700", cursor: "pointer"
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmitReturnRequest}
          style={{
            padding: "10px 20px", borderRadius: "8px", border: "none",
            background: "linear-gradient(135deg, #2563eb, #1e3a8a)",
            color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer"
          }}
        >
          Yes, Request Return
        </button>
      </div>
    </div>
  </div>
)}

        {/* Form */}
        {showForm && isAdmin && (
          <div style={s.formCard}>
            <h3 style={s.formTitle}>New Employee</h3>
            <form onSubmit={handleCreateEmployee}>
              <div style={s.formGrid}>
                {[
                  { label: "Employee Code", name: "EmployeeCode", type: "text", placeholder: "EMP001" },
                  { label: "Full Name", name: "EmployeeName", type: "text", placeholder: "Ravi Kumar" },
                  { label: "Department", name: "Department", type: "text", placeholder: "IT" },
                  { label: "Designation", name: "Designation", type: "text", placeholder: "Software Engineer" },
                  { label: "Email", name: "Email", type: "email", placeholder: "ravi@company.com" },
                  { label: "Mobile", name: "Mobile", type: "text", placeholder: "9876543210" },
                  { label: "Joining Date", name: "JoiningDate", type: "date", placeholder: "" },
                ].map((f) => (
                  <div key={f.name} style={s.formGroup}>
                    <label style={s.label}>{f.label}</label>
                    <input type={f.type} name={f.name} value={form[f.name]}
                      onChange={handleFormChange} placeholder={f.placeholder} style={s.input} />
                  </div>
                ))}
              </div>
              {formError && <p style={s.errorMsg}>{formError}</p>}
              {formSuccess && <p style={s.successMsg}>{formSuccess}</p>}
              <button type="submit" style={s.btnPrimary}>Create Employee</button>
            </form>
          </div>
        )}

        <div style={s.mainLayout}>
          <div style={s.tableCard}>
            {loading ? (
              <p style={s.loadingText}>Loading employees...</p>
            ) : filtered.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>{"\uD83D\uDC65"}</div>
                <p style={s.emptyTitle}>No employees found</p>
                <p style={s.emptyDesc}>{search ? "Try a different search term" : "Start by adding your first employee"}</p>
              </div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    {["S.No", "Code", "Name", "Department", "Designation", "Email", "Mobile", "Request", "Status", "Actions"].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp, index) => {
                    const hasLogin = loggedInEmps.has(emp.EmployeeID);
                    return (
                      <tr key={emp.EmployeeID} style={{
                        ...s.tr, ...(selectedEmployee?.EmployeeID === emp.EmployeeID ? s.trSelected : {}),
                      }}>
                        <td style={s.td}>{index + 1}</td>
                        <td style={s.td}><span style={s.codeBadge}>{emp.EmployeeCode || "-"}</span></td>
                        <td style={{ ...s.td, fontWeight: "600", color: t.textPrimary }}>{emp.EmployeeName}</td>
                        <td style={s.td}>{emp.Department || "-"}</td>
                        <td style={s.td}>{emp.Designation || "-"}</td>
                        <td style={s.td}>{emp.Email || "-"}</td>
                        <td style={s.td}>{emp.Mobile || "-"}</td>
                        <td style={s.td}>
                          {isAdmin ? (
                            <button
                              style={hasLogin ? s.btnLoginDone : s.btnGenLogin}
                              onClick={() => handleGenerateLogin(emp)}
                            >
                              {hasLogin ? "Login Created" : "Generate Login"}
                            </button>
                          ) : (
                            (() => {
                              const pendingCount = myReturnRequests.filter((r) => r.Status === "Pending").length;
                              return (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                  <button
                                    style={{ padding: "6px 12px", borderRadius: "7px", border: "none", background: "#16a34a", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                    onClick={() => handleOpenReturnModal(emp)}
                                  >
                                    Return Request
                                  </button>
                                  {pendingCount > 0 && (
                                    <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "#fef2f2", color: "#dc2626" }}>
                                      {pendingCount} Pending
                                    </span>
                                  )}
                                </div>
                              );
                            })()
                          )}
                        </td>
                        <td style={s.td}>
                          <span style={emp.IsActive ? s.badgeActive : s.badgeInactive}>
                            {emp.IsActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={s.td}>
                          <div style={s.actionBtns}>
                            <button style={s.btnView} onClick={() => handleViewAssets(emp)}>View Assets</button>
                            {isAdmin && (
                              <button style={s.btnReport} onClick={() => downloadEmployeeReport(emp.EmployeeID, emp.EmployeeCode)}>
                                Report
                              </button>
                            )}
                            {isAdmin && (
                              <button style={s.btnDelete} onClick={() => handleDelete(emp.EmployeeID)}>Deactivate</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {selectedEmployee && (
            <div style={s.sidePanel}>
              {/* Header with avatar */}
              <div style={s.spTopBar}>
                <div style={s.spAvatar}>
                  {selectedEmployee.EmployeeName.charAt(0).toUpperCase()}
                </div>
                <button style={s.btnClose} onClick={() => setSelectedEmployee(null)}>&#10005;</button>
              </div>
              <div style={s.spNameBlock}>
                <h3 style={s.sidePanelTitle}>{selectedEmployee.EmployeeName}</h3>
                <p style={s.sidePanelSub}>{selectedEmployee.Designation}</p>
                <span style={s.spDeptBadge}>{selectedEmployee.Department}</span>
              </div>

              <div style={s.spDivider} />

              {loadingAssets ? (
                <p style={s.loadingText}>Loading assets...</p>
              ) : (
                <>
                  {/* Stat cards */}
                  <div style={s.statRow}>
                    <div style={s.statBox}>
                      <div style={{ ...s.statNum, color: "#1e3a8a" }}>{assignments.length}</div>
                      <div style={s.statLabel}>TOTAL</div>
                    </div>
                    <div style={s.statBox}>
                      <div style={{ ...s.statNum, color: "#059669" }}>{assignments.filter((a) => !a.IsReturned).length}</div>
                      <div style={s.statLabel}>HOLDING</div>
                    </div>
                    <div style={s.statBox}>
                      <div style={{ ...s.statNum, color: "#dc2626" }}>{assignments.filter((a) => a.IsReturned).length}</div>
                      <div style={s.statLabel}>RETURNED</div>
                    </div>
                  </div>

                  {assignments.length === 0 ? (
                    <div style={s.spEmpty}>
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
                      <p style={{ margin: 0, fontWeight: "700", color: "#1e3a8a", fontSize: "13px" }}>No assets assigned</p>
                      <p style={{ margin: "4px 0 0", color: "#3b82f6", fontSize: "12px" }}>This employee has no asset history</p>
                    </div>
                  ) : (
                    <div style={s.spAssetList}>
                      <p style={s.spListLabel}>Asset History</p>
                      {assignments.map((a) => (
                        <div key={a.AssignmentID} style={s.assetItem}>
                          <div style={s.assetIconWrap}>
                            <span style={{ fontSize: "16px" }}>
                              {a.AssetType?.toLowerCase().includes("laptop") ? "💻"
                                : a.AssetType?.toLowerCase().includes("phone") || a.AssetType?.toLowerCase().includes("mobile") ? "📱"
                                : a.AssetType?.toLowerCase().includes("monitor") ? "🖥️"
                                : a.AssetType?.toLowerCase().includes("mouse") ? "🖱️"
                                : a.AssetType?.toLowerCase().includes("keyboard") ? "⌨️"
                                : "📦"}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={s.assetName}>{a.AssetName || `Asset #${a.AssetID}`}</div>
                            <div style={s.assetMeta}>{a.AssetType}{a.Brand ? ` — ${a.Brand}` : ""}</div>
                            <div style={s.assetMeta}>📅 {a.AssignedDate}</div>
                          </div>
                          <span style={a.IsReturned ? s.miniBadgeReturned : s.miniBadgeHolding}>
                            {a.IsReturned ? "Returned" : "Holding"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;