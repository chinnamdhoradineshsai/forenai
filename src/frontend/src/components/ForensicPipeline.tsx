import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Usb,
  Smartphone,
  Database,
  HardDrive,
  Hash,
  Server,
  Brain,
  CheckCircle2,
  Loader2,
  Terminal,
  ShieldAlert,
  AlertTriangle,
  ChevronRight,
  TrendingUp
} from "lucide-react";

interface ForensicPipelineProps {
  progress: number;
  currentStepIndex: number;
  deviceModel?: string;
  serialNumber?: string;
  smsCount?: number;
  callCount?: number;
  appCount?: number;
  mediaCount?: number;
  browserCount?: number;
  isRealDevice?: boolean;
}

interface StepInfo {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  badge?: (progress: number) => string;
}

const PIPELINE_STEPS: StepInfo[] = [
  {
    title: "Phone Connected",
    subtitle: "Establish connection to target mobile device",
    icon: Usb,
    color: "#22d3ee", // Cyan
    badge: (p) => p > 0 ? "USB 480 Mbps" : "Handshake..."
  },
  {
    title: "Device Detection",
    subtitle: "Scan & detect hardware profile (Model, Serial, OS)",
    icon: Smartphone,
    color: "#818cf8", // Indigo
    badge: (p) => p >= 15 ? "Detected" : "Querying..."
  },
  {
    title: "Read Accessible Data",
    subtitle: "Read database sectors (SMS, Calls, Browser, Apps)",
    icon: Database,
    color: "#f472b6", // Pink
    badge: (p) => p >= 30 ? "Carving Completed" : "Reading..."
  },
  {
    title: "Create Forensic Backup",
    subtitle: "Compile bit-stream logical copy & data blocks",
    icon: HardDrive,
    color: "#34d399", // Emerald
    badge: (p) => p >= 45 ? "Backup ZIP Created" : "Archiving..."
  },
  {
    title: "Generate SHA-256 Hash",
    subtitle: "Calculate cryptographic validation signature",
    icon: Hash,
    color: "#fbbf24", // Amber
    badge: (p) => p >= 60 ? "SHA-256 Computed" : "Hashing..."
  },
  {
    title: "Store Evidence",
    subtitle: "Seal backup archive on canister storage ledger",
    icon: Server,
    color: "#a78bfa", // Violet
    badge: (p) => p >= 75 ? "Evidence Sealed" : "Storing..."
  },
  {
    title: "Analyze with AI",
    subtitle: "Run forensic threat classifiers & risk profiling",
    icon: Brain,
    color: "#f43f5e", // Rose
    badge: (p) => p >= 90 ? "AI Assessment Active" : "Analyzing..."
  }
];

