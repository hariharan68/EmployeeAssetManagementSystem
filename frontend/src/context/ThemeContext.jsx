import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark((prev) => !prev);
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export const getTheme = (isDark) => ({
  // Backgrounds
  pageBg:       isDark ? "#18181b" : "#eff6ff",
  surface:      isDark ? "#27272a" : "#ffffff",
  surfaceAlt:   isDark ? "#1f1f23" : "#eff6ff",
  // Borders & shadows
  border:       isDark ? "#3f3f46" : "#bfdbfe",
  shadow:       isDark ? "rgba(0,0,0,0.4)" : "rgba(37,99,235,0.08)",
  divider:      isDark ? "#3f3f46" : "#bfdbfe",
  // Text
  textPrimary:  isDark ? "#fafafa"  : "#1e3a8a",
  textSecondary:isDark ? "#a1a1aa"  : "#3b82f6",
  textBody:     isDark ? "#d4d4d8"  : "#1e40af",
  // Table
  thBg:         isDark ? "#1f1f23"  : "#eff6ff",
  rowBorder:    isDark ? "#3f3f46"  : "#dbeafe",
  // Inputs
  inputBg:      isDark ? "#27272a"  : "#ffffff",
  inputColor:   isDark ? "#fafafa"  : "#1e3a8a",
  // Badges
  codeBg:       isDark ? "#3f3f46"  : "#dbeafe",
  codeColor:    isDark ? "#93c5fd"  : "#1e3a8a",
  badgeActiveBg:    isDark ? "#14532d" : "#dcfce7",
  badgeActiveColor: isDark ? "#86efac" : "#166534",
  badgeInactiveBg:  isDark ? "#450a0a" : "#fef2f2",
  badgeInactiveColor: isDark ? "#fca5a5" : "#991b1b",
  // Accent
  accent:       "#2563eb",
  accentLight:  isDark ? "#1d4ed8"  : "#eff6ff",
  // Navbar
  navBg:        isDark ? "#18181b"  : "#ffffff",
  navBorder:    isDark ? "#3f3f46"  : "#e2e8f0",
  navText:      isDark ? "#d4d4d8"  : "#64748b",
  navTextActive:isDark ? "#60a5fa"  : "#2563eb",
  navActiveBg:  isDark ? "rgba(96,165,250,0.1)" : "rgba(37,99,235,0.06)",
  pillBg:       isDark ? "#27272a"  : "#f8fafc",
  pillBorder:   isDark ? "#3f3f46"  : "#e2e8f0",
});
