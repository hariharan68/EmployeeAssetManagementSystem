import Navbar from "../components/Navbar";
import { useTheme, getTheme } from "../context/ThemeContext";

const THEMES = [
  {
    id: "light",
    name: "Classic Blue",
    description: "Clean blue & white — the default look",
    preview: {
      bg: "#eff6ff", surface: "#ffffff", accent: "#2563eb",
      text: "#1e3a8a", border: "#bfdbfe",
    },
  },
  {
    id: "warm",
    name: "Warm Cream",
    description: "Terracotta & cream — easy on the eyes",
    preview: {
      bg: "#F5F1EA", surface: "#FBF9F5", accent: "#C15A34",
      text: "#1C1A17", border: "#E0DCD3",
    },
  },
  {
    id: "dark",
    name: "Dark Mode",
    description: "Dark zinc — low light environment",
    preview: {
      bg: "#18181b", surface: "#27272a", accent: "#2563eb",
      text: "#fafafa", border: "#3f3f46",
    },
  },
];

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const t = getTheme(theme);

  const S = {
    page:    { background: t.pageBg, minHeight: "100vh" },
    wrap:    { maxWidth: 860, margin: "0 auto", padding: "36px 32px" },
    heading: { fontSize: 24, fontWeight: 800, color: t.textPrimary, margin: 0 },
    sub:     { fontSize: 14, color: t.textSecondary, marginTop: 6, marginBottom: 36 },
    section: { marginBottom: 40 },
    eyebrow: {
      fontSize: 11, fontWeight: 700, color: t.textSecondary,
      textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16,
    },
    grid: {
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20,
    },
    card: (isActive, p) => ({
      background: p.surface, border: `2px solid ${isActive ? p.accent : p.border}`,
      borderRadius: 16, padding: 20, cursor: "pointer",
      boxShadow: isActive ? `0 0 0 4px ${p.accent}22` : "none",
      transition: "all 0.2s",
      position: "relative", overflow: "hidden",
    }),
    previewBox: (p) => ({
      background: p.bg, border: `1px solid ${p.border}`,
      borderRadius: 10, padding: 14, marginBottom: 16,
      display: "flex", flexDirection: "column", gap: 8,
    }),
    previewBar: (p) => ({
      background: p.surface, border: `1px solid ${p.border}`,
      borderRadius: 6, height: 8, width: "100%",
    }),
    previewAccent: (p) => ({
      background: p.accent, borderRadius: 4, height: 8, width: "40%",
    }),
    previewText: (p) => ({
      background: p.text + "33", borderRadius: 3, height: 6, width: "70%",
    }),
    previewTextSm: (p) => ({
      background: p.text + "22", borderRadius: 3, height: 5, width: "50%",
    }),
    themeName: (p) => ({
      fontSize: 15, fontWeight: 700, color: p.text, marginBottom: 4,
    }),
    themeDesc: (p) => ({
      fontSize: 12, color: p.text + "99",
    }),
    activeBadge: (p) => ({
      position: "absolute", top: 12, right: 12,
      background: p.accent, color: "#fff",
      fontSize: 10, fontWeight: 700, padding: "3px 8px",
      borderRadius: 999, letterSpacing: "0.05em",
    }),
  };

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.wrap}>
        <h2 style={S.heading}>Settings</h2>
        <p style={S.sub}>Personalise the look and feel of your workspace</p>

        <div style={S.section}>
          <div style={S.eyebrow}>Appearance — Theme</div>
          <div style={S.grid}>
            {THEMES.map((th) => {
              const isActive = theme === th.id;
              const p = th.preview;
              return (
                <div
                  key={th.id}
                  style={S.card(isActive, p)}
                  onClick={() => setTheme(th.id)}
                >
                  {isActive && <div style={S.activeBadge(p)}>ACTIVE</div>}

                  {/* Mini UI preview */}
                  <div style={S.previewBox(p)}>
                    <div style={S.previewBar(p)} />
                    <div style={S.previewAccent(p)} />
                    <div style={S.previewText(p)} />
                    <div style={S.previewTextSm(p)} />
                    <div style={S.previewText(p)} />
                  </div>

                  <div style={S.themeName(p)}>{th.name}</div>
                  <div style={S.themeDesc(p)}>{th.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
