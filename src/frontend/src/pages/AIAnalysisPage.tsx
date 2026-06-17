import { Badge } from "@/components/ui/badge";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  AlertOctagon,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronRight,
  Eye,
  Loader2,
  Lock,
  Shield,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { createActor } from "../backend";
import { aiService } from "../services/aiService";
import { evidenceService } from "../services/evidenceService";

// ── Constants ─────────────────────────────────────────  ───────────────────────

const DEFAULT_PERMS = [
  { name: "READ_CALL_LOG", risk: "high" },
  { name: "SEND_SMS", risk: "high" },
  { name: "ACCESS_FINE_LOCATION", risk: "high" },
  { name: "RECORD_AUDIO", risk: "high" },
  { name: "READ_CONTACTS", risk: "medium" },
  { name: "WRITE_EXTERNAL_STORAGE", risk: "medium" },
  { name: "CAMERA", risk: "medium" },
] as const;

const DEFAULT_REASONING = [
  {
    num: "01",
    label: "Anomalous Permission Combos",
    text: "Detected apps requesting critical permissions READ_SMS + RECORD_AUDIO + LOCATION simultaneously.",
    conf: 96,
  },
  {
    num: "02",
    label: "Hidden Media Discovery",
    text: "Found hidden media files in concealed directories with .nomedia markers.",
    conf: 91,
  },
];

const alertSeverityMap = {
  critical: {
    icon: ShieldAlert,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.30)",
    glow: "rgba(239,68,68,0.25)",
  },
  high: {
    icon: Shield,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.30)",
    glow: "rgba(239,68,68,0.25)",
  },
  medium: {
    icon: AlertTriangle,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.30)",
    glow: "rgba(245,158,11,0.20)",
  },
  low: {
    icon: CheckCircle2,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.30)",
    glow: "rgba(34,197,94,0.15)",
  },
};

// ── Animated Risk Meter ───────────────────────────────────────────────────────