export function ForensicPipeline({
  progress,
  currentStepIndex,
  deviceModel,
  serialNumber,
  smsCount,
  callCount,
  appCount,
  mediaCount,
  browserCount,
  isRealDevice,
}: ForensicPipelineProps) {
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);

  const getTerminalLogs = (): Record<number, string[]> => {
    const modelName = deviceModel || "Samsung Galaxy S23 Ultra";
    const serial = serialNumber || "SGR2023001X";
    const sms = smsCount !== undefined ? smsCount : 4;
    const calls = callCount !== undefined ? callCount : 5;
    const apps = appCount !== undefined ? appCount : 5;
    const media = mediaCount !== undefined ? mediaCount : 4;
    const browser = browserCount !== undefined ? browserCount : 4;
    const typeLabel = isRealDevice ? "REAL ADB LINK" : "SIMULATED INTERFACE";

    return {
      0: [
        `[INFO] Initializing USB port handshake...`,
        `[INFO] Requesting USB device descriptors...`,
        `[SUCCESS] USB connection established. Connection Type: ${typeLabel}.`,
        `[INFO] Initiating ADB daemon protocol...`,
        `[SUCCESS] Secure ADB handshake completed successfully.`
      ],
      1: [
        `[INFO] Querying system properties via getprop...`,
        `[INFO] Device manufacturer: Samsung`,
        `[INFO] Device model: ${modelName}`,
        `[INFO] OS version: Android 14 (API level 34)`,
        `[INFO] Checking bootloader status...`,
        `[WARN] Bootloader: UNLOCKED`,
        `[INFO] Checking root access privileges...`,
        `[ALERT] Device status verification completed.`
      ],
      2: [
        `[INFO] Accessing internal storage partitions...`,
        `[INFO] Scanning logical path: /sdcard`,
        `[INFO] Carving SMS database content://sms...`,
        `[SUCCESS] SMS database parsed. Extracted ${sms} text records.`,
        `[INFO] Carving Call Log database content://call_log/calls...`,
        `[SUCCESS] Call logs parsed. Extracted ${calls} calling events.`,
        `[INFO] Querying third-party app packages via pm list...`,
        `[SUCCESS] Package scan completed. Found ${apps} user applications.`,
        `[INFO] Locating media paths and Nomedia files...`,
        `[SUCCESS] Media cataloged: ${media} active media assets.`,
        `[INFO] Scanning browser history databases...`,
        `[SUCCESS] Browser history parsed: ${browser} bookmarks/visitations.`
      ],
      3: [
        `[INFO] Packing logical evidence data into container...`,
        `[INFO] Compiling system partition backup archives...`,
        `[INFO] Generating raw bit-stream replica image...`,
        `[SUCCESS] Forensic backup container generated: device_backup_${serial}.zip`
      ],
      4: [
        `[INFO] Preparing cryptographic checksum algorithm...`,
        `[INFO] Running SHA-256 integrity check over zip archive...`,
        `[SUCCESS] Computed SHA-256: 8a4c8f35ddbb3e85bb773c2805ea7e2c943809fb031548dbcd8d63a8a3a2e7c`,
        `[SUCCESS] Integrity token appended to Chain of Custody record.`
      ],
      5: [
        `[INFO] Writing evidence metadata to local indexer...`,
        `[INFO] Synchronizing records with remote Supabase database...`,
        `[INFO] Sealing hash verification block on canister storage ledger...`,
        `[SUCCESS] Database transaction sealed. Chain of Custody locked.`
      ],
      6: [
        `[INFO] Launching AI Forensic Classifier on extracted data...`,
        `[INFO] Parsing SMS sentiment and keyword risk logs...`,
        `[INFO] Evaluating threat signatures in user packages...`,
        `[INFO] Evaluating network telemetry and browsing patterns...`,
        `[SUCCESS] AI assessment complete. Threat Level: HIGH. Risk Score: 87%.`
      ]
    };
  };

  // Synchronously write logs corresponding to the current step and previous steps
  useEffect(() => {
    let logs: string[] = [];
    const logsData = getTerminalLogs();
    // Gather all logs up to current step
    for (let i = 0; i <= currentStepIndex; i++) {
      if (logsData[i]) {
        logs = [...logs, ...logsData[i]];
      }
    }
    setConsoleLogs(logs);
  }, [currentStepIndex, deviceModel, serialNumber, smsCount, callCount, appCount, mediaCount, browserCount, isRealDevice]);

  // Scroll to bottom of terminal log console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
      {/* ── Left Side: Interactive Pipeline Chart (7 cols) ── */}
      <div className="lg:col-span-7 glass-card p-6 md:p-8 space-y-6 relative overflow-hidden border border-cyan-500/15">
        <div className="absolute -right-24 -top-24 w-52 h-52 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-400" />
              Forensic Processing Pipeline
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Visual validation sequence for chain-of-custody preservation
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-cyan-400 font-mono tracking-tighter">
              {progress}%
            </span>
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
              Overall Progress
            </div>
          </div>
        </div>

        {/* The Pipeline Node Flow */}
        <div className="relative pl-10 space-y-6">
          {/* Vertical Progress Connector Line */}
          <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-white/5">
            {/* Active flowing neon bar */}
            <motion.div
              className="w-full bg-gradient-to-b from-cyan-500 via-indigo-500 to-emerald-500 origin-top"
              style={{ height: `${Math.min(100, (progress / 100) * 115)}%` }}
              layout
            />
          </div>

          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            // Status style rules
            let statusColor = "text-zinc-500 border-white/10 bg-zinc-950";
            let textColor = "text-muted-foreground/60";
            let glowEffect = "";

            if (isCompleted) {
              statusColor = "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
              textColor = "text-foreground";
            } else if (isActive) {
              statusColor = "text-cyan-400 border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(34,211,238,0.25)]";
              textColor = "text-cyan-200 font-bold";
              glowEffect = "shadow-lg shadow-cyan-400/20 animate-pulse";
            }

            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className={`relative flex items-start gap-4 transition-all duration-300 ${isPending ? "opacity-35" : "opacity-100"}`}
              >
                {/* Node Icon Container */}
                <div
                  className={`absolute left-[-31px] w-9 h-9 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300 ${statusColor} ${glowEffect}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                      className="flex items-center justify-center"
                    >
                      <Icon size={15} />
                    </motion.div>
                  ) : (
                    <Icon size={15} />
                  )}
                </div>

                {/* Node Information */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-xs font-semibold ${textColor} tracking-wide`}>
                      {step.title}
                    </h3>
                    {progress > 0 && !isPending && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold uppercase tracking-wider ${
                          isCompleted
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                            : "bg-cyan-500/10 text-cyan-400 border-cyan-500/25"
                        }`}
                      >
                        {step.badge ? step.badge(progress) : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate leading-relaxed">
                    {step.subtitle}
                  </p>

                  {/* Sub-details for specific steps */}
                  {isActive && idx === 2 && (
                    <div className="mt-2 text-[10px] font-mono text-cyan-400 flex gap-4 animate-pulse">
                      <span>💬 SMS: carving...</span>
                      <span>📞 Calls: carving...</span>
                      <span>📂 Media: carving...</span>
                    </div>
                  )}

                  {isCompleted && idx === 4 && (
                    <div className="mt-1.5 p-2 bg-black/40 border border-white/5 rounded-lg text-[9px] font-mono text-amber-300/90 break-all leading-normal">
                      SHA-256: 8a4c8f35ddbb3e85bb773c2805ea7e2c943809fb031548dbcd8d63a8a3a2e7c
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Right Side: Live Logs Terminal + AI Verdict (5 cols) ── */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Retro CRT Logs Terminal */}
        <div className="flex-1 min-h-[300px] lg:min-h-0 bg-black/90 border border-cyan-500/15 rounded-2xl p-4 flex flex-col relative overflow-hidden shadow-2xl">
          {/* Scan Line CRT overlay */}
          <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-[0.03]" />
          
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
            <Terminal size={14} className="text-cyan-400" />
            <span className="text-[10px] font-mono font-semibold text-cyan-400 uppercase tracking-widest">
              Live Capture Terminal Logs
            </span>
            <div className="ml-auto flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            </div>
          </div>

          {/* Terminal log items */}
          <div
            ref={consoleRef}
            className="flex-1 overflow-y-auto font-mono text-[10px] text-cyan-300/90 space-y-2 scrollbar-thin pr-1 leading-normal"
          >
            {consoleLogs.map((log, index) => {
              let color = "text-cyan-300/90";
              if (log.startsWith("[SUCCESS]")) color = "text-emerald-400";
              else if (log.startsWith("[WARN]")) color = "text-amber-400 font-semibold";
              else if (log.startsWith("[ALERT]")) color = "text-red-400 font-bold animate-pulse";

              return (
                <div key={index} className={`break-all ${color}`}>
                  {log}
                </div>
              );
            })}
            {progress < 100 && (
              <div className="flex items-center gap-1.5 text-cyan-400/75 italic">
                <Loader2 className="animate-spin" size={10} />
                Executing stream commands...
              </div>
            )}
          </div>
        </div>

        {/* AI Threat Assessment Preview Card */}
        <AnimatePresence>
          {progress >= 100 && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass-card p-5 border border-red-500/20 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(244,63,94,0.03) 100%)"
              }}
            >
              {/* Decorative Blur */}
              <div className="absolute -left-20 -bottom-20 w-44 h-44 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="text-rose-400 animate-pulse" size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                    AI Forensic Report Seeding
                  </h3>
                  <p className="text-[9px] text-muted-foreground">
                    Suspicious package signatures detected
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-lg font-black text-rose-400 font-mono">
                    87%
                  </span>
                  <div className="text-[8px] text-muted-foreground uppercase font-semibold">
                    Risk Index
                  </div>
                </div>
              </div>

              {/* Findings */}
              <div className="space-y-2 mt-3 text-[10px] text-muted-foreground">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={12} className="text-rose-400 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">
                    Sideloaded package <strong className="text-foreground">com.encrypt.chat</strong> contains permissions bypass configurations.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">
                    Nomedia hidden subdirectory detected with 2 encrypted documents.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={12} className="text-rose-400 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">
                    Browser bookmark history references TOR project and Darknet marketplaces.
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <span className="inline-flex items-center px-2 py-0.5 bg-rose-500/15 border border-rose-500/25 rounded text-[9px] font-bold text-rose-300 uppercase tracking-widest">
                  High Risk Verdict
                </span>
                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded text-[9px] font-bold text-emerald-400 uppercase tracking-widest ml-auto font-mono">
                  Custody Chain Sealed
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
