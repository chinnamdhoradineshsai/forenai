import { Eye, EyeOff, Hash, Lock, Mail, Shield, User, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  type Toast,
  ToastContainer,
  type ToastType,
} from "../components/NotificationToast";
import { authService } from "../services/authService";
import type { User as UserType } from "../types/user";

interface LoginPageProps {
  onLogin: (user: UserType) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<"admin" | "investigator">(
    "investigator",
  );

  // Admin Form State
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Investigator Form State
  const [investigatorName, setInvestigatorName] = useState("");
  const [msAccount, setMsAccount] = useState("");
  const [msAuthCode, setMsAuthCode] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Toast Notifications State
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (activeTab === "admin") {
      if (!adminId.trim() || !adminPassword.trim()) {
        const msg = "Admin ID and Password are required.";
        setError(msg);
        addToast("error", msg);
        return;
      }
      // Dynamic validation check
      if (adminId !== "admin" || adminPassword !== "admin123") {
        const msg = "Invalid credentials. Demo: admin / admin123";
        setError(msg);
        addToast("error", msg);
        return;
      }
    } else {
      if (!investigatorName.trim() || !msAccount.trim() || !msAuthCode.trim()) {
        const msg =
          "Investigator Name, Microsoft Account, and Authenticator Code are required.";
        setError(msg);
        addToast("error", msg);
        return;
      }
      if (!authService.isMicrosoftEmail(msAccount.trim())) {
        const msg =
          "Access Blocked: Only Microsoft / corporate email addresses are permitted. Temp or fake emails are strictly prohibited.";
        setError(msg);
        addToast("error", msg);
        return;
      }
      if (
        (msAuthCode.length !== 6 && msAuthCode.length !== 8) ||
        !/^[0-9]+$/.test(msAuthCode)
      ) {
        const msg =
          "Invalid Authenticator Code. Please enter a 6 or 8-digit number.";
        setError(msg);
        addToast("error", msg);
        return;
      }
    }

