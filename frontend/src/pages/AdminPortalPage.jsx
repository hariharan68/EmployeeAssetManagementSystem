import { useState } from "react";
import Navbar from "../components/Navbar";
import { adminCreateUser } from "../api/authApi";
import { useTheme, getTheme } from "../context/ThemeContext";

const EMPTY_NEW_USER = {
  username: "", email: "", password: "", role: "Admin", EmployeeID: "",
};

const AdminPortalPage = () => {
  const { theme, isDark } = useTheme();
  const t = getTheme(theme);

  const [showForm, setShowForm]   = useState(false);
  const [newUser, setNewUser]     = useState(EMPTY_NEW_USER);
  const [formError, setFormError] = useState("");
  const [message, setMessage]     = useState("");

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError("");
    setMessage("");
    try {
      const payload = {
        username:   newUser.username,
        email:      newUser.email,
        password:   newUser.password,
        role:       newUser.role,
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

  const s = {
    page: { minHeight: "100vh", backgroundColor: t.pageBg, transition: "background 0.3s" },
    content: { maxWidth: "1400px", margin: "0 auto", padding: "28px 32px" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
    pageTitle: { fontSize: "26px", fontWeight: "800", color: t.textPrimary, margin: 0, letterSpacing: "-0.5px" },
    pageSubtitle: { fontSize: "13px", color: t.textSecondary, marginTop: "4px" },
    btnPrimary: {
      padding: "12px 24px", background: t.accent,
      color: "#fff", border: "none", borderRadius: "9px", fontSize: "13px",
      fontWeight: "700", cursor: "pointer", boxShadow: "none",
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
    errorBox: {
      color: "#dc2626", fontSize: "13px", padding: "10px 14px",
      background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "9px", marginBottom: "12px",
    },
    infoMsg: {
      color: isDark ? "#93c5fd" : "#1d4ed8", fontSize: "13px", padding: "10px 14px",
      background: isDark ? "#1e3a5f" : "#eff6ff", border: `1px solid ${t.border}`, borderRadius: "9px", marginBottom: "16px",
    },
    emptyCard: {
      background: t.surface, border: `1.5px solid ${t.border}`, borderRadius: "14px",
      padding: "60px 24px", textAlign: "center", boxShadow: `0 1px 6px ${t.shadow}`,
    },
    emptyIcon: { fontSize: "40px", marginBottom: "12px" },
    emptyTitle: { fontSize: "16px", fontWeight: "700", color: t.textPrimary, marginBottom: "4px" },
    emptyDesc: { fontSize: "13px", color: t.textSecondary },
  };

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.content}>
        <div style={s.headerRow}>
          <div>
            <h2 style={s.pageTitle}>Admin Portal</h2>
            <p style={s.pageSubtitle}>Manage admin accounts and system settings</p>
          </div>
          <button style={s.btnPrimary} onClick={() => setShowForm(!showForm)}>
            {showForm ? "✕ Cancel" : "+ Add Admin"}
          </button>
        </div>

        {message && <p style={s.infoMsg}>{message}</p>}

        {showForm && (
          <div style={s.formCard}>
            <h3 style={s.formTitle}>Create New Admin Account</h3>
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

        {!showForm && (
          <div style={s.emptyCard}>
            <div style={s.emptyIcon}>🛡️</div>
            <p style={s.emptyTitle}>Admin Portal</p>
            <p style={s.emptyDesc}>Click <strong>+ Add Admin</strong> above to create a new admin account.</p>
            <p style={s.emptyDesc}>The account will be created with Admin access immediately.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortalPage;
