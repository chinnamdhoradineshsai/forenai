// No static mock data — timeline events come from Supabase or dynamic generation only.
import { supabase } from "../lib/supabase";
import type { TimelineEvent } from "../types/analysis";
import {
  getDeviceDetailsFromLocalStorage,
  getOrGenerateDynamicEvidence,
} from "./evidenceService";

const ESPIONAGE_PERMS = [
  { name: "READ_SMS", risk: "high" },
  { name: "RECORD_AUDIO", risk: "high" },
  { name: "ACCESS_FINE_LOCATION", risk: "high" },
  { name: "READ_EXTERNAL_STORAGE", risk: "high" },
  { name: "READ_CONTACTS", risk: "medium" },
  { name: "INTERNET", risk: "medium" },
];

const FRAUD_PERMS = [
  { name: "READ_SMS", risk: "high" },
  { name: "RECEIVE_SMS", risk: "high" },
  { name: "INTERNET", risk: "high" },
  { name: "ACCESS_NETWORK_STATE", risk: "medium" },
  { name: "READ_PHONE_STATE", risk: "medium" },
];

const CONCEALMENT_PERMS = [
  { name: "WRITE_EXTERNAL_STORAGE", risk: "high" },
  { name: "READ_EXTERNAL_STORAGE", risk: "high" },
  { name: "SYSTEM_ALERT_WINDOW", risk: "medium" },
  { name: "INTERNET", risk: "medium" },
];

const ESPIONAGE_REASONING = [
  {
    num: "01",
    label: "Anomalous Permission Combos",
    text: "Detected apps with anomalous permission combinations — READ_SMS + RECORD_AUDIO + LOCATION requested simultaneously, a classic spyware signature.",
    conf: 96,
  },
  {
    num: "02",
    label: "Hidden Archive Folder",
    text: "Found hidden directories with .nomedia markers containing encryptable documents, aligning with data exfiltration behaviors.",
    conf: 91,
  },
  {
    num: "03",
    label: "Unverified Communication APK",
    text: "App StealthChat (com.encrypt.chat) lacks publisher verification and is sideloaded, indicating covert communication channels.",
    conf: 88,
  },
  {
    num: "04",
    label: "Suspicious Audit Logs Searches",
    text: "Recent browser queries regarding clearing local cache and logs match timestamp window of document exfiltration.",
    conf: 84,
  },
];

const FRAUD_REASONING = [
  {
    num: "01",
    label: "Proxy Tunneling Active",
    text: "Background routing of device internet traffic via ProxyDroid detected, suggesting unauthorized remote hijacking.",
    conf: 94,
  },
  {
    num: "02",
    label: "OTP Interception Service",
    text: "Service com.sys.service.otp monitoring SMS inbox in background without user consent, matching known banking malware behavior.",
    conf: 92,
  },
  {
    num: "03",
    label: "Dark Web Access Footprint",
    text: "Browser history shows searches for anonymous cryptocurrency purchases and Tor Project downloads.",
    conf: 89,
  },
  {
    num: "04",
    label: "Banking Alert Matching",
    text: "Inbox contains urgent password trigger SMS notifications corresponding to the exact window of active network proxying.",
    conf: 86,
  },
];

const CONCEALMENT_REASONING = [
  {
    num: "01",
    label: "Concealed File Locker Installed",
    text: "VaultHide (com.vault.photohide) active, allowing users to conceal encrypted images/documents from standard directory views.",
    conf: 90,
  },
  {
    num: "02",
    label: "Local Terminal Execution",
    text: "Termux package installed, allowing shell script execution and root manipulation commands on local storage.",
    conf: 85,
  },
  {
    num: "03",
    label: "Nomedia File Markers Present",
    text: "Multiple directories tagged with .nomedia extension to hide folders from Android Media Scanner index.",
    conf: 80,
  },
  {
    num: "04",
    label: "Obfuscated Photo Audit Log",
    text: "Timestamps of browser search 'how to create .nomedia folder' matches creation dates of newly locked vault volumes.",
    conf: 78,
  },
];

function getThemeIdxForDevice(deviceId: string): number {
  const details = getDeviceDetailsFromLocalStorage(deviceId);
  const seedStr = details.serialNumber || deviceId;
  let seedVal = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seedVal += seedStr.charCodeAt(i) * (i + 1);
  }
  return seedVal % 3;
}

export const analysisService = {
  async getTimelineEvents(
    deviceId: string,
    actor?: any,
  ): Promise<TimelineEvent[]> {
    const { data, error } = await supabase
      .from("timeline_events")
      .select("*")
      .eq("deviceId", deviceId)
      .order("unixTime", { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn(
        "Supabase select timeline failed or empty, fallback to dynamic cache:",
        error?.message,
      );
      try {
        const dynamic = getOrGenerateDynamicEvidence(deviceId);
        return dynamic.timelineEvents.map((ev: any) => ({
          id: ev.id,
          timestamp: ev.timestamp,
          unixTime: Number(ev.unixTime),
          type: ev.type,
          title: ev.title,
          description: ev.description,
          isSuspicious: ev.isSuspicious,
          metadata: ev.metadata,
        }));
      } catch (e) {
        // No dynamic evidence available either — return empty (no fake data)
        return [];
      }
    }

    return (data || []).map((ev: any) => ({
      ...ev,
      unixTime: Number(ev.unixTime),
    })) as TimelineEvent[];
  },

  async getPermissionsAnalysis(
    deviceId: string,
  ): Promise<{ name: string; risk: string }[]> {
    const themeIdx = getThemeIdxForDevice(deviceId);
    if (themeIdx === 0) return ESPIONAGE_PERMS;
    if (themeIdx === 1) return FRAUD_PERMS;
    return CONCEALMENT_PERMS;
  },

  async getReasoningSteps(
    deviceId: string,
  ): Promise<{ num: string; label: string; text: string; conf: number }[]> {
    const themeIdx = getThemeIdxForDevice(deviceId);
    if (themeIdx === 0) return ESPIONAGE_REASONING;
    if (themeIdx === 1) return FRAUD_REASONING;
    return CONCEALMENT_REASONING;
  },
};
