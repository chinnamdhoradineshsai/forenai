import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart3,
  FileText,
  Folder,
  FolderSearch,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShieldAlert,
  Smartphone,
  Users,
  X,
  Zap,
  Disc,
  ShieldCheck,
  History,
  Binary,
  Bug,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useUsbConnectionState } from "../hooks/useUsbConnectionState";

export type Page =
  | "dashboard"
  | "cases"
  | "casedetails"
  | "device"
  | "devices"
  | "evidence"
  | "analysis"
  | "timeline"
  | "report"
  | "acquisition"
  | "whatsapp"
  | "sms"
  | "calls"
  | "browser"
  | "settings"
  | "users"
  | "imaging"
  | "hashverify"
  | "recovery"
  | "classification"
  | "malware";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Cases & Acquisition",
    items: [
      { id: "cases", label: "Forensic Cases", icon: Folder },
      { id: "imaging", label: "Disk Imaging", icon: Disc },
      { id: "hashverify", label: "Hash Verification", icon: ShieldCheck },
    ],
  },
  {
    title: "Analysis & Recovery",
    items: [
      { id: "recovery", label: "Data Recovery", icon: History },
      { id: "classification", label: "AI File Classifier", icon: Binary },
      { id: "malware", label: "Malware Detection", icon: Bug },
      { id: "timeline", label: "Timeline Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "System & Records",
    items: [
      { id: "dashboard", label: "Overview", icon: LayoutDashboard },
      { id: "device", label: "Device Info", icon: Smartphone },
      { id: "evidence", label: "Evidence Viewer", icon: FolderSearch },
      { id: "whatsapp", label: "WhatsApp Decrypt", icon: MessageSquare },
      { id: "analysis", label: "AI Analysis Reports", icon: ShieldAlert, badge: 3 },
      { id: "report", label: "Report Generator", icon: FileText },
      { id: "settings", label: "Settings", icon: Settings },
      { id: "users", label: "Investigators", icon: Users },
    ],
  },
];

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onLogout: () => void;
  notificationCount: number;
  investigatorName?: string;
  investigatorBadge?: string;
  deviceSerial?: string;
  deviceModel?: string;
}

export function Sidebar({
  currentPage,
  onNavigate,
  mobileOpen,
  onMobileClose,
  onLogout,
  notificationCount,
  investigatorName = "Investigator",
  investigatorBadge = "FSL-2026-0001",
  deviceSerial,
  deviceModel,
}: SidebarProps) {
  const isUsbConnected = useUsbConnectionState(
    deviceSerial || "",
    "disconnected",
  );

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)" }}
        >
          <Zap size={17} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-foreground tracking-widest uppercase">
            Forensic AI
          </div>
          <div className="text-[10px] text-muted-foreground tracking-wide">
            Android Forensics
          </div>
        </div>
        <button
          type="button"
          className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
          onClick={onMobileClose}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* USB Status */}
      <div
        className={`mx-3 mt-3 mb-1 px-3 py-2 rounded-xl border ${
          isUsbConnected
            ? "border-emerald-500/20 bg-emerald-500/5 animate-pulse"
            : deviceSerial
              ? "border-red-500/20 bg-red-500/5"
              : "border-white/5 bg-white/5"
        }`}
      >
        <div
          className="flex items-center gap-2"
          title={
            isUsbConnected
              ? `Connected to ${deviceModel}`
              : deviceSerial
                ? "Device Disconnected"
                : "No Active Device"
          }
        >
          <span className="relative flex h-2 w-2">
            {isUsbConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isUsbConnected
                  ? "bg-emerald-500"
                  : deviceSerial
                    ? "bg-red-500"
                    : "bg-zinc-500"
              }`}
            />
          </span>
          <span
            className={`text-[11px] font-medium ${
              isUsbConnected
                ? "text-emerald-400 font-semibold"
                : deviceSerial
                  ? "text-red-400"
                  : "text-zinc-400"
            }`}
          >
            {isUsbConnected
              ? "USB Connected"
              : deviceSerial
                ? "USB Disconnected"
                : "No Device"}
          </span>
          {isUsbConnected ? (
            <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-[80px]">
              {deviceSerial || "N/A"}
            </span>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  if (typeof navigator !== "undefined" && "usb" in navigator) {
                    await (navigator as any).usb.requestDevice({ filters: [] });
                  }
                } catch (e) {
                  console.warn("User cancelled pairing:", e);
                }
              }}
              className="ml-auto text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer border border-cyan-400/30 px-1.5 py-0.5 rounded bg-cyan-400/5 transition-all"
            >
              Pair
            </button>
          )}
        </div>
      </div>

      {/* Investigator */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8 mt-1">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback
            style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)" }}
            className="text-white text-[11px] font-bold"
          >
            {investigatorName
              ? investigatorName
                  .split(" ")
                  .filter((x) => !x.includes("."))
                  .map((x) => x[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
              : "IN"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-foreground truncate">
            {investigatorName}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {investigatorBadge}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin"
        aria-label="Main navigation"
      >
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h4 className="px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 mb-1.5">
              {section.title}
            </h4>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-ocid={`nav.${item.id}.link`}
                    onClick={() => {
                      onNavigate(item.id);
                      onMobileClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      active
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    <Icon size={14} className={active ? "text-cyan-400" : ""} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge != null && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/8 pt-3">
        {notificationCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <span className="flex-1">Active Alerts</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
              {notificationCount}
            </span>
          </div>
        )}
        <button
          type="button"
          data-ocid="nav.logout.button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={16} />
          <span>End Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-30 border-r border-white/8"
        style={{
          background: "rgba(8,12,20,0.95)",
          backdropFilter: "blur(20px)",
        }}
      >
        {content}
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-64 z-50 lg:hidden border-r border-white/8"
              style={{
                background: "rgba(8,12,20,0.99)",
                backdropFilter: "blur(20px)",
              }}
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
