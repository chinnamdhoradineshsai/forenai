import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Cpu,
  Database,
  Info,
  Key,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Terminal,
  Trash2,
  Usb,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Page } from "../components/Sidebar";
import { useUsbConnectionState } from "../hooks/useUsbConnectionState";
import {
  evidenceService,
  getDeviceDetailsFromLocalStorage,
} from "../services/evidenceService";
import type { RealDeviceWhatsAppChat } from "../services/webadbService";

interface WhatsAppAnalysisPageProps {
  deviceId: string;
  onNavigate: (page: Page) => void;
}

const DECRYPTION_LOGS = [
  { text: "[SYSTEM] Port handshake initiated on USB Hub 002...", delay: 0 },
  { text: "[ADB] Establishing connection daemon...", delay: 400 },
  {
    text: "[ADB] Authorization signature matches suspect profile.",
    delay: 800,
  },
  {
    text: "[FS] Traversing Android/media/com.whatsapp/com.whatsapp/...",
    delay: 1200,
  },
  {
    text: "[FS] Target backup found: msgstore.db.crypt14 (12.4 MB)",
    delay: 1600,
  },
  {
    text: "[KEY] Carving crypto credentials from secure keychain...",
    delay: 2000,
  },
  {
    text: "[KEY] Derived AES-256 decryption key hash: 8f3c...1e90",
    delay: 2400,
  },
  {
    text: "[CRYPT] Accessing SQLITE database via AES-256-GCM cipher...",
    delay: 2800,
  },
  { text: "[SQLITE] Decrypting database pages: 100% parsed.", delay: 3200 },
  {
    text: "[PARSER] Extracting chat metadata & deleted message logs...",
    delay: 3600,
  },
  {
    text: "[SUCCESS] WhatsApp database decrypted. 3 threads ready.",
    delay: 4000,
  },
];

