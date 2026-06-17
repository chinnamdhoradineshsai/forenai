import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Globe,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Smartphone,
  Video,
  X,
  Music,
  FileText,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import { EvidenceCard } from "../components/EvidenceCard";
import { EvidenceTable } from "../components/EvidenceTable";
import type { Page } from "../components/Sidebar";
import { evidenceService } from "../services/evidenceService";
import { webadbService } from "../services/webadbService";

type Tab = "sms" | "calls" | "apps" | "media" | "browser" | "location";

interface EvidencePageProps {
  caseId: string;
  deviceId: string;
  onNavigate: (page: Page) => void;
}

export function EvidencePage({
  caseId,
  deviceId,
  onNavigate,
}: EvidencePageProps) {
  const { actor } = useActor(createActor);
  const [activeTab, setActiveTab] = useState<Tab>("sms");
  const [search, setSearch] = useState("");

  const [previewFile, setPreviewFile] = useState<{
    name: string;
    url: string;
    type: "image" | "video" | "audio" | "document" | "text";
  } | null>(null);
  const [textContent, setTextContent] = useState<string>("");
  const [loadingText, setLoadingText] = useState(false);

  const handleOpenFile = async (fileName: string, filePath: string) => {
    const fullPath = filePath + fileName;
    const toastId = toast.loading(
      `Pulling "${fileName}" from live USB device...`,
    );

    let fileUrl = "";
    try {
      const blob = await webadbService.pullFileFromDevice(fullPath);
      if (blob) {
        toast.success(`Successfully pulled "${fileName}" from device!`, {
          id: toastId,
        });
        fileUrl = URL.createObjectURL(blob);
      } else {
        toast.info("Device disconnected. Opening cached local file.", {
          id: toastId,
        });
        fileUrl = `/uploads/evidence/${fileName}`;
      }
    } catch (err) {
      console.error("Error pulling file:", err);
      toast.error("Failed to read file. Opening cached local file.", {
        id: toastId,
      });
      fileUrl = `/uploads/evidence/${fileName}`;
    }

    // Determine type
    const ext = fileName.split(".").pop()?.toLowerCase();
    let type: "image" | "video" | "audio" | "document" | "text" = "document";

    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
      type = "image";
    } else if (["mp4", "webm", "ogg", "mkv", "3gp"].includes(ext || "")) {
      type = "video";
    } else if (["mp3", "wav", "m4a", "aac", "ogg"].includes(ext || "")) {
      type = "audio";
    } else if (["txt", "tmp", "log", "json", "xml", "csv"].includes(ext || "")) {
      type = "text";
    }

    setPreviewFile({ name: fileName, url: fileUrl, type });

    if (type === "text") {
      setLoadingText(true);
      setTextContent("");
      try {
        const response = await fetch(fileUrl);
        const text = await response.text();
        setTextContent(text);
      } catch (err) {
        setTextContent("Error: Failed to load text file content.");
      } finally {
        setLoadingText(false);
      }
    }
  };

  // Queries for each type of evidence using evidenceService
  const { data: sms = [], isLoading: loadingSms } = useQuery({
    queryKey: ["sms", deviceId, !!actor],
    queryFn: () => evidenceService.getSmsRecords(deviceId, actor),
  });

  const { data: calls = [], isLoading: loadingCalls } = useQuery({
    queryKey: ["calls", deviceId, !!actor],
    queryFn: () => evidenceService.getCallRecords(deviceId, actor),
  });

  const { data: apps = [], isLoading: loadingApps } = useQuery({
    queryKey: ["apps", deviceId, !!actor],
    queryFn: () => evidenceService.getAppRecords(deviceId, actor),
  });

  const { data: media = [], isLoading: loadingMedia } = useQuery({
    queryKey: ["media", deviceId, !!actor],
    queryFn: () => evidenceService.getMediaFiles(deviceId, actor),
  });

  const { data: browser = [], isLoading: loadingBrowser } = useQuery({
    queryKey: ["browser", deviceId, !!actor],
    queryFn: () => evidenceService.getBrowserRecords(deviceId, actor),
  });

  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ["locations", deviceId, !!actor],
    queryFn: () => evidenceService.getLocationRecords(deviceId, actor),
  });

  const isLoading =
    loadingSms ||
    loadingCalls ||
    loadingApps ||
    loadingMedia ||
    loadingBrowser ||
    loadingLocations;

  // Recovery toggle check
  const isRecoveryEnabled = useMemo(
    () => localStorage.getItem("forenai_data_recovery_enabled") === "true",
    [],
  );

  // Filtered lists
  const filteredSms = useMemo(() => {
    let list = sms;
    if (!isRecoveryEnabled) {
      list = list.filter((s) => !s.isRecovered);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.sender.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.content.toLowerCase().includes(q),
      );
    }
    return list;
  }, [sms, isRecoveryEnabled, search]);

  const filteredCalls = useMemo(() => {
    let list = calls;
    if (!isRecoveryEnabled) {
      list = list.filter((c) => !c.isRecovered);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.caller.toLowerCase().includes(q) || c.number.includes(q),
      );
    }
    return list;
  }, [calls, isRecoveryEnabled, search]);

  const filteredApps = useMemo(() => {
    let list = apps;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.packageName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [apps, search]);

  const filteredMedia = useMemo(() => {
    let list = media;
    if (!isRecoveryEnabled) {
      list = list.filter((m) => !m.isRecovered);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) || m.path.toLowerCase().includes(q),
      );
    }
    return list;
  }, [media, isRecoveryEnabled, search]);

  const filteredBrowser = useMemo(() => {
    let list = browser;
    if (!isRecoveryEnabled) {
      list = list.filter((b) => !b.isRecovered);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q),
      );
    }
    return list;
  }, [browser, isRecoveryEnabled, search]);

  const filteredLocations = useMemo(() => {
    let list = locations;
    if (!isRecoveryEnabled) {
      list = list.filter((l) => !l.isRecovered);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.address.toLowerCase().includes(q));
    }
    return list;
  }, [locations, isRecoveryEnabled, search]);

  // Calculate hidden deleted files count
  const hiddenCount = useMemo(() => {
    if (isRecoveryEnabled) return 0;
    const deletedSms = sms.filter((s) => s.isRecovered).length;
    const deletedCalls = calls.filter((c) => c.isRecovered).length;
    const deletedMedia = media.filter((m) => m.isRecovered).length;
    const deletedBrowser = browser.filter((b) => b.isRecovered).length;
    const deletedLocations = locations.filter((l) => l.isRecovered).length;
    return (
      deletedSms +
      deletedCalls +
      deletedMedia +
      deletedBrowser +
      deletedLocations
    );
  }, [sms, calls, media, browser, locations, isRecoveryEnabled]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Evidence Browser
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Browse and inspect parsed artifacts from target file partitions
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search active tab..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Hidden Recovery Warnings Banner */}
      {hiddenCount > 0 && !isRecoveryEnabled && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border border-orange-500/20 bg-orange-950/10 text-xs text-orange-400 gap-4 shadow-[0_0_15px_rgba(249,115,22,0.05)] animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertTriangle
              size={16}
              className="text-orange-400 flex-shrink-0"
            />
            <span>
              <strong>Carved Data Alert:</strong> {hiddenCount} recovered
              deleted items (SMS, call logs, media files) have been carved from
              raw device storage blocks but are hidden. Enable **Forensic Data
              Recovery** in configurations to view.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className="px-3.5 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 font-bold transition-all text-[11px] whitespace-nowrap cursor-pointer"
          >
            Enable Data Recovery
          </button>
        </div>
      )}

      {/* Grid Summaries */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <EvidenceCard
          label="SMS"
          count={filteredSms.length}
          icon={MessageSquare}
          color="#22d3ee"
          onClick={() => setActiveTab("sms")}
        />
        <EvidenceCard
          label="Calls"
          count={filteredCalls.length}
          icon={Phone}
          color="#818cf8"
          onClick={() => setActiveTab("calls")}
        />
        <EvidenceCard
          label="Apps"
          count={filteredApps.length}
          icon={Smartphone}
          color="#f472b6"
          onClick={() => setActiveTab("apps")}
        />
        <EvidenceCard
          label="Media"
          count={filteredMedia.length}
          icon={Video}
          color="#34d399"
          onClick={() => setActiveTab("media")}
        />
        <EvidenceCard
          label="Browser"
          count={filteredBrowser.length}
          icon={Globe}
          color="#fbbf24"
          onClick={() => setActiveTab("browser")}
        />
        <EvidenceCard
          label="Locations"
          count={filteredLocations.length}
          icon={MapPin}
          color="#fb7185"
          onClick={() => setActiveTab("location")}
        />
      </div>

      {/* Dynamic Tab Browser */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-cyan-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === "sms" && (
            <EvidenceTable
              headers={[
                "Direction",
                "Contact",
                "Number",
                "Message Content",
                "Timestamp",
                "Status/Flag",
              ]}
              gridTemplateColumns="80px 140px 140px 1fr 160px 110px"
            >
              {filteredSms.map((s) => (
                <div
                  key={s.id}
                  className={`grid gap-3 px-4 py-3.5 hover:bg-white/3 text-xs text-foreground items-center ${s.isRecovered ? "border-l-2 border-orange-500/60 bg-orange-950/[0.02]" : ""}`}
                  style={{
                    gridTemplateColumns: "80px 140px 140px 1fr 160px 110px",
                  }}
                >
                  <span className="font-bold text-cyan-400">
                    {s.direction.toUpperCase()}
                  </span>
                  <span className="font-semibold">{s.sender}</span>
                  <span className="font-mono text-muted-foreground">
                    {s.phone}
                  </span>
                  <span className="truncate">{s.content}</span>
                  <span className="text-muted-foreground">{s.timestamp}</span>
                  <span>
                    {s.isRecovered ? (
                      <span className="text-[9px] font-bold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        ✓ RECOVERED
                      </span>
                    ) : s.isSuspicious ? (
                      <span className="text-[9px] font-bold text-red-400 bg-red-500/15 border border-red-500/25 px-2 py-0.5 rounded-full">
                        FLAGGED
                      </span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground">
                        CLEAN
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </EvidenceTable>
          )}

          {activeTab === "calls" && (
            <EvidenceTable
              headers={[
                "Type",
                "Contact",
                "Number",
                "Duration",
                "Timestamp",
                "Status/Flag",
              ]}
              gridTemplateColumns="80px 140px 1fr 110px 170px 110px"
            >
              {filteredCalls.map((c) => (
                <div
                  key={c.id}
                  className={`grid gap-3 px-4 py-3.5 hover:bg-white/3 text-xs text-foreground items-center ${c.isRecovered ? "border-l-2 border-orange-500/60 bg-orange-950/[0.02]" : ""}`}
                  style={{
                    gridTemplateColumns: "80px 140px 1fr 110px 170px 110px",
                  }}
                >
                  <span className="font-bold text-violet-400">
                    {c.callType.toUpperCase()}
                  </span>
                  <span className="font-semibold">{c.caller}</span>
                  <span className="font-mono text-muted-foreground">
                    {c.number}
                  </span>
                  <span>{c.duration}</span>
                  <span className="text-muted-foreground">{c.timestamp}</span>
                  <span>
                    {c.isRecovered ? (
                      <span className="text-[9px] font-bold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        ✓ RECOVERED
                      </span>
                    ) : c.isSuspicious ? (
                      <span className="text-[9px] font-bold text-red-400 bg-red-500/15 border border-red-500/25 px-2 py-0.5 rounded-full">
                        SUSPICIOUS
                      </span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground">
                        NORMAL
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </EvidenceTable>
          )}

          {activeTab === "apps" && (
            <div className="space-y-4">
              {filteredApps.map((a) => (
                <div
                  key={a.id}
                  className={`p-4 rounded-xl border bg-white/[0.01] hover:bg-white/[0.03] space-y-3 ${a.isSuspicious ? "border-red-500/25" : "border-white/8"}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        {a.name}
                        {a.isSuspicious && (
                          <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full">
                            SUSPICIOUS APK
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {a.packageName}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 border border-white/8">
                      {a.source}
                    </span>
                  </div>
                  <div className="flex gap-4 text-[10px] text-muted-foreground font-mono">
                    <span>Version: {a.version}</span>
                    <span>Size: {a.size}</span>
                    <span>Date: {a.installDate}</span>
                  </div>
                  {a.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {a.permissions.map((p) => (
                        <span
                          key={p}
                          className="text-[9px] font-mono border border-white/5 bg-white/5 px-2 py-0.5 rounded text-muted-foreground"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "media" && (
            <EvidenceTable
              headers={[
                "Type",
                "Name",
                "Size",
                "Created",
                "Directory Path",
                "Status",
              ]}
              gridTemplateColumns="70px 1fr 80px 160px 1fr 110px"
            >
              {filteredMedia.map((f) => (
                <div
                  key={f.id}
                  className={`grid gap-3 px-4 py-3.5 hover:bg-white/3 text-xs text-foreground items-center ${f.isRecovered ? "border-l-2 border-orange-500/60 bg-orange-950/[0.02]" : ""}`}
                  style={{
                    gridTemplateColumns: "70px 1fr 80px 160px 1fr 110px",
                  }}
                >
                  <span className="font-bold text-emerald-400 uppercase">
                    {f.fileType}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenFile(f.name, f.path)}
                    className="font-semibold truncate text-cyan-400 hover:underline hover:text-cyan-300 text-left bg-transparent border-0 p-0 cursor-pointer"
                  >
                    {f.name}
                  </button>
                  <span className="text-muted-foreground">{f.size}</span>
                  <span className="text-muted-foreground">{f.createdAt}</span>
                  <span className="font-mono text-muted-foreground truncate">
                    {f.path}
                  </span>
                  <span>
                    {f.isRecovered ? (
                      <span className="text-[9px] font-bold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.15)] animate-pulse">
                        ✓ RECOVERED
                      </span>
                    ) : f.isHidden ? (
                      <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full">
                        CONCEALED
                      </span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground">
                        STANDARD
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </EvidenceTable>
          )}

          {activeTab === "browser" && (
            <EvidenceTable
              headers={[
                "Browser",
                "Title",
                "URL Link",
                "Visits",
                "Timestamp",
                "Flag",
              ]}
              gridTemplateColumns="110px 1fr 1fr 70px 160px 110px"
            >
              {filteredBrowser.map((b) => (
                <div
                  key={b.id}
                  className={`grid gap-3 px-4 py-3.5 hover:bg-white/3 text-xs text-foreground items-center ${b.isRecovered ? "border-l-2 border-orange-500/60 bg-orange-950/[0.02]" : ""}`}
                  style={{
                    gridTemplateColumns: "110px 1fr 1fr 70px 160px 110px",
                  }}
                >
                  <span className="font-mono text-amber-400">{b.browser}</span>
                  <span className="font-semibold truncate">{b.title}</span>
                  <span className="font-mono text-muted-foreground truncate hover:text-cyan-300">
                    {b.url}
                  </span>
                  <span>{Number(b.visitCount)}</span>
                  <span className="text-muted-foreground">{b.lastVisited}</span>
                  <span>
                    {b.isRecovered ? (
                      <span className="text-[9px] font-bold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        ✓ RECOVERED
                      </span>
                    ) : b.isSuspicious ? (
                      <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full">
                        SUSPICIOUS
                      </span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground">
                        CLEAN
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </EvidenceTable>
          )}

          {activeTab === "location" && (
            <EvidenceTable
              headers={[
                "Source",
                "Coordinates",
                "Address Location",
                "Timestamp",
                "Accuracy",
                "Status",
              ]}
              gridTemplateColumns="100px 160px 1fr 160px 80px 110px"
            >
              {filteredLocations.map((l) => (
                <div
                  key={l.id}
                  className={`grid gap-3 px-4 py-3.5 hover:bg-white/3 text-xs text-foreground items-center ${l.isRecovered ? "border-l-2 border-orange-500/60 bg-orange-950/[0.02]" : ""}`}
                  style={{
                    gridTemplateColumns: "100px 160px 1fr 160px 80px 110px",
                  }}
                >
                  <span className="font-bold text-pink-400">{l.source}</span>
                  <span className="font-mono">
                    {l.lat.toFixed(4)}, {l.lng.toFixed(4)}
                  </span>
                  <span className="truncate">{l.address}</span>
                  <span className="text-muted-foreground">{l.timestamp}</span>
                  <span>{Number(l.accuracy)}m</span>
                  <span>
                    {l.isRecovered ? (
                      <span className="text-[9px] font-bold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        ✓ RECOVERED
                      </span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground font-mono">
                        CELL/GPS
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </EvidenceTable>
          )}
        </div>
      )}

      {/* Media & Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setPreviewFile(null)}
          />
          <div className="relative w-full max-w-3xl glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-white/[0.02] backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  {previewFile.type === "image" && <ImageIcon className="text-cyan-400" size={16} />}
                  {previewFile.type === "video" && <Video className="text-indigo-400" size={16} />}
                  {previewFile.type === "audio" && <Music className="text-emerald-400" size={16} />}
                  {(previewFile.type === "document" || previewFile.type === "text") && <FileText className="text-amber-400" size={16} />}
                </div>
                <div className="truncate text-left">
                  <h3 className="text-xs font-bold text-foreground truncate">{previewFile.name}</h3>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{previewFile.type} preview</span>
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

            {/* Content Body */}
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
                          height: `${8 + Math.sin(idx + Date.now() / 1000) * 16}px`,
                          animationDelay: `${idx * 0.08}s`,
                          animationDuration: "1.2s",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {previewFile.type === "text" && (
                <div className="w-full flex-1 flex flex-col min-h-[350px]">
                  {loadingText ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                      <Loader2 className="animate-spin text-cyan-400" size={20} />
                      Loading text log files...
                    </div>
                  ) : (
                    <div className="flex-1 rounded-xl border border-white/8 bg-black/40 p-4 font-mono text-left text-xs overflow-auto max-h-[45vh] leading-relaxed text-cyan-300/90 shadow-inner select-text w-full">
                      <pre className="whitespace-pre-wrap">{textContent || "No content found inside this file."}</pre>
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

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/8 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/8 text-foreground hover:bg-white/10 hover:text-foreground transition-all cursor-pointer"
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
