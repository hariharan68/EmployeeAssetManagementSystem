import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme, getTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { username, role, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const t = getTheme(isDark);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate("/login"); };
  const isAdmin = role === "Admin";

  const links = [
    { path: "/dashboard",   label: "Dashboard" },
    { path: "/employees",   label: "Employees" },
    ...(isAdmin ? [{ path: "/assets",      label: "Assets" }]    : []),
    { path: "/assignments", label: "Assignments" },
    ...(isAdmin ? [{ path: "/approvals",   label: "Approvals" }] : []),
  ];

  const st = {
    nav: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "0 32px", height: "64px",
      background: t.navBg, borderBottom: `1.5px solid ${t.navBorder}`,
      position: "sticky", top: 0, zIndex: 100,
      transition: "background 0.3s, border-color 0.3s",
    },
    left:  { display: "flex", alignItems: "center", gap: "24px" },
    brand: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" },
    brandIcon: {
      width: "34px", height: "34px", borderRadius: "9px",
      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
    },
    brandText: { fontSize: "16px", fontWeight: "800", color: t.textPrimary, letterSpacing: "-0.3px" },
    divider:   { width: "1px", height: "28px", background: t.navBorder },
    links:     { display: "flex", gap: "2px" },
    link: {
      cursor: "pointer", color: t.navText, fontSize: "13px", fontWeight: "500",
      padding: "8px 16px", borderRadius: "8px", transition: "all 0.15s",
    },
    linkActive: { color: t.navTextActive, background: t.navActiveBg, fontWeight: "700" },
    right:     { display: "flex", alignItems: "center", gap: "14px" },
    userPill: {
      display: "flex", alignItems: "center", gap: "10px",
      padding: "5px 14px 5px 5px", borderRadius: "10px",
      background: t.pillBg, border: `1.5px solid ${t.pillBorder}`,
    },
    avatar: {
      width: "32px", height: "32px", borderRadius: "8px",
      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      color: "#fff", display: "flex", alignItems: "center",
      justifyContent: "center", fontWeight: "700", fontSize: "14px",
    },
    userName: { fontSize: "13px", fontWeight: "600", color: t.textPrimary, lineHeight: "1.2" },
    userRole: {
      fontSize: "10px", color: t.navText, textTransform: "uppercase",
      letterSpacing: "0.06em", fontWeight: "700",
    },
    iconBtn: {
      width: "36px", height: "36px", display: "flex",
      alignItems: "center", justifyContent: "center",
      borderRadius: "8px", border: `1.5px solid ${t.navBorder}`,
      background: t.pillBg, color: t.navText, cursor: "pointer", transition: "all 0.2s",
    },
    logout: {
      padding: "7px 16px", backgroundColor: t.pillBg,
      border: `1.5px solid ${t.navBorder}`, borderRadius: "8px",
      color: t.navText, cursor: "pointer", fontSize: "12px",
      fontWeight: "600", transition: "all 0.15s",
    },
  };

  return (
    <nav style={st.nav}>
      <div style={st.left}>
        <div style={st.brand} onClick={() => navigate("/dashboard")}>
          <div style={st.brandIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 3H8l-2 4h12l-2-4z" />
            </svg>
          </div>
          <span style={st.brandText}>EmpAssetDB</span>
        </div>

        <div style={st.divider} />

        <div style={st.links}>
          {links.map((l) => {
            const active = location.pathname === l.path;
            return (
              <span key={l.path}
                style={{ ...st.link, ...(active ? st.linkActive : {}) }}
                onClick={() => navigate(l.path)}>
                {l.label}
              </span>
            );
          })}
        </div>
      </div>

      <div style={st.right}>
        {/* Dark / Light toggle */}
        <button style={st.iconBtn} onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          {isDark ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <div style={st.userPill}>
          <div style={st.avatar}>{(username || "U")[0].toUpperCase()}</div>
          <div>
            <div style={st.userName}>{username}</div>
            <div style={st.userRole}>{role}</div>
          </div>
        </div>
        <button style={st.logout} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
