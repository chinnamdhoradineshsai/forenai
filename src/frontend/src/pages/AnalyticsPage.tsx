// AnalyticsPage — fully dynamic, no static mock data.
// This page is kept for legacy route compatibility; the main analytics
// experience is served by TimelineAnalyticsPage which receives caseId + deviceId.
// If this page is ever rendered directly (e.g. via old link), it redirects the
// user to select a device first.
import { AlertTriangle, BarChart3, Info } from "lucide-react";

export function AnalyticsPage() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
          <BarChart3 className="text-cyan-400" size={18} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Timeline &amp; Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Statistical charts detailing evidence distributions and timeline
            suspicious event peaks
          </p>
        </div>
      </div>

      {/* Prompt user to select a device */}
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center gap-4 border border-dashed border-white/10">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
          <Info className="text-cyan-400" size={24} />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">
            No Device Selected
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            Select a case and device from the sidebar to view live evidence
            distribution charts, activity trends, and forensic timeline data.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-amber-400/80 bg-amber-400/5 border border-amber-400/15 rounded-lg px-4 py-2">
          <AlertTriangle size={12} />
          All analytics are computed in real-time from actual extracted evidence
          — no static data is displayed.
        </div>
      </div>
    </div>
  );
}
