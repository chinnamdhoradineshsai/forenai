import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Globe,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { createActor } from "../backend";
import type { Page } from "../components/Sidebar";

interface BrowserAnalysisPageProps {
  deviceId: string;
  onNavigate: (page: Page) => void;
}

export function BrowserAnalysisPage({
  deviceId,
  onNavigate,
}: BrowserAnalysisPageProps) {
  const { actor } = useActor(createActor);
  const [search, setSearch] = useState("");

  const { data: browser = [], isLoading } = useQuery({
    queryKey: ["browser", deviceId],
    queryFn: () => (actor ? actor.getBrowserRecords(deviceId) : []),
    enabled: !!actor && !!deviceId,
  });

  const filteredBrowser = browser.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase()),
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
            <Globe className="text-cyan-400" size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Browser History Analysis
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track search queries, accessed web portals, and incognito sessions
            </p>
          </div>
        </div>

        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search URLs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input text-xs"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-cyan-400" />
        </div>
      ) : filteredBrowser.length === 0 ? (
        <div className="glass-card p-10 text-center text-muted-foreground">
          No browser records found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBrowser.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-xl border bg-white/[0.01] hover:bg-white/[0.02] flex items-center justify-between gap-4 ${
                b.isSuspicious
                  ? "border-red-500/20 bg-red-950/[0.01]"
                  : "border-white/8"
              }`}
            >
              <div className="min-w-0 space-y-1 text-xs">
                <div className="font-bold text-foreground truncate">
                  {b.title}
                </div>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground font-mono text-[10px] truncate hover:text-cyan-400 flex items-center gap-1"
                >
                  {b.url}
                  <ExternalLink size={10} />
                </a>
                <div className="flex gap-4 text-[9px] text-muted-foreground font-mono pt-1">
                  <span>Browser: {b.browser}</span>
                  <span>Visits: {Number(b.visitCount)}</span>
                  <span>Last: {b.lastVisited}</span>
                </div>
              </div>

              {b.isSuspicious && (
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-red-400 border border-red-500/25 bg-red-500/5 px-2 py-0.5 rounded-full flex-shrink-0">
                  <AlertTriangle size={12} />
                  SUSPICIOUS PORTAL
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
