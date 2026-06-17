import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

export type ToastType = "success" | "warning" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    color: "#2ED47A",
    bg: "rgba(46,212,122,0.12)",
    border: "rgba(46,212,122,0.25)",
  },
  warning: {
    icon: AlertTriangle,
    color: "#F5B942",
    bg: "rgba(245,185,66,0.12)",
    border: "rgba(245,185,66,0.25)",
  },
  error: {
    icon: XCircle,
    color: "#FF4D4F",
    bg: "rgba(255,77,79,0.12)",
    border: "rgba(255,77,79,0.25)",
  },
  info: {
    icon: Info,
    color: "#37C3FF",
    bg: "rgba(55,195,255,0.12)",
    border: "rgba(55,195,255,0.25)",
  },
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const cfg = typeConfig[toast.type];
  const Icon = cfg.icon;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      data-ocid="notifications.toast"
      className="flex items-start gap-3 w-80 p-3.5 rounded-xl shadow-glass border text-sm"
      style={{
        background: cfg.bg,
        borderColor: cfg.border,
        backdropFilter: "blur(12px)",
      }}
    >
      <Icon
        size={16}
        style={{ color: cfg.color }}
        className="mt-0.5 flex-shrink-0"
      />
      <span className="flex-1 text-foreground leading-snug">
        {toast.message}
      </span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-muted-foreground hover:text-foreground transition flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <section
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </section>
  );
}
