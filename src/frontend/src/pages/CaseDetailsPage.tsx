import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  Folder,
  Loader2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import { DeviceCard } from "../components/DeviceCard";
import { InvestigationSummaryCard } from "../components/InvestigationSummaryCard";
import type { Page } from "../components/Sidebar";
import { caseService } from "../services/caseService";
import { deviceService } from "../services/deviceService";
import { evidenceService } from "../services/evidenceService";
import { AuditLogsPage } from "./AuditLogsPage";

interface CaseDetailsPageProps {
  caseId: string;
  onNavigate: (page: Page) => void;
  setSelectedDeviceId: (id: string) => void;
}

type Tab = "overview" | "devices" | "audit";

export function CaseDetailsPage({
  caseId,
  onNavigate,
  setSelectedDeviceId,
}: CaseDetailsPageProps) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const handleDeleteDevice = async (deviceId: string) => {
    if (
      confirm(
        "Are you sure you want to permanently delete this device and all its extracted evidence? This action cannot be undone.",
      )
    ) {
      const toastId = toast.loading("Deleting target device...");
      try {
        await deviceService.deleteDevice(deviceId, caseId, actor);
        toast.success("Device and associated evidence deleted successfully", {
          id: toastId,
        });
        queryClient.invalidateQueries({ queryKey: ["devices", caseId] });
      } catch (err) {
        console.error("Failed to delete device:", err);
        toast.error("Failed to delete device. Please try again.", {
          id: toastId,
        });
      }
    }
  };

  // Fetch Cases to find this case details
  const { data: cases = [] } = useQuery({
    queryKey: ["cases", !!actor],
    queryFn: () => caseService.getAllCases(actor),
  });

  const currentCase = cases.find((c) => c.id === caseId);

  // Fetch Devices associated with this case
  const { data: devices = [], isLoading: loadingDevices } = useQuery({
    queryKey: ["devices", caseId, !!actor],
    queryFn: () => deviceService.getDevices(caseId, actor),
  });

  // Fetch Audit Logs
  const { data: auditLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["auditLogs", caseId, !!actor],
    queryFn: () => evidenceService.getAuditLogs(caseId, actor),
  });

  const firstDevice = devices[0];
  const firstDeviceId = firstDevice?.id;
  const isExtracted = firstDevice?.extractionStatus === "completed";

  // Fetch counts dynamically
  const { data: sms = [] } = useQuery({
    queryKey: ["sms", firstDeviceId, !!actor],
    queryFn: () => evidenceService.getSmsRecords(firstDeviceId || "", actor),
    enabled: !!firstDeviceId && isExtracted,
  });

  const { data: calls = [] } = useQuery({
    queryKey: ["calls", firstDeviceId, !!actor],
    queryFn: () => evidenceService.getCallRecords(firstDeviceId || "", actor),
    enabled: !!firstDeviceId && isExtracted,
  });

  const { data: apps = [] } = useQuery({
    queryKey: ["apps", firstDeviceId, !!actor],
    queryFn: () => evidenceService.getAppRecords(firstDeviceId || "", actor),
    enabled: !!firstDeviceId && isExtracted,
  });

  const { data: media = [] } = useQuery({
    queryKey: ["media", firstDeviceId, !!actor],
    queryFn: () => evidenceService.getMediaFiles(firstDeviceId || "", actor),
    enabled: !!firstDeviceId && isExtracted,
  });

  const { data: browser = [] } = useQuery({
    queryKey: ["browser", firstDeviceId, !!actor],
    queryFn: () =>
      evidenceService.getBrowserRecords(firstDeviceId || "", actor),
    enabled: !!firstDeviceId && isExtracted,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations", firstDeviceId, !!actor],
    queryFn: () =>
      evidenceService.getLocationRecords(firstDeviceId || "", actor),
    enabled: !!firstDeviceId && isExtracted,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts", firstDeviceId, !!actor],
    queryFn: () => evidenceService.getAlerts(firstDeviceId || "", actor),
    enabled: !!firstDeviceId && isExtracted,
  });

  const dynamicEvidenceCount = isExtracted
    ? sms.length +
      calls.length +
      apps.length +
      media.length +
      browser.length +
      locations.length
    : 0;

  const dynamicAlertsCount = isExtracted ? alerts.length : 0;

  if (!currentCase) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="animate-spin mx-auto text-cyan-400 mb-2" />
        Loading Case Details...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back to Cases */}
      <button
        type="button"
        onClick={() => onNavigate("cases")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back to Forensic Cases
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 justify-between flex-wrap">
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
            {currentCase.caseNumber}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {currentCase.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            Investigator: {currentCase.investigator}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 gap-4">
        {[
          { id: "overview", label: "Overview", icon: Folder },
          { id: "devices", label: "Evidence Devices", icon: Smartphone },
          { id: "audit", label: "Audit Ledger", icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                active
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <InvestigationSummaryCard
            kase={currentCase}
            device={devices[0]}
            alertsCount={dynamicAlertsCount}
            evidenceCount={dynamicEvidenceCount}
          />
        )}

        {activeTab === "devices" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Target Devices ({devices.length})
              </h3>
              <button
                type="button"
                onClick={() => onNavigate("devices")}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                + Connect Device
              </button>
            </div>

            {loadingDevices ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-cyan-400" />
              </div>
            ) : devices.length === 0 ? (
              <div className="glass-card p-10 text-center text-muted-foreground">
                No forensic devices registered to this case yet.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((dev) => (
                  <DeviceCard
                    key={dev.id}
                    device={dev}
                    onClick={() => {
                      setSelectedDeviceId(dev.id);
                      onNavigate("device");
                    }}
                    onDelete={() => handleDeleteDevice(dev.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "audit" && <AuditLogsPage caseId={caseId} />}
      </div>
    </div>
  );
}
