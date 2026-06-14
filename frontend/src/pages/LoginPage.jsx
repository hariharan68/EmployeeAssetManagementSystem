import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate    = useNavigate();
  const { login }   = useAuth();

  const [activeTab, setActiveTab] = useState("login");

  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError,    setLoginError]    = useState("");
  const [loginLoading,  setLoginLoading]  = useState(false);

  const [regUsername, setRegUsername] = useState("");
  const [regEmail,    setRegEmail]    = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError,    setRegError]    = useState("");
  const [regSuccess,  setRegSuccess]  = useState("");
  const [regLoading,  setRegLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const data = await loginUser(loginEmail, loginPassword);
      login(data.access_token, data.role, data.username);
      navigate("/dashboard");
    } catch (err) {
      setLoginError(
        err.response?.data?.detail ||
          (err.response
            ? "Invalid email or password"
            : "Cannot reach server. Is the backend running?")
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError("");
    setRegSuccess("");
    try {
      const data = await registerUser(regUsername, regEmail, regPassword, "User");
      setRegSuccess(
        data?.message ||
          "Registration submitted. An admin must approve your account before you can log in."
      );
      setRegUsername("");
      setRegEmail("");
      setRegPassword("");
    } catch (err) {
      setRegError(
        err.response?.data?.detail || "Registration failed. Try again."
      );
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={s.body}>
      <div style={s.container}>

        {/* ══ LEFT PANEL ══ */}
        <div style={s.leftPanel}>

          {/* Decorative circles */}
          <div style={s.circle1} />
          <div style={s.circle2} />

          <div style={s.logoBlock}>
            <div style={s.logoBadge}>
              <div style={s.logoIcon}>💼</div>
              <div>
                <div style={s.logoName}>EmpAssetDB</div>
                <div style={s.logoSub}>Asset Management System</div>
              </div>
            </div>
            <div style={s.heroText}>
              <h2 style={s.heroH2}>
                Manage Assets.<br />Track Everything.
              </h2>
            </div>
          </div>

          <div style={s.featurePills}>
            {[
              {
                icon: "👥",
                title: "Employee Management",
                desc: "Records, departments, roles and permissions",
              },
              {
                icon: "💻",
                title: "Asset Tracking",
                desc: "Laptops, monitors, phones and accessories",
              },
              {
                icon: "📊",
                title: "Reports & Auditing",
                desc: "Returns, history and full audit trail",
              },
            ].map((item) => (
              <div key={item.title} style={s.pill}>
                <div style={s.pillIcon}>{item.icon}</div>
                <div>
                  <div style={s.pillTitle}>{item.title}</div>
                  <div style={s.pillDesc}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div style={s.rightPanel}>
          <div style={s.authCard}>

            {/* Greeting */}
            <div style={s.greeting}>
              <div style={s.eyebrow}>EmpAssetDB</div>
              <h1 style={s.greetingH1}>
                {activeTab === "login" ? "Welcome Back" : "Create Account"}
              </h1>
              <p style={s.greetingP}>
                {activeTab === "login"
                  ? "Sign in to access your dashboard"
                  : "Register a new system user"}
              </p>
            </div>

            {/* Tabs */}
            <div style={s.tabs}>
              <button
                style={{
                  ...s.tabBtn,
                  ...(activeTab === "login" ? s.tabBtnActive : {}),
                }}
                onClick={() => setActiveTab("login")}
              >
                Sign In
              </button>
              <button
                style={{
                  ...s.tabBtn,
                  ...(activeTab === "register" ? s.tabBtnActive : {}),
                }}
                onClick={() => setActiveTab("register")}
              >
                Register
              </button>
            </div>

            {/* ── LOGIN FORM ── */}
            {activeTab === "login" && (
              <form onSubmit={handleLogin}>

                <div style={s.formGroup}>
                  <label style={s.label}>Email Address</label>
                  <div style={s.inputWrap}>
                    <span style={s.inputIcon}>📧</span>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      style={s.input}
                      required
                    />
                  </div>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Password</label>
                  <div style={s.inputWrap}>
                    <span style={s.inputIcon}>🔒</span>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={s.input}
                      required
                    />
                  </div>
                </div>

                {loginError && (
                  <p style={s.errorMsg}>{loginError}</p>
                )}

                <button
                  type="submit"
                  style={s.btnPrimary}
                  disabled={loginLoading}
                >
                  {loginLoading ? "Signing in..." : "Sign In →"}
                </button>

                <p style={s.bottomText}>
                  Don't have an account?{" "}
                  <span
                    style={s.link}
                    onClick={() => setActiveTab("register")}
                  >
                    Register now
                  </span>
                </p>
              </form>
            )}

            {/* ── REGISTER FORM ── */}
            {activeTab === "register" && (
              <form onSubmit={handleRegister}>

                <div style={s.formGroup}>
                  <label style={s.label}>Username</label>
                  <div style={s.inputWrap}>
                    <span style={s.inputIcon}>👤</span>
                    <input
                      type="text"
                      placeholder="Choose a username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      style={s.input}
                      required
                    />
                  </div>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Email Address</label>
                  <div style={s.inputWrap}>
                    <span style={s.inputIcon}>📧</span>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      style={s.input}
                      required
                    />
                  </div>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Password</label>
                  <div style={s.inputWrap}>
                    <span style={s.inputIcon}>🔒</span>
                    <input
                      type="password"
                      placeholder="Create a strong password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      style={s.input}
                      required
                    />
                  </div>
                </div>

                {regError && (
                  <p style={s.errorMsg}>{regError}</p>
                )}

                {regSuccess && (
                  <p style={s.successMsg}>{regSuccess}</p>
                )}

                <button
                  type="submit"
                  style={s.btnPrimary}
                  disabled={regLoading}
                >
                  {regLoading ? "Creating..." : "Create Account →"}
                </button>

                <p style={s.bottomText}>
                  Already have an account?{" "}
                  <span
                    style={s.link}
                    onClick={() => setActiveTab("login")}
                  >
                    Sign in
                  </span>
                </p>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   ALL STYLES
══════════════════════════════════════ */
const s = {
  body: {
    minHeight: "100vh",
    display: "flex",
    background: "#0f172a",
  },
  container: {
    width: "100%",
    display: "flex",
  },

  /* Left Panel */
  leftPanel: {
    width: "45%",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "50px 56px",
    overflow: "hidden",
    background: "linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
  },
  circle1: {
    position: "absolute",
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
    top: "-120px",
    right: "-100px",
  },
  circle2: {
    position: "absolute",
    width: "280px",
    height: "280px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
    bottom: "-80px",
    left: "-60px",
  },
  logoBlock: {
    position: "relative",
    zIndex: 1,
  },
  logoBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "12px",
    padding: "10px 16px",
    marginBottom: "40px",
  },
  logoIcon: {
    width: "36px",
    height: "36px",
    background: "#fff",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },
  logoName: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#fff",
  },
  logoSub: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.65)",
    marginTop: "1px",
  },
  heroText: {
    position: "relative",
    zIndex: 1,
  },
  heroH2: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#fff",
    lineHeight: "1.2",
    marginBottom: "16px",
    letterSpacing: "-0.5px",
  },

  /* Feature Pills */
  featurePills: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    position: "relative",
    zIndex: 1,
  },
  pill: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px",
    padding: "14px 18px",
  },
  pillIcon: {
    width: "36px",
    height: "36px",
    background: "rgba(255,255,255,0.15)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    flexShrink: 0,
  },
  pillTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "2px",
  },
  pillDesc: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.6)",
  },

  /* Right Panel */
  rightPanel: {
    width: "55%",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 30px",
  },
  authCard: {
    width: "420px",
  },

  /* Greeting */
  greeting: {
    marginBottom: "32px",
  },
  eyebrow: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#2563eb",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  greetingH1: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.4px",
  },
  greetingP: {
    fontSize: "13px",
    color: "#94a3b8",
    marginTop: "5px",
  },

  /* Tabs */
  tabs: {
    display: "flex",
    background: "#e2e8f0",
    borderRadius: "10px",
    padding: "4px",
    marginBottom: "30px",
    gap: "4px",
  },
  tabBtn: {
    flex: 1,
    border: "none",
    background: "none",
    padding: "10px",
    borderRadius: "7px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
    cursor: "pointer",
  },
  tabBtnActive: {
    background: "#fff",
    color: "#1e40af",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },

  /* Form */
  formGroup: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    color: "#475569",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "7px",
  },
  inputWrap: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "15px",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    height: "46px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "9px",
    padding: "0 14px 0 42px",
    fontSize: "13px",
    color: "#0f172a",
    background: "#fff",
    boxSizing: "border-box",
    outline: "none",
  },
  btnPrimary: {
    width: "100%",
    height: "46px",
    border: "none",
    borderRadius: "9px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
    marginTop: "4px",
  },
  errorMsg: {
    color: "#ef4444",
    fontSize: "13px",
    marginBottom: "12px",
    padding: "10px 14px",
    background: "#fef2f2",
    borderRadius: "8px",
    border: "1px solid #fecaca",
  },
  successMsg: {
    color: "#16a34a",
    fontSize: "13px",
    marginBottom: "12px",
    padding: "10px 14px",
    background: "#f0fdf4",
    borderRadius: "8px",
    border: "1px solid #bbf7d0",
  },
  bottomText: {
    textAlign: "center",
    marginTop: "22px",
    fontSize: "13px",
    color: "#64748b",
  },
  link: {
    color: "#2563eb",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default LoginPage;