import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, setOwnPassword, checkEmail } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate  = useNavigate();
  const { login } = useAuth();

  // step: "email" | "password" | "setpassword" | "notfound"
  const [step, setStep] = useState("email");

  const [email,       setEmail]       = useState("");
  const [emailError,  setEmailError]  = useState("");
  const [emailLoading,setEmailLoading]= useState(false);

  const [password,    setPassword]    = useState("");
  const [loginError,  setLoginError]  = useState("");
  const [loginLoading,setLoginLoading]= useState(false);
  const [showPwd,     setShowPwd]     = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [setPwdError, setSetPwdError] = useState("");
  const [setPwdSuccess,setSetPwdSuccess] = useState("");
  const [setPwdLoading,setSetPwdLoading] = useState(false);
  const [showNewPwd,  setShowNewPwd]  = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);

  const handleEmailContinue = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError("");
    try {
      const result = await checkEmail(email);
      if (!result.exists) {
        setStep("notfound");
      } else if (result.role === "Admin") {
        setStep("password");
      } else if (result.has_password) {
        setStep("password");
      } else {
        setStep("setpassword");
      }
    } catch {
      setEmailError("Cannot reach server. Is the backend running?");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const data = await loginUser(email, password);
      login(data.access_token, data.role, data.username);
      navigate("/dashboard");
    } catch (err) {
      setLoginError(
        err.response?.data?.detail ||
          (err.response ? "Invalid email or password" : "Cannot reach server. Is the backend running?")
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { setSetPwdError("Passwords do not match"); return; }
    if (newPassword.length < 6)  { setSetPwdError("Password must be at least 6 characters"); return; }
    setSetPwdLoading(true);
    setSetPwdError("");
    setSetPwdSuccess("");
    try {
      const data = await setOwnPassword(email, newPassword);
      setSetPwdSuccess(data.message + " Redirecting to login...");
      setTimeout(() => {
        setNewPassword(""); setConfirm(""); setSetPwdSuccess("");
        setStep("password");
      }, 2000);
    } catch (err) {
      setSetPwdError(err.response?.data?.detail || "Failed to set password. Try again.");
    } finally {
      setSetPwdLoading(false);
    }
  };

  const resetToEmail = () => {
    setStep("email");
    setEmailError(""); setLoginError(""); setSetPwdError(""); setSetPwdSuccess("");
    setPassword(""); setNewPassword(""); setConfirm("");
  };

  const stepTitle = {
    email:       "Welcome Back",
    password:    "Enter Password",
    setpassword: "Set Your Password",
    notfound:    "Account Not Found",
  };
  const stepSub = {
    email:       "Sign in to access your dashboard",
    password:    `Signing in as ${email}`,
    setpassword: "Create a password to activate your account",
    notfound:    "No account found for this email",
  };

  return (
    <div style={s.body}>
      <div style={s.container}>

        {/* LEFT PANEL */}
        <div style={s.leftPanel}>
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
              <h2 style={s.heroH2}>Manage Assets.<br />Track Everything.</h2>
            </div>
          </div>
          <div style={s.featurePills}>
            {[
              { icon: "👥", title: "Employee Management", desc: "Records, departments, roles and permissions" },
              { icon: "💻", title: "Asset Tracking",      desc: "Laptops, monitors, phones and accessories" },
              { icon: "📊", title: "Reports & Auditing",  desc: "Returns, history and full audit trail" },
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

        {/* RIGHT PANEL */}
        <div style={s.rightPanel}>
          <div style={s.authCard}>

            <div style={s.greeting}>
              <div style={s.eyebrow}>EmpAssetDB</div>
              <h1 style={s.greetingH1}>{stepTitle[step]}</h1>
              <p style={s.greetingP}>{stepSub[step]}</p>
            </div>

            {/* STEP 1 — EMAIL */}
            {step === "email" && (
              <form onSubmit={handleEmailContinue}>
                <div style={s.formGroup}>
                  <label style={s.label}>Email Address</label>
                  <div style={s.inputWrap}>
                    <span style={s.inputIcon}>📧</span>
                    <input
                      type="email" placeholder="Enter your email"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      style={s.input} required autoFocus
                    />
                  </div>
                </div>
                {emailError && <p style={s.errorMsg}>{emailError}</p>}
                <button type="submit" style={s.btnPrimary} disabled={emailLoading}>
                  {emailLoading ? "Checking..." : "Continue →"}
                </button>
              </form>
            )}

            {/* STEP 2a — PASSWORD (admin or user with password) */}
            {step === "password" && (
              <form onSubmit={handleLogin}>
                <div style={s.formGroup}>
                  <label style={s.label}>Email Address</label>
                  <div style={s.inputWrap}>
                    <span style={s.inputIcon}>📧</span>
                    <input type="email" value={email} style={{ ...s.input, background: "#f1f5f9", color: "#64748b" }} readOnly />
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Password</label>
                  <div style={s.inputWrap}>
                    <span style={s.inputIcon}>🔒</span>
                    <input
                      type={showPwd ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      style={s.input} required autoFocus
                    />
                  </div>
                  <div style={s.checkRow}>
                    <input type="checkbox" id="showPwd" checked={showPwd}
                      onChange={() => setShowPwd(!showPwd)} style={s.checkbox} />
                    <label htmlFor="showPwd" style={s.checkLabel}>Show password</label>
                  </div>
                </div>
                {loginError && <p style={s.errorMsg}>{loginError}</p>}
                <button type="submit" style={s.btnPrimary} disabled={loginLoading}>
                  {loginLoading ? "Signing in..." : "Sign In →"}
                </button>
                <p style={s.bottomText}>
                  <span style={s.link} onClick={resetToEmail}>← Use a different email</span>
                </p>
              </form>
            )}

            {/* STEP 2b — SET PASSWORD (user with no password) */}
            {step === "setpassword" && (
              <form onSubmit={handleSetPassword}>
                <div style={s.formGroup}>
                  <label style={s.label}>Email Address</label>
                  <div style={s.inputWrap}>
                    <span style={s.inputIcon}>📧</span>
                    <input type="email" value={email} style={{ ...s.input, background: "#f1f5f9", color: "#64748b" }} readOnly />
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>New Password</label>
                  <div style={s.inputWrap}>
                    <span style={s.inputIcon}>🔒</span>
                    <input
                      type={showNewPwd ? "text" : "password"}
                      placeholder="Choose a password (min 6 chars)"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      style={s.input} required autoFocus
                    />
                  </div>
                  <div style={s.checkRow}>
                    <input type="checkbox" id="showNew" checked={showNewPwd}
                      onChange={() => setShowNewPwd(!showNewPwd)} style={s.checkbox} />
                    <label htmlFor="showNew" style={s.checkLabel}>Show password</label>
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Confirm Password</label>
                  <div style={s.inputWrap}>
                    <span style={s.inputIcon}>🔒</span>
                    <input
                      type={showConfPwd ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirm} onChange={(e) => setConfirm(e.target.value)}
                      style={s.input} required
                    />
                  </div>
                  <div style={s.checkRow}>
                    <input type="checkbox" id="showConf" checked={showConfPwd}
                      onChange={() => setShowConfPwd(!showConfPwd)} style={s.checkbox} />
                    <label htmlFor="showConf" style={s.checkLabel}>Show password</label>
                  </div>
                </div>
                {setPwdError   && <p style={s.errorMsg}>{setPwdError}</p>}
                {setPwdSuccess && <p style={s.successMsg}>{setPwdSuccess}</p>}
                <button type="submit" style={s.btnPrimary} disabled={setPwdLoading}>
                  {setPwdLoading ? "Setting..." : "Set Password →"}
                </button>
                <p style={s.bottomText}>
                  <span style={s.link} onClick={resetToEmail}>← Use a different email</span>
                </p>
              </form>
            )}

            {/* STEP 2c — NOT FOUND */}
            {step === "notfound" && (
              <div>
                <div style={s.notFoundBox}>
                  <div style={s.notFoundIcon}>🚫</div>
                  <p style={s.notFoundTitle}>No account found</p>
                  <p style={s.notFoundDesc}>
                    <strong>{email}</strong> is not registered in the system.<br />
                    Please contact your <strong>Admin</strong> to generate a login for you.
                  </p>
                </div>
                <button style={s.btnSecondary} onClick={resetToEmail}>
                  ← Try a different email
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

const s = {
  body: { minHeight: "100vh", display: "flex", background: "#0f172a" },
  container: { width: "100%", display: "flex" },
  leftPanel: {
    width: "45%", position: "relative", display: "flex", flexDirection: "column",
    justifyContent: "space-between", padding: "50px 56px", overflow: "hidden",
    background: "linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
  },
  circle1: {
    position: "absolute", width: "420px", height: "420px", borderRadius: "50%",
    background: "rgba(255,255,255,0.05)", top: "-120px", right: "-100px",
  },
  circle2: {
    position: "absolute", width: "280px", height: "280px", borderRadius: "50%",
    background: "rgba(255,255,255,0.05)", bottom: "-80px", left: "-60px",
  },
  logoBlock: { position: "relative", zIndex: 1 },
  logoBadge: {
    display: "inline-flex", alignItems: "center", gap: "12px",
    background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "12px", padding: "10px 16px", marginBottom: "40px",
  },
  logoIcon: {
    width: "36px", height: "36px", background: "#fff", borderRadius: "8px",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
  },
  logoName: { fontSize: "15px", fontWeight: "700", color: "#fff" },
  logoSub:  { fontSize: "11px", color: "rgba(255,255,255,0.65)", marginTop: "1px" },
  heroText: { position: "relative", zIndex: 1 },
  heroH2: {
    fontSize: "36px", fontWeight: "800", color: "#fff",
    lineHeight: "1.2", marginBottom: "16px", letterSpacing: "-0.5px",
  },
  featurePills: { display: "flex", flexDirection: "column", gap: "12px", position: "relative", zIndex: 1 },
  pill: {
    display: "flex", alignItems: "center", gap: "14px",
    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px", padding: "14px 18px",
  },
  pillIcon: {
    width: "36px", height: "36px", background: "rgba(255,255,255,0.15)", borderRadius: "8px",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", flexShrink: 0,
  },
  pillTitle: { fontSize: "13px", fontWeight: "600", color: "#fff", marginBottom: "2px" },
  pillDesc:  { fontSize: "11px", color: "rgba(255,255,255,0.6)" },
  rightPanel: {
    width: "55%", background: "#f8fafc",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 30px",
  },
  authCard: { width: "420px" },
  greeting: { marginBottom: "32px" },
  eyebrow: {
    fontSize: "11px", fontWeight: "700", color: "#2563eb",
    letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px",
  },
  greetingH1: { fontSize: "26px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.4px" },
  greetingP:  { fontSize: "13px", color: "#94a3b8", marginTop: "5px" },
  formGroup: { marginBottom: "18px" },
  label: {
    display: "block", fontSize: "11px", fontWeight: "700", color: "#475569",
    letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "7px",
  },
  inputWrap: { position: "relative" },
  inputIcon: {
    position: "absolute", left: "14px", top: "50%",
    transform: "translateY(-50%)", fontSize: "15px", pointerEvents: "none",
  },
  input: {
    width: "100%", height: "46px", border: "1.5px solid #e2e8f0", borderRadius: "9px",
    padding: "0 14px 0 42px", fontSize: "13px", color: "#0f172a",
    background: "#fff", boxSizing: "border-box", outline: "none",
  },
  checkRow: { display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" },
  checkbox: { width: "15px", height: "15px", cursor: "pointer", accentColor: "#2563eb" },
  checkLabel: { fontSize: "13px", color: "#64748b", cursor: "pointer" },
  btnPrimary: {
    width: "100%", height: "46px", border: "none", borderRadius: "9px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff",
    fontSize: "14px", fontWeight: "700", cursor: "pointer",
    boxShadow: "0 4px 14px rgba(37,99,235,0.35)", marginTop: "4px",
  },
  btnSecondary: {
    width: "100%", height: "46px", border: "1.5px solid #e2e8f0", borderRadius: "9px",
    background: "#fff", color: "#475569", fontSize: "14px", fontWeight: "600",
    cursor: "pointer", marginTop: "12px",
  },
  errorMsg: {
    color: "#ef4444", fontSize: "13px", marginBottom: "12px",
    padding: "10px 14px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca",
  },
  successMsg: {
    color: "#16a34a", fontSize: "13px", marginBottom: "12px",
    padding: "10px 14px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0",
  },
  bottomText: { textAlign: "center", marginTop: "22px", fontSize: "13px", color: "#64748b" },
  link: { color: "#2563eb", fontWeight: "700", cursor: "pointer" },
  notFoundBox: {
    textAlign: "center", padding: "32px 24px", background: "#fef2f2",
    border: "1px solid #fecaca", borderRadius: "12px", marginBottom: "16px",
  },
  notFoundIcon: { fontSize: "40px", marginBottom: "12px" },
  notFoundTitle: { fontSize: "16px", fontWeight: "700", color: "#dc2626", marginBottom: "8px" },
  notFoundDesc: { fontSize: "13px", color: "#64748b", lineHeight: "1.6" },
};

export default LoginPage;