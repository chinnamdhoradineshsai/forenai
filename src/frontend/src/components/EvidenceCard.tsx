import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import type { ElementType } from "react";

interface EvidenceCardProps {
  label: string;
  count: number;
  icon: ElementType;
  color: string;
  onClick: () => void;
}

export function EvidenceCard({
  label,
  count,
  icon: Icon,
  color,
  onClick,
}: EvidenceCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-card p-5 flex items-center justify-between group cursor-pointer w-full text-left"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
          style={{ background: `${color}18` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
            {label}
          </div>
          <div className="text-2xl font-bold text-foreground font-mono leading-none">
            {count}
          </div>
        </div>
      </div>
      <ChevronRight
        size={14}
        className="text-muted-foreground group-hover:text-foreground transition-colors"
      />
    </motion.button>
  );
}
