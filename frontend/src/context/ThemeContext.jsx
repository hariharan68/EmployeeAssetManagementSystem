import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const setAndSaveTheme = (t) => {
    setTheme(t);
    localStorage.setItem("theme", t);
  };

  const isDark = theme === "dark";

  const toggleTheme = () => {
    if (theme === "dark") {
      // return to the last non-dark theme (warm or light)
      const prev = localStorage.getItem("prevTheme") || "light";
      setAndSaveTheme(prev);
    } else {
      // save current non-dark theme so we can return to it
      localStorage.setItem("prevTheme", theme);
      setAndSaveTheme("dark");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setAndSaveTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export const getTheme = (isDarkOrTheme) => {
  // support both old boolean usage and new theme string
  const theme = typeof isDarkOrTheme === "string" ? isDarkOrTheme : (isDarkOrTheme ? "dark" : "light");

  if (theme === "warm") return {
    pageBg:           "#F5F1EA",
    surface:          "#FBF9F5",
    surfaceAlt:       "#EAE6DD",
    border:           "#E0DCD3",
    shadow:           "rgba(28,26,23,0.06)",
    divider:          "#E0DCD3",
    textPrimary:      "#1C1A17",
    textSecondary:    "#8A8377",
    textBody:         "#1C1A17",
    thBg:             "#EAE6DD",
    rowBorder:        "#E0DCD3",
    inputBg:          "#FBF9F5",
    inputColor:       "#1C1A17",
    codeBg:           "#EAE6DD",
    codeColor:        "#1C1A17",
    badgeActiveBg:    "#e8f5e9",
    badgeActiveColor: "#2e7d32",
    badgeInactiveBg:  "#fbe9e7",
    badgeInactiveColor:"#bf360c",
    accent:           "#C15A34",
    accentLight:      "#FBF9F5",
    navBg:            "#FBF9F5",
    navBorder:        "#E0DCD3",
    navText:          "#8A8377",
    navTextActive:    "#C15A34",
    navActiveBg:      "rgba(193,90,52,0.08)",
    pillBg:           "#EAE6DD",
    pillBorder:       "#E0DCD3",
  };

  if (theme === "dark") return {
    pageBg:           "#18181b",
    surface:          "#27272a",
    surfaceAlt:       "#1f1f23",
    border:           "#3f3f46",
    shadow:           "rgba(0,0,0,0.4)",
    divider:          "#3f3f46",
    textPrimary:      "#fafafa",
    textSecondary:    "#a1a1aa",
    textBody:         "#d4d4d8",
    thBg:             "#1f1f23",
    rowBorder:        "#3f3f46",
    inputBg:          "#27272a",
    inputColor:       "#fafafa",
    codeBg:           "#3f3f46",
    codeColor:        "#93c5fd",
    badgeActiveBg:    "#14532d",
    badgeActiveColor: "#86efac",
    badgeInactiveBg:  "#450a0a",
    badgeInactiveColor:"#fca5a5",
    accent:           "#2563eb",
    accentLight:      "#1d4ed8",
    navBg:            "#18181b",
    navBorder:        "#3f3f46",
    navText:          "#d4d4d8",
    navTextActive:    "#60a5fa",
    navActiveBg:      "rgba(96,165,250,0.1)",
    pillBg:           "#27272a",
    pillBorder:       "#3f3f46",
  };

  // light (default)
  return {
    pageBg:           "#eff6ff",
    surface:          "#ffffff",
    surfaceAlt:       "#eff6ff",
    border:           "#bfdbfe",
    shadow:           "rgba(37,99,235,0.08)",
    divider:          "#bfdbfe",
    textPrimary:      "#1e3a8a",
    textSecondary:    "#3b82f6",
    textBody:         "#1e40af",
    thBg:             "#eff6ff",
    rowBorder:        "#dbeafe",
    inputBg:          "#ffffff",
    inputColor:       "#1e3a8a",
    codeBg:           "#dbeafe",
    codeColor:        "#1e3a8a",
    badgeActiveBg:    "#dcfce7",
    badgeActiveColor: "#166534",
    badgeInactiveBg:  "#fef2f2",
    badgeInactiveColor:"#991b1b",
    accent:           "#2563eb",
    accentLight:      "#eff6ff",
    navBg:            "#ffffff",
    navBorder:        "#e2e8f0",
    navText:          "#64748b",
    navTextActive:    "#2563eb",
    navActiveBg:      "rgba(37,99,235,0.06)",
    pillBg:           "#f8fafc",
    pillBorder:       "#e2e8f0",
  };
};
