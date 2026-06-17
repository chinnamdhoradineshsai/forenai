import { Database, History } from "lucide-react";
import { DBRecoveredFile } from "../services/backendApi";

interface RecoveryHistoryProps {
  isBackendOnline: boolean;
  dbRecoveredFiles: DBRecoveredFile[];
  recoveryLogs: any[];
}

export function RecoveryHistory({
  isBackendOnline,
  dbRecoveredFiles,
  recoveryLogs
}: RecoveryHistoryProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {isBackendOnline && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
            <Database size={13} />
            Persistent Recovered Files Database (<span className="text-orange-400 font-mono">recovered_files</span> table)
          </h3>
          {dbRecoveredFiles.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No files restored to database yet. Run a restoration check.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-black/30 border-b border-white/5 text-left text-muted-foreground uppercase text-[10px] font-black tracking-wider">
                    <th className="p-3">File Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Recovery Date</th>
                    <th className="p-3">Verification Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {dbRecoveredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-white/2 transition-colors">
                      <td className="p-3 font-semibold text-foreground">{file.file_name}</td>
                      <td className="p-3 text-muted-foreground">{file.file_type}</td>
                      <td className="p-3 text-muted-foreground">{file.file_size}</td>
                      <td className="p-3 text-green-400 font-bold">{file.recovery_status}</td>
                      <td className="p-3 text-muted-foreground">{file.recovery_date}</td>
                      <td className="p-3 text-orange-400 truncate max-w-[150px]" title={file.hash_value}>
                        {file.hash_value.substring(0, 16)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
          <History size={13} />
          Persistent Recovery Operations Log (<span className="text-orange-400 font-mono">recovery_logs</span> table)
        </h3>

        {!isBackendOnline ? (
          recoveryLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No recovery runs completed yet.
            </div>
          ) : (
            <div className="space-y-4">
              {recoveryLogs.map((log) => (
                <div key={log.id} className="p-4 border border-white/5 bg-white/[0.005] rounded-xl space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-foreground">RESTORE RUN #{log.id.replace("log_", "")}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{log.timestamp}</div>
                    </div>
                    <span className="text-[9px] font-bold bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded">
                      {log.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[10px] bg-black/20 p-2.5 rounded border border-white/5">
                    <div>
                      <span className="text-muted-foreground/60">Recovered:</span>{" "}
                      <span className="text-foreground font-semibold">{log.filesRecovered} files</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/60">Destination:</span>{" "}
                      <span className="text-foreground truncate max-w-[200px]" title={log.destination}>
                        {log.destination}
                      </span>
                    </div>
                  </div>

                  <div className="font-mono text-[9px] truncate bg-black/10 p-1.5 rounded border border-white/5">
                    <span className="text-muted-foreground/60">SHA-256 Checksum:</span>{" "}
                    <span className="text-orange-400/90">{log.hash}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          recoveryLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No recovery runs logged in SQLite.
            </div>
          ) : (
            <div className="space-y-4">
              {recoveryLogs.map((log) => (
                <div key={log.id} className="p-4 border border-white/5 bg-white/[0.005] rounded-xl space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-foreground">LOG ENTRY: {log.id}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{log.timestamp}</div>
                    </div>
                    <span className="text-[9px] font-bold bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase">
                      {log.status || "Verified"}
                    </span>
                  </div>

                  <div className="font-mono text-[10px] bg-black/20 p-2.5 rounded border border-white/5">
                    <span className="text-muted-foreground/60">Operation:</span>{" "}
                    <span className="text-foreground font-semibold">{log.operation}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
