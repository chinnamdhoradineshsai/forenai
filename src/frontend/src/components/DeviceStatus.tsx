import { RefreshCw, Usb } from "lucide-react";

interface DeviceStatusProps {
  isConnected: boolean;
  modelName?: string;
  serialNumber?: string;
  onRefresh?: () => void;
}

export function DeviceStatus({
  isConnected,
  modelName = "Android Device",
  serialNumber = "ADB-DEVICE",
  onRefresh,
}: DeviceStatusProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
        isConnected
          ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
          : "bg-red-500/5 border-red-500/20 text-red-400"
      }`}
    >
      <div className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isConnected ? "bg-emerald-400" : "bg-red-400"
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isConnected ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
      </div>

      <Usb
        size={14}
        className={isConnected ? "text-emerald-400" : "text-red-400"}
      />

      <div className="flex-1 min-w-0 text-xs">
        {isConnected ? (
          <div>
            <span className="font-bold">USB Linked</span>
            <span className="text-[10px] text-muted-foreground ml-2">
              {modelName} ({serialNumber})
            </span>
          </div>
        ) : (
          <div>
            <span className="font-bold">No Device Linked</span>
            <span className="text-[10px] text-muted-foreground ml-2">
              Connect suspect device via USB
            </span>
          </div>
        )}
      </div>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="p-1 hover:bg-white/5 rounded transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
          title="Scan USB ports"
        >
          <RefreshCw size={12} className="animate-hover-spin" />
        </button>
      )}
    </div>
  );
}
