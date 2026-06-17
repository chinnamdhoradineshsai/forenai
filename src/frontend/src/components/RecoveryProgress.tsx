interface RecoveryProgressProps {
  progress: number;
  stats: {
    sectorsScanned: number;
    deletedFound: number;
    carvedFound: number;
    partitionsFound: number;
  };
  sectorGrid: string[];
}

export function RecoveryProgress({ progress, stats, sectorGrid }: RecoveryProgressProps) {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest">
          Live Sector Scanner Log
        </h3>
        <span className="text-[11px] font-mono text-orange-400 font-bold">{progress}%</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg text-center">
          <div className="text-[9px] text-muted-foreground font-semibold uppercase">Sectors Audited</div>
          <div className="text-xs font-bold font-mono text-foreground mt-0.5">{stats.sectorsScanned.toLocaleString()}</div>
        </div>
        <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg text-center">
          <div className="text-[9px] text-muted-foreground font-semibold uppercase">Deleted Metadata</div>
          <div className="text-xs font-bold font-mono text-orange-400 mt-0.5">{stats.deletedFound}</div>
        </div>
        <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg text-center">
          <div className="text-[9px] text-muted-foreground font-semibold uppercase">Carved Elements</div>
          <div className="text-xs font-bold font-mono text-yellow-400 mt-0.5">{stats.carvedFound}</div>
        </div>
        <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg text-center">
          <div className="text-[9px] text-muted-foreground font-semibold uppercase">Partition Bounds</div>
          <div className="text-xs font-bold font-mono text-green-400 mt-0.5">{stats.partitionsFound}</div>
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-12 md:grid-cols-18 gap-1 p-2 bg-black/30 border border-white/5 rounded-lg overflow-y-auto max-h-[140px] scrollbar-thin">
        {sectorGrid.map((sector, i) => {
          let bg = "bg-zinc-800";
          if (sector === "success") bg = "bg-orange-500/80 shadow-orange-500/10";
          if (sector === "deleted") bg = "bg-amber-500/70";
          if (sector === "carved") bg = "bg-yellow-500";
          if (sector === "error") bg = "bg-red-500/80";
          return <div key={`sec-${i}`} className={`w-full aspect-square rounded-sm ${bg} transition-colors duration-200`} />;
        })}
      </div>
    </div>
  );
}
