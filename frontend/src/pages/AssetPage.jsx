import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
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

const AssetPage = () => {
  const { isAdmin } = useAuth();

  const [view,          setView]          = useState("groups");
  const [groups,        setGroups]        = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupAssets,   setGroupAssets]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(false);

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

  const groupIcons = {
    Laptops:   "💻",
    Mice:      "🖱️",
    Keyboards: "⌨️",
    Mobiles:   "📱",
    Monitors:  "🖥️",
    default:   "📦",
  };

  const getGroupIcon = (name) =>
    groupIcons[name] || groupIcons.default;

  const getStatusColor = (status) => {
    if (status === "Available") return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
    if (status === "Assigned")  return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
    return                             { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
  };

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.content}>

        {/* ══ GROUPS VIEW ══ */}
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
                  <button style={s.btnReport} onClick={() => downloadAssetsReport()}>
                    ⬇ Download All (PDF)
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
                  <div style={{ ...s.statNumber, color: "#2563eb" }}>
                    {groups.reduce((a, g) => a + (g.TotalAssets || 0), 0)}
                  </div>
                  <div style={s.statLabel}>Total Assets</div>
                </div>
                <div style={s.statCard}>
                  <div style={{ ...s.statNumber, color: "#16a34a" }}>
                    {groups.reduce((a, g) => a + (g.AvailableCount || 0), 0)}
                  </div>
                  <div style={s.statLabel}>Available</div>
                </div>
                <div style={s.statCard}>
                  <div style={{ ...s.statNumber, color: "#f59e0b" }}>
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
                <div style={s.emptyIcon}>📦</div>
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
                      <div style={s.groupIconWrap}>
                        <span style={s.groupIconEmoji}>
                          {getGroupIcon(group.GroupName)}
                        </span>
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
                          ...s.groupStatNumber, color: "#16a34a"
                        }}>
                          {group.AvailableCount || 0}
                        </span>
                        <span style={s.groupStatLabel}>Available</span>
                      </div>
                      <div style={s.groupStatDivider} />
                      <div style={s.groupStatItem}>
                        <span style={{
                          ...s.groupStatNumber, color: "#2563eb"
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
                        style={s.btnViewAssets}
                        onClick={() => fetchGroupAssets(group)}
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
                            ✏️
                          </button>
                          <button
                            style={s.btnIconDelete}
                            onClick={() => handleDeleteGroup(group.GroupID)}
                            title="Delete group"
                          >
                            🗑️
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

        {/* ══ ASSETS INSIDE GROUP VIEW ══ */}
        {view === "assets" && selectedGroup && (
          <>
            {/* Breadcrumb Header */}
            <div style={s.pageHeader}>
              <div>
                <div style={s.breadcrumb}>
                  <span
                    style={s.breadcrumbLink}
                    onClick={() => {
                      setView("groups");
                      setShowAssetForm(false);
                    }}
                  >
                    Asset Groups
                  </span>
                  <span style={s.breadcrumbArrow}> › </span>
                  <span style={s.breadcrumbActive}>
                    {selectedGroup.GroupName}
                  </span>
                </div>
                <p style={s.pageSubtitle}>
                  Managing assets in {selectedGroup.GroupName} group
                </p>
              </div>
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

            {/* Summary Cards */}
            <div style={s.summaryCards}>
              <div style={s.summaryCard}>
                <div style={s.summaryCardIcon}>📦</div>
                <div>
                  <div style={s.summaryCardNumber}>
                    {groupAssets.length}
                  </div>
                  <div style={s.summaryCardLabel}>Total Assets</div>
                </div>
              </div>
              <div style={s.summaryCard}>
                <div style={{
                  ...s.summaryCardIcon,
                  backgroundColor: "#f0fdf4",
                  color: "#16a34a"
                }}>
                  ✅
                </div>
                <div>
                  <div style={{
                    ...s.summaryCardNumber, color: "#16a34a"
                  }}>
                    {groupAssets.filter(a => a.Status === "Available").length}
                  </div>
                  <div style={s.summaryCardLabel}>Available</div>
                </div>
              </div>
              <div style={s.summaryCard}>
                <div style={{
                  ...s.summaryCardIcon,
                  backgroundColor: "#eff6ff",
                  color: "#2563eb"
                }}>
                  🔗
                </div>
                <div>
                  <div style={{
                    ...s.summaryCardNumber, color: "#2563eb"
                  }}>
                    {groupAssets.filter(a => a.Status === "Assigned").length}
                  </div>
                  <div style={s.summaryCardLabel}>Assigned</div>
                </div>
              </div>
              <div style={s.summaryCard}>
                <div style={{
                  ...s.summaryCardIcon,
                  backgroundColor: "#fefce8",
                  color: "#ca8a04"
                }}>
                  🏷️
                </div>
                <div>
                  <div style={s.summaryCardNumber}>
                    {selectedGroup.GroupCode}
                  </div>
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
                    <span style={s.groupSelectedIcon}>
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
                  <div style={s.emptyIcon}>📭</div>
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
                                  style={s.btnReport}
                                  onClick={() => downloadAssetReport(asset.AssetID, asset.AssetCode)}
                                >
                                  Report
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  style={s.btnDelete}
                                  onClick={() => handleDeleteAsset(asset.AssetID)}
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

const s = {
  page: {
    minHeight:       "100vh",
    backgroundColor: "#e3edf8",
    color:           "#1e293b",
  },
  content: {
    padding:   "32px 40px",
    maxWidth:  "1400px",
    margin:    "0 auto",
  },

  pageHeader: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    marginBottom:   "28px",
  },
  pageTitle: {
    fontSize:     "24px",
    fontWeight:   "700",
    color:        "#0f172a",
    margin:       0,
    letterSpacing: "-0.3px",
  },
  pageSubtitle: {
    fontSize:  "14px",
    color:     "#64748b",
    marginTop: "4px",
    margin:    "4px 0 0",
  },

  btnPrimary: {
    padding:         "10px 20px",
    backgroundColor: "#2563eb",
    color:           "#fff",
    border:          "none",
    borderRadius:    "8px",
    fontSize:        "13px",
    fontWeight:      "600",
    cursor:          "pointer",
    boxShadow:       "0 1px 3px rgba(37,99,235,0.3)",
  },

  statsRow: {
    display:             "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap:                 "16px",
    marginBottom:        "28px",
  },
  statCard: {
    backgroundColor: "#fff",
    border:          "1px solid #e2e8f0",
    borderRadius:    "12px",
    padding:         "20px 24px",
    boxShadow:       "0 1px 3px rgba(0,0,0,0.05)",
  },
  statNumber: {
    fontSize:   "28px",
    fontWeight: "700",
    color:      "#0f172a",
    lineHeight: 1,
  },
  statLabel: {
    fontSize:  "13px",
    color:     "#64748b",
    marginTop: "6px",
  },

  formCard: {
    backgroundColor: "#fff",
    border:          "1px solid #e2e8f0",
    borderRadius:    "12px",
    padding:         "24px",
    marginBottom:    "24px",
    boxShadow:       "0 1px 3px rgba(0,0,0,0.05)",
  },
  formTitle: {
    fontSize:     "15px",
    fontWeight:   "600",
    color:        "#0f172a",
    marginBottom: "4px",
    marginTop:    0,
  },
  formTopBar: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    marginBottom:   "20px",
  },
  formSubtitle: {
    fontSize:  "13px",
    color:     "#64748b",
    margin:    "4px 0 0",
  },
  groupSelectedBadge: {
    display:         "flex",
    alignItems:      "center",
    gap:             "12px",
    padding:         "10px 16px",
    backgroundColor: "#eff6ff",
    border:          "1px solid #bfdbfe",
    borderRadius:    "10px",
  },
  groupSelectedIcon: {
    fontSize: "20px",
  },
  groupSelectedName: {
    fontSize:   "14px",
    fontWeight: "600",
    color:      "#1e40af",
  },
  groupSelectedCode: {
    fontSize:  "11px",
    color:     "#3b82f6",
    marginTop: "2px",
  },
  formRow: {
    display:    "flex",
    gap:        "16px",
    alignItems: "flex-end",
    flexWrap:   "wrap",
  },
  assetFormGrid: {
    display:             "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap:                 "16px",
    marginBottom:        "20px",
  },
  formField: {
    display:       "flex",
    flexDirection: "column",
    gap:           "6px",
    flex:          1,
    minWidth:      "160px",
  },
  label: {
    fontSize:      "12px",
    fontWeight:    "600",
    color:         "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    height:          "40px",
    padding:         "0 12px",
    backgroundColor: "#f8fafc",
    border:          "1.5px solid #e2e8f0",
    borderRadius:    "8px",
    color:           "#0f172a",
    fontSize:        "13px",
    outline:         "none",
    boxSizing:       "border-box",
    width:           "100%",
  },
  errorMsg: {
    color:           "#dc2626",
    fontSize:        "13px",
    padding:         "10px 14px",
    backgroundColor: "#fef2f2",
    borderRadius:    "8px",
    border:          "1px solid #fecaca",
    marginTop:       "12px",
  },
  successMsg: {
    color:           "#16a34a",
    fontSize:        "13px",
    padding:         "10px 14px",
    backgroundColor: "#f0fdf4",
    borderRadius:    "8px",
    border:          "1px solid #bbf7d0",
    marginTop:       "12px",
  },

  groupGrid: {
    display:             "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap:                 "20px",
  },
  groupCard: {
    backgroundColor: "#fff",
    border:          "1px solid #e2e8f0",
    borderRadius:    "14px",
    padding:         "24px",
    boxShadow:       "0 1px 3px rgba(0,0,0,0.05)",
    transition:      "box-shadow 0.2s",
  },
  groupCardTop: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   "16px",
  },
  groupIconWrap: {
    width:           "48px",
    height:          "48px",
    backgroundColor: "#eff6ff",
    borderRadius:    "12px",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
  },
  groupIconEmoji: {
    fontSize: "22px",
  },
  groupCodePill: {
    padding:         "4px 10px",
    backgroundColor: "#f1f5f9",
    color:           "#475569",
    borderRadius:    "20px",
    fontSize:        "11px",
    fontWeight:      "600",
    letterSpacing:   "0.05em",
  },
  groupCardName: {
    fontSize:     "18px",
    fontWeight:   "700",
    color:        "#0f172a",
    margin:       "0 0 16px",
  },
  groupCardStats: {
    display:         "flex",
    alignItems:      "center",
    gap:             "0",
    backgroundColor: "#f8fafc",
    borderRadius:    "10px",
    padding:         "12px 0",
    marginBottom:    "14px",
  },
  groupStatItem: {
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    flex:          1,
  },
  groupStatNumber: {
    fontSize:   "20px",
    fontWeight: "700",
    color:      "#0f172a",
    lineHeight: 1,
  },
  groupStatLabel: {
    fontSize:  "11px",
    color:     "#94a3b8",
    marginTop: "4px",
  },
  groupStatDivider: {
    width:           "1px",
    height:          "32px",
    backgroundColor: "#e2e8f0",
  },
  progressBar: {
    height:          "4px",
    backgroundColor: "#e2e8f0",
    borderRadius:    "2px",
    overflow:        "hidden",
    marginBottom:    "6px",
  },
  progressFill: {
    height:          "100%",
    backgroundColor: "#2563eb",
    borderRadius:    "2px",
    transition:      "width 0.3s",
  },
  progressLabel: {
    fontSize:     "11px",
    color:        "#94a3b8",
    margin:       "0 0 16px",
  },
  groupCardActions: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    gap:            "8px",
  },
  btnViewAssets: {
    flex:            1,
    padding:         "9px 0",
    backgroundColor: "#eff6ff",
    color:           "#2563eb",
    border:          "1px solid #bfdbfe",
    borderRadius:    "8px",
    fontSize:        "13px",
    fontWeight:      "600",
    cursor:          "pointer",
    textAlign:       "center",
  },
  groupCardSecondary: {
    display: "flex",
    gap:     "6px",
  },
  btnIconEdit: {
    width:           "34px",
    height:          "34px",
    backgroundColor: "#fefce8",
    border:          "1px solid #fde68a",
    borderRadius:    "8px",
    cursor:          "pointer",
    fontSize:        "14px",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
  },
  btnIconDelete: {
    width:           "34px",
    height:          "34px",
    backgroundColor: "#fef2f2",
    border:          "1px solid #fecaca",
    borderRadius:    "8px",
    cursor:          "pointer",
    fontSize:        "14px",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
  },

  loadingBox: {
    textAlign: "center",
    padding:   "60px 20px",
  },
  loadingText: {
    color:    "#94a3b8",
    fontSize: "14px",
  },
  loadingSpinner: {
    width:           "32px",
    height:          "32px",
    border:          "3px solid #e2e8f0",
    borderTopColor:  "#2563eb",
    borderRadius:    "50%",
    margin:          "0 auto 16px",
    animation:       "spin 0.8s linear infinite",
  },
  emptyBox: {
    textAlign:       "center",
    padding:         "60px 20px",
    backgroundColor: "#fff",
    border:          "1px solid #e2e8f0",
    borderRadius:    "14px",
  },
  emptyIcon: {
    fontSize:     "40px",
    marginBottom: "12px",
  },
  emptyTitle: {
    fontSize:     "16px",
    fontWeight:   "600",
    color:        "#475569",
    margin:       "0 0 8px",
  },
  emptySubtitle: {
    fontSize: "13px",
    color:    "#94a3b8",
    margin:   0,
  },

  breadcrumb: {
    display:      "flex",
    alignItems:   "center",
    gap:          "4px",
    marginBottom: "4px",
  },
  breadcrumbLink: {
    fontSize:   "13px",
    color:      "#2563eb",
    cursor:     "pointer",
    fontWeight: "500",
  },
  breadcrumbArrow: {
    color:    "#94a3b8",
    fontSize: "16px",
  },
  breadcrumbActive: {
    fontSize:   "24px",
    fontWeight: "700",
    color:      "#0f172a",
  },

  summaryCards: {
    display:             "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap:                 "16px",
    marginBottom:        "24px",
  },
  summaryCard: {
    backgroundColor: "#fff",
    border:          "1px solid #e2e8f0",
    borderRadius:    "12px",
    padding:         "20px",
    display:         "flex",
    alignItems:      "center",
    gap:             "16px",
    boxShadow:       "0 1px 3px rgba(0,0,0,0.05)",
  },
  summaryCardIcon: {
    width:           "44px",
    height:          "44px",
    backgroundColor: "#f1f5f9",
    borderRadius:    "10px",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    fontSize:        "20px",
    flexShrink:      0,
  },
  summaryCardNumber: {
    fontSize:   "22px",
    fontWeight: "700",
    color:      "#0f172a",
    lineHeight: 1,
  },
  summaryCardLabel: {
    fontSize:  "12px",
    color:     "#64748b",
    marginTop: "4px",
  },

  tableCard: {
    backgroundColor: "#fff",
    border:          "1px solid #e2e8f0",
    borderRadius:    "14px",
    overflow:        "hidden",
    boxShadow:       "0 1px 3px rgba(0,0,0,0.05)",
  },
  tableHeader: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    padding:        "18px 20px",
    borderBottom:   "1px solid #f1f5f9",
  },
  tableTitle: {
    fontSize:   "15px",
    fontWeight: "600",
    color:      "#0f172a",
    margin:     0,
  },
  tableCount: {
    fontSize:        "12px",
    fontWeight:      "600",
    color:           "#64748b",
    backgroundColor: "#f1f5f9",
    padding:         "4px 10px",
    borderRadius:    "20px",
  },
  table: {
    width:          "100%",
    borderCollapse: "collapse",
  },
  tableHeadRow: {
    backgroundColor: "#f8fafc",
  },
  th: {
    padding:       "12px 16px",
    textAlign:     "left",
    fontSize:      "11px",
    fontWeight:    "700",
    color:         "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom:  "1px solid #e2e8f0",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding:  "14px 16px",
    fontSize: "13px",
    color:    "#475569",
  },
  tdName: {
    padding:    "14px 16px",
    fontSize:   "13px",
    color:      "#0f172a",
    fontWeight: "600",
  },
  tdMono: {
    padding:    "14px 16px",
    fontSize:   "12px",
    color:      "#475569",
    fontFamily: "monospace",
  },
  assetCodeBadge: {
    padding:         "3px 8px",
    backgroundColor: "#eff6ff",
    color:           "#2563eb",
    borderRadius:    "6px",
    fontSize:        "11px",
    fontWeight:      "700",
    letterSpacing:   "0.04em",
  },
  statusBadge: {
    padding:      "4px 10px",
    borderRadius: "20px",
    fontSize:     "12px",
    fontWeight:   "600",
  },
  btnDelete: {
    padding:         "5px 12px",
    backgroundColor: "#fef2f2",
    color:           "#dc2626",
    border:          "1px solid #fecaca",
    borderRadius:    "6px",
    fontSize:        "12px",
    fontWeight:      "500",
    cursor:          "pointer",
  },
  btnReport: {
    padding:         "5px 12px",
    backgroundColor: "#f0fdf4",
    color:           "#059669",
    border:          "1px solid #bbf7d0",
    borderRadius:    "6px",
    fontSize:        "12px",
    fontWeight:      "600",
    cursor:          "pointer",
  },
};

export default AssetPage;