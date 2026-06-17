/* eslint-disable */
// @ts-nocheck
import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export interface Case {
  'id' : string,
  'caseNumber' : string,
  'name' : string,
  'description' : string,
  'investigator' : string,
  'status' : string,
  'createdTimestamp' : bigint,
}
export interface Device {
  'id' : string,
  'caseId' : string,
  'model' : string,
  'manufacturer' : string,
  'androidVersion' : string,
  'serialNumber' : string,
  'imei' : string,
  'usbStatus' : string,
  'batteryLevel' : bigint,
  'storageTotal' : string,
  'storageUsed' : string,
  'extractionStatus' : string,
  'lastExtractionTimestamp' : string,
  'securityPatch'?: string,
  'buildNumber'?: string,
  'modelNumber'?: string,
  'deviceFingerprint'?: string,
  'bootloaderStatus'?: string,
  'rootStatus'?: string,
  'macAddress'?: string,
}
export interface SmsRecord {
  'id' : string,
  'deviceId' : string,
  'sender' : string,
  'phone' : string,
  'content' : string,
  'timestamp' : string,
  'direction' : string,
  'isSuspicious' : boolean,
}
export interface CallRecord {
  'id' : string,
  'deviceId' : string,
  'caller' : string,
  'number' : string,
  'duration' : string,
  'timestamp' : string,
  'callType' : string,
  'isSuspicious' : boolean,
}
export interface AppRecord {
  'id' : string,
  'deviceId' : string,
  'name' : string,
  'packageName' : string,
  'version' : string,
  'installDate' : string,
  'permissions' : Array<string>,
  'isSuspicious' : boolean,
  'source' : string,
  'size' : string,
}
export interface MediaFile {
  'id' : string,
  'deviceId' : string,
  'name' : string,
  'fileType' : string,
  'size' : string,
  'createdAt' : string,
  'isHidden' : boolean,
  'path' : string,
}
export interface BrowserRecord {
  'id' : string,
  'deviceId' : string,
  'url' : string,
  'title' : string,
  'visitCount' : bigint,
  'lastVisited' : string,
  'browser' : string,
  'isSuspicious' : boolean,
}
export interface LocationRecord {
  'id' : string,
  'deviceId' : string,
  'lat' : number,
  'lng' : number,
  'address' : string,
  'timestamp' : string,
  'accuracy' : bigint,
  'source' : string,
}
export interface AuditLog {
  'id' : string,
  'caseId' : string,
  'action' : string,
  'investigator' : string,
  'timestamp' : bigint,
  'details' : string,
}
export interface ForensicAlert {
  'id' : string,
  'deviceId' : string,
  'title' : string,
  'description' : string,
  'severity' : string,
  'category' : string,
  'timestamp' : string,
}
export interface _SERVICE {
  'getAllCases' : ActorMethod<[], Array<Case>>,
  'createCase' : ActorMethod<[string, string, string, string], Case>,
  'updateCaseStatus' : ActorMethod<[string, string], boolean>,
  'getDevices' : ActorMethod<[string], Array<Device>>,
  'addDevice' : ActorMethod<[string, string, string, string, string, string, bigint, string, string], Device>,
  'updateDeviceExtractionStatus' : ActorMethod<[string, string, string], boolean>,
  'getSmsRecords' : ActorMethod<[string], Array<SmsRecord>>,
  'getCallRecords' : ActorMethod<[string], Array<CallRecord>>,
  'getAppRecords' : ActorMethod<[string], Array<AppRecord>>,
  'getMediaFiles' : ActorMethod<[string], Array<MediaFile>>,
  'getBrowserRecords' : ActorMethod<[string], Array<BrowserRecord>>,
  'getLocationRecords' : ActorMethod<[string], Array<LocationRecord>>,
  'getAlerts' : ActorMethod<[string], Array<ForensicAlert>>,
  'getAuditLogs' : ActorMethod<[string], Array<AuditLog>>,
  'addAuditLog' : ActorMethod<[string, string, string, string], AuditLog>,
  'addMockEvidence' : ActorMethod<[string], boolean>,
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];