import { AlertTriangle, BookOpen, FileText, ShieldAlert } from "lucide-react";
import type { Case, Device } from "../backend.d";

interface InvestigationSummaryCardProps {
  kase: Case;
  device?: Device;
  alertsCount: number;
  evidenceCount: number;
}

export function InvestigationSummaryCard({
  kase,
  device,
  alertsCount,
  evidenceCount,
}: InvestigationSummaryCardProps) {
  return (
    <div className="glass-card p-6 space-y-6 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute -left-20 -bottom-20 w-44 h-44 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
            Case Summary
          </div>
          <h2 className="text-xl font-bold text-foreground">{kase.name}</h2>
          <p className="text-xs text-muted-foreground">
            Case Number: <span className="font-mono">{kase.caseNumber}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center bg-white/5 border border-white/8 px-4 py-2.5 rounded-xl">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">
              Total Evidence
            </div>
            <div className="text-xl font-bold text-foreground font-mono mt-0.5">
              {evidenceCount}
            </div>
          </div>

          <div className="text-center bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
            <div className="text-[10px] font-bold text-red-400 uppercase">
              Critical Alerts
            </div>
            <div className="text-xl font-bold text-red-400 font-mono mt-0.5">
              {alertsCount}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 border-t border-white/5 pt-5">
        <div className="space-y-2">
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <BookOpen size={14} className="text-cyan-400" />
            <span>Scope & Investigation Objectives</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {kase.description ||
              "No specific objectives defined for this case."}
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <FileText size={14} className="text-violet-400" />
            <span>Investigator Details & Device Log</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 bg-black/25 p-3 rounded-lg border border-white/5 font-mono">
            <div>Lead: {kase.investigator}</div>
            {device && (
              <>
                <div>Device: {device.model}</div>
                <div>ROM: {device.androidVersion}</div>
                <div>Hash: SHA-256 Verified</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
