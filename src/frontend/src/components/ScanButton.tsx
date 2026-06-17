import { Loader2 } from "lucide-react";

interface ScanButtonProps {
  isScanning: boolean;
  activeSector: number;
  onClick: () => void;
}

export function ScanButton({ isScanning, activeSector, onClick }: ScanButtonProps) {
  return (
    <div className="pt-2 border-t border-white/5">
      {!isScanning ? (
        <button
          type="button"
          onClick={onClick}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20 hover:brightness-110 active:scale-[0.98]"
        >
          Initiate Partition Scan
        </button>
      ) : (
        <div className="text-center py-2.5 text-xs font-mono text-orange-400 animate-pulse flex items-center justify-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <Loader2 size={13} className="animate-spin text-orange-400" />
          Scanning Sector Block {activeSector}...
        </div>
      )}
    </div>
  );
}
