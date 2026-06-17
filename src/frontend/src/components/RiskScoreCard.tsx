import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

interface RiskScoreCardProps {
  score: number;
}

export function RiskScoreCard({ score }: RiskScoreCardProps) {
  const getRiskLabel = (s: number) => {
    if (s > 75)
      return {
        text: "HIGH RISK",
        color: "text-red-400 border-red-500/30 bg-red-500/10",
        stroke: "#ef4444",
      };
    if (s > 40)
      return {
        text: "MODERATE RISK",
        color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
        stroke: "#f59e0b",
      };
    return {
      text: "MINIMAL RISK",
      color: "text-green-400 border-green-500/30 bg-green-500/10",
      stroke: "#10b981",
    };
  };

  const risk = getRiskLabel(score);
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card p-6 space-y-6 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-red-400" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            AI Threat Assessment
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          v1.2.0
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Radial Ring Gauge */}
        <div className="relative flex-shrink-0 w-24 h-24">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Background Ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={strokeWidth}
            />
            {/* Animated Indicator */}
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={risk.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
            <span className="text-xl font-bold text-foreground">{score}%</span>
            <span className="text-[8px] text-muted-foreground uppercase">
              Threat
            </span>
          </div>
        </div>

        {/* Level Banner */}
        <div className="space-y-2 flex-1">
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold border tracking-wider ${risk.color}`}
          >
            {risk.text}
          </div>
          <p className="text-xs text-muted-foreground leading-normal">
            Neural classification flags multiple suspect signatures: sideloaded
            packages, concealed file paths, and potential darknet history
            markers.
          </p>
        </div>
      </div>

      {/* Flagged Rules */}
      <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <AlertTriangle
            size={14}
            className="text-red-400 mt-0.5 flex-shrink-0"
          />
          <span>
            Sideloaded package <strong>com.sys.updater</strong> requests
            persistent SMS broadcast rights.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <AlertTriangle
            size={14}
            className="text-amber-400 mt-0.5 flex-shrink-0"
          />
          <span>
            Nomedia concealment folder contains encrypted SQLite audio
            databases.
          </span>
        </div>
      </div>
    </div>
  );
}
