import { supabase } from "../lib/supabase";
import { safeSetItem } from "../lib/safeStorage";
import type { Device, DeviceInput } from "../types/device";
import { authService } from "./authService";

function getInvestigatorName(): string {
  const user = authService.getCurrentUser();
  return user?.name || "Investigator";
}

export const deviceService = {
  async getDevices(caseId: string, actor?: any): Promise<Device[]> {
    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("caseId", caseId);

    if (error) {
      console.warn(
        "Supabase select devices failed, fallback to local storage:",
        error.message,
      );
      const stored = localStorage.getItem(`forenai_devices_${caseId}`);
      if (stored) {
        const list = JSON.parse(stored);
        return list.map((item: any) => ({
          ...item,
          batteryLevel: BigInt(item.batteryLevel),
        }));
      }
      return [];
    }

    return (data || []).map((d: any) => ({
      ...d,
      batteryLevel: BigInt(d.batteryLevel),
    }));
  },

  async addDevice(input: DeviceInput, actor?: any): Promise<Device> {
    const newDevice = {
      id: "device_" + input.serialNumber,
      caseId: input.caseId,
      model: input.model,
      manufacturer: input.manufacturer,
      androidVersion: input.androidVersion,
      serialNumber: input.serialNumber,
      imei: input.imei,
      usbStatus: "connected",
      batteryLevel: Number(input.batteryLevel),
      storageTotal: input.storageTotal,
      storageUsed: input.storageUsed,
      extractionStatus: "idle",
      lastExtractionTimestamp: "",
      securityPatch: input.securityPatch || "",
      buildNumber: input.buildNumber || "",
      modelNumber: input.modelNumber || "",
      deviceFingerprint: input.deviceFingerprint || "",
      bootloaderStatus: input.bootloaderStatus || "Locked",
      rootStatus: input.rootStatus || "Not Rooted — Stock ROM",
      macAddress: input.macAddress || "",
    };
    localStorage.setItem(
      `forenai_device_details_${newDevice.id}`,
      JSON.stringify(newDevice),
    );

    const { data, error } = await supabase
      .from("devices")
      .upsert([newDevice])
      .select()
      .single();

    if (error) {
      console.warn(
        "Supabase upsert device failed, fallback to local storage:",
        error.message,
      );
      const stored = localStorage.getItem(`forenai_devices_${input.caseId}`);
      const list = stored ? JSON.parse(stored) : [];
      const created: Device = {
        ...newDevice,
        batteryLevel: BigInt(newDevice.batteryLevel),
      };
      const existingIndex = list.findIndex((d: any) => d.id === created.id);
      if (existingIndex !== -1) {
        list[existingIndex] = created;
      } else {
        list.push(created);
      }
      safeSetItem(
        `forenai_devices_${input.caseId}`,
        JSON.stringify(list, (_, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      );

      const logsStored = localStorage.getItem(`forenai_logs_${input.caseId}`);
      const logs = logsStored ? JSON.parse(logsStored) : [];
      logs.push({
        id: `log_${input.caseId}_dev_${input.serialNumber}_${Date.now()}`,
        caseId: input.caseId,
        action: "Device Registered",
        investigator: getInvestigatorName(),
        timestamp: BigInt(Date.now()),
        details: `Device ${input.model} (S/N: ${input.serialNumber}) registered/reconnected locally.`,
      });
      safeSetItem(
        `forenai_logs_${input.caseId}`,
        JSON.stringify(logs, (_, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      );

      return created;
    }

    return {
      ...data,
      batteryLevel: BigInt(data.batteryLevel),
    };
  },

  async updateExtractionStatus(
    deviceId: string,
    caseId: string,
    status: string,
    timestamp: string,
    actor?: any,
  ): Promise<boolean> {
    const { error } = await supabase
      .from("devices")
      .update({ extractionStatus: status, lastExtractionTimestamp: timestamp })
      .eq("id", deviceId);

    if (error) {
      console.warn(
        "Supabase update device status failed, fallback to local storage:",
        error.message,
      );
      const stored = localStorage.getItem(`forenai_devices_${caseId}`);
      if (!stored) return false;
      const list = JSON.parse(stored);
      const index = list.findIndex((d: any) => d.id === deviceId);
      if (index === -1) return false;
      list[index].extractionStatus = status;
      list[index].lastExtractionTimestamp = timestamp;
      safeSetItem(
        `forenai_devices_${caseId}`,
        JSON.stringify(list, (_, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      );

      if (status === "completed") {
        localStorage.setItem(`forenai_evidence_extracted_${deviceId}`, "true");
        const logsStored = localStorage.getItem(`forenai_logs_${caseId}`);
        const logs = logsStored ? JSON.parse(logsStored) : [];
        logs.push({
          id: `log_${caseId}_extraction_completed_${Date.now()}`,
          caseId,
          action: "Extraction Completed",
          investigator: getInvestigatorName(),
          timestamp: BigInt(Date.now()),
          details: `Forensic data acquisition complete for device ${deviceId}.`,
        });
        safeSetItem(
          `forenai_logs_${caseId}`,
          JSON.stringify(logs, (_, v) =>
            typeof v === "bigint" ? v.toString() : v,
          ),
        );
      }
      return true;
    }

    if (status === "completed") {
      localStorage.setItem(`forenai_evidence_extracted_${deviceId}`, "true");
    }

    return true;
  },

  async triggerMockEvidence(deviceId: string, actor?: any): Promise<boolean> {
    // With Supabase, in development mode we can seed the records in the Supabase tables
    // Or return true for local mock parsing fallbacks.
    localStorage.setItem(`forenai_evidence_extracted_${deviceId}`, "true");
    return true;
  },

  async deleteDevice(
    deviceId: string,
    caseId: string,
    actor?: any,
  ): Promise<boolean> {
    // 1. Delete from Supabase
    const { error } = await supabase
      .from("devices")
      .delete()
      .eq("id", deviceId);

    if (error) {
      console.warn(
        "Supabase delete device failed, fallback to local storage:",
        error.message,
      );
    }

    // 2. Local storage cleanups
    localStorage.removeItem(`forenai_device_details_${deviceId}`);
    localStorage.removeItem(`forenai_evidence_extracted_${deviceId}`);
    localStorage.removeItem(`forenai_dynamic_evidence_${deviceId}`);
    localStorage.removeItem(`forenai_whatsapp_chats_${deviceId}`);

    // Filter out from case devices array
    const stored = localStorage.getItem(`forenai_devices_${caseId}`);
    if (stored) {
      const list = JSON.parse(stored);
      const filtered = list.filter((d: any) => d.id !== deviceId);
      safeSetItem(
        `forenai_devices_${caseId}`,
        JSON.stringify(filtered, (_, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      );
    }

    // Add a deletion entry in audit logs
    try {
      const logId = `log_${caseId}_dev_deleted_${Date.now()}`;

      // Local storage logs
      const logsStored = localStorage.getItem(`forenai_logs_${caseId}`);
      const logs = logsStored ? JSON.parse(logsStored) : [];
      logs.push({
        id: logId,
        caseId,
        action: "Device Removed",
        investigator: getInvestigatorName(),
        timestamp: BigInt(Date.now()),
        details: `Device ${deviceId} was deleted and all its extracted evidence was removed from the tool.`,
      });
      safeSetItem(
        `forenai_logs_${caseId}`,
        JSON.stringify(logs, (_, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      );

      // Supabase audit_logs
      await supabase.from("audit_logs").insert([
        {
          id: logId,
          caseId,
          action: "Device Removed",
          investigator: getInvestigatorName(),
          timestamp: Date.now(),
          details: `Device ${deviceId} was deleted and all its extracted evidence was removed from the tool.`,
        },
      ]);
    } catch (e) {
      console.warn("Failed to write deletion audit log:", e);
    }

    return true;
  },
};
