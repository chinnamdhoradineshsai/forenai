import { motion } from "motion/react";
import type { TimelineEvent } from "../data/mockData";

interface EvidenceTimelineProps {
  events: TimelineEvent[];
}

const SEVERITY_COLORS = {
  high: "bg-red-500 shadow-red-500/50",
  medium: "bg-amber-500 shadow-amber-500/50",
  low: "bg-green-500 shadow-green-500/50",
  info: "bg-cyan-500 shadow-cyan-500/50",
  success: "bg-emerald-500 shadow-emerald-500/50",
};

export function EvidenceTimeline({ events }: EvidenceTimelineProps) {
  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
      {events.map((ev, i) => {
        const colorClass = SEVERITY_COLORS[ev.severity] || SEVERITY_COLORS.info;

        return (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            className="relative flex flex-col gap-1.5"
          >
            {/* Timeline Node */}
            <div
              className={`absolute -left-[21px] top-1.5 w-3.5 h-3.5 rounded-full border border-black/80 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${colorClass}`}
            />

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-mono">
                {ev.timestamp}
              </span>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-muted-foreground tracking-wider">
                {ev.type}
              </span>
              <h4 className="text-xs font-bold text-foreground">{ev.title}</h4>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pl-1">
              {ev.description}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
