import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  Briefcase,
  Loader2,
  Mail,
  Plus,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { authService } from "../services/authService";

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [badge, setBadge] = useState("");
  const [dept, setDept] = useState("Cyber Crime Cell");
  const [role, setRole] = useState("investigator");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Setup/Secret Modal States
  const [newlyRegistered, setNewlyRegistered] = useState<{
    name: string;
    email: string;
    totp_secret: string;
  } | null>(null);

  const [qrModalData, setQrModalData] = useState<{
    email: string;
    secret: string;
    name: string;
  } | null>(null);

  const { data: investigators = [], isLoading } = useQuery({
    queryKey: ["investigators"],
    queryFn: () => authService.getInvestigators(),
  });

  const addMutation = useMutation({
    mutationFn: (newInv: {
      name: string;
      email: string;
      badge: string;
      dept: string;
      role: string;
      totp_secret?: string;
    }) => authService.addInvestigator(newInv),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["investigators"] });
      setName("");
      setEmail("");
      setBadge("");
      setNewlyRegistered({
        name: data.name,
        email: data.email,
        totp_secret: data.totp_secret || "",
      });
      setFormSuccess("Investigator registered successfully!");
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to register investigator.");
      setTimeout(() => setFormError(""), 4000);
    },
  });

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!name.trim() || !email.trim() || !badge.trim() || !dept.trim()) {
      setFormError("All fields are required.");
      return;
    }

    if (!authService.isMicrosoftEmail(email.trim())) {
      setFormError(
        "Registration Blocked: Email must be a valid Microsoft/corporate account. Fake/temporary emails are prohibited.",
      );
      return;
    }

    addMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      badge: badge.trim(),
      dept: dept.trim(),
      role,
    });
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
          <User className="text-cyan-400" size={18} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Investigator Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage forensic authority profiles and badge authorizations
          </p>
        </div>
      </div>

      {/* Admin registration panel */}
      {isAdmin && (
        <div className="glass-card p-6 border border-white/10 bg-white/[0.02] space-y-4">
          <div className="flex items-center gap-2 border-b border-white/8 pb-3">
            <Plus size={16} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Register New Investigator
            </h2>
          </div>

          <form onSubmit={handleRegister} className="grid md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter investigator full name"
                className="form-input"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Microsoft / Org Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Microsoft account email"
                className="form-input"
                required
              />
            </div>

            {/* Badge ID */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Badge ID
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. FSL-2026-0001"
                className="form-input"
                required
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="form-input"
              >
                <option value="Cyber Crime Cell">Cyber Crime Cell</option>
                <option value="Mobile Forensics Division">
                  Mobile Forensics Division
                </option>
                <option value="Digital Evidence Unit">
                  Digital Evidence Unit
                </option>
                <option value="Security Operations">Security Operations</option>
              </select>
            </div>

            {/* Feedback messages */}
            <div className="md:col-span-2">
              {formError && (
                <p className="text-xs text-red-400 mt-1">{formError}</p>
              )}

              {newlyRegistered && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-4 text-xs mb-3 text-left">
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Shield size={14} /> Microsoft Authenticator Setup Required
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    To log in, this investigator must configure Time-based
                    One-Time Password (TOTP) authentication (6-digit or 8-digit
                    codes are both supported). Scan the QR code below using the
                    **Microsoft Authenticator**, **Google Authenticator**, or
                    any other authenticator app:
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-3 bg-black/40 rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        `otpauth://totp/ForenAI:${newlyRegistered.email}?secret=${newlyRegistered.totp_secret}&issuer=ForenAI&digits=8&period=30`,
                      )}`}
                      alt="OTP Setup QR Code"
                      className="w-32 h-32 border border-white/10 rounded bg-white p-1"
                    />
                    <div className="space-y-2 text-left flex-1 min-w-0">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                          Account name
                        </span>
                        <span className="font-mono text-white text-xs truncate block">
                          {newlyRegistered.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                          Secret Key (Base32)
                        </span>
                        <span className="font-mono text-cyan-400 text-xs select-all bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {newlyRegistered.totp_secret}
                        </span>
                      </div>
                      <div className="text-[9px] text-muted-foreground italic mt-2">
                        💡 Any standard authenticator app will work. Standard
                        apps like Google Authenticator will generate a 6-digit
                        code, while Microsoft Authenticator supports 8-digit
                        codes. The system accepts both.
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setNewlyRegistered(null);
                        setFormSuccess("");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold cursor-pointer text-[10px] uppercase tracking-wider transition"
                    >
                      Dismiss Setup
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg,#06b6d4,#6366f1)",
                }}
              >
                {addMutation.isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Registering…
                  </>
                ) : (
                  <>
                    <Plus size={13} /> Add Investigator
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory list */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-1">
          Registered Investigators
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-cyan-400" />
          </div>
        ) : investigators.length > 0 ? (
          investigators.map((inv) => (
            <div
              key={inv.badge || inv.id}
              className="glass-card p-5 flex items-center justify-between gap-4 border border-white/5 bg-white/[0.01]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  <User size={18} />
                </div>
                <div className="min-w-0 text-xs">
                  <div className="font-bold text-foreground truncate">
                    {inv.name}
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    {inv.role === "admin"
                      ? "System Administrator"
                      : "Forensic Investigator"}
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 font-mono mt-1 flex gap-4">
                    <span>Dept: {inv.dept}</span>
                    <span className="truncate">Email: {inv.email}</span>
                  </div>
                </div>
              </div>

              <div className="text-right text-xs space-y-1.5 flex-shrink-0">
                <div className="font-mono text-[10px] text-muted-foreground">
                  Badge ID: {inv.badge}
                </div>
                <div className="font-mono text-[9px] text-[#5A6A7A] flex items-center justify-end gap-1.5">
                  <span>
                    Secret:{" "}
                    <span className="text-cyan-400/80 font-bold select-all bg-white/5 px-1.5 py-0.5 rounded">
                      {inv.totp_secret || "KAVATIPAVANSAI23"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setQrModalData({
                        email: inv.email,
                        secret: inv.totp_secret || "KAVATIPAVANSAI23",
                        name: inv.name,
                      });
                    }}
                    className="text-[9px] text-cyan-400 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    🔍 QR
                  </button>
                </div>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Shield size={10} />
                  ACTIVE CREDENTIALS
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-8 text-center text-xs text-muted-foreground italic border border-white/5 bg-white/[0.01]">
            No investigators registered in the database. Please register
            investigators as an Administrator.
          </div>
        )}
      </div>
      {/* QR Code Viewer Modal */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setQrModalData(null)}
          />
          <div className="relative w-full max-w-sm glass-card p-6 text-center space-y-4 z-10 border border-white/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Authenticator Setup: {qrModalData.name}
            </h3>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Scan this QR code in Microsoft/Google Authenticator app (6-digit
              or 8-digit TOTP):
            </p>
            <div className="flex justify-center p-3 bg-black/40 rounded-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `otpauth://totp/ForenAI:${qrModalData.email}?secret=${qrModalData.secret}&issuer=ForenAI&digits=8&period=30`,
                )}`}
                alt="Authenticator QR Code"
                className="w-40 h-40 border border-white/10 rounded bg-white p-1"
              />
            </div>
            <div className="space-y-1 text-left">
              <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                Secret Key (Base32)
              </span>
              <code className="font-mono text-cyan-400 text-xs bg-white/5 px-2 py-1 rounded border border-white/5 select-all block break-all text-center">
                {qrModalData.secret}
              </code>
            </div>
            <button
              type="button"
              onClick={() => setQrModalData(null)}
              className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white uppercase tracking-wider cursor-pointer transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
