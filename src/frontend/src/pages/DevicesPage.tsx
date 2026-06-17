import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Shield,
  Smartphone,
  Usb,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import { DeviceCard } from "../components/DeviceCard";
import type { Page } from "../components/Sidebar";
import { deviceService } from "../services/deviceService";
import { evidenceService } from "../services/evidenceService";
import { webadbService } from "../services/webadbService";

interface DevicesPageProps {
  caseId: string;
  onNavigate: (page: Page) => void;
  setSelectedDeviceId: (id: string) => void;
  investigatorName: string;
}

export function DevicesPage({
  caseId,
  onNavigate,
  setSelectedDeviceId,
  investigatorName,
}: DevicesPageProps) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [realAdbLoading, setRealAdbLoading] = useState(false);
  const [adbError, setAdbError] = useState<string | null>(null);

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

  const connectRealDevice = async () => {
    setRealAdbLoading(true);
    setAdbError(null);
    try {
      const result = await webadbService.acquireRealDevice();

      const createdDevice = await deviceService.addDevice(
        {
          caseId,
          model: result.model,
          manufacturer: result.manufacturer,
          androidVersion: result.androidVersion,
          serialNumber: result.serialNumber,
          imei: result.imei,
          batteryLevel: result.batteryLevel,
          storageTotal: result.storageTotal,
          storageUsed: result.storageUsed,
          securityPatch: result.securityPatch,
          buildNumber: result.buildNumber,
          modelNumber: result.modelNumber,
          deviceFingerprint: result.deviceFingerprint,
          bootloaderStatus: result.bootloaderStatus,
          rootStatus: result.rootStatus,
          macAddress: result.macAddress,
        },
        actor,
      );

      await evidenceService.seedRealDeviceEvidence(
        createdDevice.id,
        caseId,
        result,
        investigatorName,
      );

      queryClient.invalidateQueries({ queryKey: ["devices", caseId] });
      setSimulatorOpen(false);
    } catch (err: any) {
      console.error(err);
      setAdbError(
        err.message ||
          "Failed to establish USB connection. Please verify USB debugging is enabled on your phone.",
      );
    } finally {
      setRealAdbLoading(false);
    }
  };

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["devices", caseId],
    queryFn: () => deviceService.getDevices(caseId, actor),
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back button */}
      <button
        type="button"
        onClick={() => onNavigate("casedetails")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back to Case Overview
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              Target Evidence Devices
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect and inspect mobile hardware for forensic acquisition
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSimulatorOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #0ea5e9, #22d3ee)",
            boxShadow: "0 0 15px rgba(34, 211, 238, 0.3)",
          }}
        >
          <Usb size={14} />
          Connect USB Device
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-cyan-400" size={24} />
        </div>
      ) : devices.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground space-y-4">
          <div>
            No evidence devices registered. Connect a device via USB to start
            acquisition.
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              onClick={() => {
                setSelectedDeviceId(d.id);
                onNavigate("device");
              }}
              onDelete={() => handleDeleteDevice(d.id)}
            />
          ))}
        </div>
      )}

      {/* Simulator Modal */}
      {simulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSimulatorOpen(false)}
          />
          <div className="relative w-full max-w-md glass-card p-6 md:p-8 space-y-6 z-10">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Usb size={16} className="text-cyan-400" />
              Connect Evidence Device
            </h3>

            {webadbService.isSupported() ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-cyan-950/20 border border-cyan-800/30 rounded-xl space-y-2">
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Requires enabling <strong>USB Debugging</strong> in your
                    phone's Developer Options, and connecting via USB.
                  </p>
                  <button
                    type="button"
                    onClick={connectRealDevice}
                    disabled={realAdbLoading}
                    className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {realAdbLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Authorizing phone...
                      </>
                    ) : (
                      "Scan & Connect Real Phone"
                    )}
                  </button>
                  {adbError && (
                    <p className="text-[10px] text-red-400 mt-1 leading-normal font-semibold">
                      {adbError}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-red-950/20 border border-red-800/30 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-red-400">
                  Browser Unsupported
                </h4>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  WebUSB / WebADB is not supported in this browser. Please use
                  Google Chrome, Microsoft Edge, or another Chromium-based
                  browser to run real device acquisitions.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
