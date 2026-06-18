import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
  FaKeyboard, FaLaptop, FaMouse, FaMobileAlt, FaDesktop, FaBox,
  FaCheckCircle, FaLink, FaTag, FaPencilAlt, FaTrashAlt, FaSearch,
} from "react-icons/fa";
import {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getAssetsInGroup,
} from "../api/assetGroupApi";
import { createAsset, deleteAsset } from "../api/assetApi";
import { downloadAssetReport, downloadAssetsReport } from "../api/reportApi";
import { useAuth } from "../context/AuthContext";
import { useTheme, getTheme } from "../context/ThemeContext";

const AssetPage = () => {
  const { isAdmin } = useAuth();
  const { theme, isDark } = useTheme();
  const t = getTheme(theme);

  const [view,          setView]          = useState("groups");
  const [groups,        setGroups]        = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupAssets,   setGroupAssets]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [hoveredViewBtn, setHoveredViewBtn] = useState(null);
  const [hoveredAssetBtn, setHoveredAssetBtn] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [editingGroup,  setEditingGroup]  = useState(null);

  const [groupForm, setGroupForm] = useState({
    GroupCode: "",
    GroupName: ""
  });

  const [assetForm, setAssetForm] = useState({
    AssetCode:    "",
    AssetName:    "",
    AssetType:    "",
    Brand:        "",
    Model:        "",
    SerialNumber: "",
    PurchaseDate: "",
  });

  const [formError,   setFormError]   = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await getAllGroups();
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupAssets = async (group) => {
    setSelectedGroup(group);
    setView("assets");
    setLoadingAssets(true);
    setShowAssetForm(false);
    setFormError("");
    setFormSuccess("");
    try {
      const data = await getAssetsInGroup(group.GroupID);
      setGroupAssets(data);
    } catch (err) {
      setGroupAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    try {
      await createGroup(groupForm);
      setFormSuccess("Group created successfully");
      setGroupForm({ GroupCode: "", GroupName: "" });
      fetchGroups();
      setTimeout(() => { setShowGroupForm(false); setFormSuccess(""); }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to create group");
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    try {
      await updateGroup(editingGroup.GroupID, groupForm);
      setFormSuccess("Group updated successfully");
      fetchGroups();
      setTimeout(() => {
        setEditingGroup(null);
        setShowGroupForm(false);
        setFormSuccess("");
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to update group");
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setGroupForm({ GroupCode: group.GroupCode, GroupName: group.GroupName });
    setShowGroupForm(true);
    setFormError("");
    setFormSuccess("");
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Delete this group?")) return;
    try {
      await deleteGroup(id);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.detail || "Cannot delete group");
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const groupId = selectedGroup?.GroupID;
    if (!groupId) {
      setFormError("No group selected. Please go back and select a group first.");
      return;
    }

    try {
      await createAsset({
        ...assetForm,
        PurchaseDate: assetForm.PurchaseDate || null,
        GroupID: groupId,
      });
      setFormSuccess("Asset added successfully");
      setAssetForm({
        AssetCode: "", AssetName: "", AssetType: "",
        Brand: "", Model: "", SerialNumber: "", PurchaseDate: "",
      });
      fetchGroupAssets(selectedGroup);
      setTimeout(() => { setShowAssetForm(false); setFormSuccess(""); }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to add asset");
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm("Delete this asset?")) return;
    try {
      await deleteAsset(id);
      fetchGroupAssets(selectedGroup);
    } catch (err) {
      console.error(err);
    }
  };

  const getGroupIcon = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("laptop"))   return <FaLaptop size={22} color="#2563eb" />;
    if (n.includes("keyboard")) return <FaKeyboard size={22} color="#7c3aed" />;
    if (n.includes("mouse") || n.includes("mice")) return <FaMouse size={22} color="#059669" />;
    if (n.includes("mobile") || n.includes("phone")) return <FaMobileAlt size={22} color="#dc2626" />;
    if (n.includes("monitor") || n.includes("screen")) return <FaDesktop size={22} color="#0891b2" />;
    return <FaBox size={22} color="#f59e0b" />;
  };

  const getStatusColor = (status) => {
    if (status === "Available") return { bg: isDark ? "#14532d" : "#f0fdf4", color: isDark ? "#86efac" : "#16a34a", border: isDark ? "#166534" : "#bbf7d0" };
    if (status === "Assigned")  return { bg: isDark ? "#1e3a5f" : "#eff6ff", color: isDark ? "#93c5fd" : "#2563eb", border: isDark ? "#1d4ed8" : "#bfdbfe" };
    return                             { bg: t.surfaceAlt, color: t.textSecondary, border: t.border };
  };

  const s = {
    page: { minHeight: "100vh", backgroundColor: t.pageBg, color: t.textPrimary, transition: "background 0.3s" },
    content: { padding: "32px 40px", maxWidth: "1400px", margin: "0 auto" },
    pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" },
    pageTitle: { fontSize: "26px", fontWeight: "800", color: t.textPrimary, margin: 0, letterSpacing: "-0.5px" },
    pageSubtitle: { fontSize: "13px", color: t.textSecondary, marginTop: "4px", margin: "4px 0 0" },
    btnPrimary: {
      padding: "10px 20px", background: t.accent,
      color: "#fff", border: "none", borderRadius: "9px", fontSize: "13px",
      fontWeight: "700", cursor: "pointer", boxShadow: "none",
    },
    statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" },
    statCard: {
      backgroundColor: t.surface, border: `1.5px solid ${t.border}`,
      borderRadius: "14px", padding: "20px 24px", boxShadow: `0 1px 6px ${t.shadow}`,
    },
    statNumber: { fontSize: "28px", fontWeight: "800", color: isDark ? "#f4f4f5" : t.textPrimary, lineHeight: 1 },
    statLabel:  { fontSize: "13px", color: t.textSecondary, marginTop: "6px" },
    formCard: {
      backgroundColor: t.surface, border: `1.5px solid ${t.border}`,
      borderRadius: "14px", padding: "24px", marginBottom: "24px", boxShadow: `0 1px 6px ${t.shadow}`,
    },
    formTitle:   { fontSize: "15px", fontWeight: "700", color: t.textPrimary, marginBottom: "4px", marginTop: 0 },
    formTopBar:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
    formSubtitle:{ fontSize: "13px", color: t.textSecondary, margin: "4px 0 0" },
    groupSelectedBadge: {
      display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px",
      backgroundColor: t.surfaceAlt, border: `1.5px solid ${t.border}`, borderRadius: "10px",
    },
    groupSelectedIcon: { fontSize: "20px" },
    groupSelectedName: { fontSize: "14px", fontWeight: "600", color: t.textPrimary },
    groupSelectedCode: { fontSize: "11px", color: t.textSecondary, marginTop: "2px" },
    formRow:   { display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" },
    assetFormGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" },
    formField: { display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "160px" },
    label: { fontSize: "11px", fontWeight: "700", color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em" },
    input: {
      height: "40px", padding: "0 12px", backgroundColor: t.inputBg, border: `1.5px solid ${t.border}`,
      borderRadius: "9px", color: t.inputColor, fontSize: "13px", outline: "none", boxSizing: "border-box", width: "100%",
    },
    errorMsg:   { color: "#dc2626", fontSize: "13px", padding: "10px 14px", backgroundColor: "#fef2f2", borderRadius: "9px", border: "1px solid #fecaca", marginTop: "12px" },
    successMsg: { color: "#059669", fontSize: "13px", padding: "10px 14px", backgroundColor: "#f0fdf4", borderRadius: "9px", border: "1px solid #bbf7d0", marginTop: "12px" },
    groupGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" },
    groupCard: {
      backgroundColor: t.surface, border: `1.5px solid ${t.border}`,
      borderRadius: "14px", padding: "24px", boxShadow: `0 1px 6px ${t.shadow}`, transition: "box-shadow 0.2s",
    },
    groupCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
    groupIconWrap: {
      width: "48px", height: "48px", backgroundColor: t.codeBg, borderRadius: "12px",
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    groupIconEmoji: { fontSize: "22px" },
    groupCodePill: {
      padding: "4px 10px", backgroundColor: t.codeBg, color: t.codeColor,
      borderRadius: "20px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em",
    },
    groupCardName:  { fontSize: "18px", fontWeight: "700", color: t.textPrimary, margin: "0 0 16px" },
    groupCardStats: {
      display: "flex", alignItems: "center", backgroundColor: t.surfaceAlt,
      borderRadius: "10px", padding: "12px 0", marginBottom: "14px", border: `1px solid ${t.border}`,
    },
    groupStatItem:   { display: "flex", flexDirection: "column", alignItems: "center", flex: 1 },
    groupStatNumber: { fontSize: "20px", fontWeight: "800", color: isDark ? "#f4f4f5" : t.textPrimary, lineHeight: 1 },
    groupStatLabel:  { fontSize: "11px", color: t.textSecondary, marginTop: "4px" },
    groupStatDivider:{ width: "1px", height: "32px", backgroundColor: t.border },
    progressBar: { height: "4px", backgroundColor: t.codeBg, borderRadius: "2px", overflow: "hidden", marginBottom: "6px" },
    progressFill:  { height: "100%", backgroundColor: isDark ? "#60a5fa" : "#2563eb", borderRadius: "2px", transition: "width 0.3s" },
    progressLabel: { fontSize: "11px", color: t.textSecondary, margin: "0 0 16px" },
    groupCardActions:  { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" },
    btnViewAssets: {
      flex: 1, padding: "9px 0", backgroundColor: t.surfaceAlt, color: t.textPrimary,
      border: `1.5px solid ${t.border}`, borderRadius: "9px", fontSize: "13px",
      fontWeight: "700", cursor: "pointer", textAlign: "center",
    },
    groupCardSecondary: { display: "flex", gap: "6px" },
    btnIconEdit: {
      width: "34px", height: "34px", backgroundColor: isDark ? "#3b2f00" : "#fefce8",
      border: `1px solid ${isDark ? "#78450a" : "#fde68a"}`, borderRadius: "8px",
      cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center",
    },
    btnIconDelete: {
      width: "34px", height: "34px", backgroundColor: "#fef2f2",
      border: "1px solid #fecaca", borderRadius: "8px",
      cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center",
    },
    loadingBox:    { textAlign: "center", padding: "60px 20px" },
    loadingText:   { color: t.textSecondary, fontSize: "14px" },
    loadingSpinner:{ width: "32px", height: "32px", border: `3px solid ${t.border}`, borderTopColor: "#2563eb", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" },
    emptyBox: { textAlign: "center", padding: "60px 20px", backgroundColor: t.surface, border: `1.5px solid ${t.border}`, borderRadius: "14px" },
    emptyIcon:     { fontSize: "40px", marginBottom: "12px" },
    emptyTitle:    { fontSize: "16px", fontWeight: "700", color: t.textPrimary, margin: "0 0 8px" },
    emptySubtitle: { fontSize: "13px", color: t.textSecondary, margin: 0 },
    breadcrumb:    { display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" },
    breadcrumbLink:  { fontSize: "13px", color: isDark ? "#60a5fa" : "#2563eb", cursor: "pointer", fontWeight: "600" },
    breadcrumbArrow: { color: t.textSecondary, fontSize: "16px" },
    breadcrumbActive:{ fontSize: "24px", fontWeight: "800", color: t.textPrimary },
    summaryCards: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" },
    summaryCard: {
      backgroundColor: t.surface, border: `1.5px solid ${t.border}`, borderRadius: "14px",
      padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: `0 1px 6px ${t.shadow}`,
    },
    summaryCardIcon:  { width: "44px", height: "44px", backgroundColor: t.codeBg, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 },
    summaryCardNumber:{ fontSize: "22px", fontWeight: "700", color: t.textPrimary, lineHeight: 1 },
    summaryCardLabel: { fontSize: "12px", color: t.textSecondary, marginTop: "4px" },
    tableCard: { backgroundColor: t.surface, border: `1.5px solid ${t.border}`, borderRadius: "14px", overflow: "hidden", boxShadow: `0 1px 6px ${t.shadow}` },
    tableHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: `1.5px solid ${t.border}`, backgroundColor: t.thBg },
    tableTitle: { fontSize: "15px", fontWeight: "700", color: t.textPrimary, margin: 0 },
    tableCount: { fontSize: "12px", fontWeight: "700", color: t.codeColor, backgroundColor: t.codeBg, padding: "4px 10px", borderRadius: "20px" },
    table: { width: "100%", borderCollapse: "collapse" },
    tableHeadRow: { backgroundColor: t.thBg },
    th: { padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: t.textPrimary, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1.5px solid ${t.border}` },
    tr: { borderBottom: `1px solid ${t.rowBorder}` },
    td: { padding: "14px 16px", fontSize: "13px", color: t.textBody },
    tdName: { padding: "14px 16px", fontSize: "13px", color: t.textPrimary, fontWeight: "700" },
    tdMono: { padding: "14px 16px", fontSize: "12px", color: t.textBody, fontFamily: "monospace" },
    assetCodeBadge: { padding: "3px 8px", backgroundColor: t.codeBg, color: t.codeColor, borderRadius: "6px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.04em" },
    statusBadge: { padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
    btnDelete: { padding: "5px 12px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    btnReport: { padding: "5px 12px", backgroundColor: "#f0fdf4", color: "#059669", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    btnDownload: { padding: "9px 18px", backgroundColor: t.surface, color: t.textPrimary, border: `1.5px solid ${t.border}`, borderRadius: "9px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes assetSpinBtn { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes assetFadeIn  { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {downloading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.55)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          animation: "assetFadeIn 0.2s ease",
        }}>
          <svg width="64" height="64" viewBox="0 0 64 64"
            style={{ animation: "assetSpinBtn 0.8s linear infinite", marginBottom: "20px" }}>
            {[0,1,2,3,4,5,6,7].map((i) => (
              <line key={i} x1="32" y1="8" x2="32" y2="18"
                stroke="#C15A34" strokeWidth="5" strokeLinecap="round"
                style={{ opacity: (i + 1) / 8 }}
                transform={`rotate(${i * 45} 32 32)`}
              />
            ))}
          </svg>
          <p style={{ color: "#fff", fontSize: "16px", fontWeight: "700", margin: 0, letterSpacing: "0.03em" }}>
            Generating PDF...
          </p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", marginTop: "6px" }}>
            Please wait a moment
          </p>
        </div>
      )}

      <Navbar />
      <div style={s.content}>

        {/*  GROUPS VIEW  */}
        {view === "groups" && (
          <>
            {/* Page Header */}
            <div style={s.pageHeader}>
              <div>
                <h1 style={s.pageTitle}>Asset Groups</h1>
                <p style={s.pageSubtitle}>
                  Organize and manage your company assets by category
                </p>
              </div>
              {isAdmin && (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    style={{ ...s.btnDownload, opacity: downloading ? 0.7 : 1, cursor: downloading ? "not-allowed" : "pointer" }}
                    disabled={downloading}
                    onClick={async () => {
                      if (downloading) return;
                      setDownloading(true);
                      await new Promise((res) => setTimeout(res, 2000));
                      await downloadAssetsReport();
                      setDownloading(false);
                    }}
                  >
                    {downloading ? "⏳ Generating..." : "⬇ Download All (PDF)"}
                  </button>
                  <button
                    style={s.btnPrimary}
                    onClick={() => {
                      setEditingGroup(null);
                      setGroupForm({ GroupCode: "", GroupName: "" });
                      setFormError("");
                      setFormSuccess("");
                      setShowGroupForm(!showGroupForm);
                    }}
                  >
                    {showGroupForm ? "✕ " : "+ Create Group"}
                  </button>
                </div>
              )}
            </div>

            {/* Create / Edit Group Form */}
            {showGroupForm && isAdmin && (
              <div style={s.formCard}>
                <h3 style={s.formTitle}>
                  {editingGroup ? "Edit Group" : "Create New Group"}
                </h3>
                <form onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}>
                  <div style={s.formRow}>
                    <div style={s.formField}>
                      <label style={s.label}>Group Code</label>
                      <input
                        type="text"
                        style={s.input}
                        placeholder="e.g. GRP-LAPTOP"
                        value={groupForm.GroupCode}
                        onChange={(e) => setGroupForm({
                          ...groupForm, GroupCode: e.target.value
                        })}
                        required
                      />
                    </div>
                    <div style={s.formField}>
                      <label style={s.label}>Group Name</label>
                      <input
                        type="text"
                        style={s.input}
                        placeholder="e.g. Laptops"
                        value={groupForm.GroupName}
                        onChange={(e) => setGroupForm({
                          ...groupForm, GroupName: e.target.value
                        })}
                        required
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <button type="submit" style={s.btnPrimary}>
                        {editingGroup ? "Update Group" : "Create Group"}
                      </button>
                    </div>
                  </div>
                  {formError   && <p style={s.errorMsg}>{formError}</p>}
                  {formSuccess && <p style={s.successMsg}>{formSuccess}</p>}
                </form>
              </div>
            )}

            {/* Stats Row */}
            {!loading && groups.length > 0 && (
              <div style={s.statsRow}>
                <div style={s.statCard}>
                  <div style={s.statNumber}>{groups.length}</div>
                  <div style={s.statLabel}>Total Groups</div>
                </div>
                <div style={s.statCard}>
                  <div style={{ ...s.statNumber, color: isDark ? "#60a5fa" : "#2563eb" }}>
                    {groups.reduce((a, g) => a + (g.TotalAssets || 0), 0)}
                  </div>
                  <div style={s.statLabel}>Total Assets</div>
                </div>
                <div style={s.statCard}>
                  <div style={{ ...s.statNumber, color: isDark ? "#4ade80" : "#16a34a" }}>
                    {groups.reduce((a, g) => a + (g.AvailableCount || 0), 0)}
                  </div>
                  <div style={s.statLabel}>Available</div>
                </div>
                <div style={s.statCard}>
                  <div style={{ ...s.statNumber, color: isDark ? "#fbbf24" : "#f59e0b" }}>
                    {groups.reduce((a, g) => a + (g.AssignedCount || 0), 0)}
                  </div>
                  <div style={s.statLabel}>Assigned</div>
                </div>
              </div>
            )}

            {/* Groups Grid */}
            {loading ? (
              <div style={s.loadingBox}>
                <div style={s.loadingSpinner} />
                <p style={s.loadingText}>Loading groups...</p>
              </div>
            ) : groups.length === 0 ? (
              <div style={s.emptyBox}>
                <div style={{ fontSize: "40px", marginBottom: "12px", display: "flex", justifyContent: "center" }}><FaBox size={40} color="#f59e0b" /></div>
                <h3 style={s.emptyTitle}>No groups yet</h3>
                <p style={s.emptySubtitle}>
                  Create your first group like Laptops, Mice or Keyboards
                </p>
                {isAdmin && (
                  <button
                    style={{ ...s.btnPrimary, marginTop: "16px" }}
                    onClick={() => setShowGroupForm(true)}
                  >
                    + Create First Group
                  </button>
                )}
              </div>
            ) : (
              <div style={s.groupGrid}>
                {groups.map((group) => (
                  <div key={group.GroupID} style={s.groupCard}>

                    {/* Card Top */}
                    <div style={s.groupCardTop}>
                      <div style={{ ...s.groupIconWrap, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {getGroupIcon(group.GroupName)}
                      </div>
                      <span style={s.groupCodePill}>
                        {group.GroupCode}
                      </span>
                    </div>

                    {/* Group Name */}
                    <h3 style={s.groupCardName}>{group.GroupName}</h3>

                    {/* Asset Count Stats */}
                    <div style={s.groupCardStats}>
                      <div style={s.groupStatItem}>
                        <span style={s.groupStatNumber}>
                          {group.TotalAssets || 0}
                        </span>
                        <span style={s.groupStatLabel}>Total</span>
                      </div>
                      <div style={s.groupStatDivider} />
                      <div style={s.groupStatItem}>
                        <span style={{
                          ...s.groupStatNumber, color: isDark ? "#4ade80" : "#16a34a"
                        }}>
                          {group.AvailableCount || 0}
                        </span>
                        <span style={s.groupStatLabel}>Available</span>
                      </div>
                      <div style={s.groupStatDivider} />
                      <div style={s.groupStatItem}>
                        <span style={{
                          ...s.groupStatNumber, color: isDark ? "#60a5fa" : "#2563eb"
                        }}>
                          {group.AssignedCount || 0}
                        </span>
                        <span style={s.groupStatLabel}>Assigned</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={s.progressBar}>
                      <div
                        style={{
                          ...s.progressFill,
                          width: group.TotalAssets > 0
                            ? `${Math.round(
                                (group.AssignedCount / group.TotalAssets) * 100
                              )}%`
                            : "0%"
                        }}
                      />
                    </div>
                    <p style={s.progressLabel}>
                      {group.TotalAssets > 0
                        ? `${Math.round(
                            (group.AssignedCount / group.TotalAssets) * 100
                          )}% in use`
                        : "No assets yet"}
                    </p>

                    {/* Action Buttons */}
                    <div style={s.groupCardActions}>
                      <button
                        style={{
                          ...s.btnViewAssets,
                          ...(hoveredViewBtn === group.GroupID ? {
                            backgroundColor: "#C15A34", color: "#ffffff",
                            border: "1.5px solid #C15A34", transform: "translateY(-1px)",
                          } : {}),
                          transition: "all 0.15s ease",
                        }}
                        onClick={() => fetchGroupAssets(group)}
                        onMouseEnter={() => setHoveredViewBtn(group.GroupID)}
                        onMouseLeave={() => setHoveredViewBtn(null)}
                      >
                        View Assets →
                      </button>
                      {isAdmin && (
                        <div style={s.groupCardSecondary}>
                          <button
                            style={s.btnIconEdit}
                            onClick={() => handleEditGroup(group)}
                            title="Edit group"
                          >
                            <FaPencilAlt size={13} color="#d97706" />
                          </button>
                          <button
                            style={s.btnIconDelete}
                            onClick={() => handleDeleteGroup(group.GroupID)}
                            title="Delete group"
                          >
                            <FaTrashAlt size={13} color="#dc2626" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/*  ASSETS INSIDE GROUP VIEW  */}
        {view === "assets" && selectedGroup && (
          <>
            {/* Breadcrumb Header */}
            <div style={s.pageHeader}>
              <div>
                <div style={s.breadcrumb}>
                  <span style={s.breadcrumbActive}>
                    {selectedGroup.GroupName}
                  </span>
                </div>
                <p style={s.pageSubtitle}>
                  Managing assets in {selectedGroup.GroupName} group
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "10px 18px", borderRadius: "9px",
                    background: t.surfaceAlt, color: t.textPrimary,
                    border: `1.5px solid ${t.border}`, fontSize: "13px",
                    fontWeight: "700", cursor: "pointer",
                  }}
                  onClick={() => { setView("groups"); setShowAssetForm(false); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                  Back to Groups
                </button>
                {isAdmin && (
                  <button
                    style={s.btnPrimary}
                    onClick={() => {
                      setShowAssetForm(!showAssetForm);
                      setFormError("");
                      setFormSuccess("");
                    }}
                  >
                    {showAssetForm ? "✕" : "+ Add Asset"}
                  </button>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div style={s.summaryCards}>
              <div style={s.summaryCard}>
                <div style={{ ...s.summaryCardIcon, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaBox size={20} color="#f59e0b" />
                </div>
                <div>
                  <div style={s.summaryCardNumber}>{groupAssets.length}</div>
                  <div style={s.summaryCardLabel}>Total Assets</div>
                </div>
              </div>
              <div style={s.summaryCard}>
                <div style={{ ...s.summaryCardIcon, backgroundColor: isDark ? "#14532d" : "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaCheckCircle size={20} color={isDark ? "#4ade80" : "#16a34a"} />
                </div>
                <div>
                  <div style={{ ...s.summaryCardNumber, color: isDark ? "#4ade80" : "#16a34a" }}>
                    {groupAssets.filter(a => a.Status === "Available").length}
                  </div>
                  <div style={s.summaryCardLabel}>Available</div>
                </div>
              </div>
              <div style={s.summaryCard}>
                <div style={{ ...s.summaryCardIcon, backgroundColor: isDark ? "#1e3a5f" : "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaLink size={20} color={isDark ? "#60a5fa" : "#2563eb"} />
                </div>
                <div>
                  <div style={{ ...s.summaryCardNumber, color: isDark ? "#60a5fa" : "#2563eb" }}>
                    {groupAssets.filter(a => a.Status === "Assigned").length}
                  </div>
                  <div style={s.summaryCardLabel}>Assigned</div>
                </div>
              </div>
              <div style={s.summaryCard}>
                <div style={{ ...s.summaryCardIcon, backgroundColor: isDark ? "#3b2f00" : "#fefce8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaTag size={20} color={isDark ? "#fbbf24" : "#ca8a04"} />
                </div>
                <div>
                  <div style={s.summaryCardNumber}>{selectedGroup.GroupCode}</div>
                  <div style={s.summaryCardLabel}>Group Code</div>
                </div>
              </div>
            </div>

            {/* Add Asset Form */}
            {showAssetForm && isAdmin && (
              <div style={s.formCard}>
                <div style={s.formTopBar}>
                  <div>
                    <h3 style={s.formTitle}>Add New Asset</h3>
                    <p style={s.formSubtitle}>
                      This asset will be added to the group below
                    </p>
                  </div>
                  <div style={s.groupSelectedBadge}>
                    <span style={{ display: "flex", alignItems: "center" }}>
                      {getGroupIcon(selectedGroup.GroupName)}
                    </span>
                    <div>
                      <div style={s.groupSelectedName}>
                        {selectedGroup.GroupName}
                      </div>
                      <div style={s.groupSelectedCode}>
                        {selectedGroup.GroupCode}
                      </div>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleCreateAsset}>
                  <div style={s.assetFormGrid}>

                    <div style={s.formField}>
                      <label style={s.label}>Asset Code</label>
                      <input
                        type="text"
                        style={s.input}
                        placeholder="AST001"
                        value={assetForm.AssetCode}
                        onChange={(e) => setAssetForm({
                          ...assetForm, AssetCode: e.target.value
                        })}
                      />
                    </div>

                    <div style={s.formField}>
                      <label style={s.label}>Asset Name</label>
                      <input
                        type="text"
                        style={s.input}
                        placeholder="Dell Laptop"
                        value={assetForm.AssetName}
                        onChange={(e) => setAssetForm({
                          ...assetForm, AssetName: e.target.value
                        })}
                      />
                    </div>

                    <div style={s.formField}>
                      <label style={s.label}>Asset Type</label>
                      <input
                        type="text"
                        style={s.input}
                        placeholder="Laptop"
                        value={assetForm.AssetType}
                        onChange={(e) => setAssetForm({
                          ...assetForm, AssetType: e.target.value
                        })}
                      />
                    </div>

                    <div style={s.formField}>
                      <label style={s.label}>Brand</label>
                      <input
                        type="text"
                        style={s.input}
                        placeholder="Dell"
                        value={assetForm.Brand}
                        onChange={(e) => setAssetForm({
                          ...assetForm, Brand: e.target.value
                        })}
                      />
                    </div>

                    <div style={s.formField}>
                      <label style={s.label}>Model</label>
                      <input
                        type="text"
                        style={s.input}
                        placeholder="Inspiron 15 3520"
                        value={assetForm.Model}
                        onChange={(e) => setAssetForm({
                          ...assetForm, Model: e.target.value
                        })}
                      />
                    </div>

                    <div style={s.formField}>
                      <label style={s.label}>Serial Number</label>
                      <input
                        type="text"
                        style={s.input}
                        placeholder="DL-2024-001234"
                        value={assetForm.SerialNumber}
                        onChange={(e) => setAssetForm({
                          ...assetForm, SerialNumber: e.target.value
                        })}
                      />
                    </div>

                    <div style={s.formField}>
                      <label style={s.label}>Purchase Date</label>
                      <input
                        type="date"
                        style={s.input}
                        value={assetForm.PurchaseDate}
                        onChange={(e) => setAssetForm({
                          ...assetForm, PurchaseDate: e.target.value
                        })}
                      />
                    </div>

                  </div>
                  {formError   && <p style={s.errorMsg}>{formError}</p>}
                  {formSuccess && <p style={s.successMsg}>{formSuccess}</p>}
                  <button type="submit" style={s.btnPrimary}>
                    Add Asset to {selectedGroup.GroupName}
                  </button>
                </form>
              </div>
            )}

            {/* Assets Table */}
            <div style={s.tableCard}>
              <div style={s.tableHeader}>
                <h3 style={s.tableTitle}>
                  Assets in {selectedGroup.GroupName}
                </h3>
                <span style={s.tableCount}>
                  {groupAssets.length} items
                </span>
              </div>

              {loadingAssets ? (
                <div style={s.loadingBox}>
                  <p style={s.loadingText}>Loading assets...</p>
                </div>
              ) : groupAssets.length === 0 ? (
                <div style={s.emptyBox}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}><FaSearch size={36} color="#94a3b8" /></div>
                  <h3 style={s.emptyTitle}>No assets yet</h3>
                  <p style={s.emptySubtitle}>
                    Click Add Asset to add the first one to this group
                  </p>
                </div>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr style={s.tableHeadRow}>
                      {[
                        "Code", "Name", "Brand", "Model",
                        "Serial No", "Purchase Date", "Status", "Actions"
                      ].map((h) => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupAssets.map((asset) => {
                      const sc = getStatusColor(asset.Status);
                      return (
                        <tr key={asset.AssetID} style={s.tr}>
                          <td style={s.td}>
                            <span style={s.assetCodeBadge}>
                              {asset.AssetCode}
                            </span>
                          </td>
                          <td style={s.tdName}>{asset.AssetName}</td>
                          <td style={s.td}>{asset.Brand}</td>
                          <td style={s.td}>{asset.Model}</td>
                          <td style={s.tdMono}>{asset.SerialNumber}</td>
                          <td style={s.td}>{asset.PurchaseDate}</td>
                          <td style={s.td}>
                            <span style={{
                              ...s.statusBadge,
                              backgroundColor: sc.bg,
                              color:           sc.color,
                              border:          `1px solid ${sc.border}`,
                            }}>
                              {asset.Status}
                            </span>
                          </td>
                          <td style={s.td}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {isAdmin && (
                                <button
                                  style={{
                                    ...s.btnReport,
                                    ...(hoveredAssetBtn === `report-${asset.AssetID}` ? {
                                      backgroundColor: "#15803d", color: "#ffffff",
                                      border: "1.5px solid #15803d", transform: "translateY(-1px)",
                                    } : {}),
                                    transition: "all 0.15s ease",
                                  }}
                                  onClick={() => downloadAssetReport(asset.AssetID, asset.AssetCode)}
                                  onMouseEnter={() => setHoveredAssetBtn(`report-${asset.AssetID}`)}
                                  onMouseLeave={() => setHoveredAssetBtn(null)}
                                >
                                  Report
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  style={{
                                    ...s.btnDelete,
                                    ...(hoveredAssetBtn === `delete-${asset.AssetID}` ? {
                                      backgroundColor: "#991b1b", color: "#ffffff",
                                      border: "1.5px solid #991b1b", transform: "translateY(-1px)",
                                    } : {}),
                                    transition: "all 0.15s ease",
                                  }}
                                  onClick={() => handleDeleteAsset(asset.AssetID)}
                                  onMouseEnter={() => setHoveredAssetBtn(`delete-${asset.AssetID}`)}
                                  onMouseLeave={() => setHoveredAssetBtn(null)}
                                >
                                  Delete
                                </button>
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
          </>
        )}
      </div>
    </div>
  );
};

export default AssetPage;
