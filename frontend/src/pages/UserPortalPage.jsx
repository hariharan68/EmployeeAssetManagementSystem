import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useTheme, getTheme } from "../context/ThemeContext";
import {
  getAllUsers, adminCreateUser, updateUser, deleteUser, resetUserPassword,
} from "../api/authApi";
import { getAllEmployees } from "../api/employeeApi";

// ── helpers ──────────────────────────────────────────────────────────────────

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const bg = type === "success" ? "#16a34a" : "#dc2626";
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: bg, color: "#fff", padding: "12px 20px",
      borderRadius: 10, fontWeight: 600, fontSize: 14,
      boxShadow: "0 4px 16px rgba(0,0,0,0.18)", maxWidth: 340,
    }}>{msg}</div>
  );
};

const Badge = ({ label, color, bg }) => (
  <span style={{
    display: "inline-block", padding: "2px 10px", borderRadius: 20,
    fontSize: 12, fontWeight: 700, color, background: bg,
  }}>{label}</span>
);

// ── main component ────────────────────────────────────────────────────────────

const UserPortalPage = () => {
  const { username: myUsername } = useAuth();
  const { isDark } = useTheme();
  const t = getTheme(isDark);

  const [users, setUsers]           = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);

  // filters
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterApproval, setFilterApproval] = useState("All");

  // modals
  const [addModal, setAddModal]           = useState(false);
  const [editModal, setEditModal]         = useState(null); // user object
  const [resetModal, setResetModal]       = useState(null); // user object
  const [resetLoading, setResetLoading]   = useState(false);
  const [deleteModal, setDeleteModal]     = useState(null); // user object

  // add form
  const [addForm, setAddForm] = useState({
    username: "", email: "", password: "", role: "User", employeeId: "",
  });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // edit form
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── data ──────────────────────────────────────────────────────────────────

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, e] = await Promise.all([getAllUsers(), getAllEmployees()]);
      setUsers(u);
      setEmployees(e);
    } catch {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── stats ─────────────────────────────────────────────────────────────────

  const totalUsers   = users.length;
  const totalAdmins  = users.filter(u => u.Role === "Admin").length;
  const totalActive  = users.filter(u => u.IsActive === 1).length;
  const totalPending = users.filter(u => u.IsApproved === 0).length;

  // ── filtered list ─────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.Username.toLowerCase().includes(q) ||
      u.Email.toLowerCase().includes(q);
    const matchRole = filterRole === "All" || u.Role === filterRole;
    const matchStatus = filterStatus === "All" ||
      (filterStatus === "Active" ? u.IsActive === 1 : u.IsActive === 0);
    const matchApproval = filterApproval === "All" ||
      (filterApproval === "Approved" ? u.IsApproved === 1 : u.IsApproved === 0);
    return matchSearch && matchRole && matchStatus && matchApproval;
  });

  // ── add user ──────────────────────────────────────────────────────────────

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError("");
    if (!addForm.username || !addForm.email || !addForm.password) {
      setAddError("Username, email and password are required"); return;
    }
    setAddLoading(true);
    try {
      await adminCreateUser({
        username: addForm.username,
        email: addForm.email,
        password: addForm.password,
        role: addForm.role,
        EmployeeID: addForm.employeeId ? Number(addForm.employeeId) : null,
      });
      showToast("User created successfully");
      setAddModal(false);
      setAddForm({ username: "", email: "", password: "", role: "User", employeeId: "" });
      fetchAll();
    } catch (err) {
      setAddError(err?.response?.data?.detail || "Failed to create user");
    } finally {
      setAddLoading(false);
    }
  };

  // ── edit user ─────────────────────────────────────────────────────────────

  const openEdit = (u) => {
    setEditForm({
      username: u.Username,
      email: u.Email,
      role: u.Role,
      isActive: u.IsActive,
      isApproved: u.IsApproved,
      employeeId: u.EmployeeID ?? "",
    });
    setEditError("");
    setEditModal(u);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);
    try {
      await updateUser(editModal.UserID, {
        username:   editForm.username,
        email:      editForm.email,
        role:       editForm.role,
        isActive:   Number(editForm.isActive),
        isApproved: Number(editForm.isApproved),
        employeeId: editForm.employeeId !== "" ? Number(editForm.employeeId) : null,
      });
      showToast("User updated successfully");
      setEditModal(null);
      fetchAll();
    } catch (err) {
      setEditError(err?.response?.data?.detail || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  // ── inline toggle ─────────────────────────────────────────────────────────

  const handleToggleActive = async (u) => {
    try {
      await updateUser(u.UserID, { isActive: u.IsActive === 1 ? 0 : 1 });
      showToast(`User ${u.IsActive === 1 ? "deactivated" : "activated"}`);
      fetchAll();
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const handleApprove = async (u) => {
    try {
      await updateUser(u.UserID, { isApproved: 1 });
      showToast(`${u.Username} approved`);
      fetchAll();
    } catch {
      showToast("Failed to approve user", "error");
    }
  };


  // ── reset password (clears hash → user must set new password on next login)
  const handleResetPassword = async () => {
    setResetLoading(true);
    try {
      await resetUserPassword(resetModal.UserID);
      showToast(`Password cleared for ${resetModal.Username}. They must set a new password on next login.`);
      setResetModal(null);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to reset password", "error");
    } finally {
      setResetLoading(false);
    }
  };

  // ── delete user ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteUser(deleteModal.UserID);
      showToast("User deleted");
      setDeleteModal(null);
      fetchAll();
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to delete user", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── employee map ──────────────────────────────────────────────────────────

  const empMap = {};
  employees.forEach(e => { empMap[e.EmployeeID] = e.EmployeeName; });

  // ── styles ────────────────────────────────────────────────────────────────

  const S = {
    page:     { background: t.pageBg, minHeight: "100vh" },
    wrap:     { maxWidth: 1320, margin: "0 auto", padding: "28px 32px" },
    card:     { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14,
                boxShadow: `0 2px 12px ${t.shadow}`, padding: 24, marginBottom: 24 },
    statGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 },
    statCard: (accent) => ({
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
      padding: "18px 22px", boxShadow: `0 1px 6px ${t.shadow}`,
      borderLeft: `4px solid ${accent}`,
    }),
    statNum:  { fontSize: 28, fontWeight: 800, color: t.textPrimary },
    statLbl:  { fontSize: 12, color: t.textSecondary, marginTop: 2, fontWeight: 500 },
    toolbar:  { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 },
    input:    { background: t.inputBg, color: t.inputColor, border: `1px solid ${t.border}`,
                borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none" },
    select:   { background: t.inputBg, color: t.inputColor, border: `1px solid ${t.border}`,
                borderRadius: 8, padding: "8px 10px", fontSize: 14, outline: "none", cursor: "pointer" },
    btnPrimary: {
      background: "#2563eb", color: "#fff", border: "none", borderRadius: 8,
      padding: "9px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer",
    },
    btnSm: (bg, color) => ({
      background: bg, color, border: "none", borderRadius: 6,
      padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
    }),
    table:  { width: "100%", borderCollapse: "collapse", fontSize: 14 },
    th:     { background: t.thBg, color: t.textSecondary, fontWeight: 700,
              padding: "10px 14px", textAlign: "left", fontSize: 12,
              borderBottom: `1px solid ${t.rowBorder}` },
    td:     { padding: "11px 14px", borderBottom: `1px solid ${t.rowBorder}`,
              color: t.textBody, verticalAlign: "middle" },
    overlay:{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
              zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" },
    modal:  { background: t.surface, borderRadius: 16, padding: "28px 32px",
              width: 460, maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)" },
    label:  { display: "block", fontSize: 13, fontWeight: 600,
              color: t.textSecondary, marginBottom: 5 },
    mInput: { width: "100%", background: t.inputBg, color: t.inputColor,
              border: `1px solid ${t.border}`, borderRadius: 8,
              padding: "9px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" },
    formRow:{ marginBottom: 16 },
    errTxt: { color: "#dc2626", fontSize: 13, marginTop: 8 },
    toggle: (on) => ({
      width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
      background: on ? "#16a34a" : "#94a3b8",
      position: "relative", transition: "background 0.2s", flexShrink: 0,
    }),
    toggleKnob: (on) => ({
      position: "absolute", top: 3, left: on ? 20 : 3, width: 16, height: 16,
      borderRadius: "50%", background: "#fff", transition: "left 0.2s",
    }),
  };

  const ModalField = ({ label, children }) => (
    <div style={S.formRow}><label style={S.label}>{label}</label>{children}</div>
  );

  const Toggle = ({ on, onChange }) => (
    <button type="button" style={S.toggle(on)} onClick={onChange}>
      <span style={S.toggleKnob(on)} />
    </button>
  );

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.wrap}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: t.textPrimary, margin: 0 }}>User Management</h2>
            <p style={{ color: t.textSecondary, fontSize: 14, marginTop: 4 }}>
              Manage all user accounts, roles, and access
            </p>
          </div>
          <button style={S.btnPrimary} onClick={() => { setAddForm({ username:"",email:"",password:"",role:"User",employeeId:"" }); setAddError(""); setAddModal(true); }}>
            + Add User
          </button>
        </div>

        {/* Stats */}
        <div style={S.statGrid}>
          {[
            { label: "Total Users",    value: totalUsers,   color: "#2563eb" },
            { label: "Admins",         value: totalAdmins,  color: "#7c3aed" },
            { label: "Active Accounts",value: totalActive,  color: "#16a34a" },
            { label: "Pending Approval",value: totalPending, color: "#d97706" },
          ].map(s => (
            <div key={s.label} style={S.statCard(s.color)}>
              <div style={S.statNum}>{s.value}</div>
              <div style={S.statLbl}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div style={S.card}>

          {/* Toolbar */}
          <div style={S.toolbar}>
            <input
              style={{ ...S.input, flex: 1, minWidth: 200 }}
              placeholder="Search username or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select style={S.select} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
            <select style={S.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select style={S.select} value={filterApproval} onChange={e => setFilterApproval(e.target.value)}>
              <option value="All">All Approval</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
            </select>
            {(search || filterRole !== "All" || filterStatus !== "All" || filterApproval !== "All") && (
              <button
                style={{ ...S.btnSm("#f1f5f9", "#64748b"), padding: "8px 14px", fontSize: 13 }}
                onClick={() => { setSearch(""); setFilterRole("All"); setFilterStatus("All"); setFilterApproval("All"); }}
              >Reset</button>
            )}
            <span style={{ color: t.textSecondary, fontSize: 13, marginLeft: "auto" }}>
              {filtered.length} of {totalUsers} users
            </span>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: t.textSecondary }}>Loading users...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: t.textSecondary }}>No users found</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {["#","Username","Email","Role","Status","Approval","Employee","Created","Actions"].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => {
                    const isSelf = u.Username === myUsername;
                    return (
                      <tr key={u.UserID} style={{ background: isSelf ? (isDark ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.03)") : "transparent" }}>
                        <td style={S.td}><span style={{ color: t.textSecondary, fontSize: 12 }}>{i + 1}</span></td>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600, color: t.textPrimary }}>
                            {u.Username}
                            {isSelf && <span style={{ marginLeft: 6, fontSize: 11, background: "#dbeafe", color: "#1d4ed8", borderRadius: 10, padding: "1px 7px", fontWeight: 700 }}>You</span>}
                          </div>
                        </td>
                        <td style={S.td}>{u.Email}</td>
                        <td style={S.td}>
                          <Badge
                            label={u.Role}
                            color={u.Role === "Admin" ? "#6d28d9" : "#1d4ed8"}
                            bg={u.Role === "Admin" ? (isDark ? "#3b0764" : "#ede9fe") : (isDark ? "#1e3a8a" : "#dbeafe")}
                          />
                        </td>
                        <td style={S.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Toggle on={u.IsActive === 1} onChange={() => handleToggleActive(u)} />
                            <span style={{ fontSize: 12, color: u.IsActive === 1 ? "#16a34a" : "#94a3b8" }}>
                              {u.IsActive === 1 ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td style={S.td}>
                          {u.IsApproved === 1
                            ? <Badge label="Approved" color={t.badgeActiveColor} bg={t.badgeActiveBg} />
                            : (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Badge label="Pending" color="#92400e" bg={isDark ? "#451a03" : "#fef3c7"} />
                                <button style={S.btnSm("#16a34a", "#fff")} onClick={() => handleApprove(u)}>Approve</button>
                              </div>
                            )
                          }
                        </td>
                        <td style={S.td}>
                          {u.EmployeeID
                            ? <span style={{ ...S.input, padding: "2px 8px", fontSize: 12 }}>
                                {empMap[u.EmployeeID] || `#${u.EmployeeID}`}
                              </span>
                            : <span style={{ color: t.textSecondary, fontSize: 12 }}>—</span>
                          }
                        </td>
                        <td style={S.td}>
                          <span style={{ fontSize: 12, color: t.textSecondary }}>
                            {new Date(u.CreatedDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                          </span>
                        </td>
                        <td style={S.td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={S.btnSm("#eff6ff", "#1d4ed8")} title="Edit" onClick={() => openEdit(u)}>Edit</button>
                            <button style={S.btnSm("#faf5ff", "#6d28d9")} title="Reset Password" onClick={() => setResetModal(u)}>Pwd</button>
                            {!isSelf && (
                              <button style={S.btnSm("#fef2f2", "#dc2626")} title="Delete" onClick={() => setDeleteModal(u)}>Del</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Add User Modal ──────────────────────────────────────────────── */}
      {addModal && (
        <div style={S.overlay} onClick={() => setAddModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: t.textPrimary, marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Add New User</h3>
            <form onSubmit={handleAdd}>
              <ModalField label="Username *">
                <input style={S.mInput} value={addForm.username} onChange={e => setAddForm(f => ({ ...f, username: e.target.value }))} placeholder="e.g. johndoe" />
              </ModalField>
              <ModalField label="Email *">
                <input style={S.mInput} type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" />
              </ModalField>
              <ModalField label="Password *">
                <input style={S.mInput} type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
              </ModalField>
              <ModalField label="Role">
                <select style={{ ...S.mInput, cursor: "pointer" }} value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </ModalField>
              <ModalField label="Link to Employee (optional)">
                <select style={{ ...S.mInput, cursor: "pointer" }} value={addForm.employeeId} onChange={e => setAddForm(f => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">— No Employee —</option>
                  {employees.map(e => (
                    <option key={e.EmployeeID} value={e.EmployeeID}>{e.EmployeeName} ({e.EmployeeCode})</option>
                  ))}
                </select>
              </ModalField>
              {addError && <div style={S.errTxt}>{addError}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button type="submit" style={{ ...S.btnPrimary, flex: 1 }} disabled={addLoading}>
                  {addLoading ? "Creating..." : "Create User"}
                </button>
                <button type="button" style={{ ...S.btnSm(t.surfaceAlt, t.textSecondary), flex: 1, padding: "9px 18px", fontSize: 14 }} onClick={() => setAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ─────────────────────────────────────────────── */}
      {editModal && (
        <div style={S.overlay} onClick={() => setEditModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: t.textPrimary, marginBottom: 4, fontSize: 18, fontWeight: 700 }}>Edit User</h3>
            <p style={{ color: t.textSecondary, fontSize: 13, marginBottom: 20 }}>Editing: <strong>{editModal.Username}</strong></p>
            <form onSubmit={handleEdit}>
              <ModalField label="Username">
                <input style={S.mInput} value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} />
              </ModalField>
              <ModalField label="Email">
                <input style={S.mInput} type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </ModalField>
              <ModalField label="Role">
                <select style={{ ...S.mInput, cursor: "pointer" }} value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </ModalField>
              <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                <div>
                  <label style={S.label}>Active</label>
                  <Toggle on={editForm.isActive === 1} onChange={() => setEditForm(f => ({ ...f, isActive: f.isActive === 1 ? 0 : 1 }))} />
                </div>
                <div>
                  <label style={S.label}>Approved</label>
                  <Toggle on={editForm.isApproved === 1} onChange={() => setEditForm(f => ({ ...f, isApproved: f.isApproved === 1 ? 0 : 1 }))} />
                </div>
              </div>
              <ModalField label="Link to Employee">
                <select style={{ ...S.mInput, cursor: "pointer" }} value={editForm.employeeId} onChange={e => setEditForm(f => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">— No Employee —</option>
                  {employees.map(e => (
                    <option key={e.EmployeeID} value={e.EmployeeID}>{e.EmployeeName} ({e.EmployeeCode})</option>
                  ))}
                </select>
              </ModalField>
              {editError && <div style={S.errTxt}>{editError}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button type="submit" style={{ ...S.btnPrimary, flex: 1 }} disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" style={{ ...S.btnSm(t.surfaceAlt, t.textSecondary), flex: 1, padding: "9px 18px", fontSize: 14 }} onClick={() => setEditModal(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ── Reset Password Confirm Modal ────────────────────────────────── */}
      {resetModal && (
        <div style={S.overlay} onClick={() => setResetModal(null)}>
          <div style={{ ...S.modal, width: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: "#d97706", marginBottom: 8, fontSize: 18, fontWeight: 700 }}>Reset Password</h3>
            <p style={{ color: t.textBody, marginBottom: 6 }}>
              This will <strong>clear the password</strong> for <strong>{resetModal.Username}</strong>.
            </p>
            <p style={{ color: t.textSecondary, fontSize: 13, marginBottom: 20 }}>
              On their next login, they will be asked to set a new password before they can access the system.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{ ...S.btnSm("#d97706", "#fff"), flex: 1, padding: "10px 18px", fontSize: 14, fontWeight: 700 }}
                onClick={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading ? "Resetting..." : "Yes, Reset Password"}
              </button>
              <button
                style={{ ...S.btnSm(t.surfaceAlt, t.textSecondary), flex: 1, padding: "10px 18px", fontSize: 14 }}
                onClick={() => setResetModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ────────────────────────────────────────── */}
      {deleteModal && (
        <div style={S.overlay} onClick={() => setDeleteModal(null)}>
          <div style={{ ...S.modal, width: 380 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: "#dc2626", marginBottom: 8, fontSize: 18, fontWeight: 700 }}>Delete User</h3>
            <p style={{ color: t.textBody, marginBottom: 6 }}>
              Are you sure you want to delete <strong>{deleteModal.Username}</strong>?
            </p>
            <p style={{ color: t.textSecondary, fontSize: 13, marginBottom: 20 }}>
              {deleteModal.Email} — This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{ ...S.btnSm("#dc2626", "#fff"), flex: 1, padding: "10px 18px", fontSize: 14, fontWeight: 700 }}
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                style={{ ...S.btnSm(t.surfaceAlt, t.textSecondary), flex: 1, padding: "10px 18px", fontSize: 14 }}
                onClick={() => setDeleteModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default UserPortalPage;
