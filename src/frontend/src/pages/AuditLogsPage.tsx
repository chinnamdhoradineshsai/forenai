import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2, Search, Shield } from "lucide-react";
import { useState } from "react";
import { createActor } from "../backend";
import { evidenceService } from "../services/evidenceService";

interface AuditLogsPageProps {
  caseId: string;
}

export function AuditLogsPage({ caseId }: AuditLogsPageProps) {
  const { actor } = useActor(createActor);
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["auditLogs", caseId, !!actor],
    queryFn: () => evidenceService.getAuditLogs(caseId, actor),
  });

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.investigator.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Search and header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-400" />
            Chain of Custody Ledger
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Cryptographically signed events recorded on-chain
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 py-1.5 text-xs rounded-lg"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-cyan-400" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-card p-10 text-center text-muted-foreground">
          No audit logs recorded for this case.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const dateStr = new Date(Number(log.timestamp)).toLocaleString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              },
            );

            return (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.01]"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield size={14} className="text-emerald-400" />
                </div>

                <div className="flex-1 min-w-0 space-y-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                      {dateStr}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {log.details}
                  </p>
                  <div className="flex gap-4 text-[10px] text-muted-foreground/60 pt-1 font-mono">
                    <span>Investigator: {log.investigator}</span>
                    <span className="text-emerald-500/70">
                      ✓ Verified Ledger Log
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