export function WhatsAppAnalysisPage({
  deviceId,
  onNavigate,
}: WhatsAppAnalysisPageProps) {
  const devDetails = useMemo(
    () => getDeviceDetailsFromLocalStorage(deviceId),
    [deviceId],
  );

  const isUsbConnectedReal = useUsbConnectionState(
    devDetails.serialNumber,
    "disconnected",
  );

  const [simulateUsb, setSimulateUsb] = useState(() => {
    const cached = localStorage.getItem(`forenai_device_details_${deviceId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return (
          parsed.usbStatus === "connected" ||
          parsed.serialNumber === "SGR2023001X"
        );
      } catch (_e) {}
    }
    return devDetails.serialNumber === "SGR2023001X";
  });

  const isUsbConnected = simulateUsb || isUsbConnectedReal;

  const [chats, setChats] = useState<RealDeviceWhatsAppChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [isDecrypted, setIsDecrypted] = useState(() => {
    return (
      localStorage.getItem(`forenai_whatsapp_decrypted_${deviceId}`) === "true"
    );
  });

  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [decryptionLogs, setDecryptionLogs] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    async function loadChats() {
      if (isDecrypted) {
        try {
          const data = await evidenceService.getWhatsAppChats(deviceId);
          if (active) {
            setChats(data);
            if (data.length > 0) {
              setSelectedChatId(data[0].id);
            }
          }
        } catch (err) {
          console.error("Error loading WhatsApp chats:", err);
        }
      } else {
        if (active) {
          setChats([]);
        }
      }
      if (active) {
        setLoading(false);
      }
    }
    loadChats();
    return () => {
      active = false;
    };
  }, [deviceId, isDecrypted]);

  const isRecoveryEnabled = useMemo(
    () => localStorage.getItem("forenai_data_recovery_enabled") === "true",
    [],
  );

  const selectedChat = chats.find((c) => c.id === selectedChatId) || chats[0];

  const visibleMessages = useMemo(() => {
    if (!selectedChat) return [];
    return selectedChat.messages.filter(
      (m) => isRecoveryEnabled || !(m as any).isRecovered,
    );
  }, [selectedChat, isRecoveryEnabled]);

  const hasRecoveredMessages = useMemo(() => {
    if (!selectedChat) return false;
    return selectedChat.messages.some((m) => (m as any).isRecovered);
  }, [selectedChat]);

  const startDecryption = () => {
    setIsDecrypting(true);
    setDecryptionProgress(0);
    setDecryptionLogs([]);

    const startTime = Date.now();
    const duration = 4000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setDecryptionProgress(pct);

      const activeLogs = DECRYPTION_LOGS.filter(
        (log) => elapsed >= log.delay,
      ).map((log) => log.text);
      setDecryptionLogs(activeLogs);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(async () => {
          setIsDecrypting(false);
          setIsDecrypted(true);
          localStorage.setItem(
            `forenai_whatsapp_decrypted_${deviceId}`,
            "true",
          );
          const data = await evidenceService.getWhatsAppChats(deviceId);
          setChats(data);
          if (data.length > 0) {
            setSelectedChatId(data[0].id);
          }
        }, 300);
      }
    }, 100);
  };

  const handleReset = () => {
    localStorage.removeItem(`forenai_whatsapp_chats_${deviceId}`);
    localStorage.removeItem(`forenai_whatsapp_decrypted_${deviceId}`);
    setIsDecrypted(false);
    setChats([]);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col justify-center items-center">
        <div className="text-muted-foreground animate-pulse text-xs font-bold uppercase tracking-widest">
          Loading Forensic Components...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Back button and Reset */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => onNavigate("evidence")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Evidence Viewer
        </button>
        {isDecrypted && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[10px] border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1"
          >
            <RefreshCw size={10} />
            Reset Decryption Session
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <MessageSquare className="text-emerald-400" size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              WhatsApp Db Decryption
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              msgstore.db.crypt14 Decryption & Logical Parsing
            </p>
          </div>
        </div>

        {/* Dynamic USB Control / Status Widget */}
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-xl">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg">
            <span
              className={`w-2 h-2 rounded-full ${isUsbConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
            />
            <Usb
              size={12}
              className={isUsbConnected ? "text-emerald-400" : "text-red-400"}
            />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              USB Port: {isUsbConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSimulateUsb(!simulateUsb)}
            className={`px-2.5 py-1 text-[10px] font-bold border rounded-md cursor-pointer transition-colors ${
              simulateUsb
                ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            🔌 {simulateUsb ? "Simulated" : "Simulate Plug"}
          </button>
        </div>
      </div>

      {/* Dynamic Main Body Content */}
      <div className="flex-1 min-h-0 flex flex-col justify-center">
        {isDecrypting ? (
          /* Case A: Decrying Animation & Console Logs */
          <div className="max-w-xl mx-auto w-full glass-card p-6 md:p-8 space-y-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Cpu size={14} className="animate-spin" />
                <span>DYNAMIC EXTRACTION RUNNING</span>
              </div>
              <span className="font-mono text-xs text-emerald-400 font-bold">
                {decryptionProgress}%
              </span>
            </div>

            {/* Neon glowing progress bar */}
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all duration-100"
                style={{ width: `${decryptionProgress}%` }}
              />
            </div>

            {/* Virtual Cryptographic Terminal Console */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                <Terminal size={10} />
                <span>ADB Decryption Console</span>
              </div>
              <div className="font-mono text-[10px] text-emerald-400 bg-black/60 p-4 rounded-lg border border-white/5 h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                {decryptionLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-1">
                    <span className="text-emerald-500/50 select-none">
                      &gt;
                    </span>
                    <span>{log}</span>
                  </div>
                ))}
                <div className="h-2" />
              </div>
            </div>
          </div>
        ) : isUsbConnected && !isDecrypted ? (
          /* Case B: Connected but not decrypted yet */
          <div className="max-w-md mx-auto w-full glass-card p-8 text-center space-y-6 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.05)]">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-500/10 rounded-full border border-cyan-500/20 animate-ping opacity-75" />
              <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500/10 to-indigo-500/15 rounded-full border border-cyan-500/30 flex items-center justify-center">
                <Database className="text-cyan-400" size={32} />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold text-foreground">
                Live USB Link Active
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Target device <strong>{devDetails.model}</strong> is connected.
                Logical msgstore backups detected at{" "}
                <code>/sdcard/WhatsApp/Databases/</code>.
              </p>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-left space-y-1.5 text-[10px] text-muted-foreground font-mono">
              <div className="flex justify-between">
                <span>PORT ID:</span>
                <span className="text-foreground font-bold">
                  PORT 002 [BUS 001]
                </span>
              </div>
              <div className="flex justify-between">
                <span>SERIAL:</span>
                <span className="text-foreground font-bold">
                  {devDetails.serialNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span>COMPATIBILITY:</span>
                <span className="text-emerald-400 font-bold">
                  ADB SECURITY OK
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={startDecryption}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white cursor-pointer transition-all bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:opacity-90 animate-pulse"
            >
              <Key size={14} />
              Decrypt Live msgstore.db
            </button>
          </div>
        ) : !isUsbConnected && chats.length === 0 ? (
          /* Case C: Disconnected and empty */
          <div className="max-w-md mx-auto w-full glass-card p-8 text-center space-y-6 border border-red-500/15 shadow-[0_0_25px_rgba(239,68,68,0.03)]">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full border border-red-500/25 flex items-center justify-center animate-pulse">
                <Usb className="text-red-400" size={32} />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold text-foreground">
                No Device on USB Port
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                WhatsApp analysis requires a live suspect device linked via USB.
                Please connect the device or turn on USB simulation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSimulateUsb(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-cyan-300 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all cursor-pointer"
            >
              🔌 Enable USB Simulation
            </button>
          </div>
        ) : (
          /* Case D: Has chats (either live or offline cache) */
          <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
            {/* Chats List */}
            <div className="w-80 glass-card p-4 flex flex-col gap-4 overflow-y-auto border border-white/5">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/5 pb-2">
                Active Dialogs
              </div>
              <div className="space-y-2">
                {chats.map((c) => {
                  const hasDel = c.messages.some((m) => (m as any).isRecovered);
                  const lastMsg =
                    c.messages.length > 0
                      ? c.messages[c.messages.length - 1]
                      : null;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedChatId(c.id)}
                      className={`w-full p-3 rounded-xl border text-left flex justify-between items-start gap-2 cursor-pointer transition-all ${
                        selectedChat && selectedChat.id === c.id
                          ? "bg-emerald-500/10 border-emerald-500/35"
                          : "bg-white/[0.01] border-white/5 hover:bg-white/5"
                      }`}
                    >
                      <div className="min-w-0 text-xs flex-1">
                        <div className="font-bold text-foreground truncate flex items-center gap-1.5">
                          {c.contact}
                          {hasDel && isRecoveryEnabled && (
                            <Trash2
                              size={11}
                              className="text-orange-400 flex-shrink-0 animate-pulse"
                            />
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate">
                          {c.phone}
                        </div>
                        {lastMsg && (
                          <div className="text-[10px] text-muted-foreground/60 truncate mt-1 italic max-w-[190px]">
                            {lastMsg.sender === "suspect" ? "You: " : ""}
                            {lastMsg.content}
                          </div>
                        )}
                      </div>
                      {c.isSuspicious && (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse flex-shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Panel */}
            <div className="flex-1 glass-card p-4 flex flex-col justify-between overflow-hidden relative border border-white/5">
              {/* Dynamic Header for active chat */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="text-xs">
                  {selectedChat ? (
                    <>
                      <span className="font-bold text-foreground">
                        {selectedChat.contact}
                      </span>
                      <span className="text-muted-foreground font-mono ml-2">
                        ({selectedChat.phone})
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Select a chat</span>
                  )}
                </div>

                {/* Live vs Cached Badge */}
                {isUsbConnected ? (
                  <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle size={10} className="animate-pulse" />
                    msgstore.db live decrypted
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[9px] text-orange-400 font-bold bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/25">
                    <Info size={10} />
                    offline cache read-only
                  </div>
                )}
              </div>

              {/* Dynamic USB State Warning / Banner */}
              {!isUsbConnected && (
                <div className="mb-4 p-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 text-[10px] text-orange-300 flex items-center gap-2">
                  <AlertTriangle
                    size={13}
                    className="flex-shrink-0 animate-bounce"
                  />
                  <span>
                    <strong>USB Link Broken:</strong> Real-time connection was
                    lost. Currently displaying cached evidence data from the
                    last logical pull.
                  </span>
                </div>
              )}

              {isUsbConnected && isDecrypted && (
                <div className="mb-4 p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-[10px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle size={13} className="flex-shrink-0" />
                  <span>
                    <strong>Live USB Connection Established:</strong> Decrypting
                    database sectors in real-time. Full stream active.
                  </span>
                </div>
              )}

              {/* Recovery notification */}
              {hasRecoveredMessages && !isRecoveryEnabled && (
                <div className="mb-4 p-2 rounded-lg border border-orange-500/20 bg-orange-950/15 text-[10px] text-orange-400 flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle size={12} className="flex-shrink-0" />
                  <span>
                    Deleted WhatsApp messages were detected in SQLite journals.
                    Enable <strong>Forensic Data Recovery</strong> in Settings
                    to reconstruct this conversation thread.
                  </span>
                </div>
              )}

              {/* Chats Bubble Stream */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-xs scrollbar-thin">
                {visibleMessages.map((m, i) => {
                  const isSuspect = m.sender === "suspect";
                  const isRec = (m as any).isRecovered;
                  return (
                    <div
                      key={i}
                      className={`flex ${isSuspect ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-md p-3 rounded-2xl border leading-relaxed space-y-1 ${
                          isRec
                            ? "bg-orange-500/10 border-orange-500/25 text-orange-200/90 shadow-[0_0_12px_rgba(249,115,22,0.05)]"
                            : isSuspect
                              ? "bg-emerald-500/10 border-emerald-500/20 text-foreground"
                              : "bg-white/5 border-white/8 text-foreground/90"
                        }`}
                      >
                        <p className="font-mono">{m.content}</p>
                        <div className="flex justify-between items-center gap-4 text-[9px] text-muted-foreground/60 font-mono mt-1">
                          {isRec ? (
                            <span className="text-orange-400 font-bold flex items-center gap-0.5 animate-pulse">
                              <Trash2 size={10} /> Deleted & Recovered
                            </span>
                          ) : (
                            <span />
                          )}
                          <span>{m.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedChat?.isSuspicious && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-[10px] text-red-400 mt-4 leading-normal">
                  <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Neural Flag:</strong> Chat thread references
                    Signal/Telegram communication redirections, OTP requests,
                    and deletion instructions. Matches Corporate Espionage
                    profile indicators.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
