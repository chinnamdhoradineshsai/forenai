import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Crosshair,
  DatabaseZap,
  Download,
  ExternalLink,
  FileText,
  FolderSearch,
  Globe,
  Image as ImageIcon,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Music,
  Package,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Search,
  ShieldAlert,
  Signal,
  Smartphone,
  Video,
  Wifi,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import type { Page } from "../components/Sidebar";
import { evidenceService } from "../services/evidenceService";
import { mockFileService } from "../services/mockFileService";
import { webadbService } from "../services/webadbService";
import type {
  AppRecord,
  BrowserRecord,
  CallRecord,
  LocationRecord,
  MediaFile,
  SmsRecord,
} from "../types/evidence";

type EvidenceTab = "sms" | "calls" | "apps" | "media" | "browser" | "location";

const TABS: {
  id: EvidenceTab;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { id: "sms", label: "SMS", icon: MessageSquare, color: "#22d3ee" },
  { id: "calls", label: "Call Logs", icon: Phone, color: "#818cf8" },
  { id: "apps", label: "Installed Apps", icon: Smartphone, color: "#f472b6" },
  { id: "media", label: "Media Files", icon: Video, color: "#34d399" },
  { id: "browser", label: "Browser History", icon: Globe, color: "#fbbf24" },
  { id: "location", label: "Location Data", icon: MapPin, color: "#fb7185" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const keys = Object.keys(data[0]);
  const rows = [
    keys.join(","),
    ...data.map((row) =>
      keys
        .map((k) => `"${String(row[k] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SuspiciousBadge({ label = "SUSPICIOUS" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 flex-shrink-0">
      <AlertTriangle size={9} />
      {label}
    </span>
  );
}

function RecoveredBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/12 text-orange-400 border border-orange-500/20 flex-shrink-0">
      ✓ RECOVERED
    </span>
  );
}

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div
      className="grid gap-3 px-4 py-2.5 border-b border-white/8 sticky top-0 bg-[rgba(12,12,28,0.85)] backdrop-blur-sm z-10 rounded-t-xl"
      style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}
    >
      {cols.map((c) => (
        <span
          key={c}
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function TabToolbar({
  title,
  subtitle,
  accentColor,
  onExport,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  accentColor: string;
  onExport: () => void;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accentColor}15` }}
        >
          <Icon size={15} style={{ color: accentColor }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        data-ocid="evidence.export.button"
        onClick={onExport}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all hover:bg-white/5"
        style={{ borderColor: `${accentColor}30`, color: accentColor }}
      >
        <Download size={12} />
        Export CSV
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="py-16 text-center flex flex-col items-center gap-3"
      data-ocid="evidence.empty_state"
    >
      <DatabaseZap size={36} className="text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/60">
        Connect and extract a device to populate evidence.
      </p>
    </div>
  );
}

function EmptySearch() {
  return (
    <div className="py-10 text-center" data-ocid="evidence.empty_state">
      <Search size={32} className="text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">
        No records match your search
      </p>
    </div>
  );
}

// ── SMS Tab ───────────────────────────────────────────────────────────────────

function SmsTab({ records, query }: { records: SmsRecord[]; query: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      records.filter(
        (s) =>
          !query ||
          s.sender.toLowerCase().includes(query.toLowerCase()) ||
          s.phone.includes(query) ||
          s.content.toLowerCase().includes(query.toLowerCase()),
      ),
    [records, query],
  );

  if (records.length === 0) {
    return (
      <EmptyState message="No SMS records extracted from this device yet." />
    );
  }

  return (
    <div data-ocid="evidence.sms.list">
      <TabToolbar
        title="SMS Records"
        subtitle={`${filtered.length} messages · ${records.filter((s) => s.isSuspicious).length} flagged`}
        accentColor="#22d3ee"
        onExport={() =>
          exportToCSV(
            records.map(
              ({
                id,
                sender,
                phone,
                content,
                timestamp,
                direction,
                isSuspicious,
              }) => ({
                id,
                sender,
                phone,
                content,
                timestamp,
                direction,
                suspicious: isSuspicious,
              }),
            ),
            "forensic_sms.csv",
          )
        }
        icon={MessageSquare}
      />
      <div className="overflow-hidden rounded-xl border border-white/8 mt-4">
        <TableHeader
          cols={[
            "Direction",
            "Contact",
            "Number",
            "Preview",
            "Timestamp",
            "Status",
          ]}
        />
        <div className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <EmptySearch />
          ) : (
            filtered.map((sms: SmsRecord, i) => (
              <motion.div
                key={sms.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <button
                  type="button"
                  data-ocid={`evidence.sms.item.${i + 1}`}
                  className="grid gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors cursor-pointer group w-full text-left"
                  style={{
                    gridTemplateColumns: "80px 140px 140px 1fr 160px 100px",
                  }}
                  onClick={() =>
                    setExpanded(expanded === sms.id ? null : sms.id)
                  }
                >
                  <div className="flex items-center gap-1.5">
                    {sms.direction === "incoming" ? (
                      <ArrowDownLeft
                        size={14}
                        className="text-cyan-400 flex-shrink-0"
                      />
                    ) : (
                      <ArrowUpRight
                        size={14}
                        className="text-violet-400 flex-shrink-0"
                      />
                    )}
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background:
                          sms.direction === "incoming"
                            ? "rgba(34,211,238,0.12)"
                            : "rgba(129,140,248,0.12)",
                        color:
                          sms.direction === "incoming" ? "#22d3ee" : "#818cf8",
                      }}
                    >
                      {sms.direction === "incoming" ? "IN" : "OUT"}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-foreground truncate">
                    {sms.sender}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono truncate">
                    {sms.phone}
                  </span>
                  <span className="text-xs text-foreground/75 line-clamp-2 whitespace-normal break-words">
                    {sms.content}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {sms.timestamp}
                  </span>
                  <div className="flex items-center gap-1">
                    {sms.isRecovered ? (
                      <RecoveredBadge />
                    ) : sms.isSuspicious ? (
                      <SuspiciousBadge />
                    ) : null}
                    {expanded === sms.id ? (
                      <ChevronDown
                        size={12}
                        className="text-muted-foreground group-hover:text-foreground transition-colors"
                      />
                    ) : (
                      <ChevronRight
                        size={12}
                        className="text-muted-foreground group-hover:text-foreground transition-colors"
                      />
                    )}
                  </div>
                </button>
                <AnimatePresence>
                  {expanded === sms.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-cyan-950/20 border-t border-cyan-400/10">
                        <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-widest">
                          Full Message Content
                        </p>
                        <p className="text-sm text-foreground/90 leading-relaxed font-mono">
                          {sms.content}
                        </p>
                        {sms.isSuspicious && (
                          <div className="mt-2 flex items-center gap-2 text-red-400 text-[11px]">
                            <ShieldAlert size={12} />
                            Flagged by AI classifier as potentially suspicious
                            communication
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Call Logs Tab ─────────────────────────────────────────────────────────────

function CallsTab({
  records,
  query,
}: { records: CallRecord[]; query: string }) {
  const filtered = useMemo(
    () =>
      records.filter(
        (c) =>
          !query ||
          (c.caller || "").toLowerCase().includes(query.toLowerCase()) ||
          (c.number || "").includes(query),
      ),
    [records, query],
  );

  const CallIcon = ({ type }: { type: string }) => {
    if (type === "incoming")
      return <PhoneIncoming size={14} className="text-cyan-400" />;
    if (type === "outgoing")
      return <PhoneOutgoing size={14} className="text-violet-400" />;
    return <PhoneMissed size={14} className="text-red-400" />;
  };

  const typeStyle = (t: string) => ({
    background:
      t === "incoming"
        ? "rgba(34,211,238,0.12)"
        : t === "outgoing"
          ? "rgba(129,140,248,0.12)"
          : "rgba(239,68,68,0.12)",
    color:
      t === "incoming" ? "#22d3ee" : t === "outgoing" ? "#818cf8" : "#ef4444",
  });

  if (records.length === 0) {
    return (
      <EmptyState message="No call records extracted from this device yet." />
    );
  }

  return (
    <div data-ocid="evidence.calls.list">
      <TabToolbar
        title="Call Logs"
        subtitle={`${filtered.length} records · ${records.filter((c) => c.isSuspicious).length} suspicious`}
        accentColor="#818cf8"
        onExport={() =>
          exportToCSV(
            records.map(
              ({
                id,
                caller,
                number,
                duration,
                timestamp,
                callType,
                isSuspicious,
              }) => ({
                id,
                caller,
                number,
                duration,
                timestamp,
                type: callType,
                suspicious: isSuspicious,
              }),
            ),
            "forensic_calls.csv",
          )
        }
        icon={Phone}
      />
      <div className="overflow-hidden rounded-xl border border-white/8 mt-4">
        <TableHeader
          cols={[
            "Type",
            "Contact",
            "Number",
            "Duration",
            "Date & Time",
            "Flag",
          ]}
        />
        <div className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <EmptySearch />
          ) : (
            filtered.map((call: CallRecord, i) => (
              <motion.div
                key={call.id}
                data-ocid={`evidence.calls.item.${i + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="grid gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors"
                style={{
                  gridTemplateColumns: "80px 160px 1fr 110px 170px 110px",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <CallIcon type={call.callType || "incoming"} />
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={typeStyle(call.callType || "incoming")}
                  >
                    {(call.callType || "incoming").toUpperCase()}
                  </span>
                </div>
                <span className="text-xs font-semibold text-foreground truncate">
                  {call.caller}
                </span>
                <span className="text-xs text-muted-foreground font-mono truncate">
                  {call.number}
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: call.callType === "missed" ? "#ef4444" : "#22d3ee",
                  }}
                >
                  {call.duration}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {call.timestamp}
                </span>
                <div className="flex items-center gap-1">
                  {call.isRecovered ? (
                    <RecoveredBadge />
                  ) : call.isSuspicious ? (
                    <SuspiciousBadge />
                  ) : null}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Apps Tab ──────────────────────────────────────────────────────────────────

function AppsTab({ records, query }: { records: AppRecord[]; query: string }) {
  const filtered = useMemo(
    () =>
      records.filter(
        (a) =>
          !query ||
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.packageName.toLowerCase().includes(query.toLowerCase()),
      ),
    [records, query],
  );

  const sourceStyle = (s: string) => ({
    background:
      s === "Unknown APK"
        ? "rgba(239,68,68,0.12)"
        : s === "Google Play"
          ? "rgba(34,197,94,0.12)"
          : "rgba(129,140,248,0.12)",
    color:
      s === "Unknown APK"
        ? "#f87171"
        : s === "Google Play"
          ? "#4ade80"
          : "#818cf8",
  });

  if (records.length === 0) {
    return (
      <EmptyState message="No installed apps extracted from this device yet." />
    );
  }

  return (
    <div data-ocid="evidence.apps.list">
      <TabToolbar
        title="Installed Applications"
        subtitle={`${filtered.length} apps · ${records.filter((a) => a.isSuspicious).length} flagged suspicious`}
        accentColor="#f472b6"
        onExport={() =>
          exportToCSV(
            records.map(
              ({
                id,
                name,
                packageName,
                version,
                installDate,
                source,
                size,
                isSuspicious,
                permissions,
              }) => ({
                id,
                name,
                packageName,
                version,
                installDate,
                source,
                size,
                suspicious: isSuspicious,
                permissions: (permissions || []).join(" | "),
              }),
            ),
            "forensic_apps.csv",
          )
        }
        icon={Smartphone}
      />
      <div className="space-y-3 mt-4">
        {filtered.length === 0 ? (
          <EmptySearch />
        ) : (
          filtered.map((app: AppRecord, i) => (
            <motion.div
              key={app.id}
              data-ocid={`evidence.apps.item.${i + 1}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-xl border bg-white/3 hover:bg-white/5 transition-all ${app.isSuspicious ? "border-red-500/25" : "border-white/8"}`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-bold"
                    style={{
                      background: app.isSuspicious
                        ? "rgba(239,68,68,0.15)"
                        : "rgba(129,140,248,0.15)",
                      color: app.isSuspicious ? "#f87171" : "#818cf8",
                    }}
                  >
                    {(app.name || "?")[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">
                        {app.name}
                      </span>
                      {app.isSuspicious && <SuspiciousBadge />}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {app.packageName}
                    </span>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                  style={sourceStyle(app.source)}
                >
                  {app.source}
                </span>
              </div>
              <div className="flex gap-4 mt-3 text-[11px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Package size={11} />v{app.version}
                </span>
                <span>📦 {app.size}</span>
                <span>📅 Installed {app.installDate}</span>
                <span className="flex items-center gap-1">
                  <Lock size={11} />
                  {(app.permissions || []).length} permissions
                </span>
              </div>
              {(app.permissions || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(app.permissions || []).map((p) => (
                    <span
                      key={p}
                      className="text-[10px] px-2 py-0.5 rounded-md font-mono border"
                      style={{
                        background: app.isSuspicious
                          ? "rgba(251,146,60,0.1)"
                          : "rgba(255,255,255,0.05)",
                        borderColor: app.isSuspicious
                          ? "rgba(251,146,60,0.25)"
                          : "rgba(255,255,255,0.08)",
                        color: app.isSuspicious ? "#fb923c" : undefined,
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Media Tab ─────────────────────────────────────────────────────────────────

function MediaTab({
  records,
  query,
  onOpenFile,
}: {
  records: MediaFile[];
  query: string;
  onOpenFile: (fileName: string, filePath: string) => void;
}) {
  const filtered = useMemo(
    () =>
      records.filter(
        (f) =>
          !query ||
          f.name.toLowerCase().includes(query.toLowerCase()) ||
          f.path.toLowerCase().includes(query.toLowerCase()),
      ),
    [records, query],
  );

  const typeIconMap: Record<string, React.ElementType> = {
    image: ImageIcon,
    video: Video,
    audio: Music,
    document: FileText,
  };
  const typeColorMap: Record<string, string> = {
    image: "#22d3ee",
    video: "#818cf8",
    audio: "#34d399",
    document: "#fbbf24",
  };

  if (records.length === 0) {
    return (
      <EmptyState message="No media files extracted from this device yet." />
    );
  }

  return (
    <div data-ocid="evidence.media.list">
      <TabToolbar
        title="Media Files"
        subtitle={`${filtered.length} files · ${records.filter((f) => f.isHidden).length} hidden`}
        accentColor="#34d399"
        onExport={() =>
          exportToCSV(
            records.map(
              ({ id, name, fileType, size, createdAt, isHidden, path }) => ({
                id,
                name,
                type: fileType,
                size,
                createdAt,
                hidden: isHidden,
                path,
              }),
            ),
            "forensic_media.csv",
          )
        }
        icon={Video}
      />
      <div className="overflow-hidden rounded-xl border border-white/8 mt-4">
        <TableHeader
          cols={["Type", "Filename", "Size", "Created", "Path", "Status"]}
        />
        <div className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <EmptySearch />
          ) : (
            filtered.map((file: MediaFile, i) => {
              const Icon = typeIconMap[file.fileType || "document"] || FileText;
              const color =
                typeColorMap[file.fileType || "document"] || "#fbbf24";
              return (
                <motion.div
                  key={file.id}
                  data-ocid={`evidence.media.item.${i + 1}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`grid gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors ${file.isHidden ? "bg-red-950/10" : ""}`}
                  style={{
                    gridTemplateColumns: "70px 1fr 80px 160px 1fr 100px",
                  }}
                >
                  <div className="flex items-center">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${color}15` }}
                    >
                      <Icon size={14} style={{ color }} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenFile(file.name, file.path)}
                    className="text-xs font-medium text-cyan-400 hover:underline hover:text-cyan-300 truncate flex items-center bg-transparent border-0 p-0 cursor-pointer text-left"
                  >
                    {file.name}
                  </button>
                  <span className="text-xs text-muted-foreground flex items-center">
                    {file.size}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center">
                    {file.createdAt}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono truncate flex items-center">
                    {file.path}
                  </span>
                  <div className="flex items-center">
                    {file.isRecovered ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 animate-pulse">
                        ✓ RECOVERED
                      </span>
                    ) : file.isHidden ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
                        HIDDEN
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/6 text-muted-foreground">
                        NORMAL
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Browser Tab ───────────────────────────────────────────────────────────────

function BrowserTab({
  records,
  query,
}: { records: BrowserRecord[]; query: string }) {
  const filtered = useMemo(
    () =>
      records.filter(
        (r) =>
          !query ||
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.url.toLowerCase().includes(query.toLowerCase()),
      ),
    [records, query],
  );

  if (records.length === 0) {
    return (
      <EmptyState message="No browser history extracted from this device yet." />
    );
  }

  return (
    <div data-ocid="evidence.browser.list">
      <TabToolbar
        title="Browser History"
        subtitle={`${filtered.length} entries · ${records.filter((r) => r.isSuspicious).length} flagged`}
        accentColor="#fbbf24"
        onExport={() =>
          exportToCSV(
            records.map(
              ({
                id,
                url,
                title,
                visitCount,
                lastVisited,
                browser,
                isSuspicious,
              }) => ({
                id,
                title,
                url,
                visitCount: Number(visitCount),
                lastVisited,
                browser,
                suspicious: isSuspicious,
              }),
            ),
            "forensic_browser.csv",
          )
        }
        icon={Globe}
      />
      <div className="overflow-hidden rounded-xl border border-white/8 mt-4">
        <TableHeader
          cols={[
            "Browser",
            "Page Title",
            "URL",
            "Visits",
            "Last Visited",
            "Flag",
          ]}
        />
        <div className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <EmptySearch />
          ) : (
            filtered.map((rec: BrowserRecord, i) => (
              <motion.div
                key={rec.id}
                data-ocid={`evidence.browser.item.${i + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`grid gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors ${rec.isSuspicious ? "bg-amber-950/10" : ""}`}
                style={{
                  gridTemplateColumns: "100px 1fr 1fr 70px 160px 110px",
                }}
              >
                <div className="flex items-center">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      background: rec.isSuspicious
                        ? "rgba(251,191,36,0.12)"
                        : "rgba(255,255,255,0.06)",
                      color: rec.isSuspicious ? "#fbbf24" : undefined,
                    }}
                  >
                    <Globe size={13} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-foreground truncate flex items-center">
                  {rec.title}
                </span>
                <div className="flex items-center gap-1 min-w-0">
                  <ExternalLink
                    size={10}
                    className="text-cyan-500 flex-shrink-0"
                  />
                  <span className="text-[11px] text-cyan-400/80 font-mono truncate">
                    {rec.url}
                  </span>
                </div>
                <span
                  className="text-xs font-bold flex items-center"
                  style={{
                    color: Number(rec.visitCount) > 5 ? "#f87171" : "#22d3ee",
                  }}
                >
                  {Number(rec.visitCount)}×
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center">
                  {rec.lastVisited}
                </span>
                <div className="flex items-center">
                  {rec.isSuspicious ? <SuspiciousBadge /> : null}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Location Tab ──────────────────────────────────────────────────────────────

function LocationTab({
  records,
  query,
}: { records: LocationRecord[]; query: string }) {
  const filtered = useMemo(
    () =>
      records.filter(
        (l) =>
          !query ||
          l.address.toLowerCase().includes(query.toLowerCase()) ||
          String(l.lat).includes(query) ||
          String(l.lng).includes(query),
      ),
    [records, query],
  );

  const sourceIcon = (s: string) => {
    if (s === "GPS" || s === "GPS Provider")
      return <Crosshair size={12} className="text-cyan-400" />;
    if (s === "Wi-Fi") return <Wifi size={12} className="text-violet-400" />;
    return <Signal size={12} className="text-amber-400" />;
  };

  if (records.length === 0) {
    return (
      <EmptyState message="No location data extracted from this device yet." />
    );
  }

  return (
    <div data-ocid="evidence.location.list">
      <TabToolbar
        title="Location Data"
        subtitle={`${filtered.length} records extracted from GPS & network sources`}
        accentColor="#fb7185"
        onExport={() =>
          exportToCSV(
            records.map(
              ({ id, lat, lng, address, timestamp, accuracy, source }) => ({
                id,
                lat,
                lng,
                address,
                timestamp,
                accuracyMeters: Number(accuracy),
                source,
              }),
            ),
            "forensic_location.csv",
          )
        }
        icon={MapPin}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {filtered.length === 0 ? (
          <EmptySearch />
        ) : (
          filtered.map((loc: LocationRecord, i) => (
            <motion.div
              key={loc.id}
              data-ocid={`evidence.location.item.${i + 1}`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              className="p-4 rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-pink-500/15">
                  <MapPin size={16} className="text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {loc.address}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {loc.timestamp}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { label: "Latitude", value: Number(loc.lat).toFixed(4) },
                  { label: "Longitude", value: Number(loc.lng).toFixed(4) },
                  { label: "Accuracy", value: `±${Number(loc.accuracy)}m` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-2 rounded-lg bg-white/5 border border-white/8"
                  >
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-xs font-bold text-foreground font-mono">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
                {sourceIcon(loc.source)}
                <span>Source: {loc.source}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface EvidenceViewerPageProps {
  deviceId: string;
  onNavigate?: (page: Page) => void;
}

export function EvidenceViewerPage({
  deviceId,
  onNavigate,
}: EvidenceViewerPageProps) {
  const { actor } = useActor(createActor);
  const [activeTab, setActiveTab] = useState<EvidenceTab>("sms");
  const [query, setQuery] = useState("");

  // Media preview state
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    url: string;
    type: "image" | "video" | "audio" | "document" | "text";
    isMock?: boolean;
  } | null>(null);
  const [textContent, setTextContent] = useState<string>("");
  const [loadingText, setLoadingText] = useState(false);

  // Dynamic data from evidenceService — same as EvidencePage
  const { data: sms = [], isLoading: loadingSms } = useQuery({
    queryKey: ["sms", deviceId, !!actor],
    queryFn: () => evidenceService.getSmsRecords(deviceId, actor),
    enabled: !!deviceId,
  });

  const { data: calls = [], isLoading: loadingCalls } = useQuery({
    queryKey: ["calls", deviceId, !!actor],
    queryFn: () => evidenceService.getCallRecords(deviceId, actor),
    enabled: !!deviceId,
  });

  const { data: apps = [], isLoading: loadingApps } = useQuery({
    queryKey: ["apps", deviceId, !!actor],
    queryFn: () => evidenceService.getAppRecords(deviceId, actor),
    enabled: !!deviceId,
  });

  const { data: media = [], isLoading: loadingMedia } = useQuery({
    queryKey: ["media", deviceId, !!actor],
    queryFn: () => evidenceService.getMediaFiles(deviceId, actor),
    enabled: !!deviceId,
  });

  const { data: browser = [], isLoading: loadingBrowser } = useQuery({
    queryKey: ["browser", deviceId, !!actor],
    queryFn: () => evidenceService.getBrowserRecords(deviceId, actor),
    enabled: !!deviceId,
  });

  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ["locations", deviceId, !!actor],
    queryFn: () => evidenceService.getLocationRecords(deviceId, actor),
    enabled: !!deviceId,
  });

  const isLoading =
    loadingSms ||
    loadingCalls ||
    loadingApps ||
    loadingMedia ||
    loadingBrowser ||
    loadingLocations;

  const totalItems =
    sms.length +
    calls.length +
    apps.length +
    media.length +
    browser.length +
    locations.length;

  const TABS_WITH_COUNTS = TABS.map((tab) => ({
    ...tab,
    count:
      tab.id === "sms"
        ? sms.length
        : tab.id === "calls"
          ? calls.length
          : tab.id === "apps"
            ? apps.length
            : tab.id === "media"
              ? media.length
              : tab.id === "browser"
                ? browser.length
                : locations.length,
  }));

  const handleOpenFile = async (fileName: string, filePath: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    let type: "image" | "video" | "audio" | "document" | "text" = "document";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || ""))
      type = "image";
    else if (["mp4", "webm", "ogg", "mkv", "3gp"].includes(ext || ""))
      type = "video";
    else if (["mp3", "wav", "m4a", "aac"].includes(ext || "")) type = "audio";
    else if (["txt", "tmp", "log", "json", "xml", "csv"].includes(ext || ""))
      type = "text";

    const fullPath = filePath + fileName;
    const toastId = toast.loading(
      `Pulling "${fileName}" from live USB device...`,
    );
    let fileUrl = "";
    let isMock = false;
    try {
      const blob = await webadbService.pullFileFromDevice(fullPath);
      if (blob) {
        toast.success(`Successfully pulled "${fileName}" from device!`, {
          id: toastId,
        });
        fileUrl = URL.createObjectURL(blob);
      } else {
        toast.info("Device disconnected. Generating dynamic mock file.", {
          id: toastId,
        });
        fileUrl = mockFileService.getDynamicFileUrl(fileName, type);
        isMock = true;
      }
    } catch (err) {
      console.error("Error pulling file:", err);
      toast.error("Failed to read file. Generating dynamic mock file.", {
        id: toastId,
      });
      fileUrl = mockFileService.getDynamicFileUrl(fileName, type);
      isMock = true;
    }

    setPreviewFile({ name: fileName, url: fileUrl, type, isMock });
    if (type === "text" || (isMock && (type === "audio" || type === "video"))) {
      setLoadingText(true);
      setTextContent("");
      try {
        const response = await fetch(fileUrl);
        const text = await response.text();
        setTextContent(text);
      } catch {
        setTextContent("Error: Failed to load dynamic file content.");
      } finally {
        setLoadingText(false);
      }
    }
  };

  const activeTabMeta = TABS_WITH_COUNTS.find((t) => t.id === activeTab)!;

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-cyan-400/10 border border-cyan-400/20">
            <FolderSearch size={22} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Evidence Viewer
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {deviceId
                ? `Live extracted forensic evidence for device: ${deviceId}`
                : "Select a device to view evidence"}
            </p>
          </div>
        </div>
        {!deviceId ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/20 bg-amber-950/10">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-xs text-amber-400 font-semibold">
              No device selected
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-sm font-bold text-foreground">
                {isLoading ? "—" : totalItems}
              </span>
              <span className="text-xs text-muted-foreground">
                total items extracted
              </span>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("whatsapp")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:text-white transition-all border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/70 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
              >
                <MessageSquare size={13} />
                WhatsApp Analysis
              </button>
            )}
          </div>
        )}
      </motion.div>

      {!deviceId ? (
        <div className="glass-card p-16 text-center flex flex-col items-center gap-4">
          <FolderSearch size={48} className="text-muted-foreground/30" />
          <p className="text-base font-semibold text-muted-foreground">
            No Device Selected
          </p>
          <p className="text-sm text-muted-foreground/70">
            Please go to <strong>Cases → Devices</strong>, select your device,
            and run extraction first.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-cyan-400" size={32} />
            <p className="text-sm text-muted-foreground">
              Loading extracted evidence...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Search + Tab Row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            {/* Tab Strip */}
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              data-ocid="evidence.tab_strip"
            >
              {TABS_WITH_COUNTS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-ocid={`evidence.${tab.id}.tab`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setQuery("");
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                      active
                        ? "shadow-md"
                        : "border-white/8 text-muted-foreground hover:bg-white/5 hover:text-foreground hover:border-white/15"
                    }`}
                    style={
                      active
                        ? {
                            background: `${tab.color}10`,
                            borderColor: `${tab.color}30`,
                            color: tab.color,
                            boxShadow: `0 0 16px ${tab.color}20`,
                          }
                        : {}
                    }
                  >
                    <Icon size={13} />
                    {tab.label}
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                      style={{
                        background: active
                          ? `${tab.color}25`
                          : "rgba(255,255,255,0.07)",
                        color: active ? tab.color : undefined,
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                data-ocid="evidence.search_input"
                type="text"
                placeholder={`Search ${activeTabMeta.label}…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-9 bg-white/5 border-white/12 text-sm placeholder:text-muted-foreground/50 focus:border-cyan-400/40 focus:ring-cyan-400/20"
              />
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="glass-card p-5"
            >
              {activeTab === "sms" && <SmsTab records={sms} query={query} />}
              {activeTab === "calls" && (
                <CallsTab records={calls} query={query} />
              )}
              {activeTab === "apps" && <AppsTab records={apps} query={query} />}
              {activeTab === "media" && (
                <MediaTab
                  records={media}
                  query={query}
                  onOpenFile={handleOpenFile}
                />
              )}
              {activeTab === "browser" && (
                <BrowserTab records={browser} query={query} />
              )}
              {activeTab === "location" && (
                <LocationTab records={locations} query={query} />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {/* Media & Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setPreviewFile(null)}
          />
          <div className="relative w-full max-w-3xl glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-white/[0.02] backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  {previewFile.type === "image" && (
                    <ImageIcon className="text-cyan-400" size={16} />
                  )}
                  {previewFile.type === "video" && (
                    <Video className="text-indigo-400" size={16} />
                  )}
                  {previewFile.type === "audio" && (
                    <Music className="text-emerald-400" size={16} />
                  )}
                  {(previewFile.type === "document" ||
                    previewFile.type === "text") && (
                    <FileText className="text-amber-400" size={16} />
                  )}
                </div>
                <div className="truncate text-left">
                  <h3 className="text-xs font-bold text-foreground truncate">
                    {previewFile.name}
                  </h3>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                    {previewFile.type} preview
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/8 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center min-h-[300px] bg-slate-950/20">
              {previewFile.type === "image" && (
                <div className="relative max-h-[50vh] flex items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-black/30">
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-w-full max-h-[50vh] object-contain transition-transform duration-300"
                  />
                </div>
              )}
              {(previewFile.type === "audio" || previewFile.type === "video") &&
              previewFile.isMock ? (
                <div className="w-full flex-1 flex flex-col min-h-[350px]">
                  {loadingText ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                      <Loader2
                        className="animate-spin text-cyan-400"
                        size={20}
                      />
                      Loading forensic stream description...
                    </div>
                  ) : (
                    <div className="flex-1 rounded-xl border border-white/8 bg-black/40 p-4 font-mono text-left text-xs overflow-auto max-h-[45vh] leading-relaxed text-cyan-300/90 shadow-inner select-text w-full">
                      <pre className="whitespace-pre-wrap">
                        {textContent || "No stream details available."}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {previewFile.type === "video" && (
                    <div className="w-full max-h-[50vh] overflow-hidden rounded-lg border border-white/5 bg-black/40 shadow-inner">
                      <video
                        src={previewFile.url}
                        controls
                        autoPlay
                        className="w-full max-h-[50vh] object-contain"
                      />
                    </div>
                  )}
                  {previewFile.type === "audio" && (
                    <div className="w-full py-10 px-8 flex flex-col items-center gap-6 rounded-xl border border-white/8 bg-white/[0.01]">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 animate-pulse">
                        <Music className="text-emerald-400" size={28} />
                      </div>
                      <div className="w-full max-w-md">
                        <audio
                          src={previewFile.url}
                          controls
                          autoPlay
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-1 items-center justify-center">
                        {Array.from({ length: 15 }).map((_, idx) => (
                          <span
                            key={idx}
                            className="w-1 rounded-full bg-emerald-400/40 animate-bounce"
                            style={{
                              height: `${8 + Math.sin(idx) * 16}px`,
                              animationDelay: `${idx * 0.08}s`,
                              animationDuration: "1.2s",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {previewFile.type === "text" && (
                <div className="w-full flex-1 flex flex-col min-h-[350px]">
                  {loadingText ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                      <Loader2
                        className="animate-spin text-cyan-400"
                        size={20}
                      />
                      Loading text log files...
                    </div>
                  ) : (
                    <div className="flex-1 rounded-xl border border-white/8 bg-black/40 p-4 font-mono text-left text-xs overflow-auto max-h-[45vh] leading-relaxed text-cyan-300/90 shadow-inner select-text w-full">
                      <pre className="whitespace-pre-wrap">
                        {textContent || "No content found inside this file."}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              {previewFile.type === "document" && (
                <div className="w-full h-[50vh] rounded-lg overflow-hidden border border-white/8 bg-white/5">
                  <iframe
                    src={previewFile.url}
                    title={previewFile.name}
                    className="w-full h-full border-0"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/8 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/8 text-foreground hover:bg-white/10 transition-all cursor-pointer"
              >
                Close Preview
              </button>
              <a
                href={previewFile.url}
                download={previewFile.name}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20"
                style={{
                  background: "linear-gradient(135deg, #0ea5e9, #22d3ee)",
                }}
              >
                <Download size={13} />
                Download File
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
