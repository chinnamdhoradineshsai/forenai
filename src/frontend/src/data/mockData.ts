/**
 * mockData.ts — type definitions only.
 *
 * All static evidence arrays (SMS, calls, apps, media, browser, locations,
 * timeline, alerts, chart data) have been removed. The application now fetches
 * all data exclusively from Supabase and generates evidence dynamically per
 * device using generateDynamicEvidence() in evidenceService.ts.
 *
 * This file is kept only to avoid breaking imports of the type definitions
 * that are still used across multiple components. No data is exported here.
 */

// ── Type definitions (kept for consumer compatibility) ─────────────────────

export interface DeviceInfo {
  model: string;
  manufacturer: string;
  androidVersion: string;
  serialNumber: string;
  imei: string;
  usbStatus: "connected" | "disconnected";
  extractionTimestamp: string;
  investigatorName: string;
  investigatorBadge: string;
  caseNumber: string;
  batteryLevel: number;
  storageTotal: string;
  storageUsed: string;
}

export interface SmsRecord {
  id: string;
  sender: string;
  phone: string;
  content: string;
  timestamp: string;
  direction: "incoming" | "outgoing";
  isSuspicious: boolean;
}

export interface CallRecord {
  id: string;
  caller: string;
  number: string;
  duration: string;
  timestamp: string;
  type: "incoming" | "outgoing" | "missed";
  isSuspicious: boolean;
}

export interface AppRecord {
  id: string;
  name: string;
  packageName: string;
  version: string;
  installDate: string;
  permissions: string[];
  isSuspicious: boolean;
  source: "Google Play" | "Unknown APK" | "System";
  size: string;
}

export interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "document";
  size: string;
  createdAt: string;
  isHidden: boolean;
  path: string;
  isRecovered?: boolean;
}

export interface BrowserRecord {
  id: string;
  url: string;
  title: string;
  visitCount: number;
  lastVisited: string;
  browser: string;
  isSuspicious: boolean;
}

export interface LocationRecord {
  id: string;
  lat: number;
  lng: number;
  address: string;
  timestamp: string;
  accuracy: number;
  source: string;
}

export interface ForensicAlert {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  category: string;
  timestamp: string;
}

export interface EvidenceSummary {
  sms: number;
  calls: number;
  apps: number;
  media: number;
  browser: number;
  location: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low" | "info" | "success";
}

export interface SuspiciousEvent {
  id: string;
  title: string;
  time: string;
  category: string;
  severity: "critical" | "high" | "medium";
}

// ── Empty exports for legacy compatibility ─────────────────────────────────
// Previously populated with static data. Now always empty so no hardcoded
// evidence ever reaches the UI.

export const deviceInfo: DeviceInfo = {
  model: "",
  manufacturer: "",
  androidVersion: "",
  serialNumber: "",
  imei: "",
  usbStatus: "disconnected",
  extractionTimestamp: "",
  investigatorName: "",
  investigatorBadge: "",
  caseNumber: "",
  batteryLevel: 0,
  storageTotal: "",
  storageUsed: "",
};

export const evidenceSummary: EvidenceSummary = {
  sms: 0,
  calls: 0,
  apps: 0,
  media: 0,
  browser: 0,
  location: 0,
};

// Risk values start at 0 — real values come from Supabase ai_analysis table.
export const aiRiskScore = 0;
export const suspiciousAppCount = 0;
export const totalEvidenceCount = 0;

// All evidence arrays are empty — data comes exclusively from Supabase.
export const forensicAlerts: ForensicAlert[] = [];
export const smsRecords: SmsRecord[] = [];
export const callRecords: CallRecord[] = [];
export const appRecords: AppRecord[] = [];
export const mediaFiles: MediaFile[] = [];
export const browserRecords: BrowserRecord[] = [];
export const locationRecords: LocationRecord[] = [];
export const timelineEvents: TimelineEvent[] = [];
export const recentSuspiciousEvents: SuspiciousEvent[] = [];

// Chart data is always computed dynamically from real evidence counts.
export const evidenceChartData: { name: string; value: number; color: string }[] = [];
export const activityTrendData: { time: string; events: number; suspicious: number }[] = [];

// Legacy exports kept so existing imports don't break.
export const initialBins = [];
export const initialWorkers = [];
export const initialTrucks = [];
export const initialAlerts = [];
export const initialResources = [];
export const analyticsData = [];
export const notificationPool: string[] = [];
