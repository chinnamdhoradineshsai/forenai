import {
  Battery,
  Cpu,
  ShieldAlert,
  Smartphone,
  Trash2,
  Usb,
} from "lucide-react";
import { motion } from "motion/react";
import type { Device } from "../backend.d";
import { useUsbConnectionState } from "../hooks/useUsbConnectionState";

interface DeviceCardProps {
  device: Device;
  onClick: () => void;
  onDelete?: () => void;
}

export function DeviceCard({ device, onClick, onDelete }: DeviceCardProps) {
  const isUsbConnected = useUsbConnectionState(
    device.serialNumber,
    device.usbStatus,
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-500/10 border-green-500/25";
      case "extracting":
        return "text-cyan-400 bg-cyan-500/10 border-cyan-500/25 animate-pulse";
      default:
        return "text-amber-400 bg-amber-500/10 border-amber-500/25";
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="glass-card p-6 flex flex-col justify-between h-52 cursor-pointer group"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Smartphone size={16} className="text-cyan-400" />
            {device.model}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(device.extractionStatus)}`}
            >
              {device.extractionStatus.toUpperCase()}
            </span>
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)] active:scale-95 transition-all duration-200 cursor-pointer border border-transparent hover:border-red-500/20"
                title="Delete Device"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Cpu size={12} className="text-violet-400" />
            <span>Mfr: {device.manufacturer}</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mr-1">
              S/N:
            </span>
            {device.serialNumber}
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mr-1">
              IMEI:
            </span>
            {device.imei}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Usb
            size={12}
            className={isUsbConnected ? "text-emerald-400" : "text-zinc-400"}
          />
          <span
            className={
              isUsbConnected ? "text-emerald-400 font-bold" : "text-zinc-400"
            }
          >
            {isUsbConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Battery size={12} className="text-amber-400" />
          <span>{Number(device.batteryLevel)}%</span>
        </div>
      </div>
    </motion.div>
  );
}
