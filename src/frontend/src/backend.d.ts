import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export interface Case {
    id: string;
    caseNumber: string;
    name: string;
    description: string;
    investigator: string;
    status: string;
    createdTimestamp: bigint;
}
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
export interface SmsRecord {
    id: string;
    deviceId: string;
    sender: string;
    phone: string;
    content: string;
    timestamp: string;
    direction: string;
    isSuspicious: boolean;
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
}
export interface AppRecord {
    id: string;
    deviceId: string;
    name: string;
    packageName: string;
    version: string;
    installDate: string;
    permissions: Array<string>;
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
}
export interface AuditLog {
    id: string;
    caseId: string;
    action: string;
    investigator: string;
    timestamp: bigint;
    details: string;
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

export interface backendInterface {
    getAllCases(): Promise<Array<Case>>;
    createCase(caseNumber: string, name: string, description: string, investigator: string): Promise<Case>;
    updateCaseStatus(id: string, status: string): Promise<boolean>;
    getDevices(caseId: string): Promise<Array<Device>>;
    addDevice(caseId: string, model: string, manufacturer: string, androidVersion: string, serialNumber: string, imei: string, batteryLevel: bigint, storageTotal: string, storageUsed: string): Promise<Device>;
    updateDeviceExtractionStatus(deviceId: string, status: string, timestamp: string): Promise<boolean>;
    getSmsRecords(deviceId: string): Promise<Array<SmsRecord>>;
    getCallRecords(deviceId: string): Promise<Array<CallRecord>>;
    getAppRecords(deviceId: string): Promise<Array<AppRecord>>;
    getMediaFiles(deviceId: string): Promise<Array<MediaFile>>;
    getBrowserRecords(deviceId: string): Promise<Array<BrowserRecord>>;
    getLocationRecords(deviceId: string): Promise<Array<LocationRecord>>;
    getAlerts(deviceId: string): Promise<Array<ForensicAlert>>;
    getAuditLogs(caseId: string): Promise<Array<AuditLog>>;
    addAuditLog(caseId: string, action: string, investigator: string, details: string): Promise<AuditLog>;
    addMockEvidence(deviceId: string): Promise<boolean>;
}
