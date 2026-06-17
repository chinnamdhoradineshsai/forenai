import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Bell,
  ChevronDown,
  Menu,
  Moon,
  Search,
  Shield,
  Sun,
} from "lucide-react";

interface TopbarProps {
  onMenuToggle: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  notificationCount: number;
  onNotificationClick: () => void;
  investigatorName?: string;
}

export function Topbar({
  onMenuToggle,
  isDark,
  onToggleDark,
  notificationCount,
  onNotificationClick,
  investigatorName = "Investigator",
}: TopbarProps) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-white/8"
      style={{
        background: isDark ? "rgba(6,9,16,0.88)" : "rgba(240,244,248,0.88)",
        backdropFilter: "blur(16px)",
      }}
    >
      <button
        type="button"
        data-ocid="topbar.menu.button"
        className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition"
        onClick={onMenuToggle}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Brand badge */}
      <div className="hidden lg:flex items-center gap-2 mr-2">
        <Shield size={15} className="text-cyan-400" />
        <span className="text-xs font-semibold text-cyan-400/80 tracking-wider uppercase">
          Forensic AI
        </span>
        <span className="text-xs text-muted-foreground">/ Case Details</span>
      </div>

      <div className="flex-1 max-w-sm relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          data-ocid="topbar.search.input"
          type="text"
          placeholder="Search evidence, apps, calls…"
          className="w-full pl-8 pr-4 py-1.5 text-xs rounded-full border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition"
          style={{
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
          }}
        />
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <button
          type="button"
          data-ocid="topbar.theme.toggle"
          onClick={onToggleDark}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/8 transition"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          type="button"
          data-ocid="topbar.notifications.button"
          onClick={onNotificationClick}
          className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/8 transition"
          aria-label="Notifications"
        >
          <Bell size={16} />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {Math.min(notificationCount, 9)}
            </span>
          )}
        </button>

        <button
          type="button"
          data-ocid="topbar.user.button"
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/8 transition"
        >
          <Avatar className="w-7 h-7">
            <AvatarFallback
              style={{
                background: "linear-gradient(135deg,#06b6d4,#6366f1)",
                fontSize: "10px",
              }}
              className="text-white font-bold"
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
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-foreground leading-none">
              {investigatorName}
            </div>
            <div className="text-[10px] text-muted-foreground leading-none mt-0.5">
              Investigator
            </div>
          </div>
          <ChevronDown
            size={12}
            className="text-muted-foreground hidden sm:block"
          />
        </button>
      </div>
    </header>
  );
}
