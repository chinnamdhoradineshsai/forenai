import { Calendar, Folder, ShieldAlert, Trash2, User } from "lucide-react";
import { motion } from "motion/react";
import type { Case } from "../backend.d";

interface CaseCardProps {
  kase: Case;
  onClick: () => void;
  onDelete?: () => void;
}

export function CaseCard({ kase, onClick, onDelete }: CaseCardProps) {
  const dateStr = new Date(
    Number(kase.createdTimestamp) * 1000,
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="glass-card p-6 flex flex-col justify-between h-56 cursor-pointer group transition-all"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
            <Folder size={12} />
            {kase.caseNumber}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide ${
                kase.status === "active"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                  : "bg-zinc-500/15 text-zinc-400 border-zinc-500/25"
              }`}
            >
              {kase.status.toUpperCase()}
            </span>
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)] active:scale-95 transition-all duration-200 cursor-pointer border border-transparent hover:border-red-500/20"
                title="Delete Case"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <h3 className="text-base font-bold text-foreground line-clamp-1 group-hover:text-cyan-300 transition-colors">
          {kase.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {kase.description}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5 min-w-0">
          <User size={12} className="text-violet-400 flex-shrink-0" />
          <span className="truncate">{kase.investigator}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Calendar size={12} className="text-pink-400" />
          <span>{dateStr}</span>
        </div>
      </div>
    </motion.div>
  );
}