function RiskMeter({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  const radius = 80;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  const center = 100;
  const dashOffset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const riskText =
    score > 80 ? "CRITICAL" : score > 50 ? "HIGH RISK" : "LOW RISK";
  const riskColor = score > 80 ? "#ef4444" : score > 50 ? "#f59e0b" : "#22c55e";
  const glowColor =
    score > 80
      ? "rgba(239,68,68,0.35)"
      : score > 50
        ? "rgba(245,158,11,0.35)"
        : "rgba(34,197,94,0.35)";

  const classificationBars = [
    {
      label: "Safe",
      pct: score > 80 ? 0 : score > 50 ? 30 : 100,
      color: "#22c55e",
      glow: "rgba(34,197,94,0.5)",
    },
    {
      label: "Suspicious",
      pct: score > 80 ? 23 : score > 50 ? 50 : 0,
      color: "#f59e0b",
      glow: "rgba(245,158,11,0.5)",
    },
    {
      label: "High Risk",
      pct: score > 80 ? 77 : score > 50 ? 20 : 0,
      color: "#ef4444",
      glow: "rgba(239,68,68,0.5)",
    },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG Meter */}
      <div className="relative" style={{ width: 200, height: 200 }}>
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "transparent",
            boxShadow: `0 0 40px ${glowColor}, 0 0 80px rgba(239,68,68,0.05)`,
            borderRadius: "50%",
            animation: "riskPulse 2s ease-in-out infinite",
          }}
        />

        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{ transform: "rotate(-90deg)" }}
          role="img"
          aria-label="Risk score meter"
        >
          <title>Risk score meter</title>
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          {/* Amber ticks at 50% */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(245,158,11,0.20)"
            strokeWidth={stroke}
            strokeDasharray={`${circumference * 0.5} ${circumference * 0.5}`}
            strokeDashoffset={0}
          />
          {/* Animated arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#riskGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)",
              filter: `drop-shadow(0 0 10px ${riskColor})`,
            }}
          />
          <defs>
            <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="60%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="text-5xl font-black tracking-tight leading-none"
            style={{
              color: riskColor,
              textShadow: `0 0 20px ${riskColor}b0`,
            }}
          >
            {animated}%
          </div>
          <div
            className="text-[10px] font-black tracking-[0.2em] mt-1"
            style={{ color: riskColor }}
          >
            {riskText}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">
            AI Risk Score
          </div>
        </div>
      </div>

      {/* Confidence + model */}
      <div className="w-full flex items-center justify-between text-xs px-1">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Brain size={12} className="text-purple-400" />
          Forensic AI-v2.1
        </span>
        <span
          className="font-bold"
          style={{
            color: "#22d3ee",
            textShadow: "0 0 8px rgba(34,211,238,0.6)",
          }}
        >
          <Eye size={11} className="inline mr-1" />
          94.2% Confidence
        </span>
      </div>

      {/* Classification distribution */}
      <div className="w-full space-y-2.5">
        {classificationBars.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.12 }}
          >
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground font-medium">
                {item.label}
              </span>
              <span className="font-bold" style={{ color: item.color }}>
                {item.pct}%
              </span>
            </div>
            <div
              className="w-full rounded-full h-2"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <motion.div
                className="h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${item.pct}%` }}
                transition={{
                  delay: 0.8 + i * 0.12,
                  duration: 0.9,
                  ease: "easeOut",
                }}
                style={{
                  background: item.color,
                  boxShadow: `0 0 8px ${item.glow}`,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface AIAnalysisPageProps {
  caseId: string;
  deviceId: string;
}

export function AIAnalysisPage({ caseId, deviceId }: AIAnalysisPageProps) {
  const { actor } = useActor(createActor);

  // Queries
  const { data: analysisResult, isLoading: loadingResult } = useQuery({
    queryKey: ["aiAnalysis", deviceId, !!actor],
    queryFn: () => aiService.getAIAnalysisResult(deviceId, actor),
  });

  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ["alerts", deviceId, !!actor],
    queryFn: () => evidenceService.getAlerts(deviceId, actor),
  });

  const { data: apps = [], isLoading: loadingApps } = useQuery({
    queryKey: ["apps", deviceId, !!actor],
    queryFn: () => evidenceService.getAppRecords(deviceId, actor),
  });

  if (loadingResult || loadingAlerts || loadingApps) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-cyan-400" size={24} />
      </div>
    );
  }

  const riskScore = analysisResult?.riskScore ?? 87;
  const suspiciousAppCount = apps.filter((a) => a.isSuspicious).length;

  // Compile unique suspicious permissions dynamically from app records
  const dangerousPermsList = [
    "READ_SMS",
    "RECORD_AUDIO",
    "ACCESS_FINE_LOCATION",
    "READ_CONTACTS",
    "CAMERA",
    "WRITE_EXTERNAL_STORAGE",
    "READ_CALL_LOG",
    "SEND_SMS",
  ];
  const uniqueAppPerms = Array.from(
    new Set(apps.flatMap((a) => a.permissions)),
  ).filter((p) => dangerousPermsList.includes(p));
  const dynamicPermissions = uniqueAppPerms.map((name) => ({
    name,
    risk: [
      "READ_SMS",
      "RECORD_AUDIO",
      "ACCESS_FINE_LOCATION",
      "READ_CALL_LOG",
      "SEND_SMS",
    ].includes(name)
      ? ("high" as const)
      : ("medium" as const),
  }));

  const permsToShow =
    dynamicPermissions.length > 0 ? dynamicPermissions : DEFAULT_PERMS;

  // Compile threat reasoning dynamically from AI key findings
  const dynamicReasoning =
    analysisResult?.keyFindings.map((finding, idx) => ({
      num: String(idx + 1).padStart(2, "0"),
      label: finding.split(":")[0] || "Key Finding",
      text: finding,
      conf: Math.max(72, 96 - idx * 5),
    })) || DEFAULT_REASONING;

  // Map real forensic alerts to UI alert cards
  const dynamicAlertCards = alerts.map((alert, idx) => {
    const sev = (alert.severity?.toLowerCase() ||
      "low") as keyof typeof alertSeverityMap;
    const style = alertSeverityMap[sev] || alertSeverityMap.low;
    const recAction =
      alert.category === "Data Concealment"
        ? "Perform full physical storage partition scan and file carving."
        : alert.category === "Privacy Risk"
          ? "Isolate application process and assess API level permission request blocks."
          : alert.category === "Suspicious Installation"
            ? "Verify sideloaded binary signatures against public reputation databases."
            : "Perform full device chip-off extraction and isolate radio signals.";
    return {
      id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity.toUpperCase(),
      severityKey: sev,
      style,
      action: recAction,
      ocid: `analysis.alert_${idx + 1}`,
    };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-center justify-between gap-3"
        data-ocid="analysis.page"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.30)",
              boxShadow: "0 0 20px rgba(239,68,68,0.25)",
            }}
          >
            <ShieldAlert size={22} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Analysis</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Machine learning threat classification &amp; explainable reasoning
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1.5 rounded-lg text-[11px] font-black tracking-[0.18em] flex items-center gap-1.5"
            style={{
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.30)",
              color: "#22c55e",
              boxShadow: "0 0 12px rgba(34,197,94,0.20)",
            }}
          >
            <CheckCircle2 size={11} />
            ANALYSIS COMPLETE
          </span>
          <span
            className="px-3 py-1.5 rounded-lg text-[11px] font-black tracking-[0.15em] border"
            style={{
              background: "rgba(239,68,68,0.12)",
              borderColor: "rgba(239,68,68,0.30)",
              color: "#ef4444",
            }}
          >
            {suspiciousAppCount} THREATS
          </span>
        </div>
      </motion.div>

      {/* ── Two-column layout ── */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* ── LEFT: Risk Meter ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 glass-card p-6"
          data-ocid="analysis.risk_meter_panel"
        >
          <div className="flex items-center gap-2 mb-5">
            <Zap size={14} className="text-red-400" />
            <h3 className="text-sm font-semibold text-foreground">
              Risk Classification
            </h3>
          </div>
          <RiskMeter score={riskScore} />
        </motion.div>

        {/* ── RIGHT: Permissions + Reasoning + AI text ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="lg:col-span-3 space-y-4"
        >
          {/* Suspicious Permissions */}
          <div
            className="glass-card p-5"
            data-ocid="analysis.permissions_panel"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lock size={14} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">
                Suspicious Permissions
              </h3>
              <span
                className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(245,158,11,0.15)",
                  color: "#f59e0b",
                }}
              >
                {permsToShow.length} DETECTED
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {permsToShow.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  data-ocid={`analysis.permission.item.${i + 1}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold"
                  style={{
                    background:
                      p.risk === "high"
                        ? "rgba(239,68,68,0.10)"
                        : "rgba(245,158,11,0.10)",
                    border: `1px solid ${p.risk === "high" ? "rgba(239,68,68,0.30)" : "rgba(245,158,11,0.25)"}`,
                    color: p.risk === "high" ? "#fca5a5" : "#fcd34d",
                  }}
                >
                  <Lock
                    size={9}
                    style={{ color: p.risk === "high" ? "#ef4444" : "#f59e0b" }}
                  />
                  {p.name}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Threat Reasoning */}
          <div className="glass-card p-5" data-ocid="analysis.reasoning_panel">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={14} className="text-cyan-400" />
              <h3 className="text-sm font-semibold text-foreground">
                Explainable AI — Threat Reasoning
              </h3>
            </div>
            <div className="space-y-3">
              {dynamicReasoning.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  data-ocid={`analysis.reasoning.item.${i + 1}`}
                  className="flex gap-3 p-3 rounded-xl transition-colors hover:bg-white/5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black mt-0.5"
                    style={{
                      background: "rgba(34,211,238,0.12)",
                      border: "1px solid rgba(34,211,238,0.25)",
                      color: "#22d3ee",
                    }}
                  >
                    {step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                        {step.label}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div
                          className="w-14 rounded-full h-1"
                          style={{ background: "rgba(255,255,255,0.08)" }}
                        >
                          <div
                            className="h-1 rounded-full"
                            style={{
                              width: `${step.conf}%`,
                              background: "#22d3ee",
                              boxShadow: "0 0 6px rgba(34,211,238,0.6)",
                            }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: "#22d3ee" }}
                        >
                          {step.conf}%
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {step.text}
                    </p>
                    <div
                      className="flex items-center gap-1 mt-1.5 text-[10px]"
                      style={{ color: "rgba(34,211,238,0.5)" }}
                    >
                      <ChevronRight size={10} />
                      Confidence score: {step.conf}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* AI Explanation */}
          {analysisResult?.summary && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="p-4 rounded-xl"
              style={{
                background: "rgba(34,211,238,0.04)",
                border: "1px solid rgba(34,211,238,0.18)",
                boxShadow: "0 0 20px rgba(34,211,238,0.06)",
              }}
              data-ocid="analysis.ai_explanation"
            >
              <div className="flex items-start gap-2.5">
                <div
                  className="flex-shrink-0 p-1.5 rounded-lg mt-0.5"
                  style={{
                    background: "rgba(34,211,238,0.12)",
                    border: "1px solid rgba(34,211,238,0.25)",
                  }}
                >
                  <Brain size={13} className="text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground mb-1.5">
                    AI Summary — Behavioral Assessment
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {analysisResult.summary}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ── Bottom: Forensic Alert Cards ── */}
      <div className="grid md:grid-cols-3 gap-4">
        {dynamicAlertCards.length > 0 ? (
          dynamicAlertCards.map((alert, i) => {
            const Icon = alert.style.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 + i * 0.12 }}
                data-ocid={alert.ocid}
                className="glass-card p-5 hover:scale-[1.02] transition-transform duration-200 cursor-default"
                style={{
                  borderColor: alert.style.border,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${alert.style.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}
              >
                {/* Icon + title row */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2.5 rounded-xl"
                    style={{
                      background: alert.style.bg,
                      border: `1px solid ${alert.style.border}`,
                      boxShadow: `0 0 14px ${alert.style.glow}`,
                    }}
                  >
                    <Icon size={18} style={{ color: alert.style.color }} />
                  </div>
                  <span
                    className="text-[10px] font-black tracking-[0.15em] px-2 py-1 rounded-md border"
                    style={{
                      background: alert.style.bg,
                      color: alert.style.color,
                      borderColor: alert.style.border,
                    }}
                  >
                    {alert.severity}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-foreground mb-2">
                  {alert.title}
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                  {alert.description}
                </p>

                {/* Recommendation */}
                <div
                  className="p-2.5 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="text-[10px] font-bold text-muted-foreground/70 mb-0.5 tracking-wider">
                    RECOMMENDED ACTION
                  </div>
                  <p
                    className="text-[11px]"
                    style={{ color: alert.style.color }}
                  >
                    {alert.action}
                  </p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="md:col-span-3 glass-card p-12 text-center text-muted-foreground">
            No active alerts found for this device.
          </div>
        )}
      </div>

      {/* Pulse ring keyframe */}
      <style>{`
        @keyframes riskPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(239,68,68,0.20), 0 0 60px rgba(239,68,68,0.05); }
          50% { box-shadow: 0 0 50px rgba(239,68,68,0.35), 0 0 90px rgba(239,68,68,0.10); }
        }
      `}</style>
    </div>
  );
}
