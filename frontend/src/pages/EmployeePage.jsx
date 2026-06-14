import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getAllEmployees, createEmployee, deleteEmployee } from "../api/employeeApi";
import { getAssignmentsByEmployee } from "../api/assignmentApi";
import { downloadEmployeeReport, downloadEmployeesReport } from "../api/reportApi";
import { useAuth } from "../context/AuthContext";

const EmployeePage = () => {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    EmployeeCode: "", EmployeeName: "", Department: "",
    Designation: "", Email: "", Mobile: "", JoiningDate: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getAllEmployees();
      setEmployees(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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

  const filtered = employees.filter((e) =>
    (e.EmployeeName || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.EmployeeCode || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.Department || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.Email || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = employees.filter((e) => e.IsActive).length;

  return (
    <div style={s.page}>
      <Navbar />
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
          {/* Table */}
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
                    {["Code", "Name", "Department", "Designation", "Email", "Mobile", "Status", "Actions"].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => (
                    <tr key={emp.EmployeeID} style={{
                      ...s.tr, ...(selectedEmployee?.EmployeeID === emp.EmployeeID ? s.trSelected : {}),
                    }}>
                      <td style={s.td}><span style={s.codeBadge}>{emp.EmployeeCode || "-"}</span></td>
                      <td style={{ ...s.td, fontWeight: "600", color: "#0f172a" }}>{emp.EmployeeName}</td>
                      <td style={s.td}>{emp.Department || "-"}</td>
                      <td style={s.td}>{emp.Designation || "-"}</td>
                      <td style={s.td}>{emp.Email || "-"}</td>
                      <td style={s.td}>{emp.Mobile || "-"}</td>
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
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Side Panel */}
          {selectedEmployee && (
            <div style={s.sidePanel}>
              <div style={s.sidePanelHeader}>
                <div>
                  <h3 style={s.sidePanelTitle}>{selectedEmployee.EmployeeName}</h3>
                  <p style={s.sidePanelSub}>{selectedEmployee.Department} — {selectedEmployee.Designation}</p>
                </div>
                <button style={s.btnClose} onClick={() => setSelectedEmployee(null)}>&#10005;</button>
              </div>

              {loadingAssets ? (
                <p style={s.loadingText}>Loading...</p>
              ) : assignments.length === 0 ? (
                <p style={s.emptySmall}>No assets assigned.</p>
              ) : (
                <>
                  <div style={s.statRow}>
                    <div style={s.statBox}>
                      <div style={{ ...s.statNum, color: "#2563eb" }}>{assignments.length}</div>
                      <div style={s.statLabel}>TOTAL</div>
                    </div>
                    <div style={s.statBox}>
                      <div style={{ ...s.statNum, color: "#059669" }}>{assignments.filter((a) => !a.IsReturned).length}</div>
                      <div style={s.statLabel}>HOLDING</div>
                    </div>
                    <div style={s.statBox}>
                      <div style={{ ...s.statNum, color: "#64748b" }}>{assignments.filter((a) => a.IsReturned).length}</div>
                      <div style={s.statLabel}>RETURNED</div>
                    </div>
                  </div>
                  {assignments.map((a) => (
                    <div key={a.AssignmentID} style={s.assetItem}>
                      <div>
                        <div style={s.assetName}>{a.AssetName || `Asset #${a.AssetID}`}</div>
                        <div style={s.assetMeta}>{a.AssetType} {a.Brand ? `— ${a.Brand}` : ""}</div>
                        <div style={s.assetMeta}>Assigned: {a.AssignedDate}</div>
                      </div>
                      <span style={a.IsReturned ? s.miniBadgeReturned : s.miniBadgeHolding}>
                        {a.IsReturned ? "Returned" : "Holding"}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const s = {
  page: { minHeight: "100vh", backgroundColor: "#f8fafc" },
  content: { maxWidth: "1400px", margin: "0 auto", padding: "28px 32px" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" },
  pageTitle: { fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.5px" },
  pageSubtitle: { fontSize: "13px", color: "#64748b", marginTop: "4px" },
  headerActions: { display: "flex", gap: "12px", alignItems: "center" },
  searchWrap: { position: "relative" },
  searchInput: {
    width: "260px", height: "46px", padding: "0 16px", borderRadius: "9px",
    border: "1.5px solid #e2e8f0", background: "#fff", color: "#0f172a",
    fontSize: "13px", outline: "none", boxSizing: "border-box",
  },
  btnPrimary: {
    padding: "12px 24px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff", border: "none", borderRadius: "9px", fontSize: "13px",
    fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
  },
  formCard: {
    background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "14px",
    padding: "28px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  formTitle: { fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "20px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" },
  input: {
    height: "46px", padding: "0 14px", backgroundColor: "#fff", border: "1.5px solid #e2e8f0",
    borderRadius: "9px", color: "#0f172a", fontSize: "13px", outline: "none", boxSizing: "border-box",
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
    flex: 1, background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "14px",
    overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "13px 18px", textAlign: "left", fontSize: "11px", fontWeight: "700",
    color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em",
    borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc",
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  trSelected: { background: "rgba(37,99,235,0.04)" },
  td: { padding: "13px 18px", fontSize: "13px", color: "#475569" },
  codeBadge: {
    padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
    background: "rgba(37,99,235,0.06)", color: "#2563eb", fontFamily: "monospace",
  },
  badgeActive: {
    padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
    background: "rgba(5,150,105,0.08)", color: "#059669",
  },
  badgeInactive: {
    padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
    background: "rgba(220,38,38,0.06)", color: "#dc2626",
  },
  actionBtns: { display: "flex", gap: "6px" },
  btnView: {
    padding: "6px 12px", borderRadius: "7px", border: "1.5px solid #e2e8f0",
    background: "#fff", color: "#2563eb", fontSize: "12px", fontWeight: "700", cursor: "pointer",
  },
  btnDelete: {
    padding: "6px 12px", borderRadius: "7px", border: "1.5px solid #fecaca",
    background: "#fef2f2", color: "#dc2626", fontSize: "12px", fontWeight: "700", cursor: "pointer",
  },
  btnReport: {
    padding: "6px 12px", borderRadius: "7px", border: "1.5px solid #bbf7d0",
    background: "#f0fdf4", color: "#059669", fontSize: "12px", fontWeight: "700", cursor: "pointer",
  },
  emptyState: { padding: "60px 24px", textAlign: "center" },
  emptyIcon: { fontSize: "40px", marginBottom: "12px" },
  emptyTitle: { fontSize: "16px", fontWeight: "700", color: "#64748b", marginBottom: "4px" },
  emptyDesc: { fontSize: "13px", color: "#94a3b8" },
  emptySmall: { padding: "24px", color: "#64748b", fontSize: "13px", textAlign: "center" },
  loadingText: { padding: "24px", color: "#64748b", textAlign: "center", fontSize: "13px" },

  // Side Panel
  sidePanel: {
    width: "340px", background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "14px",
    padding: "20px", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  sidePanelHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: "18px", paddingBottom: "14px", borderBottom: "1.5px solid #e2e8f0",
  },
  sidePanelTitle: { fontSize: "15px", fontWeight: "800", color: "#0f172a", margin: 0 },
  sidePanelSub: { fontSize: "12px", color: "#64748b", marginTop: "3px" },
  btnClose: {
    background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "7px",
    color: "#64748b", cursor: "pointer", fontSize: "13px",
    width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
  },
  statRow: { display: "flex", gap: "8px", marginBottom: "16px" },
  statBox: {
    flex: 1, background: "#f8fafc", borderRadius: "10px", padding: "12px", textAlign: "center",
    border: "1.5px solid #e2e8f0",
  },
  statNum: { fontSize: "20px", fontWeight: "800" },
  statLabel: { fontSize: "10px", color: "#64748b", marginTop: "2px", fontWeight: "700", letterSpacing: "0.06em" },
  assetItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 14px", background: "#f8fafc", borderRadius: "10px",
    marginBottom: "8px", border: "1.5px solid #e2e8f0",
  },
  assetName: { fontSize: "13px", fontWeight: "600", color: "#0f172a", marginBottom: "2px" },
  assetMeta: { fontSize: "11px", color: "#64748b" },
  miniBadgeHolding: {
    padding: "3px 8px", borderRadius: "5px", fontSize: "10px", fontWeight: "700",
    background: "rgba(5,150,105,0.08)", color: "#059669",
  },
  miniBadgeReturned: {
    padding: "3px 8px", borderRadius: "5px", fontSize: "10px", fontWeight: "700",
    background: "rgba(100,116,139,0.08)", color: "#64748b",
  },
};

export default EmployeePage;
