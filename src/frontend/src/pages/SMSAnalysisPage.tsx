import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { createActor } from "../backend";
import type { Page } from "../components/Sidebar";
import { evidenceService } from "../services/evidenceService";

interface SMSAnalysisPageProps {
  deviceId: string;
  onNavigate: (page: Page) => void;
}

export function SMSAnalysisPage({
  deviceId,
  onNavigate,
}: SMSAnalysisPageProps) {
  const { actor } = useActor(createActor);
  const [filterSuspicious, setFilterSuspicious] = useState(false);
  const [search, setSearch] = useState("");

  const { data: sms = [], isLoading } = useQuery({
    queryKey: ["sms", deviceId, !!actor],
    queryFn: () => evidenceService.getSmsRecords(deviceId, actor),
    enabled: !!deviceId,
  });

  const isRecoveryEnabled = useMemo(
    () => localStorage.getItem("forenai_data_recovery_enabled") === "true",
    [],
  );

  const filteredSms = useMemo(() => {
    let list = sms;

    // Filter out recovered if disabled
    if (!isRecoveryEnabled) {
      list = list.filter((s) => !s.isRecovered);
    }

    return list.filter((s) => {
      const matchesSearch =
        s.sender.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search) ||
        s.content.toLowerCase().includes(search.toLowerCase());
      const matchesSuspicious =
        !filterSuspicious || s.isSuspicious || s.isRecovered;
      return matchesSearch && matchesSuspicious;
    });
  }, [sms, isRecoveryEnabled, search, filterSuspicious]);

  const recoveredCount = useMemo(
    () => sms.filter((s) => s.isRecovered).length,
    [sms],
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
            <MessageSquare className="text-cyan-400" size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              SMS Deep Analysis
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inspect suspicious links, bank transactions, and hidden contact
              references
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search SMS logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9 py-1.5 text-xs rounded-lg"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterSuspicious(!filterSuspicious)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
              filterSuspicious
                ? "bg-red-500/15 border-red-500/25 text-red-400"
                : "bg-white/5 border-white/8 text-muted-foreground hover:text-foreground"
            }`}
          >
            Show Flagged Only
          </button>
        </div>
      </div>

      {/* Recovery status info */}
      {isRecoveryEnabled && recoveredCount > 0 && (
        <div className="p-3.5 rounded-xl border border-orange-500/15 bg-orange-950/[0.02] text-xs text-orange-400 flex items-center gap-2">
          <Trash2 size={14} className="animate-pulse" />
          <span>
            <strong>Data Recovery Mode:</strong> Successfully retrieved{" "}
            <strong>{recoveredCount}</strong> deleted messages from target
            unallocated SQLite database sectors.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-cyan-400" />
        </div>
      ) : filteredSms.length === 0 ? (
        <div className="glass-card p-10 text-center text-muted-foreground">
          No SMS records matching criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSms.map((s) => (
            <div
              key={s.id}
              className={`p-4 rounded-xl border flex gap-4 ${
                s.isRecovered
                  ? "border-orange-500/25 bg-orange-950/[0.01] shadow-[0_0_15px_rgba(249,115,22,0.04)]"
                  : s.isSuspicious
                    ? "border-red-500/20 bg-red-950/[0.01]"
                    : "border-white/8 bg-white/[0.01] hover:bg-white/[0.02]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                  s.isRecovered
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                    : "bg-cyan-500/10 text-cyan-400"
                }`}
              >
                {s.isRecovered
                  ? "DEL"
                  : s.direction === "incoming"
                    ? "IN"
                    : "OUT"}
              </div>
              <div className="flex-1 min-w-0 space-y-1 text-xs">
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <div>
                    <span className="font-bold text-foreground">
                      {s.sender}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono ml-2">
                      {s.phone}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                    {s.timestamp}
                  </span>
                </div>
                <p
                  className={`p-2 rounded border font-mono leading-relaxed ${
                    s.isRecovered
                      ? "bg-orange-950/10 border-orange-500/10 text-orange-200/90"
                      : "bg-black/15 border-white/5 text-foreground/90"
                  }`}
                >
                  {s.content}
                </p>
                {s.isRecovered ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-orange-400 pt-1 font-semibold">
                    <Trash2 size={12} className="animate-pulse" />
                    Recovered Deleted message: recovered via SQLite DB
                    journaling analysis.
                  </div>
                ) : s.isSuspicious ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-red-400 pt-1 font-semibold">
                    <AlertTriangle size={12} />
                    Suspicious pattern: contains link click triggers or secure
                    vault references.
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
