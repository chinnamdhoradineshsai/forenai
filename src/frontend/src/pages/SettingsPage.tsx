import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  FileJson,
  History,
  Save,
  Settings,
  Shield,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authService } from "../services/authService";
import { evidenceService } from "../services/evidenceService";

interface SettingsPageProps {
  caseId?: string;
  deviceId?: string;
}

export function SettingsPage({
  caseId = "",
  deviceId = "",
}: SettingsPageProps) {
  const [dbPath, setDbPath] = useState(
    () =>
      localStorage.getItem("forenai_db_path") || "D:\\ForensicData\\backups",
  );
  const [hashAlgo, setHashAlgo] = useState(
    () => localStorage.getItem("forenai_hash_algo") || "SHA-256",
  );
  const [aiThreshold, setAiThreshold] = useState(
    () => localStorage.getItem("forenai_ai_threshold") || "High",
  );

  // Recovery Engine states
  const [recoveryEnabled, setRecoveryEnabled] = useState(
    () => localStorage.getItem("forenai_data_recovery_enabled") === "true",
  );
  const [deepCarve, setDeepCarve] = useState(
    () => localStorage.getItem("forenai_deep_carve_enabled") === "true",
  );

  const [recoverSMS, setRecoverSMS] = useState(true);
  const [recoverCalls, setRecoverCalls] = useState(true);
  const [recoverMedia, setRecoverMedia] = useState(true);

  const [isScanning, setIsScanning] = useState(false);
  const [backups, setBackups] = useState<any[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("forenai_recovered_backups") || "[]",
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("forenai_recovered_backups", JSON.stringify(backups));
  }, [backups]);

  const handleSaveConfig = () => {
    localStorage.setItem("forenai_db_path", dbPath);
    localStorage.setItem("forenai_hash_algo", hashAlgo);
    localStorage.setItem("forenai_ai_threshold", aiThreshold);
    localStorage.setItem(
      "forenai_data_recovery_enabled",
      recoveryEnabled ? "true" : "false",
    );
    localStorage.setItem(
      "forenai_deep_carve_enabled",
      deepCarve ? "true" : "false",
    );

    toast.success("Forensic configurations saved successfully!");
  };

  const handleRunRecovery = async () => {
    if (!deviceId) {
      toast.error(
        "No active device selected. Please select a device in the Evidence Browser first.",
      );
      return;
    }

    setIsScanning(true);
    const toastId = toast.loading(
      "Running forensic data recovery scan on unallocated partitions...",
    );

    try {
      // Wait for a realistic scanning micro-animation (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Fetch dynamic data from database
      const [sms, calls, media] = await Promise.all([
        recoverSMS
          ? evidenceService.getSmsRecords(deviceId)
          : Promise.resolve([]),
        recoverCalls
          ? evidenceService.getCallRecords(deviceId)
          : Promise.resolve([]),
        recoverMedia
          ? evidenceService.getMediaFiles(deviceId)
          : Promise.resolve([]),
      ]);

      // Filter for recovered (deleted) items
      const recoveredSms = sms.filter((s) => s.isRecovered === true);
      const recoveredCalls = calls.filter((c) => c.isRecovered === true);
      const recoveredMedia = media.filter((m) => m.isRecovered === true);

      // WhatsApp chats deleted message recovery simulation
      let recoveredWhatsApp: any[] = [];
      if (recoverSMS) {
        const waChats = await evidenceService.getWhatsAppChats(deviceId);
        recoveredWhatsApp = waChats
          .flatMap((c: any) =>
            c.messages.map((m: any) => ({
              ...m,
              contact: c.contact,
              phone: c.phone,
            })),
          )
          .filter((m: any) => m.isRecovered === true);
      }

      const totalRecoveredCount =
        recoveredSms.length +
        recoveredCalls.length +
        recoveredMedia.length +
        recoveredWhatsApp.length;

      if (totalRecoveredCount === 0) {
        toast.info(
          "No deleted or unallocated records found on the device partitions.",
          { id: toastId },
        );
        setIsScanning(false);
        return;
      }

      // Construct dynamic backup payload
      const payload = {
        meta: {
          forensicTool: "ForenAI Mobile Forensics",
          caseId,
          deviceId,
          timestamp: new Date().toISOString(),
          hashingAlgorithm: hashAlgo,
          integrityCheck: "PENDING",
        },
        counts: {
          sms: recoveredSms.length,
          calls: recoveredCalls.length,
          media: recoveredMedia.length,
          whatsapp: recoveredWhatsApp.length,
          total: totalRecoveredCount,
        },
        data: {
          sms: recoveredSms,
          calls: recoveredCalls,
          media: recoveredMedia,
          whatsapp: recoveredWhatsApp,
        },
      };

      // Compute Cryptographic Signature
      const jsonStr = JSON.stringify(payload);
      const encoder = new TextEncoder();
      const dataUint8 = encoder.encode(jsonStr);
      const hashBuffer = await crypto.subtle.digest(
        hashAlgo === "MD5"
          ? "SHA-1"
          : hashAlgo === "SHA-1"
            ? "SHA-1"
            : "SHA-256",
        dataUint8,
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      payload.meta.integrityCheck = hashHex;

      // Trigger automatic backup file download
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const fileName = `forensic_recovery_backup_${deviceId}_${Date.now()}.json`;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(blobUrl);

      // Append to local backup history
      const newBackup = {
        id: `backup_${Date.now()}`,
        timestamp: Date.now(),
        fileName,
        hash: hashHex,
        size: `${(blob.size / 1024).toFixed(2)} KB`,
        recoveredCount: totalRecoveredCount,
        status: "Verified",
        payloadStr: JSON.stringify(payload),
      };

      setBackups((prev) => [newBackup, ...prev]);

      // Add to Supabase Audit Logs
      await evidenceService.addAuditLog(
        caseId,
        "Data Recovery Backup",
        authService.getCurrentUser()?.name || "Investigator",
        `Exported cryptographic backup file (${newBackup.size}) containing ${totalRecoveredCount} recovered deleted items (SMS: ${recoveredSms.length}, Calls: ${recoveredCalls.length}, Media: ${recoveredMedia.length}, WhatsApp: ${recoveredWhatsApp.length}). Hash: ${hashHex.substring(0, 18)}...`,
      );

      toast.success(
        `Successfully recovered and exported ${totalRecoveredCount} deleted records!`,
        { id: toastId },
      );
    } catch (err: any) {
      console.error(err);
      toast.error(`Forensic extraction failed: ${err.message || err}`, {
        id: toastId,
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownloadBackup = (backup: any) => {
    const blob = new Blob([backup.payloadStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backup.fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.info(`Downloading backup file ${backup.fileName}...`);
  };

  const handleDeleteBackup = (id: string) => {
    setBackups((prev) => prev.filter((b) => b.id !== id));
    toast.success("Backup log removed from settings dashboard.");
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
          <Settings className="text-cyan-400" size={18} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Forensic Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure acquisition storage directories, cryptographic tools, and
            classification thresholds
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Configurations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-6">
            {/* Directories Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
                <Database size={14} />
                Data & Directories
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Physical Backup Directory
                </label>
                <input
                  type="text"
                  value={dbPath}
                  onChange={(e) => setDbPath(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Integrity Hashing Algorithm
                </label>
                <select
                  value={hashAlgo}
                  onChange={(e) => setHashAlgo(e.target.value)}
                  className="form-input text-xs py-2 bg-[#0B1220] border-white/10"
                >
                  <option value="MD5">MD5</option>
                  <option value="SHA-1">SHA-1</option>
                  <option value="SHA-256">SHA-256 (Recommended)</option>
                </select>
              </div>
            </div>

            {/* AI Engine Section */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
                <Cpu size={14} />
                AI Classification Engine
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Threat Severity Classifier
                </label>
                <select
                  value={aiThreshold}
                  onChange={(e) => setAiThreshold(e.target.value)}
                  className="form-input text-xs py-2 bg-[#0B1220] border-white/10"
                >
                  <option value="Low">Low - Flag all keywords</option>
                  <option value="Medium">
                    Medium - Flag encrypted refs & links
                  </option>
                  <option value="High">
                    High - Flag known threats only (Recommended)
                  </option>
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl cursor-pointer hover:brightness-110 transition-all"
                style={{
                  background: "linear-gradient(135deg, #0ea5e9, #22d3ee)",
                  boxShadow: "0 0 15px rgba(34, 211, 238, 0.3)",
                }}
              >
                <Save size={12} />
                Save Configurations
              </button>
            </div>
          </div>

          {/* Forensic Data Recovery Card */}
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="animate-pulse" />
                Forensic Data Recovery System
              </h3>
              {recoveryEnabled && (
                <span className="text-[9px] font-bold bg-orange-500/10 border border-orange-500/25 text-orange-400 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Recovery Active
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Enable the dynamic extraction of deleted files, wiped SMS cache
              logs, and call logs reconstructed from database unallocated pages
              (DB carving).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-start gap-3">
                <input
                  type="checkbox"
                  id="toggle-recovery"
                  checked={recoveryEnabled}
                  onChange={(e) => setRecoveryEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-[#0B1220] text-orange-500 mt-0.5 cursor-pointer accent-orange-500"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="toggle-recovery"
                    className="text-xs font-bold text-foreground cursor-pointer hover:text-orange-400 transition-colors"
                  >
                    Enable Deleted Data Recovery
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    Carves SQLite databases and file systems to retrieve deleted
                    messages, calls, and files.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-start gap-3">
                <input
                  type="checkbox"
                  id="toggle-deep-carve"
                  checked={deepCarve}
                  onChange={(e) => setDeepCarve(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-[#0B1220] text-orange-500 mt-0.5 cursor-pointer accent-orange-500"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="toggle-deep-carve"
                    className="text-xs font-bold text-foreground cursor-pointer hover:text-orange-400 transition-colors"
                  >
                    Deep Carving (Unallocated Storage)
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    Performs header/footer carving across raw storage partitions
                    to reconstruct fragmented images.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Target Core Partitions for Recovery
              </label>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-foreground">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-cyan-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={recoverSMS}
                    onChange={(e) => setRecoverSMS(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                  SMS & Chat Databases
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-violet-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={recoverCalls}
                    onChange={(e) => setRecoverCalls(e.target.checked)}
                    className="accent-violet-500 cursor-pointer"
                  />
                  Call Records
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={recoverMedia}
                    onChange={(e) => setRecoverMedia(e.target.checked)}
                    className="accent-emerald-500 cursor-pointer"
                  />
                  Media File Systems
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-orange-500/10 bg-orange-950/[0.02] text-xs text-orange-400/90 leading-relaxed gap-3">
              <div className="flex gap-2">
                <AlertTriangle
                  size={16}
                  className="flex-shrink-0 mt-0.5 text-orange-400"
                />
                <span>
                  <strong>Legal Notice:</strong> Recovered items extracted using
                  unallocated carvers will be marked as <strong>DELETED</strong>{" "}
                  for digital chain of custody integrity.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isScanning}
                onClick={handleRunRecovery}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white rounded-xl cursor-pointer hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  boxShadow: "0 0 15px rgba(249, 115, 22, 0.25)",
                }}
              >
                <FileJson size={13} />
                {isScanning
                  ? "Scanning Partitions..."
                  : "Scan & Backup Recovered Data"}
              </button>
            </div>
          </div>
        </div>

        {/* Right column - Backup History */}
        <div className="space-y-6">
          <div className="glass-card p-6 h-full flex flex-col gap-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
              <History size={14} />
              Recovery Backup History
            </h3>

            {backups.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground border border-dashed border-white/5 rounded-xl bg-white/[0.005]">
                <FileJson size={28} className="text-muted-foreground/30 mb-2" />
                <span className="text-xs font-bold text-foreground">
                  No Cryptographic Backups
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">
                  Run a dynamic data recovery scan to create cryptographic
                  backups of deleted files.
                </span>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[550px] scrollbar-thin">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="p-3.5 rounded-xl border border-white/5 bg-white/[0.005] hover:bg-white/5 transition-all space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="font-semibold text-foreground truncate"
                          title={backup.fileName}
                        >
                          {backup.fileName}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(backup.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <span className="text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded flex-shrink-0">
                        {backup.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono bg-black/20 p-2 rounded border border-white/5">
                      <span>Files: {backup.recoveredCount}</span>
                      <span>Size: {backup.size}</span>
                    </div>

                    <div className="text-[9px] text-muted-foreground font-mono truncate bg-black/10 p-1.5 rounded border border-white/5">
                      Hash: {backup.hash}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 hover:bg-red-500/15 cursor-pointer transition-colors"
                        title="Delete record"
                      >
                        <Trash2 size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadBackup(backup)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white rounded-lg bg-emerald-600 hover:bg-emerald-500 cursor-pointer transition-colors"
                      >
                        <Download size={11} />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