    setLoading(true);
    if (activeTab === "admin") {
      setTimeout(() => {
        setLoading(false);
        const adminUser: UserType = {
          id: "admin",
          username: "admin",
          name: "System Administrator",
          badgeNumber: "ADM-0001",
          role: "admin",
          email: "admin@fsl.gov.in",
          isActive: true,
        };
        localStorage.setItem("forenai_current_user", JSON.stringify(adminUser));
        addToast(
          "success",
          "Admin authentication successful. Directing to panel...",
        );
        setTimeout(() => {
          onLogin(adminUser);
        }, 1500);
      }, 1200);
    } else {
      authService
        .validateInvestigator(
          investigatorName.trim(),
          msAccount.trim(),
          msAuthCode.trim(),
        )
        .then((user) => {
          setLoading(false);
          if (user) {
            localStorage.setItem("forenai_current_user", JSON.stringify(user));
            addToast(
              "success",
              `Access Granted: Welcome back, ${user.name}! Secure session established.`,
            );
            setTimeout(() => {
              onLogin(user);
            }, 1500);
          } else {
            const msg =
              "Access Denied: Microsoft Account not registered by Admin in directory.";
            setError(msg);
            addToast("error", msg);
          }
        })
        .catch((err) => {
          setLoading(false);
          const msg = err.message || "An error occurred during authentication.";
          setError(msg);
          addToast("error", msg);
        });
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg,#060B12 0%,#08101C 50%,#0A1424 100%)",
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,0.6) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Ambient glows */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center,#06b6d4 0%,transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[400px] h-[300px] opacity-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center,#6366f1 0%,transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative mb-4"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg,#06b6d4,#6366f1)",
                boxShadow: "0 0 32px rgba(6,182,212,0.35)",
              }}
            >
              <Zap size={28} className="text-white" />
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.9)" }}
            >
              <Shield size={12} className="text-white" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-center"
          >
            <h1
              className="text-3xl font-bold tracking-[0.15em] uppercase"
              style={{
                background: "linear-gradient(135deg,#06b6d4,#a5b4fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Forensic AI
            </h1>
            <p className="text-sm text-[#9AA8B6] mt-1.5 tracking-wide uppercase font-semibold">
              Authentication Portal
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="w-12 h-px bg-cyan-500/30" />
              <span className="text-[10px] text-[#4A5A6A] tracking-widest uppercase">
                Secure Access
              </span>
              <span className="w-12 h-px bg-cyan-500/30" />
            </div>
          </motion.div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="rounded-2xl p-7 border border-white/10"
          style={{
            background: "rgba(10,16,28,0.88)",
            backdropFilter: "blur(24px)",
            boxShadow:
              "0 4px 40px rgba(6,182,212,0.08), 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {/* Tabs */}
          <div className="flex bg-white/5 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "admin"
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                  : "text-[#9AA8B6] hover:text-white"
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("investigator");
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "investigator"
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                  : "text-[#9AA8B6] hover:text-white"
              }`}
            >
              Investigator
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-base font-bold text-white">
              {activeTab === "admin" ? "Admin Access" : "Investigator Access"}
            </h2>
            <p className="text-xs text-[#6A7A8A] mt-0.5">
              Authorised personnel only. All sessions are logged and audited.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "admin" ? (
              <>
                {/* Admin ID */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#9AA8B6] uppercase tracking-wider mb-1.5">
                    Admin ID
                  </label>
                  <div className="relative">
                    <User
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6A7A]"
                    />
                    <input
                      type="text"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      placeholder="e.g. ADM-001"
                      required
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-[#4A5A6A] border border-white/10 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#9AA8B6] uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6A7A]"
                    />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin password"
                      required
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm text-white placeholder:text-[#4A5A6A] border border-white/10 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A6A7A] hover:text-[#9AA8B6] transition"
                    >
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Investigator Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#9AA8B6] uppercase tracking-wider mb-1.5">
                    Investigator Name
                  </label>
                  <div className="relative">
                    <User
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6A7A]"
                    />
                    <input
                      type="text"
                      value={investigatorName}
                      onChange={(e) => setInvestigatorName(e.target.value)}
                      placeholder="Enter investigator name"
                      required
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-[#4A5A6A] border border-white/10 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    />
                  </div>
                </div>

                {/* Microsoft Account */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#9AA8B6] uppercase tracking-wider mb-1.5 flex justify-between items-center">
                    <span>Microsoft Account</span>
                  </label>
                  <div className="relative">
                    <Mail
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6A7A]"
                    />
                    <input
                      type="email"
                      value={msAccount}
                      onChange={(e) => setMsAccount(e.target.value)}
                      placeholder="Enter Microsoft account email"
                      required
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-[#4A5A6A] border border-white/10 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    />
                  </div>
                </div>

                {/* Microsoft Authenticator Code */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#9AA8B6] uppercase tracking-wider mb-1.5 flex justify-between items-center">
                    <span>Microsoft Authenticator Code</span>
                    <span className="text-cyan-500/70 text-[9px]">
                      Required
                    </span>
                  </label>
                  <div className="relative">
                    <Hash
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6A7A]"
                    />
                    <input
                      type="text"
                      value={msAuthCode}
                      onChange={(e) => setMsAuthCode(e.target.value)}
                      placeholder="Enter 6 or 8-digit OTP"
                      required
                      maxLength={8}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-[#4A5A6A] border border-white/10 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition font-mono tracking-widest"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 flex items-center gap-1.5 px-1"
              >
                <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-2"
              style={{
                background: loading
                  ? "rgba(6,182,212,0.4)"
                  : "linear-gradient(135deg,#06b6d4,#6366f1)",
                boxShadow: loading ? "none" : "0 4px 20px rgba(6,182,212,0.25)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Shield size={14} />
                  Access System
                </span>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/8">
            <p className="text-center text-[10px] text-[#4A5A6A]">
              🔒 Authorised access only. All activity is monitored and recorded.
            </p>
            {activeTab === "admin" && (
              <p className="text-center text-[10px] text-cyan-500/50 mt-1">
                Demo Credentials: admin / admin123
              </p>
            )}
            {activeTab === "investigator" && (
              <div className="text-center text-[10px] text-cyan-500/50 mt-1.5 space-y-1">
                <p>
                  Enter your name, Microsoft email, and the 6 or 8-digit code
                  from your Authenticator app.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Security badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-4 mt-5"
        >
          {[
            { icon: "🔐", label: "AES-256" },
            { icon: "🛡", label: "ISO 27037" },
            { icon: "⚖️", label: "Court Admissible" },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-1.5 text-[10px] text-[#4A5A6A]"
            >
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
