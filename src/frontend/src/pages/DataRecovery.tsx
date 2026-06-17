import { ScanButton } from "../components/ScanButton";
import { RecoveryProgress } from "../components/RecoveryProgress";
import { BackendDrive } from "../services/backendApi";

interface DataRecoveryProps {
  isBackendOnline: boolean;
  drives: BackendDrive[];
  selectedDrivePath: string;
  setSelectedDrivePath: (path: string) => void;
  customTargetPath: string;
  setCustomTargetPath: (path: string) => void;
  scanType: "quick" | "deep";
  setScanType: (type: "quick" | "deep") => void;
  isScanning: boolean;
  scanProgress: number;
  activeSector: number;
  scanStats: {
    sectorsScanned: number;
    deletedFound: number;
    carvedFound: number;
    partitionsFound: number;
  };
  sectorGrid: string[];
  runScan: () => void;
}

export function DataRecovery({
  isBackendOnline,
  drives,
  selectedDrivePath,
  setSelectedDrivePath,
  customTargetPath,
  setCustomTargetPath,
  scanType,
  setScanType,
  isScanning,
  scanProgress,
  activeSector,
  scanStats,
  sectorGrid,
  runScan
}: DataRecoveryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      {/* Configuration Column */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest border-b border-white/5 pb-2">
          Scan Storage Config
        </h3>

        {isBackendOnline && (
          <div className="space-y-3 pb-2 border-b border-white/5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                System Partition / Mounted Drive
              </label>
              <select
                disabled={isScanning}
                value={selectedDrivePath}
                onChange={(e) => setSelectedDrivePath(e.target.value)}
                className="form-input text-xs py-2 bg-[#0B1220] border-white/10"
              >
                {drives.length === 0 ? (
                  <option value="">No drives detected</option>
                ) : (
                  drives.map(drive => (
                    <option key={drive.path} value={drive.path}>
                      {drive.name} · {drive.status}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Or Specific Forensic Folder Path
              </label>
              <input
                disabled={isScanning}
                type="text"
                placeholder="e.g. e:\forenai\uploads"
                value={customTargetPath}
                onChange={(e) => setCustomTargetPath(e.target.value)}
                className="form-input text-xs bg-[#0B1220] border-white/10"
              />
            </div>
          </div>
        )}
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Scan Method
          </label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 transition-all cursor-pointer">
              <input
                disabled={isScanning}
                type="radio"
                checked={scanType === "quick"}
                onChange={() => setScanType("quick")}
                className="mt-0.5 accent-orange-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground">Quick Metadata Scan</span>
                <p className="text-[10px] text-muted-foreground">Scans master tables (MFT, FAT index) for deleted items.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 transition-all cursor-pointer">
              <input
                disabled={isScanning}
                type="radio"
                checked={scanType === "deep"}
                onChange={() => setScanType("deep")}
                className="mt-0.5 accent-orange-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground">Deep Carving (Raw Sectors)</span>
                <p className="text-[10px] text-muted-foreground">Searches raw unallocated space for file headers and magic byte signatures.</p>
              </div>
            </label>
          </div>
        </div>

        <ScanButton
          isScanning={isScanning}
          activeSector={activeSector}
          onClick={runScan}
        />
      </div>

      {/* Progress & Live Block Visualizer Column */}
      <div className="lg:col-span-2 space-y-6">
        <RecoveryProgress
          progress={scanProgress}
          stats={scanStats}
          sectorGrid={sectorGrid}
        />
      </div>
    </div>
  );
}
