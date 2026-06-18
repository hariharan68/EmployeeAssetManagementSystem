import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getPendingUsers, approveUser, rejectUser } from "../api/authApi";
import { getAllEmployees } from "../api/employeeApi";
import { getReturnRequests, approveReturnRequest, ignoreReturnRequest } from "../api/assignmentApi";
import { useTheme, getTheme } from "../context/ThemeContext";
import { SiReasonstudios } from "react-icons/si";

const PendingUsersPage = () => {
  const { theme, isDark } = useTheme();
  const t = getTheme(theme);
  const [pending, setPending]           = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [message, setMessage]           = useState("");
  const [picked, setPicked]             = useState({});
  const [returnRequests, setReturnRequests] = useState([]);
  const [expandedReason, setExpandedReason] = useState(null); // requestId

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
      console.error("fetchData error:", err);
    } finally {
      setLoading(false);
    }
    // fetch return requests separately so a table-not-found error doesn't break the whole page
    try {
      const returnData = await getReturnRequests();
      setReturnRequests(returnData);
    } catch (err) {
      console.error("getReturnRequests error:", err?.response?.data || err.message);
      setReturnRequests([]);
    }
  };

  const handleApproveReturn = async (requestId) => {
    try {
      await approveReturnRequest(requestId);
      setMessage("Return request approved. Asset marked as returned.");
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to approve return request.");
    }
  };

  const handleIgnoreReturn = async (requestId) => {
    if (!window.confirm("Ignore this return request?")) return;
    try {
      await ignoreReturnRequest(requestId);
      setMessage("Return request ignored.");
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to ignore return request.");
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

  const s = {
    page: { minHeight: "100vh", backgroundColor: t.pageBg, transition: "background 0.3s" },
    content: { maxWidth: "1400px", margin: "0 auto", padding: "28px 32px" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
    pageTitle: { fontSize: "26px", fontWeight: "800", color: t.textPrimary, margin: 0, letterSpacing: "-0.5px" },
    pageSubtitle: { fontSize: "13px", color: t.textSecondary, marginTop: "4px" },
    infoMsg: {
      color: isDark ? "#93c5fd" : "#1d4ed8", fontSize: "13px", padding: "10px 14px",
      background: isDark ? "#1e3a5f" : "#eff6ff", border: `1px solid ${t.border}`, borderRadius: "9px", marginBottom: "16px",
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
    select: {
      height: "40px", padding: "0 12px", borderRadius: "8px",
      border: `1.5px solid ${t.border}`, background: t.inputBg, color: t.inputColor,
      fontSize: "13px", outline: "none", minWidth: "220px",
    },
    actionBtns: { display: "flex", gap: "6px" },
    btnApprove: {
      padding: "7px 16px", borderRadius: "7px", border: "none",
      background: t.accent, color: "#fff",
      fontSize: "12px", fontWeight: "700", cursor: "pointer",
    },
    btnReject: {
      padding: "7px 16px", borderRadius: "7px", border: "1.5px solid #fecaca",
      background: "#fef2f2", color: "#dc2626", fontSize: "12px", fontWeight: "700", cursor: "pointer",
    },
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
        <div style={s.headerRow}>
          <div>
            <h2 style={s.pageTitle}>Return Request</h2>
            <p style={s.pageSubtitle}>
              {pending.length} user{pending.length === 1 ? "" : "s"} awaiting approval
            </p>
          </div>
        </div>

        {message && <p style={s.infoMsg}>{message}</p>}

        {/* Return Requests Section */}
        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "800", color: t.textPrimary, marginBottom: "12px" }}>
            Return Requests
            {returnRequests.filter((r) => r.Status === "Pending").length > 0 && (
              <span style={{ marginLeft: "10px", padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", background: "#fef2f2", color: "#dc2626" }}>
                {returnRequests.filter((r) => r.Status === "Pending").length} Pending
              </span>
            )}
          </h3>
          <div style={s.tableCard}>
            {loading ? (
              <p style={s.loadingText}>Loading...</p>
            ) : returnRequests.length === 0 ? (
              <div style={{ padding: "32px 24px", textAlign: "center", color: t.textSecondary, fontSize: "13px" }}>
                No return requests yet.
              </div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    {["S.No", "Employee", "Asset", "Type / Brand", "Requested On", "Status", "Actions"].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {returnRequests.map((r, index) => (
                    <>
                      <tr key={r.RequestID} style={s.tr}>
                        <td style={s.td}>{index + 1}</td>
                        <td style={{ ...s.td, fontWeight: "700", color: t.textPrimary }}>
                          {r.EmployeeName}
                          {r.EmployeeCode && <span style={{ marginLeft: "6px", fontSize: "11px", color: t.textSecondary }}>({r.EmployeeCode})</span>}
                        </td>
                        <td style={s.td}>{r.AssetName || "-"}</td>
                        <td style={s.td}>{r.AssetType}{r.Brand ? ` — ${r.Brand}` : ""}</td>
                        <td style={s.td}>{r.RequestDate ? String(r.RequestDate).slice(0, 10) : "-"}</td>
                        <td style={s.td}>
                          <span style={{
                            padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                            background: r.Status === "Approved" ? "#dcfce7" : r.Status === "Ignored" ? "#f3f4f6" : "#fef2f2",
                            color:      r.Status === "Approved" ? "#166534" : r.Status === "Ignored" ? "#6b7280" : "#dc2626",
                          }}>
                            {r.Status}
                          </span>
                        </td>
                        <td style={s.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {r.Status === "Pending" && (
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button style={s.btnApprove} onClick={() => handleApproveReturn(r.RequestID)}>
                                  Approve
                                </button>
                                <button style={s.btnReject} onClick={() => handleIgnoreReturn(r.RequestID)}>
                                  Ignore
                                </button>
                              </div>
                            )}
                            {r.Reason && (
                              <button
                                onClick={() => setExpandedReason(expandedReason === r.RequestID ? null : r.RequestID)}
                                style={{
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  width: "28px", height: "28px", borderRadius: "50%",
                                  background: expandedReason === r.RequestID ? t.accent : t.codeBg,
                                  border: `1.5px solid ${expandedReason === r.RequestID ? "#2563eb" : "#93c5fd"}`,
                                  color: expandedReason === r.RequestID ? "#fff" : "#2563eb",
                                  fontSize: "11px", cursor: "pointer", transition: "all 0.2s",
                                  flexShrink: 0,
                                }}
                                title={expandedReason === r.RequestID ? "Hide Reason" : "View Reason"}
                              >
                                {expandedReason === r.RequestID ? "▲" : "▼"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedReason === r.RequestID && r.Reason && (
                        <tr>
                          <td colSpan={6} style={{ padding: "0 18px 14px 18px", background: isDark ? "#0f172a" : "#f8fafc" }}>
                            <div style={{
                              display: "flex", alignItems: "flex-start", gap: "12px",
                              background: isDark ? "#1e3a5f" : "#eff6ff",
                              border: `1.5px solid ${isDark ? "#2563eb55" : "#bfdbfe"}`,
                              borderRadius: "10px", padding: "12px 16px",
                            }}>
                              <span style={{ flexShrink: 0, color: "#2563eb", marginTop: "1px" }}>
                                <SiReasonstudios size={18} />
                              </span>
                              <div>
                                <p style={{ margin: "0 0 2px", fontSize: "10px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                  Reason for Return
                                </p>
                                <p style={{ margin: 0, fontSize: "13px", color: t.textBody, lineHeight: "1.5" }}>
                                  {r.Reason}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={s.tableCard}>
          {loading ? (
            <p style={s.loadingText}>Loading...</p>
          ) : pending.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>🛡️</div>
              <p style={s.emptyTitle}>Shows all pending Return Request </p>
              <p style={s.emptyDesc}>Click <strong>Approve</strong> above to accept return request.</p>
              <p style={s.emptyDesc}>Click <strong>Ignore</strong> above to reject return request.</p>
              
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {["S.No", "Username", "Email", "Registered", "Link to Employee", "Actions"].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map((u, index) => (
                  <tr key={u.UserID} style={s.tr}>
                    <td style={s.td}>{index + 1}</td>
                    <td style={{ ...s.td, fontWeight: "700", color: t.textPrimary }}>{u.Username}</td>
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


export default PendingUsersPage;
