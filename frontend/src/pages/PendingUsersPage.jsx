import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getPendingUsers, approveUser, rejectUser, adminCreateUser } from "../api/authApi";
import { getAllEmployees } from "../api/employeeApi";

const EMPTY_NEW_USER = {
  username: "", email: "", password: "", role: "Admin", EmployeeID: "",
};

const PendingUsersPage = () => {
  const [pending, setPending]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [message, setMessage]     = useState("");
  // Tracks which employee is picked per pending user: { [userId]: employeeId }
  const [picked, setPicked]       = useState({});

  // Create-user form
  const [showForm, setShowForm]   = useState(false);
  const [newUser, setNewUser]     = useState(EMPTY_NEW_USER);
  const [formError, setFormError] = useState("");

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError("");
    setMessage("");
    try {
      const payload = {
        username: newUser.username,
        email:    newUser.email,
        password: newUser.password,
        role:     newUser.role,
        EmployeeID: newUser.EmployeeID ? Number(newUser.EmployeeID) : null,
      };
      const data = await adminCreateUser(payload);
      setMessage(data?.message || "Account created successfully.");
      setNewUser(EMPTY_NEW_USER);
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to create account.");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingData, employeeData] = await Promise.all([
        getPendingUsers(),
        getAllEmployees(),
      ]);
      setPending(pendingData);
      setEmployees(employeeData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    const employeeId = picked[userId];
    if (!employeeId) {
      setMessage("Please select an employee to link before approving.");
      return;
    }
    try {
      await approveUser(userId, Number(employeeId));
      setMessage("User approved and linked successfully.");
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to approve user.");
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm("Reject this registration?")) return;
    try {
      await rejectUser(userId);
      setMessage("User rejected.");
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to reject user.");
    }
  };

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.content}>
        <div style={s.headerRow}>
          <div>
            <h2 style={s.pageTitle}>User Management</h2>
            <p style={s.pageSubtitle}>
              {pending.length} user{pending.length === 1 ? "" : "s"} awaiting approval
            </p>
          </div>
          <button style={s.btnPrimary} onClick={() => setShowForm(!showForm)}>
            {showForm ? "✕ Cancel" : "+ Add Admin"}
          </button>
        </div>

        {message && <p style={s.infoMsg}>{message}</p>}

        {/* Create User / Admin form */}
        {showForm && (
          <div style={s.formCard}>
            <h3 style={s.formTitle}>Create New Account</h3>
            <form onSubmit={handleCreateUser}>
              <div style={s.formGrid}>
                <div style={s.formGroup}>
                  <label style={s.label}>Username</label>
                  <input style={s.input} value={newUser.username} required
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Email</label>
                  <input type="email" style={s.input} value={newUser.email} required
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Password</label>
                  <input type="password" style={s.input} value={newUser.password} required
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                </div>
              </div>
              {formError && <p style={s.errorBox}>{formError}</p>}
              <button type="submit" style={s.btnPrimary}>Create Account</button>
            </form>
          </div>
        )}

        <div style={s.tableCard}>
          {loading ? (
            <p style={s.loadingText}>Loading...</p>
          ) : pending.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>🛡️</div>
              <p style={s.emptyTitle}>No admins created yet</p>
              <p style={s.emptyDesc}>Click <strong>+ Add Admin</strong> above to create a new admin account.</p>
              <p style={s.emptyDesc}>Fill in the <strong>Username</strong>, <strong>Email</strong>, and <strong>Password</strong> — the account will be created with Admin access immediately.</p>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {["Username", "Email", "Registered", "Link to Employee", "Actions"].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map((u) => (
                  <tr key={u.UserID} style={s.tr}>
                    <td style={{ ...s.td, fontWeight: "700", color: "#1e3a8a" }}>{u.Username}</td>
                    <td style={s.td}>{u.Email}</td>
                    <td style={s.td}>{u.CreatedDate ? String(u.CreatedDate).slice(0, 10) : "-"}</td>
                    <td style={s.td}>
                      <select
                        style={s.select}
                        value={picked[u.UserID] || ""}
                        onChange={(e) =>
                          setPicked({ ...picked, [u.UserID]: e.target.value })
                        }
                      >
                        <option value="">Select employee...</option>
                        {employees.map((emp) => (
                          <option key={emp.EmployeeID} value={emp.EmployeeID}>
                            {emp.EmployeeCode ? `${emp.EmployeeCode} — ` : ""}
                            {emp.EmployeeName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={s.td}>
                      <div style={s.actionBtns}>
                        <button style={s.btnApprove} onClick={() => handleApprove(u.UserID)}>
                          Approve
                        </button>
                        <button style={s.btnReject} onClick={() => handleReject(u.UserID)}>
                          Reject
                        </button>
                      </div>
                    </td>
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

const s = {
  page: { minHeight: "100vh", backgroundColor: "#eff6ff" },
  content: { maxWidth: "1400px", margin: "0 auto", padding: "28px 32px" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  pageTitle: { fontSize: "26px", fontWeight: "800", color: "#1e3a8a", margin: 0, letterSpacing: "-0.5px" },
  pageSubtitle: { fontSize: "13px", color: "#3b82f6", marginTop: "4px" },
  btnPrimary: {
    padding: "12px 24px", background: "linear-gradient(135deg, #2563eb, #1e3a8a)",
    color: "#fff", border: "none", borderRadius: "9px", fontSize: "13px",
    fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
  },
  formCard: {
    background: "#ffffff", border: "1.5px solid #bfdbfe", borderRadius: "14px",
    padding: "28px", marginBottom: "24px", boxShadow: "0 1px 6px rgba(37,99,235,0.08)",
  },
  formTitle: { fontSize: "16px", fontWeight: "800", color: "#1e3a8a", marginBottom: "20px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "11px", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.08em" },
  input: {
    height: "46px", padding: "0 14px", backgroundColor: "#fff", border: "1.5px solid #bfdbfe",
    borderRadius: "9px", color: "#1e3a8a", fontSize: "13px", outline: "none", boxSizing: "border-box",
  },
  errorBox: {
    color: "#dc2626", fontSize: "13px", padding: "10px 14px",
    background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "9px", marginBottom: "12px",
  },
  infoMsg: {
    color: "#1d4ed8", fontSize: "13px", padding: "10px 14px",
    background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "9px", marginBottom: "16px",
  },
  tableCard: {
    background: "#ffffff", border: "1.5px solid #bfdbfe", borderRadius: "14px",
    overflow: "hidden", boxShadow: "0 1px 6px rgba(37,99,235,0.08)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "13px 18px", textAlign: "left", fontSize: "11px", fontWeight: "700",
    color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.08em",
    borderBottom: "1.5px solid #bfdbfe", background: "#eff6ff",
  },
  tr: { borderBottom: "1px solid #dbeafe" },
  td: { padding: "13px 18px", fontSize: "13px", color: "#1e40af" },
  select: {
    height: "40px", padding: "0 12px", borderRadius: "8px",
    border: "1.5px solid #bfdbfe", background: "#fff", color: "#1e3a8a",
    fontSize: "13px", outline: "none", minWidth: "220px",
  },
  actionBtns: { display: "flex", gap: "6px" },
  btnApprove: {
    padding: "7px 16px", borderRadius: "7px", border: "none",
    background: "linear-gradient(135deg, #2563eb, #1e3a8a)", color: "#fff",
    fontSize: "12px", fontWeight: "700", cursor: "pointer",
  },
  btnReject: {
    padding: "7px 16px", borderRadius: "7px", border: "1.5px solid #fecaca",
    background: "#fef2f2", color: "#dc2626", fontSize: "12px", fontWeight: "700", cursor: "pointer",
  },
  emptyState: { padding: "60px 24px", textAlign: "center" },
  emptyIcon: { fontSize: "40px", marginBottom: "12px" },
  emptyTitle: { fontSize: "16px", fontWeight: "700", color: "#1e3a8a", marginBottom: "4px" },
  emptyDesc: { fontSize: "13px", color: "#3b82f6" },
  loadingText: { padding: "24px", color: "#3b82f6", textAlign: "center", fontSize: "13px" },
};

export default PendingUsersPage;
