import { useState } from "react";
import { Binary, Eye, ShieldCheck, Download, Settings } from "lucide-react";
import { RecoveryTable } from "../components/RecoveryTable";
import { FilePreview } from "../components/FilePreview";
import { RecoverableFile } from "../services/backendApi";

interface RecoveryResultsProps {
  activeSubTab: "deleted" | "carving" | "preview" | "execute";
  setActiveSubTab: (tab: "deleted" | "carving" | "preview" | "execute") => void;
  recoverableFiles: RecoverableFile[];
  selectedFilesToRecover: Record<string, boolean>;
  onToggleFile: (id: string) => void;
  onSelectAll: () => void;
  selectedFileId: string;
  setSelectedFileId: (id: string) => void;
  generateHexDump: (sig: string, name: string) => Array<{ offset: string; hex: string; ascii: string }>;
  destinationPath: string;
  setDestinationPath: (path: string) => void;
  isRecovering: boolean;
  recoveryProgress: number;
  executeRecovery: () => void;
}

export function RecoveryResults({
  activeSubTab,
  setActiveSubTab,
  recoverableFiles,
  selectedFilesToRecover,
  onToggleFile,
  onSelectAll,
  selectedFileId,
  setSelectedFileId,
  generateHexDump,
  destinationPath,
  setDestinationPath,
  isRecovering,
  recoveryProgress,
  executeRecovery
}: RecoveryResultsProps) {
  const selectedFile = recoverableFiles.find(f => f.id === selectedFileId) || recoverableFiles[0];

  return (
    <div className="space-y-6">
      {/* Sub tabs inside results */}
      <div className="flex border-b border-white/5 overflow-x-auto gap-1 scrollbar-none">
        {[
          { id: "deleted" as const, label: "Deleted Files Table" },
          { id: "carving" as const, label: "Magic Byte Carving" },
          { id: "preview" as const, label: "Hexadecimal Preview" },
          { id: "execute" as const, label: "Restore Execution" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-1.5 text-[10px] uppercase font-black transition-all border-b-2 flex-shrink-0 cursor-pointer ${
              activeSubTab === tab.id
                ? "border-orange-500 text-orange-400 font-extrabold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {/* Sub-Tab 1: Deleted Files Table */}
        {activeSubTab === "deleted" && (
          <RecoveryTable
            files={recoverableFiles}
            selectedFilesToRecover={selectedFilesToRecover}
            onToggleFile={onToggleFile}
            onSelectAll={onSelectAll}
            onInspectFile={(id) => {
              setSelectedFileId(id);
              setActiveSubTab("preview");
            }}
          />
        )}

        {/* Sub-Tab 2: Magic Byte Carving */}
        {activeSubTab === "carving" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                <Binary size={13} />
                Magic Bytes Signature Engine
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Raw byte carving extracts file buffers directly from storage sectors matching standard header signatures:
              </p>
              <div className="space-y-2 text-[10px] font-mono bg-black/20 p-3 rounded-lg border border-white/5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">JPEG:</span>
                  <span className="text-orange-400">FF D8 FF E0 / E1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">PNG:</span>
                  <span className="text-orange-400">89 50 4E 47 0D 0A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">PDF:</span>
                  <span className="text-orange-400">25 50 44 46 (%PDF)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">ZIP/APK:</span>
                  <span className="text-orange-400">50 4B 03 04 (PK)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">SQLite:</span>
                  <span className="text-orange-400">53 51 4c 69 74 65</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 glass-card p-6 space-y-4">
              <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest border-b border-white/5 pb-2">
                Unallocated Sector Carving Results
              </h3>
              <div className="space-y-3">
                {recoverableFiles.map((file) => (
                  <div key={`carve-${file.id}`} className="flex items-center justify-between p-3 border border-white/5 bg-white/[0.01] rounded-xl hover:bg-white/3 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Binary size={14} className="text-orange-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">{file.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          Offset: {file.sectorOffset} · Header: {file.hexSignature.substring(0, 14)}...
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded">
                        Confidence: {file.recoveryRate}%
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFileId(file.id);
                          setActiveSubTab("preview");
                        }}
                        className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
                      >
                        Inspect bytes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sub-Tab 3: Hex Preview */}
        {activeSubTab === "preview" && selectedFile && (
          <FilePreview
            file={selectedFile}
            generateHexDump={generateHexDump}
          />
        )}

        {/* Sub-Tab 4: Restore Execution */}
        {activeSubTab === "execute" && (
          <div className="glass-card p-6 space-y-5 animate-fadeIn">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest border-b border-white/5 pb-2">
              Forensic Recovery Config
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Target Recovery Directory (Local Disk)
                </label>
                <input
                  type="text"
                  value={destinationPath}
                  onChange={(e) => setDestinationPath(e.target.value)}
                  className="form-input text-xs bg-[#0B1220] border-white/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Selected Assets to Recover
                </label>
                <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin border border-white/5 p-3 rounded-lg bg-black/20">
                  {recoverableFiles.map((file) => {
                    const isChecked = !!selectedFilesToRecover[file.id];
                    return (
                      <div key={`exec-${file.id}`} className="flex items-center gap-3 text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleFile(file.id)}
                          className="accent-orange-500 cursor-pointer"
                        />
                        <span className="font-semibold text-foreground flex-1">{file.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{file.size}</span>
                        <span className={`text-[10px] font-bold ${file.status === "Intact" ? "text-green-400" : "text-amber-400"}`}>
                          ({file.status})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isRecovering && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold uppercase">
                    <span className="text-muted-foreground">Recovery Action Progress</span>
                    <span className="text-orange-400">{recoveryProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-100"
                      style={{ width: `${recoveryProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isRecovering}
                  onClick={executeRecovery}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white rounded-xl cursor-pointer bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                  {isRecovering ? "Extracting & Verifying..." : "Execute Cryptographic Recovery"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
