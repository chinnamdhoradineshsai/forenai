import { Clock, Info } from "lucide-react";
import { motion } from "motion/react";
import type { TimelineEvent } from "../data/mockData";

interface TimelineViewerProps {
  events: TimelineEvent[];
}

export function TimelineViewer({ events }: TimelineViewerProps) {
  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <Clock size={14} />
          Chronological Audit Stream
        </h3>
        <span className="text-[10px] text-muted-foreground">
          {events.length} events logged
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
        {events.map((ev, i) => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative flex flex-col gap-1"
          >
            <div className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full border border-black bg-cyan-400 shadow" />
            <div className="flex items-center gap-2 flex-wrap text-[10px]">
              <span className="text-muted-foreground font-mono">
                {ev.timestamp}
              </span>
              <span className="font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 uppercase">
                {ev.type}
              </span>
            </div>
            <h4 className="text-xs font-bold text-foreground mt-0.5">
              {ev.title}
            </h4>
            <p className="text-xs text-muted-foreground leading-normal">
              {ev.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
