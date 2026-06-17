import { Eye, Database } from "lucide-react";
import { RecoverableFile } from "../services/backendApi";

interface RecoveryTableProps {
  files: RecoverableFile[];
  selectedFilesToRecover: Record<string, boolean>;
  onToggleFile: (id: string) => void;
  onSelectAll: () => void;
  onInspectFile: (id: string) => void;
}

export function RecoveryTable({
  files,
  selectedFilesToRecover,
  onToggleFile,
  onSelectAll,
  onInspectFile
}: RecoveryTableProps) {
  return (
    <div className="glass-card p-6 space-y-4 animate-fadeIn">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
          <Database size={13} />
          Detected Deleted Metadata Logs
        </h3>
        <button
          type="button"
          onClick={onSelectAll}
          className="text-[10px] text-orange-400 font-bold hover:underline cursor-pointer"
        >
          Select All
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-black/30 border-b border-white/5 text-left text-muted-foreground uppercase text-[10px] font-black tracking-wider">
              <th className="p-3 w-8">Select</th>
              <th className="p-3">File Name</th>
              <th className="p-3">Original Directory</th>
              <th className="p-3">Sector Offset</th>
              <th className="p-3">Size</th>
              <th className="p-3">Deletion Time</th>
              <th className="p-3">Integrity Rating</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {files.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No recoverable file entries found. Initialize a partition scan.
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file.id} className="hover:bg-white/2 transition-colors">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={!!selectedFilesToRecover[file.id]}
                      onChange={() => onToggleFile(file.id)}
                      className="accent-orange-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 font-semibold text-foreground">{file.name}</td>
                  <td className="p-3 text-muted-foreground font-mono truncate max-w-[200px]" title={file.path}>
                    {file.path}
                  </td>
                  <td className="p-3 text-muted-foreground font-mono">{file.sectorOffset}</td>
                  <td className="p-3 font-mono text-muted-foreground">{file.size}</td>
                  <td className="p-3 text-muted-foreground font-mono">{file.deletedTime}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      file.status === "Intact"
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : file.status === "Fragmented"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}>
                      {file.status} ({file.recoveryRate}%)
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => onInspectFile(file.id)}
                      className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <Eye size={12} />
                      Preview
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
