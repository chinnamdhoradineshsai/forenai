import {
  Calendar,
  Database,
  HardDrive,
  Hash,
  MapPin,
  Shield,
  Smartphone,
  User,
  Wifi,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import type { Device } from "../backend.d";

interface DeviceInfoPanelProps {
  device: Device;
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
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${accent}18` }}
      >
        <Icon size={13} style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5">
          {label}
        </div>
        <div
          className={`text-xs font-semibold text-foreground truncate ${mono ? "font-mono text-[11px] text-cyan-300/90" : ""}`}
        >
          {value}
        </div>
      </div>
      {badge && (
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-1 border"
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

export function DeviceInfoPanel({ device }: DeviceInfoPanelProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Profile */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2">
          <Smartphone size={14} />
          Hardware Profile
        </h3>
        <div className="divide-y divide-white/5">
          <InfoRow icon={Smartphone} label="Model Name" value={device.model} />
          <InfoRow
            icon={Smartphone}
            label="Manufacturer"
            value={device.manufacturer}
            accent="#818cf8"
          />
          <InfoRow
            icon={Smartphone}
            label="OS Version"
            value={device.androidVersion}
            accent="#f472b6"
          />
          <InfoRow
            icon={Shield}
            label="Root Status"
            value={device.rootStatus || "Stock ROM — Not Rooted"}
            accent="#22c55e"
            badge={
              device.rootStatus?.toLowerCase().includes("rooted")
                ? "ROOTED"
                : "CLEAN"
            }
            badgeColor={
              device.rootStatus?.toLowerCase().includes("rooted")
                ? "#ef4444"
                : "#22c55e"
            }
          />
          <InfoRow
            icon={Zap}
            label="Bootloader"
            value={device.bootloaderStatus || "Locked"}
            accent="#34d399"
            badge={
              device.bootloaderStatus === "Unlocked" ? "UNLOCKED" : "SECURE"
            }
            badgeColor={
              device.bootloaderStatus === "Unlocked" ? "#ef4444" : "#34d399"
            }
          />
        </div>
      </div>

      {/* Identifiers */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2 flex items-center gap-2">
          <Shield size={14} />
          Identity & Storage
        </h3>
        <div className="divide-y divide-white/5">
          <InfoRow
            icon={Hash}
            label="Serial Number"
            value={device.serialNumber}
            mono
          />
          <InfoRow
            icon={Shield}
            label="IMEI Number"
            value={device.imei}
            mono
            accent="#818cf8"
          />
          <InfoRow
            icon={HardDrive}
            label="Internal Storage"
            value={`${device.storageUsed} / ${device.storageTotal}`}
            accent="#f472b6"
          />
          <InfoRow
            icon={Wifi}
            label="Connection Link"
            value={
              device.usbStatus === "connected"
                ? "USB ADB Link Active"
                : "Disconnected"
            }
            accent="#fbbf24"
          />
          <InfoRow
            icon={Calendar}
            label="Last Scan"
            value={device.lastExtractionTimestamp || "Never"}
            accent="#34d399"
          />
        </div>
      </div>
    </div>
  );
}
