import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getAllEmployees } from "../api/employeeApi";
import { getAllAssets } from "../api/assetApi";
import { getAllAssignments } from "../api/assignmentApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const { username, role } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalEmployees: 0, totalAssets: 0, availableAssets: 0,
    assignedAssets: 0, totalAssignments: 0, activeAssignments: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [employees, assets, assignments] = await Promise.all([
        getAllEmployees(), getAllAssets(), getAllAssignments(),
      ]);
      setStats({
        totalEmployees: employees.length,
        totalAssets: assets.length,
        availableAssets: assets.filter((a) => a.Status === "Available").length,
        assignedAssets: assets.filter((a) => a.Status === "Assigned").length,
        totalAssignments: assignments.length,
        activeAssignments: assignments.filter((a) => !a.IsReturned).length,
      });
      setRecentAssignments(assignments.slice(0, 6));
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: "Total Employees", value: stats.totalEmployees, color: "#2563eb", icon: "\uD83D\uDC65", path: "/employees" },
    { title: "Total Assets", value: stats.totalAssets, color: "#5110c1", icon: "\uD83D\uDCBB", path: "/assets" },
    { title: "Available", value: stats.availableAssets, color: "#059669", icon: "\u2705", path: "/assets" },
    { title: "Assigned", value: stats.assignedAssets, color: "#d97706", icon: "\uD83D\uDCE6", path: "/assignments" },
    { title: "Total Assignments", value: stats.totalAssignments, color: "#0891b2", icon: "\uD83D\uDCCB", path: "/assignments" },
    { title: "Active", value: stats.activeAssignments, color: "#db2777", icon: "\uD83D\uDD04", path: "/assignments" },
  ];

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.content}>
        {/* Welcome Banner */}
        <div style={s.banner}>
          {/* Decorative circles */}
          <div style={s.circle1} />
          <div style={s.circle2} />
          <div style={s.bannerInner}>
            <div>
              <h1 style={s.bannerTitle}>Welcome back, {username}</h1>
              <p style={s.bannerSub}>
                Logged in as <span style={s.rolePill}>{role}</span>
              </p>
            </div>
            <div style={s.bannerDate}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <p style={s.loadingText}>Loading dashboard...</p>
        ) : (
          <div style={s.cardGrid}>
            {cards.map((card) => (
              <div key={card.title} style={s.card} onClick={() => navigate(card.path)}>
                <div style={s.cardHeader}>
                  <span style={s.cardIcon}>{card.icon}</span>
                  <span style={s.cardArrow}>&rarr;</span>
                </div>
                <div style={{ ...s.cardValue, color: card.color }}>{card.value}</div>
                <div style={s.cardTitle}>{card.title}</div>
              </div>
            ))}
          </div>
        )}

        <div style={s.bottomGrid}>
          {/* Recent Assignments */}
          <div style={s.tableCard}>
            <div style={s.tableCardHeader}>
              <h3 style={s.sectionTitle}>Recent Assignments</h3>
              <span style={s.viewAll} onClick={() => navigate("/assignments")}>View All &rarr;</span>
            </div>
            {recentAssignments.length === 0 ? (
              <p style={s.emptyText}>No assignments yet. Start by assigning assets to employees.</p>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Employee", "Asset", "Date", "Status"].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentAssignments.map((a) => (
                    <tr key={a.AssignmentID} style={s.tr}>
                      <td style={{ ...s.td, fontWeight: "600", color: "#0f172a" }}>
                        {a.EmployeeName || `Emp #${a.EmployeeID}`}
                      </td>
                      <td style={s.td}>{a.AssetName || `Asset #${a.AssetID}`}</td>
                      <td style={s.td}>{a.AssignedDate}</td>
                      <td style={s.td}>
                        <span style={a.IsReturned ? s.badgeReturned : s.badgeActive}>
                          {a.IsReturned ? "Returned" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick Actions */}
          <div style={s.quickCard}>
            <h3 style={s.sectionTitle}>Quick Actions</h3>
            <div style={s.quickList}>
              {[
                { label: "Add Employee", icon: "\uD83D\uDC64", desc: "Register a new employee", path: "/employees" },
                { label: "Add Asset", icon: "\uD83D\uDCBC", desc: "Register a new asset", path: "/assets" },
                { label: "Assign Asset", icon: "\uD83D\uDD17", desc: "Assign asset to employee", path: "/assignments" },
                { label: "View All Assets", icon: "\uD83D\uDCCA", desc: "Browse all assets", path: "/assets" },
              ].map((action) => (
                <button key={action.label} style={s.quickBtn} onClick={() => navigate(action.path)}>
                  <span style={s.quickIcon}>{action.icon}</span>
                  <div>
                    <div style={s.quickLabel}>{action.label}</div>
                    <div style={s.quickDesc}>{action.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const s = {
  page: { minHeight: "100vh", backgroundColor: "#edf2f6", },
  content: { maxWidth: "1280px", margin: "0 auto", padding: "28px 32px" },

  // Banner
  banner: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "16px",
    background: "linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
    padding: "32px 36px",
    marginBottom: "28px",
  },
  circle1: {
    position: "absolute", width: "300px", height: "300px", borderRadius: "50%",
    background: "rgba(255,255,255,0.05)", top: "-100px", right: "-60px",
  },
  circle2: {
    position: "absolute", width: "200px", height: "200px", borderRadius: "50%",
    background: "rgba(255,255,255,0.05)", bottom: "-80px", left: "-40px",
  },
  bannerInner: {
    position: "relative", zIndex: 1,
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  bannerTitle: {
    fontSize: "26px", fontWeight: "800", color: "#fff", margin: 0, letterSpacing: "-0.5px",
  },
  bannerSub: { fontSize: "14px", color: "rgba(255,255,255,0.7)", marginTop: "6px" },
  rolePill: {
    display: "inline-block", padding: "2px 10px", borderRadius: "12px",
    background: "rgba(255,255,255,0.15)", color: "#fcf6f6", fontSize: "12px",
    fontWeight: "700", border: "1px solid rgba(255,255,255,0.2)",
    backdropFilter: "blur(4px)",
  },
  bannerDate: { fontSize: "13px", color: "rgb(250, 250, 250)", fontWeight: "500" },

  // Cards
  cardGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px",
  },
  card: {
    borderRadius: "14px", padding: "22px", cursor: "pointer",
    background: "#cbc1c14c", border: "1.5px solid #93b9ec",
    boxShadow: "0 1px 3px rgba(153, 179, 234, 0.42)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px",
  },
  cardIcon: { fontSize: "26px" },
  cardArrow: { fontSize: "18px", color: "#030c17" },
  cardValue: { fontSize: "36px", fontWeight: "800", lineHeight: 1, marginBottom: "6px" },
  cardTitle: { fontSize: "13px", color: "#161250", fontWeight: "500" },

  // Bottom grid
  bottomGrid: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" },

  // Table card
  tableCard: {
    background: "#e0ebf0", border: "1.5px solid #e2e8f0", borderRadius: "14px", overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  tableCardHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 24px", borderBottom: "1.5px solid #e2e8f0",
  },
  sectionTitle: { fontSize: "15px", fontWeight: "800", color: "#0f172a", margin: 0 },
  viewAll: { fontSize: "12px", color: "#2563eb", fontWeight: "700", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "700",
    color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em",
    borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc",
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "13px 24px", fontSize: "13px", color: "#475569" },
  badgeActive: {
    padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
    background: "rgba(5,150,105,0.08)", color: "#059669",
  },
  badgeReturned: {
    padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
    background: "rgba(100,116,139,0.08)", color: "#64748b",
  },
  emptyText: { padding: "40px 24px", textAlign: "center", color: "#64748b", fontSize: "13px" },

  // Quick actions
  quickCard: {
    background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "14px",
    padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  quickList: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" },
  quickBtn: {
    display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px",
    background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "10px",
    cursor: "pointer", color: "#0f172a", textAlign: "left", transition: "all 0.15s",
  },
  quickIcon: {
    fontSize: "20px", width: "40px", height: "40px", borderRadius: "10px",
    background: "rgba(37,99,235,0.06)", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  quickLabel: { fontSize: "13px", fontWeight: "700", color: "#0f172a" },
  quickDesc: { fontSize: "11px", color: "#64748b", marginTop: "2px" },
  loadingText: { padding: "40px", color: "#64748b", textAlign: "center", fontSize: "14px" },
};

export default DashboardPage;
