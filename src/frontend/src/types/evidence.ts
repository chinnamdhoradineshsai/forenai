export interface SmsRecord {
  id: string;
  deviceId: string;
  sender: string;
  phone: string;
  content: string;
  timestamp: string;
  direction: string;
  isSuspicious: boolean;
  isRecovered?: boolean;
}

export interface CallRecord {
  id: string;
  deviceId: string;
  caller: string;
  number: string;
  duration: string;
  timestamp: string;
  callType: string;
  isSuspicious: boolean;
  isRecovered?: boolean;
}

export interface AppRecord {
  id: string;
  deviceId: string;
  name: string;
  packageName: string;
  version: string;
  installDate: string;
  permissions: string[];
  isSuspicious: boolean;
  source: string;
  size: string;
}

export interface MediaFile {
  id: string;
  deviceId: string;
  name: string;
  fileType: string;
  size: string;
  createdAt: string;
  isHidden: boolean;
  path: string;
  isRecovered?: boolean;
}

export interface BrowserRecord {
  id: string;
  deviceId: string;
  url: string;
  title: string;
  visitCount: bigint;
  lastVisited: string;
  browser: string;
  isSuspicious: boolean;
  isRecovered?: boolean;
}

export interface LocationRecord {
  id: string;
  deviceId: string;
  lat: number;
  lng: number;
  address: string;
  timestamp: string;
  accuracy: bigint;
  source: string;
  isRecovered?: boolean;
}

export interface ForensicAlert {
  id: string;
  deviceId: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  caseId: string;
  action: string;
  investigator: string;
  timestamp: bigint;
  details: string;
}

export type EvidenceRecord =
  | { type: "sms"; data: SmsRecord }
  | { type: "call"; data: CallRecord }
  | { type: "app"; data: AppRecord }
  | { type: "media"; data: MediaFile }
  | { type: "browser"; data: BrowserRecord }
  | { type: "location"; data: LocationRecord };
