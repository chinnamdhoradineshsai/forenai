export interface Device {
  id: string;
  caseId: string;
  model: string;
  manufacturer: string;
  androidVersion: string;
  serialNumber: string;
  imei: string;
  usbStatus: string;
  batteryLevel: bigint;
  storageTotal: string;
  storageUsed: string;
  extractionStatus: string;
  lastExtractionTimestamp: string;
  securityPatch?: string;
  buildNumber?: string;
  modelNumber?: string;
  deviceFingerprint?: string;
  bootloaderStatus?: string;
  rootStatus?: string;
  macAddress?: string;
}

export interface DeviceInput {
  caseId: string;
  model: string;
  manufacturer: string;
  androidVersion: string;
  serialNumber: string;
  imei: string;
  batteryLevel: bigint;
  storageTotal: string;
  storageUsed: string;
  securityPatch?: string;
  buildNumber?: string;
  modelNumber?: string;
  deviceFingerprint?: string;
  bootloaderStatus?: string;
  rootStatus?: string;
  macAddress?: string;
}
