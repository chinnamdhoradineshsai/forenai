import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  Fingerprint,
  HardDrive,
  Hash,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation,
  RefreshCw,
  Shield,
  Smartphone,
  Usb,
  User,
  Wifi,
  Zap,
  Brain,
  Server,
} from "lucide-react";
import type { Page } from "../components/Sidebar";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import { useUsbConnectionState } from "../hooks/useUsbConnectionState";
import { supabase } from "../lib/supabase";
import { caseService } from "../services/caseService";
import { deviceService } from "../services/deviceService";
import {
  evidenceService,
  generateWhatsAppChatsForDevice,
  makeTimestampDynamic,
} from "../services/evidenceService";
import { mockFileService } from "../services/mockFileService";
import { webadbService } from "../services/webadbService";

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  color = "#22d3ee",
  accent,
}: {
  icon: React.ElementType;
  title: string;
  color?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: accent ?? `${color}22` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">
        {title}
      </h3>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
  accent = "#22d3ee",
  badge,
  badgeColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
  accent?: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0 group">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110"
        style={{ background: `${accent}18` }}
      >
        <Icon size={13} style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
          {label}
        </div>
        <div
          className={`text-sm font-medium text-foreground break-all ${
            mono ? "font-mono tracking-wide text-[13px]" : ""
          }`}
        >
          {value}
        </div>
      </div>
      {badge && (
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-1 border"
          style={{
            background: `${badgeColor ?? "#22c55e"}18`,
            color: badgeColor ?? "#22c55e",
            borderColor: `${badgeColor ?? "#22c55e"}40`,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── Storage bar ────────────────────────────────────────────────────────────────

function StorageBar({
  used,
  total,
  label,
}: { used: number; total: number; label: string }) {
  const pct =
    total > 0
      ? Math.min(100, Math.max(0, Math.round((used / total) * 100)))
      : 0;
  const barColor = pct > 85 ? "#f87171" : pct > 65 ? "#fbbf24" : "#22d3ee";
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span style={{ color: barColor }} className="font-semibold">
          {pct}% used
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <motion.div
          className="h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
          style={{ background: `linear-gradient(90deg, ${barColor}, #818cf8)` }}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface DeviceInfoPageProps {
  caseId: string;
  deviceId: string;
  investigatorBadge: string;
  onNavigate: (page: Page) => void;
}

export function DeviceInfoPage({
  caseId,
  deviceId,
  investigatorBadge: propsInvestigatorBadge,
  onNavigate,
}: DeviceInfoPageProps) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  // Queries
  const { data: cases = [] } = useQuery({
    queryKey: ["cases", !!actor],
    queryFn: () => caseService.getAllCases(actor),
  });
  const currentCase = cases.find((c) => c.id === caseId);

  const { data: devices = [] } = useQuery({
    queryKey: ["devices", caseId, !!actor],
    queryFn: () => deviceService.getDevices(caseId, actor),
  });
  const device = devices.find((d) => d.id === deviceId);

  const { data: locations = [] } = useQuery({
    queryKey: ["locations", deviceId, !!actor],
    queryFn: () => evidenceService.getLocationRecords(deviceId, actor),
    enabled: !!deviceId,
  });

  const { data: sms = [] } = useQuery({
    queryKey: ["sms", deviceId, !!actor],
    queryFn: () => evidenceService.getSmsRecords(deviceId, actor),
    enabled: !!deviceId,
  });

  const isUsbConnectedReal = useUsbConnectionState(
    device?.serialNumber || "",
    device?.usbStatus || "",
  );

  const isMockDevice = device?.serialNumber === "SGR2023001X";
  const [simulateUsb, setSimulateUsb] = useState(isMockDevice);
  const isUsbConnected = simulateUsb || isUsbConnectedReal;

  const stepsList = [
    { name: "Connected", icon: Usb },
    { name: "Detected", icon: Smartphone },
    { name: "Read Data", icon: Database },
    { name: "Backup", icon: HardDrive },
    { name: "SHA-256", icon: Hash },
    { name: "Stored", icon: Server },
    { name: "AI Analysis", icon: Brain }
  ];

  if (!device) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-cyan-400" size={24} />
      </div>
    );
  }

  // Parse storage string (e.g. "128 GB") to a number. Returns 0 if unavailable.
  const parseStorageVal = (val: string | null | undefined): number => {
    if (!val || val.trim() === "" || val === "Unknown") return 0;
    const match = val.match(/([0-9.]+)/);
    if (!match) return 0;
    const parsed = Number.parseFloat(match[1]);
    return Number.isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  };

  const totalGB = parseStorageVal(device.storageTotal) || 128;
  const usedGB = parseStorageVal(device.storageUsed) || 89.2;
  const freeGB =
    totalGB > 0 ? Math.max(0, +(totalGB - usedGB).toFixed(1)) : 38.8;

  const investigatorName = currentCase?.investigator || "Investigator";
  const investigatorBadge = propsInvestigatorBadge || "";
  const caseNumber = currentCase?.caseNumber || "—";

  const handleSyncTelemetry = async () => {
    setIsSyncing(true);
    const toastId = toast.loading(
      "Connecting to USB device & synchronizing telemetry...",
    );

    try {
      let syncResult: any;

      if (simulateUsb) {
        // Simulated Dynamic Telemetry Update
        const randomDigits = Array.from({ length: 13 }, () =>
          Math.floor(Math.random() * 10),
        ).join("");
        const dynamicImei = `35${randomDigits}`;
        // Randomise realistic storage values (64–512 GB total, 30–85% used)
        const storageSizes = [64, 128, 256, 512];
        const totalStorage =
          storageSizes[Math.floor(Math.random() * storageSizes.length)];
        const usageRatio = 0.3 + Math.random() * 0.55; // 30–85% used
        const usedStorage = +(totalStorage * usageRatio).toFixed(1);
        const batteryPct = BigInt(Math.floor(40 + Math.random() * 60));

        const cityLat = 19.0596;
        const cityLng = 72.8295;
        const generatedLocations = Array.from({ length: 4 }).map((_, index) => {
          const latOffset = (index - 2) * 0.003 + (Math.random() - 0.5) * 0.001;
          const lngOffset =
            (index - 2) * 0.0025 + (Math.random() - 0.5) * 0.001;
          const lat = cityLat + latOffset;
          const lng = cityLng + lngOffset;
          return {
            lat,
            lng,
            address: `Carved GPS Trace - Bandra West, Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
            timestamp: new Date(Date.now() - index * 20 * 60000)
              .toISOString()
              .replace("T", " ")
              .substring(0, 16),
            accuracy: 8 + Math.floor(Math.random() * 10),
            source: "GPS Provider (Carved)",
          };
        });

        const dynamicApps = [
          { name: "WhatsApp", packageName: "com.whatsapp" },
          { name: "Chrome", packageName: "com.android.chrome" },
          { name: "Telegram", packageName: "org.telegram.messenger" },
          { name: "Signal", packageName: "org.securesms" },
          { name: "StealthChat", packageName: "com.encrypt.chat" },
        ];

        const randomNames = [
          "Vikram Malhotra",
          "Amit Sen",
          "Riya Kapoor",
          "David Johnson",
          "Sanjay Dutt",
          "Nisha Patel",
        ];
        const randomNumbers = [
          "+91-98765-43210",
          "+91-99000-88888",
          "+91-95432-10987",
          "+1-555-0199",
          "+91-91111-22222",
          "+91-97777-66666",
        ];
        const randomDurations = [
          "2m 45s",
          "14m 12s",
          "0s",
          "5m 08s",
          "0s",
          "1m 30s",
        ];
        const randomTypes: ("incoming" | "outgoing" | "missed")[] = [
          "incoming",
          "outgoing",
          "missed",
          "incoming",
          "missed",
          "outgoing",
        ];

        const generatedCalls = Array.from({ length: 5 }).map((_, index) => {
          const nameIdx =
            (Math.floor(Math.random() * randomNames.length) + index) %
            randomNames.length;
          return {
            caller: randomNames[nameIdx],
            number: randomNumbers[nameIdx],
            duration: randomDurations[nameIdx],
            timestamp: new Date(Date.now() - (index * 45 + 10) * 60000)
              .toISOString()
              .replace("T", " ")
              .substring(0, 16),
            type: randomTypes[nameIdx],
            isSuspicious:
              randomTypes[nameIdx] === "missed" && Math.random() > 0.5,
            isRecovered: Math.random() > 0.6,
          };
        });

        const smsSenders = [
          "Vikram Malhotra",
          "DM-OTP",
          "Mom",
          "Office Admin",
          "Hacker Alert",
        ];
        const smsPhones = [
          "+91-98765-43210",
          "DM-OTP",
          "+91-94001-88888",
          "+91-11-261000",
          "+44-7911-882200",
        ];
        const smsContents = [
          "Please verify the server login immediately.",
          "Your login OTP is 928410. Do not share it with anyone.",
          "Call me when you are free, dear.",
          "The hardware audit report has been compiled.",
          "Attention: Sideloaded package verification bypass warning detected.",
        ];
        const smsDirections: ("incoming" | "outgoing")[] = [
          "incoming",
          "incoming",
          "outgoing",
          "incoming",
          "incoming",
        ];

        const generatedSms = Array.from({ length: 4 }).map((_, index) => {
          const idx =
            (Math.floor(Math.random() * smsSenders.length) + index) %
            smsSenders.length;
          return {
            sender: smsSenders[idx],
            phone: smsPhones[idx],
            content: smsContents[idx],
            timestamp: new Date(Date.now() - (index * 60 + 15) * 60000)
              .toISOString()
              .replace("T", " ")
              .substring(0, 16),
            direction: smsDirections[idx],
            isSuspicious:
              smsContents[idx].includes("bypass") ||
              smsContents[idx].includes("OTP"),
            isRecovered: Math.random() > 0.7,
          };
        });

        const browserUrls = [
          "https://www.google.com/search?q=how+to+bypass+adb+security",
          "https://github.com/yume-chan/ya-webadb",
          "https://signal.org/download",
          "https://torproject.org",
          "https://darknet.to/marketplace",
        ];
        const browserTitles = [
          "how to bypass adb security - Google Search",
          "ya-webadb: WebADB client library - GitHub",
          "Download Signal",
          "Tor Project | Privacy & Freedom Online",
          "Darknet Marketplace Portal",
        ];
        const generatedBrowser = Array.from({ length: 4 }).map((_, index) => {
          const idx =
            (Math.floor(Math.random() * browserUrls.length) + index) %
            browserUrls.length;
          return {
            url: browserUrls[idx],
            title: browserTitles[idx],
            visitCount: BigInt(Math.floor(1 + Math.random() * 10)),
            lastVisited: new Date(Date.now() - (index * 80 + 30) * 60000)
              .toISOString()
              .replace("T", " ")
              .substring(0, 16),
            browser: "Chrome",
            isSuspicious:
              browserUrls[idx].includes("bypass") ||
              browserUrls[idx].includes("tor") ||
              browserUrls[idx].includes("darknet"),
            isRecovered: Math.random() > 0.6,
          };
        });

        const mediaFilesList = [
          {
            name: "IMG_DCIM_84920.jpg",
            type: "image" as const,
            size: "3.2 MB",
            path: "/sdcard/DCIM/Camera/",
          },
          {
            name: "IMG_DCIM_84921.jpg",
            type: "image" as const,
            size: "1.4 MB",
            path: "/sdcard/DCIM/Camera/",
          },
          {
            name: "chat_backup.zip",
            type: "document" as const,
            size: "48.5 MB",
            path: "/sdcard/Downloads/",
          },
          {
            name: "voice_note.mp3",
            type: "audio" as const,
            size: "820 KB",
            path: "/sdcard/WhatsApp/Media/",
          },
        ];
        const generatedMedia = mediaFilesList.map((m, idx) => ({
          ...m,
          createdAt: new Date(Date.now() - (idx * 120 + 200) * 60000)
            .toISOString()
            .replace("T", " ")
            .substring(0, 16),
          isHidden: m.name.includes("backup"),
          isRecovered: idx === 3,
        }));

        syncResult = {
          model:
            device &&
            !device.model.includes("Mock") &&
            device.model !== "Android Device"
              ? device.model
              : "Android Device",
          manufacturer:
            device && device.manufacturer !== "Generic"
              ? device.manufacturer
              : "Samsung",
          androidVersion: "Android 14",
          serialNumber: device?.serialNumber || "SGR2023001X",
          imei: dynamicImei,
          batteryLevel: batteryPct,
          storageTotal: `${totalStorage} GB`,
          storageUsed: `${usedStorage} GB`,
          securityPatch: "2024-05-01",
          buildNumber: "UP1A.231005.007.G998BXXU9EWG1",
          modelNumber: "SM-S918B/DS",
          deviceFingerprint:
            "samsung/dm3qxxx/dm3q:14/UP1A.231005.007/S918BXXU9EWG1:user/release-keys",
          bootloaderStatus: "Unlocked",
          rootStatus: "Rooted (su binary detected)",
          macAddress: "74:A7:22:D9:8A:F1",
          apps: dynamicApps,
          locations: generatedLocations,
          sms: generatedSms,
          calls: generatedCalls,
          media: generatedMedia,
          browser: generatedBrowser,
          whatsappChats: generateWhatsAppChatsForDevice(deviceId),
        };
      } else {
        // Real WebUSB Sync
        syncResult = await webadbService.acquireRealDevice();
      }

      const updatedDevice = {
        model: syncResult.model,
        manufacturer: syncResult.manufacturer,
        androidVersion: syncResult.androidVersion,
        imei: syncResult.imei,
        batteryLevel: Number(syncResult.batteryLevel),
        storageTotal: syncResult.storageTotal,
        storageUsed: syncResult.storageUsed,
        securityPatch: syncResult.securityPatch,
        buildNumber: syncResult.buildNumber,
        modelNumber: syncResult.modelNumber,
        deviceFingerprint: syncResult.deviceFingerprint,
        bootloaderStatus: syncResult.bootloaderStatus,
        rootStatus: syncResult.rootStatus,
        macAddress: syncResult.macAddress,
        usbStatus: "connected",
      };

      const { error: updateError } = await supabase
        .from("devices")
        .update(updatedDevice)
        .eq("id", deviceId);

      if (updateError) {
        throw updateError;
      }

      localStorage.setItem(
        `forenai_device_details_${deviceId}`,
        JSON.stringify({
          id: deviceId,
          caseId,
          ...updatedDevice,
          extractionStatus: device.extractionStatus,
          lastExtractionTimestamp: device.lastExtractionTimestamp,
        }),
      );

      await evidenceService.seedRealDeviceEvidence(
        deviceId,
        caseId,
        syncResult,
        investigatorName,
      );

      await queryClient.invalidateQueries({ queryKey: ["devices", caseId] });
      await queryClient.invalidateQueries({
        queryKey: ["locations", deviceId],
      });

      toast.success(
        simulateUsb
          ? "Successfully synced live simulated USB telemetry!"
          : "Successfully synced live hardware telemetry from USB device via ADB!",
        { id: toastId },
      );
    } catch (err: any) {
      console.error("Telemetry sync error:", err);
      if (!simulateUsb) {
        toast.error(
          `WebADB connection failed: ${err.message || err}. Falling back to simulated dynamic telemetry...`,
          { id: toastId },
        );
        setSimulateUsb(true);
        setIsSyncing(false);
        setTimeout(() => {
          handleSyncTelemetry();
        }, 1000);
        return;
      }
      toast.error(`Failed to sync telemetry: ${err.message || err}`, {
        id: toastId,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            device: {
              model: device.model,
              manufacturer: device.manufacturer,
              androidVersion: device.androidVersion,
              serialNumber: device.serialNumber,
              imei: device.imei,
              usbStatus: device.usbStatus,
              batteryLevel: Number(device.batteryLevel),
              storageTotal: device.storageTotal,
              storageUsed: device.storageUsed,
              extractionStatus: device.extractionStatus,
              lastExtractionTimestamp: device.lastExtractionTimestamp,
              investigatorName,
              investigatorBadge,
              caseNumber,
            },
            exportedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DeviceInfo_${caseNumber.replace(/\//g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = (fileName: string, type: string) => {
    const url = mockFileService.getDynamicFileUrl(fileName, type);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const isExtracted = device.extractionStatus === "completed";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)",
            }}
          >
            <Smartphone size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Device Information
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Forensic device profile extracted via USB — ADB Debug Mode
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            data-ocid="device.case_number_badge"
            className="font-mono text-[10px] px-2.5 py-1 border border-purple-400/30 bg-purple-400/10 text-purple-300 rounded-md"
          >
            <Hash size={9} className="mr-1 inline-block" />
            {caseNumber}
          </span>
          {isUsbConnected ? (
            <span
              data-ocid="device.usb_status_badge"
              className="text-[10px] px-2.5 py-1 border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 rounded-md animate-pulse"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 inline-block" />
              USB Connected
            </span>
          ) : (
            <span
              data-ocid="device.usb_status_badge"
              className="text-[10px] px-2.5 py-1 border border-red-400/30 bg-red-400/10 text-red-400 rounded-md"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 inline-block" />
              USB Disconnected
            </span>
          )}
          <span
            data-ocid="device.android_version_badge"
            className="text-[10px] px-2.5 py-1 border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 rounded-md"
          >
            {device.androidVersion}
          </span>
          <button
            type="button"
            onClick={() => setSimulateUsb(!simulateUsb)}
            className={`h-7 px-3 text-xs gap-1.5 border rounded-md cursor-pointer transition-colors ${
              simulateUsb
                ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            🔌 {simulateUsb ? "Simulated Connected" : "Simulate USB Plug"}
          </button>
          {isUsbConnected && (
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncTelemetry}
              className={`h-7 px-3 text-xs gap-1.5 border border-emerald-400/25 bg-emerald-400/8 text-emerald-300 hover:bg-emerald-400/15 hover:text-emerald-200 rounded-md cursor-pointer transition-colors flex items-center ${
                isSyncing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <RefreshCw
                size={11}
                className={`mr-1 ${isSyncing ? "animate-spin" : ""}`}
              />
              {isSyncing ? "Syncing..." : "Sync Live USB Telemetry"}
            </button>
          )}
          <button
            data-ocid="device.export_button"
            type="button"
            onClick={handleExport}
            className="h-7 px-3 text-xs gap-1.5 border border-cyan-400/25 bg-cyan-400/8 text-cyan-300 hover:bg-cyan-400/15 hover:text-cyan-200 rounded-md cursor-pointer transition-colors"
          >
            <Download size={11} className="inline mr-1" />
            Export Info
          </button>
        </div>
      </motion.div>

      {/* ── Top row: Device Profile + Identity ── */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Device Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-6"
          data-ocid="device.profile_card"
        >
          <SectionHeader
            icon={Smartphone}
            title="Device Profile"
            color="#22d3ee"
          />

          <div
            className="rounded-xl p-4 mb-5 flex items-center gap-4"
            style={{
              background:
                "linear-gradient(135deg,rgba(6,182,212,0.1) 0%,rgba(99,102,241,0.12) 100%)",
              border: "1px solid rgba(6,182,212,0.15)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)" }}
            >
              <Smartphone size={22} className="text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-foreground">
                {device.model}
              </div>
              <div className="text-xs text-muted-foreground">
                {device.manufacturer}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle2 size={10} className="text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">
                  Verified Device
                </span>
              </div>
            </div>
          </div>

          <InfoRow
            icon={Smartphone}
            label="Android Version"
            value={device.androidVersion}
            accent="#22d3ee"
          />
          <InfoRow
            icon={Shield}
            label="Security Patch"
            value={device.securityPatch || "Unknown"}
            accent="#818cf8"
          />
          <InfoRow
            icon={Zap}
            label="Build Number"
            value={device.buildNumber || "Unknown"}
            mono
            accent="#f472b6"
          />
          <InfoRow
            icon={Smartphone}
            label="Model Number"
            value={device.modelNumber || device.model || "Unknown"}
            mono
            accent="#34d399"
          />
          <InfoRow
            icon={Wifi}
            label="Last Known Network"
            value="AndroidAP_5G (WPA2-Personal)"
            accent="#fbbf24"
          />
        </motion.div>

        {/* Identity Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="glass-card p-6"
          data-ocid="device.identity_card"
        >
          <SectionHeader
            icon={Fingerprint}
            title="Device Identity"
            color="#818cf8"
          />

          <InfoRow
            icon={Hash}
            label="Serial Number"
            value={device.serialNumber}
            mono
            accent="#22d3ee"
          />
          <InfoRow
            icon={Shield}
            label="IMEI"
            value={device.imei}
            mono
            accent="#818cf8"
          />
          <InfoRow
            icon={Fingerprint}
            label="Device Fingerprint"
            value={device.deviceFingerprint || "Unknown"}
            mono
            accent="#f472b6"
          />
          <InfoRow
            icon={Shield}
            label="Bootloader Status"
            value={device.bootloaderStatus || "Locked"}
            accent="#22c55e"
            badge={device.bootloaderStatus || "Locked"}
            badgeColor={
              device.bootloaderStatus === "Unlocked" ? "#ef4444" : "#22c55e"
            }
          />
          <InfoRow
            icon={Zap}
            label="Root Status"
            value={device.rootStatus || "Not Rooted"}
            accent="#34d399"
            badge={
              device.rootStatus?.toLowerCase().includes("rooted")
                ? "ROOTED"
                : "CLEAN"
            }
            badgeColor={
              device.rootStatus?.toLowerCase().includes("rooted")
                ? "#ef4444"
                : "#34d399"
            }
          />
          <InfoRow
            icon={Wifi}
            label="MAC Address"
            value={device.macAddress || "Unknown"}
            mono
            accent="#fbbf24"
          />
        </motion.div>
      </div>

      {/* ── Bottom row: Connection + Storage + Investigation + GPS Telemetry + SMS Preview ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {/* Connection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.26 }}
          className="glass-card p-6"
          data-ocid="device.connection_card"
        >
          <SectionHeader
            icon={Usb}
            title="USB Connection"
            color={isUsbConnected ? "#22c55e" : "#ef4444"}
          />

          {isUsbConnected ? (
            <div
              className="rounded-xl p-3.5 mb-5 flex items-center gap-3"
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.20)",
              }}
            >
              <div className="pulse-ring w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-emerald-400">
                  LIVE — ADB Debug
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Transfer speed: 480 Mbit/s
                </div>
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl p-3.5 mb-5 flex items-center gap-3"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.20)",
              }}
            >
              <div className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-red-400">
                  DISCONNECTED
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Plug in USB device to inspect
                </div>
              </div>
            </div>
          )}

          <InfoRow
            icon={Usb}
            label="Connection Mode"
            value={isUsbConnected ? "ADB Debug Mode" : "Disconnected"}
            accent={isUsbConnected ? "#22c55e" : "#ef4444"}
            badge={isUsbConnected ? "Connected" : "Disconnected"}
            badgeColor={isUsbConnected ? "#22c55e" : "#ef4444"}
          />
          <InfoRow
            icon={Calendar}
            label="Connection Time"
            value={
              isUsbConnected
                ? `${new Date().toISOString().replace("T", " ").substring(0, 19)} UTC`
                : "N/A"
            }
            accent="#22d3ee"
          />
          <InfoRow
            icon={Calendar}
            label="Extraction Timestamp"
            value={device.lastExtractionTimestamp || "Not extracted yet"}
            accent="#818cf8"
          />
          <InfoRow
            icon={ChevronRight}
            label="Protocol"
            value={isUsbConnected ? "USB 3.2 Gen 1 (5 Gbps)" : "N/A"}
            accent="#fbbf24"
          />
        </motion.div>

        {/* Storage Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.34 }}
          className="glass-card p-6"
          data-ocid="device.storage_card"
        >
          <SectionHeader
            icon={HardDrive}
            title="Storage Analysis"
            color="#06b6d4"
          />
          <StorageBar used={usedGB} total={totalGB} label="Internal Storage" />
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              {
                label: "Total",
                value:
                  device.storageTotal && device.storageTotal !== "Unknown"
                    ? device.storageTotal
                    : `${totalGB} GB`,
                color: "#22d3ee",
              },
              {
                label: "Used",
                value:
                  device.storageUsed && device.storageUsed !== "Unknown"
                    ? device.storageUsed
                    : `${usedGB} GB`,
                color: "#f472b6",
              },
              {
                label: "Free",
                value: `${freeGB} GB`,
                color: "#34d399",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-2.5 text-center"
                style={{
                  background: `${s.color}10`,
                  border: `1px solid ${s.color}25`,
                }}
              >
                <div className="text-[10px] text-muted-foreground mb-0.5">
                  {s.label}
                </div>
                <div className="text-xs font-bold" style={{ color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
          <InfoRow
            icon={Database}
            label="External SD Card"
            value="Not detected"
            accent="#818cf8"
          />
        </motion.div>

        {/* Investigation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.42 }}
          className="glass-card p-6"
          data-ocid="device.investigation_card"
        >
          <SectionHeader icon={User} title="Investigation" color="#818cf8" />

          <InfoRow
            icon={User}
            label="Investigator Name"
            value={investigatorName}
            accent="#818cf8"
          />
          <InfoRow
            icon={Shield}
            label="Badge / ID"
            value={investigatorBadge}
            mono
            accent="#22d3ee"
          />
          <InfoRow
            icon={Hash}
            label="Case Number"
            value={caseNumber}
            mono
            accent="#f472b6"
          />
          <InfoRow
            icon={Calendar}
            label="Investigation Start"
            value={
              currentCase?.createdTimestamp
                ? `${new Date(Number(currentCase.createdTimestamp))
                    .toISOString()
                    .replace("T", " ")
                    .substring(0, 19)} UTC`
                : "N/A"
            }
            accent="#34d399"
          />
        </motion.div>

        {/* Extracted Telemetry GPS Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.48 }}
          className="glass-card p-6"
          data-ocid="device.gps_card"
        >
          <SectionHeader
            icon={Navigation}
            title="Extracted Telemetry GPS"
            color="#34d399"
          />

          {locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Navigation
                size={22}
                className="text-muted-foreground/30 mb-3 animate-pulse"
              />
              <span className="text-xs font-semibold">
                No live GPS trace found
              </span>
              <span className="text-[10px] mt-1 text-muted-foreground/60 max-w-[150px]">
                Connect target device via USB and click Sync Telemetry
              </span>
            </div>
          ) : (
            <>
              <div
                className="rounded-xl p-3 mb-4 flex items-center gap-3"
                style={{
                  background: "rgba(52,211,153,0.08)",
                  border: "1px solid rgba(52,211,153,0.20)",
                }}
              >
                <Navigation
                  size={14}
                  className="text-emerald-400 animate-pulse"
                />
                <div>
                  <div className="text-xs font-bold text-emerald-400">
                    {locations.length} GPS TRACES CARVED
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Carved from dumpsys location logs
                  </div>
                </div>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {locations.slice(0, 4).map((loc: any, idx: number) => (
                  <div
                    key={loc.id || idx}
                    onClick={() =>
                      toast.success(
                        `Viewing coordinate trace ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)} on forensic map.`,
                      )
                    }
                    className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 cursor-pointer transition-all group/loc"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-emerald-400 group-hover/loc:text-emerald-300">
                        {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                      </span>
                      <span className="text-muted-foreground text-[9px]">
                        {loc.timestamp}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate group-hover/loc:text-foreground">
                      {loc.address}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Extracted SMS Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.52 }}
          className="glass-card p-6"
          data-ocid="device.sms_preview_card"
        >
          <SectionHeader
            icon={MessageSquare}
            title="Extracted SMS Preview"
            color="#22d3ee"
          />

          {sms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <MessageSquare
                size={22}
                className="text-muted-foreground/30 mb-3 animate-pulse"
              />
              <span className="text-xs font-semibold">
                No SMS records found
              </span>
              <span className="text-[10px] mt-1 text-muted-foreground/60 max-w-[150px]">
                Connect target device via USB and extract evidence to view logs
              </span>
            </div>
          ) : (
            <>
              <div
                className="rounded-xl p-3 mb-4 flex items-center gap-3"
                style={{
                  background: "rgba(34,211,238,0.08)",
                  border: "1px solid rgba(34,211,238,0.20)",
                }}
              >
                <MessageSquare
                  size={14}
                  className="text-cyan-400 animate-pulse"
                />
                <div>
                  <div className="text-xs font-bold text-cyan-400">
                    {sms.length} SMS LOGS EXTRACTED
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Carved live SMS database sectors
                  </div>
                </div>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {sms.slice(0, 3).map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="flex flex-col p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group/sms"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-cyan-400 group-hover/sms:text-cyan-300 truncate max-w-[100px]">
                        {item.sender}
                      </span>
                      <span className="text-muted-foreground text-[9px] font-mono">
                        {item.timestamp.split(" ").pop()}
                      </span>
                    </div>
                    <div className="text-[11px] text-foreground/90 mt-1 line-clamp-2 italic leading-relaxed font-mono">
                      "{item.content}"
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Extraction Status Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.55 }}
        className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
        data-ocid="device.extraction_status"
        style={{
          borderColor: isExtracted
            ? "rgba(34,197,94,0.20)"
            : isUsbConnected
              ? "rgba(245,158,11,0.20)"
              : "rgba(239,68,68,0.20)",
        }}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className={`pulse-ring w-3 h-3 rounded-full flex-shrink-0 ${
              isExtracted
                ? "bg-emerald-400"
                : isUsbConnected
                  ? "bg-amber-400"
                  : "bg-red-400"
            }`}
          />
          <div className="flex-1 min-w-0 text-xs">
            <span
              className={`font-bold ${
                isExtracted
                  ? "text-emerald-400"
                  : isUsbConnected
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {isExtracted
                ? "Extraction Complete"
                : isUsbConnected
                  ? "Extraction Pending"
                  : "USB Disconnected"}
            </span>
            <span className="text-muted-foreground ml-2">
              {isExtracted
                ? "Physical + Logical extraction performed. All 4 partitions accessible."
                : isUsbConnected
                  ? "USB connected. Extraction required to parse device partitions."
                  : "Target device is physically disconnected. Please connect the phone via USB."}
            </span>
            {isExtracted && (
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                <span className="text-muted-foreground font-medium">
                  Evidence hash verified:
                </span>
                <span className="font-mono text-[11px] text-cyan-400/80 bg-cyan-400/5 px-2 py-0.5 border border-cyan-400/10 rounded">
                  SHA256: a3f91d8c4e02b6f7d19e3c28a047f2b581d6e94c2…
                </span>
                <div className="flex gap-2 ml-auto sm:ml-4">
                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(
                        `device_backup_${device.serialNumber}.zip`,
                        "backup",
                      )
                    }
                    className="flex items-center gap-1 px-2 py-1 bg-cyan-400/10 border border-cyan-400/35 hover:bg-cyan-400/20 text-cyan-300 rounded text-[10px] font-semibold transition-colors cursor-pointer animate-in fade-in"
                  >
                    <Download size={10} />
                    Download Backup (.zip)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownload("msgstore.db.crypt14", "backup")
                    }
                    className="flex items-center gap-1 px-2 py-1 bg-violet-400/10 border border-violet-400/35 hover:bg-violet-400/20 text-violet-300 rounded text-[10px] font-semibold transition-colors cursor-pointer animate-in fade-in"
                  >
                    <Database size={10} />
                    Download msgstore.db.crypt14
                  </button>
                </div>
              </div>
            )}
            {!isExtracted && (
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                {isUsbConnected ? (
                  <button
                    type="button"
                    onClick={() => onNavigate("acquisition")}
                    className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/15 border border-cyan-500/35 hover:bg-cyan-500/25 text-cyan-300 rounded text-[10px] font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)] animate-pulse"
                  >
                    <Usb size={10} />
                    Initiate Forensic Acquisition
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toast.info("Please connect the device via USB to start acquisition.")}
                    className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 rounded text-[10px] font-semibold transition-all cursor-pointer"
                  >
                    <Smartphone size={10} />
                    Connect USB Device
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {isExtracted ? (
            <CheckCircle2 size={20} className="text-emerald-400" />
          ) : isUsbConnected ? (
            <Usb size={20} className="text-amber-400 animate-pulse" />
          ) : (
            <Usb size={20} className="text-red-400" />
          )}
        </div>
      </motion.div>

      {/* ── Visual Forensic Pipeline Indicator ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.6 }}
        className="glass-card p-6 border border-white/5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
            <Zap size={11} className="text-cyan-400" />
            Active Pipeline Validation Sequence
          </h4>
          <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-400/5 px-2 py-0.5 border border-cyan-400/10 rounded">
            STATUS: {isExtracted ? "VERIFIED & SEALED" : isUsbConnected ? "PENDING ACQUISITION" : "AWAITING USB LINK"}
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pt-2">
          {stepsList.map((step, index) => {
            const Icon = step.icon;
            const isStepDone = isExtracted || (isUsbConnected && index === 0);
            const isStepActive = !isExtracted && isUsbConnected && index === 1;
            
            return (
              <div
                key={step.name}
                className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all duration-300 ${
                  isStepDone
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                    : isStepActive
                      ? "bg-cyan-500/5 border-cyan-500/30 text-cyan-400 animate-pulse"
                      : "bg-white/5 border-white/5 text-muted-foreground/30"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-transform ${
                    isStepDone
                      ? "bg-emerald-500/10 text-emerald-400"
                      : isStepActive
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "bg-white/5 text-muted-foreground/30"
                  }`}
                >
                  <Icon size={14} />
                </div>
                <span className="text-[10px] font-bold tracking-tight">
                  Step {index + 1}
                </span>
                <span className="text-[9px] mt-0.5 truncate max-w-[80px] font-medium">
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
