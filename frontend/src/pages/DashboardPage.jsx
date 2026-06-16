import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getAllEmployees } from "../api/employeeApi";
import { getAllAssets } from "../api/assetApi";
import { getAllAssignments } from "../api/assignmentApi";
import { useAuth } from "../context/AuthContext";
import { useTheme, getTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const { username, role, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const t = getTheme(isDark);
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
    { title: "Total Employees",   value: stats.totalEmployees,   color: "#3b82f6", icon: "👥", path: "/employees" },
    { title: "Total Assets",      value: stats.totalAssets,      color: "#8b5cf6", icon: "💻", path: "/assets" },
    { title: "Available",         value: stats.availableAssets,  color: "#10b981", icon: "✅", path: "/assets" },
    { title: "Assigned",          value: stats.assignedAssets,   color: "#f59e0b", icon: "📦", path: "/assignments" },
    { title: "Total Assignments", value: stats.totalAssignments, color: "#06b6d4", icon: "📋", path: "/assignments" },
    { title: "Active",            value: stats.activeAssignments,color: "#ec4899", icon: "🔄", path: "/assignments" },
  ];

  const s = {
    page: { minHeight: "100vh", backgroundColor: t.pageBg, transition: "background 0.3s" },
    content: { maxWidth: "1280px", margin: "0 auto", padding: "28px 32px" },
    banner: {
      position: "relative", overflow: "hidden", borderRadius: "16px",
      background: "linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
      padding: "32px 36px", marginBottom: "28px",
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
    bannerTitle: { fontSize: "26px", fontWeight: "800", color: "#fff", margin: 0, letterSpacing: "-0.5px" },
    bannerSub:   { fontSize: "14px", color: "rgba(255,255,255,0.7)", marginTop: "6px" },
    rolePill: {
      display: "inline-block", padding: "2px 10px", borderRadius: "12px",
      background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "12px",
      fontWeight: "700", border: "1px solid rgba(255,255,255,0.2)",
    },
    bannerDate: { fontSize: "13px", color: "rgba(255,255,255,0.85)", fontWeight: "500" },
    cardGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" },
    card: {
      borderRadius: "14px", padding: "22px", cursor: "pointer",
      background: t.surface, border: `1.5px solid ${t.border}`,
      boxShadow: `0 2px 8px ${t.shadow}`, transition: "transform 0.15s, box-shadow 0.15s",
    },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
    cardIcon:   { fontSize: "26px" },
    cardArrow:  { fontSize: "16px", color: t.textSecondary },
    cardValue:  { fontSize: "36px", fontWeight: "800", lineHeight: 1, marginBottom: "6px" },
    cardTitle:  { fontSize: "13px", color: t.textBody, fontWeight: "500" },
    bottomGrid: { display: "grid", gap: "20px" },
    tableCard: {
      background: t.surface, border: `1.5px solid ${t.border}`, borderRadius: "14px",
      overflow: "hidden", boxShadow: `0 2px 8px ${t.shadow}`,
    },
    tableCardHeader: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "20px 24px", borderBottom: `1.5px solid ${t.border}`,
      background: t.surfaceAlt,
    },
    sectionTitle: { fontSize: "15px", fontWeight: "800", color: t.textPrimary, margin: 0 },
    viewAll:   { fontSize: "12px", color: "#3b82f6", fontWeight: "700", cursor: "pointer" },
    table:     { width: "100%", borderCollapse: "collapse" },
    th: {
      padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: "700",
      color: t.textPrimary, textTransform: "uppercase", letterSpacing: "0.08em",
      borderBottom: `1.5px solid ${t.border}`, background: t.thBg,
    },
    tr: { borderBottom: `1px solid ${t.rowBorder}` },
    td: { padding: "13px 24px", fontSize: "13px", color: t.textBody },
    badgeActive: {
      padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
      background: t.badgeActiveBg, color: t.badgeActiveColor,
    },
    badgeReturned: {
      padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
      background: isDark ? "#3f3f46" : "#dbeafe", color: isDark ? "#a1a1aa" : "#1e3a8a",
    },
    emptyText: { padding: "40px 24px", textAlign: "center", color: t.textSecondary, fontSize: "13px" },
    quickCard: {
      background: t.surface, border: `1.5px solid ${t.border}`, borderRadius: "14px",
      padding: "20px", boxShadow: `0 2px 8px ${t.shadow}`,
    },
    quickList: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" },
    quickBtn: {
      display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px",
      background: t.surfaceAlt, border: `1.5px solid ${t.border}`, borderRadius: "10px",
      cursor: "pointer", textAlign: "left", transition: "all 0.15s",
    },
    quickIcon: {
      fontSize: "20px", width: "40px", height: "40px", borderRadius: "10px",
      background: isDark ? "#3f3f46" : "#dbeafe",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    quickLabel: { fontSize: "13px", fontWeight: "700", color: t.textPrimary },
    quickDesc:  { fontSize: "11px", color: t.textSecondary, marginTop: "2px" },
    loadingText: { padding: "40px", color: t.textSecondary, textAlign: "center", fontSize: "14px" },
  };

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.content}>

        <div style={s.banner}>
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

        {isAdmin && (loading ? (
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
        ))}

        <div style={{ ...s.bottomGrid, gridTemplateColumns: isAdmin ? "1fr 340px" : "1fr" }}>

          <div style={s.tableCard}>
            <div style={s.tableCardHeader}>
              <h3 style={s.sectionTitle}>Recent Assignments</h3>
              {isAdmin && (
                <span style={s.viewAll} onClick={() => navigate("/assignments")}>View All &rarr;</span>
              )}
            </div>
            {recentAssignments.length === 0 ? (
              <p style={s.emptyText}>No assignments found.</p>
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
                      <td style={{ ...s.td, fontWeight: "600", color: t.textPrimary }}>
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

          {isAdmin && (
            <div style={s.quickCard}>
              <h3 style={s.sectionTitle}>Quick Actions</h3>
              <div style={s.quickList}>
                {[
                  { label: "Add Employee",    icon: "👤", desc: "Register a new employee",    path: "/employees" },
                  { label: "Add Asset",       icon: "💼", desc: "Register a new asset",       path: "/assets" },
                  { label: "Assign Asset",    icon: "🔗", desc: "Assign asset to employee",   path: "/assignments" },
                  { label: "View All Assets", icon: "📊", desc: "Browse all assets",          path: "/assets" },
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
          )}

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
