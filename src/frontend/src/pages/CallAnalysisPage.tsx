import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Phone,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { createActor } from "../backend";
import type { Page } from "../components/Sidebar";
import { evidenceService } from "../services/evidenceService";

interface CallAnalysisPageProps {
  deviceId: string;
  onNavigate: (page: Page) => void;
}

export function CallAnalysisPage({
  deviceId,
  onNavigate,
}: CallAnalysisPageProps) {
  const { actor } = useActor(createActor);
  const [search, setSearch] = useState("");

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ["calls", deviceId, !!actor],
    queryFn: () => evidenceService.getCallRecords(deviceId, actor),
    enabled: !!deviceId,
  });

  const isRecoveryEnabled = useMemo(
    () => localStorage.getItem("forenai_data_recovery_enabled") === "true",
    [],
  );

  const filteredCalls = useMemo(() => {
    let list = calls;

    // Filter out recovered if disabled
    if (!isRecoveryEnabled) {
      list = list.filter((c) => !c.isRecovered);
    }

    return list.filter(
      (c) =>
        c.caller.toLowerCase().includes(search.toLowerCase()) ||
        c.number.includes(search),
    );
  }, [calls, isRecoveryEnabled, search]);

  const recoveredCount = useMemo(
    () => calls.filter((c) => c.isRecovered).length,
    [calls],
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        type="button"
        onClick={() => onNavigate("evidence")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back to Evidence Viewer
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Phone className="text-cyan-400" size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Call Log Analysis
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inspect missed calls, durations, and suspicious UK/international
              numbers
            </p>
          </div>
        </div>

        <div className="relative max-w-xs w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 py-1.5 text-xs rounded-lg"
          />
        </div>
      </div>

      {/* Recovery status info */}
      {isRecoveryEnabled && recoveredCount > 0 && (
        <div className="p-3.5 rounded-xl border border-orange-500/15 bg-orange-950/[0.02] text-xs text-orange-400 flex items-center gap-2">
          <Trash2 size={14} className="animate-pulse" />
          <span>
            <strong>Data Recovery Mode:</strong> Carved and recovered{" "}
            <strong>{recoveredCount}</strong> deleted call history logs from
            storage blocks.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-cyan-400" />
        </div>
      ) : filteredCalls.length === 0 ? (
        <div className="glass-card p-10 text-center text-muted-foreground">
          No call logs found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCalls.map((c) => (
            <div
              key={c.id}
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                c.isRecovered
                  ? "border-orange-500/25 bg-orange-950/[0.01] shadow-[0_0_15px_rgba(249,115,22,0.04)]"
                  : c.isSuspicious
                    ? "border-red-500/20 bg-red-950/[0.01]"
                    : "border-white/8 bg-white/[0.01] hover:bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    c.isRecovered
                      ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                      : "bg-cyan-500/10 text-cyan-400"
                  }`}
                >
                  {c.isRecovered ? "DEL" : c.callType[0].toUpperCase()}
                </div>
                <div className="min-w-0 text-xs">
                  <div className="font-bold text-foreground truncate">
                    {c.caller}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {c.number}
                  </div>
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="font-semibold text-foreground">
                  {c.duration}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                  {c.timestamp}
                </div>
              </div>

              {c.isRecovered ? (
                <div className="flex items-center gap-1.5 text-[10px] text-orange-400 font-bold border border-orange-500/20 bg-orange-500/5 px-2.5 py-1 rounded-lg animate-pulse whitespace-nowrap">
                  <Trash2 size={12} />
                  Deleted & Recovered
                </div>
              ) : (
                c.isSuspicious && (
                  <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold border border-red-500/20 bg-red-500/5 px-2.5 py-1 rounded-lg whitespace-nowrap">
                    <AlertTriangle size={12} />
                    Suspicious Call
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
