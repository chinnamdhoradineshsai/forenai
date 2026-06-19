import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { Toaster } from "sonner";
import { createActor } from "./backend";
import {
  type Toast,
  ToastContainer,
  type ToastType,
} from "./components/NotificationToast";
import { type Page, Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { AIAnalysisPage } from "./pages/AIAnalysisPage";
import { AcquisitionPage } from "./pages/AcquisitionPage";
import { BrowserAnalysisPage } from "./pages/BrowserAnalysisPage";
import { CallAnalysisPage } from "./pages/CallAnalysisPage";
import { CaseDetailsPage } from "./pages/CaseDetailsPage";
import { CasesPage } from "./pages/CasesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DeviceInfoPage } from "./pages/DeviceInfoPage";
import { DevicesPage } from "./pages/DevicesPage";
import { EvidencePage } from "./pages/EvidencePage";
import { EvidenceViewerPage } from "./pages/EvidenceViewerPage";
import { LoginPage } from "./pages/LoginPage";
import { ReportGeneratorPage } from "./pages/ReportGeneratorPage";
import { SMSAnalysisPage } from "./pages/SMSAnalysisPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TimelineAnalyticsPage } from "./pages/TimelineAnalyticsPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { WhatsAppAnalysisPage } from "./pages/WhatsAppAnalysisPage";
import { DiskImagingPage } from "./pages/DiskImagingPage";
import { HashVerificationPage } from "./pages/HashVerificationPage";
import { DataRecoveryPage } from "./pages/DataRecoveryPage";
import { AIFileClassificationPage } from "./pages/AIFileClassificationPage";
import { MalwareDetectionPage } from "./pages/MalwareDetectionPage";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { authService } from "./services/authService";
import { deviceService } from "./services/deviceService";
import type { User } from "./types/user";

function Footer() {
  const year = new Date().getFullYear();
  const href = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;
  return (
    <footer className="text-center py-3 text-[11px] text-muted-foreground border-t border-white/10">
      © {year}. Built with ❤️ using{" "}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-400 hover:underline"
      >
        caffeine.ai
      </a>
    </footer>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    authService.getCurrentUser(),
  );
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!authService.getCurrentUser(),
  );
  const [isDark, setIsDark] = useState(true);

  // Clear legacy static device evidence caches on startup to force dynamic generation
  useState(() => {
    try {
      localStorage.removeItem("forenai_dynamic_evidence_device_s23");
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("forenai_dynamic_evidence_")) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn("Failed to clear legacy local storage caches:", e);
    }
  });
  const [currentPage, setCurrentPage] = useState<Page>("cases");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const { actor } = useActor(createActor);
  const { data: devices = [] } = useQuery({
    queryKey: ["devices", selectedCaseId, !!actor],
    queryFn: () => deviceService.getDevices(selectedCaseId, actor),
    enabled: !!selectedCaseId,
  });

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden ${isDark ? "dark" : ""}`}
      style={{
        background: isDark
          ? "linear-gradient(135deg,#070B14 0%,#0B1220 100%)"
          : "#F0F4F8",
      }}
    >
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
        notificationCount={toasts.length}
        investigatorName={currentUser?.name}
        investigatorBadge={currentUser?.badgeNumber}
        deviceSerial={selectedDevice?.serialNumber}
        deviceModel={selectedDevice?.model}
      />

      <div className="flex-1 flex flex-col min-h-0 lg:ml-64">
        <Topbar
          onMenuToggle={() => setMobileOpen(true)}
          isDark={isDark}
          onToggleDark={() => setIsDark(!isDark)}
          notificationCount={toasts.length}
          onNotificationClick={() =>
            addToast("info", "Showing all active forensic alerts.")
          }
          investigatorName={currentUser?.name}
        />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="min-h-full"
            >
              {currentPage === "cases" && (
                <CasesPage
                  onNavigate={setCurrentPage}
                  setSelectedCaseId={setSelectedCaseId}
                  investigatorName={currentUser?.name || "Investigator"}
                />
              )}
              {currentPage === "casedetails" && (
                <CaseDetailsPage
                  caseId={selectedCaseId}
                  onNavigate={setCurrentPage}
                  setSelectedDeviceId={setSelectedDeviceId}
                />
              )}
              {currentPage === "devices" && (
                <DevicesPage
                  caseId={selectedCaseId}
                  onNavigate={setCurrentPage}
                  setSelectedDeviceId={setSelectedDeviceId}
                  investigatorName={currentUser?.name || "Investigator"}
                />
              )}
              {currentPage === "dashboard" && (
                <DashboardPage
                  caseId={selectedCaseId}
                  deviceId={selectedDeviceId}
                  onNavigate={setCurrentPage}
                  investigatorName={currentUser?.name || "Investigator"}
                />
              )}
              {currentPage === "device" && (
                <DeviceInfoPage
                  caseId={selectedCaseId}
                  deviceId={selectedDeviceId}
                  investigatorBadge={
                    currentUser?.badgeNumber || ""
                  }
                  onNavigate={setCurrentPage}
                />
              )}
              {currentPage === "evidence" && (
                <EvidenceViewerPage
                  deviceId={selectedDeviceId}
                  onNavigate={setCurrentPage}
                />
              )}
              {currentPage === "analysis" && (
                <AIAnalysisPage
                  caseId={selectedCaseId}
                  deviceId={selectedDeviceId}
                />
              )}
              {currentPage === "timeline" && (
                <TimelineAnalyticsPage
                  caseId={selectedCaseId}
                  deviceId={selectedDeviceId}
                />
              )}
              {currentPage === "report" && (
                <ReportGeneratorPage
                  caseId={selectedCaseId}
                  deviceId={selectedDeviceId}
                />
              )}
              {currentPage === "acquisition" && (
                <AcquisitionPage
                  caseId={selectedCaseId}
                  deviceId={selectedDeviceId}
                  onNavigate={setCurrentPage}
                  investigatorName={currentUser?.name || "Investigator"}
                />
              )}
              {currentPage === "whatsapp" && (
                <WhatsAppAnalysisPage
                  deviceId={selectedDeviceId}
                  onNavigate={setCurrentPage}
                />
              )}
              {currentPage === "sms" && (
                <SMSAnalysisPage
                  deviceId={selectedDeviceId}
                  onNavigate={setCurrentPage}
                />
              )}
              {currentPage === "calls" && (
                <CallAnalysisPage
                  deviceId={selectedDeviceId}
                  onNavigate={setCurrentPage}
                />
              )}
              {currentPage === "browser" && (
                <BrowserAnalysisPage
                  deviceId={selectedDeviceId}
                  onNavigate={setCurrentPage}
                />
              )}
              {currentPage === "settings" && (
                <SettingsPage
                  caseId={selectedCaseId}
                  deviceId={selectedDeviceId}
                />
              )}
              {currentPage === "users" && <UserManagementPage />}
              {currentPage === "imaging" && <DiskImagingPage />}
              {currentPage === "hashverify" && <HashVerificationPage />}
              {currentPage === "recovery" && <DataRecoveryPage />}
              {currentPage === "classification" && <AIFileClassificationPage />}
              {currentPage === "malware" && <MalwareDetectionPage />}
              {currentPage === "assistant" && (
                <AIAssistantPage
                  caseId={selectedCaseId}
                  deviceId={selectedDeviceId}
                  investigatorName={currentUser?.name}
                />
              )}
            </motion.div>
          </AnimatePresence>
          <Footer />
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
}
