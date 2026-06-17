/* eslint-disable */
// @ts-nocheck
import { IDL } from '@icp-sdk/core/candid';

export const Case = IDL.Record({
  'id' : IDL.Text,
  'caseNumber' : IDL.Text,
  'name' : IDL.Text,
  'description' : IDL.Text,
  'investigator' : IDL.Text,
  'status' : IDL.Text,
  'createdTimestamp' : IDL.Int,
});

export const Device = IDL.Record({
  'id' : IDL.Text,
  'caseId' : IDL.Text,
  'model' : IDL.Text,
  'manufacturer' : IDL.Text,
  'androidVersion' : IDL.Text,
  'serialNumber' : IDL.Text,
  'imei' : IDL.Text,
  'usbStatus' : IDL.Text,
  'batteryLevel' : IDL.Nat,
  'storageTotal' : IDL.Text,
  'storageUsed' : IDL.Text,
  'extractionStatus' : IDL.Text,
  'lastExtractionTimestamp' : IDL.Text,
});

export const SmsRecord = IDL.Record({
  'id' : IDL.Text,
  'deviceId' : IDL.Text,
  'sender' : IDL.Text,
  'phone' : IDL.Text,
  'content' : IDL.Text,
  'timestamp' : IDL.Text,
  'direction' : IDL.Text,
  'isSuspicious' : IDL.Bool,
});

export const CallRecord = IDL.Record({
  'id' : IDL.Text,
  'deviceId' : IDL.Text,
  'caller' : IDL.Text,
  'number' : IDL.Text,
  'duration' : IDL.Text,
  'timestamp' : IDL.Text,
  'callType' : IDL.Text,
  'isSuspicious' : IDL.Bool,
});

export const AppRecord = IDL.Record({
  'id' : IDL.Text,
  'deviceId' : IDL.Text,
  'name' : IDL.Text,
  'packageName' : IDL.Text,
  'version' : IDL.Text,
  'installDate' : IDL.Text,
  'permissions' : IDL.Vec(IDL.Text),
  'isSuspicious' : IDL.Bool,
  'source' : IDL.Text,
  'size' : IDL.Text,
});

export const MediaFile = IDL.Record({
  'id' : IDL.Text,
  'deviceId' : IDL.Text,
  'name' : IDL.Text,
  'fileType' : IDL.Text,
  'size' : IDL.Text,
  'createdAt' : IDL.Text,
  'isHidden' : IDL.Bool,
  'path' : IDL.Text,
});

export const BrowserRecord = IDL.Record({
  'id' : IDL.Text,
  'deviceId' : IDL.Text,
  'url' : IDL.Text,
  'title' : IDL.Text,
  'visitCount' : IDL.Nat,
  'lastVisited' : IDL.Text,
  'browser' : IDL.Text,
  'isSuspicious' : IDL.Bool,
});

export const LocationRecord = IDL.Record({
  'id' : IDL.Text,
  'deviceId' : IDL.Text,
  'lat' : IDL.Float64,
  'lng' : IDL.Float64,
  'address' : IDL.Text,
  'timestamp' : IDL.Text,
  'accuracy' : IDL.Nat,
  'source' : IDL.Text,
});

export const AuditLog = IDL.Record({
  'id' : IDL.Text,
  'caseId' : IDL.Text,
  'action' : IDL.Text,
  'investigator' : IDL.Text,
  'timestamp' : IDL.Int,
  'details' : IDL.Text,
});

export const ForensicAlert = IDL.Record({
  'id' : IDL.Text,
  'deviceId' : IDL.Text,
  'title' : IDL.Text,
  'description' : IDL.Text,
  'severity' : IDL.Text,
  'category' : IDL.Text,
  'timestamp' : IDL.Text,
});

export const idlService = IDL.Service({
  'getAllCases' : IDL.Func([], [IDL.Vec(Case)], ['query']),
  'createCase' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [Case], []),
  'updateCaseStatus' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
  'getDevices' : IDL.Func([IDL.Text], [IDL.Vec(Device)], ['query']),
  'addDevice' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Text, IDL.Text], [Device], []),
  'updateDeviceExtractionStatus' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
  'getSmsRecords' : IDL.Func([IDL.Text], [IDL.Vec(SmsRecord)], ['query']),
  'getCallRecords' : IDL.Func([IDL.Text], [IDL.Vec(CallRecord)], ['query']),
  'getAppRecords' : IDL.Func([IDL.Text], [IDL.Vec(AppRecord)], ['query']),
  'getMediaFiles' : IDL.Func([IDL.Text], [IDL.Vec(MediaFile)], ['query']),
  'getBrowserRecords' : IDL.Func([IDL.Text], [IDL.Vec(BrowserRecord)], ['query']),
  'getLocationRecords' : IDL.Func([IDL.Text], [IDL.Vec(LocationRecord)], ['query']),
  'getAlerts' : IDL.Func([IDL.Text], [IDL.Vec(ForensicAlert)], ['query']),
  'getAuditLogs' : IDL.Func([IDL.Text], [IDL.Vec(AuditLog)], ['query']),
  'addAuditLog' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [AuditLog], []),
  'addMockEvidence' : IDL.Func([IDL.Text], [IDL.Bool], []),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const Case = IDL.Record({
    'id' : IDL.Text,
    'caseNumber' : IDL.Text,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'investigator' : IDL.Text,
    'status' : IDL.Text,
    'createdTimestamp' : IDL.Int,
  });
  
  const Device = IDL.Record({
    'id' : IDL.Text,
    'caseId' : IDL.Text,
    'model' : IDL.Text,
    'manufacturer' : IDL.Text,
    'androidVersion' : IDL.Text,
    'serialNumber' : IDL.Text,
    'imei' : IDL.Text,
    'usbStatus' : IDL.Text,
    'batteryLevel' : IDL.Nat,
    'storageTotal' : IDL.Text,
    'storageUsed' : IDL.Text,
    'extractionStatus' : IDL.Text,
    'lastExtractionTimestamp' : IDL.Text,
  });
  
  const SmsRecord = IDL.Record({
    'id' : IDL.Text,
    'deviceId' : IDL.Text,
    'sender' : IDL.Text,
    'phone' : IDL.Text,
    'content' : IDL.Text,
    'timestamp' : IDL.Text,
    'direction' : IDL.Text,
    'isSuspicious' : IDL.Bool,
  });
  
  const CallRecord = IDL.Record({
    'id' : IDL.Text,
    'deviceId' : IDL.Text,
    'caller' : IDL.Text,
    'number' : IDL.Text,
    'duration' : IDL.Text,
    'timestamp' : IDL.Text,
    'callType' : IDL.Text,
    'isSuspicious' : IDL.Bool,
  });
  
  const AppRecord = IDL.Record({
    'id' : IDL.Text,
    'deviceId' : IDL.Text,
    'name' : IDL.Text,
    'packageName' : IDL.Text,
    'version' : IDL.Text,
    'installDate' : IDL.Text,
    'permissions' : IDL.Vec(IDL.Text),
    'isSuspicious' : IDL.Bool,
    'source' : IDL.Text,
    'size' : IDL.Text,
  });
  
  const MediaFile = IDL.Record({
    'id' : IDL.Text,
    'deviceId' : IDL.Text,
    'name' : IDL.Text,
    'fileType' : IDL.Text,
    'size' : IDL.Text,
    'createdAt' : IDL.Text,
    'isHidden' : IDL.Bool,
    'path' : IDL.Text,
  });
  
  const BrowserRecord = IDL.Record({
    'id' : IDL.Text,
    'deviceId' : IDL.Text,
    'url' : IDL.Text,
    'title' : IDL.Text,
    'visitCount' : IDL.Nat,
    'lastVisited' : IDL.Text,
    'browser' : IDL.Text,
    'isSuspicious' : IDL.Bool,
  });
  
  const LocationRecord = IDL.Record({
    'id' : IDL.Text,
    'deviceId' : IDL.Text,
    'lat' : IDL.Float64,
    'lng' : IDL.Float64,
    'address' : IDL.Text,
    'timestamp' : IDL.Text,
    'accuracy' : IDL.Nat,
    'source' : IDL.Text,
  });
  
  const AuditLog = IDL.Record({
    'id' : IDL.Text,
    'caseId' : IDL.Text,
    'action' : IDL.Text,
    'investigator' : IDL.Text,
    'timestamp' : IDL.Int,
    'details' : IDL.Text,
  });
  
  const ForensicAlert = IDL.Record({
    'id' : IDL.Text,
    'deviceId' : IDL.Text,
    'title' : IDL.Text,
    'description' : IDL.Text,
    'severity' : IDL.Text,
    'category' : IDL.Text,
    'timestamp' : IDL.Text,
  });

  return IDL.Service({
    'getAllCases' : IDL.Func([], [IDL.Vec(Case)], ['query']),
    'createCase' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [Case], []),
    'updateCaseStatus' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'getDevices' : IDL.Func([IDL.Text], [IDL.Vec(Device)], ['query']),
    'addDevice' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Text, IDL.Text], [Device], []),
    'updateDeviceExtractionStatus' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
    'getSmsRecords' : IDL.Func([IDL.Text], [IDL.Vec(SmsRecord)], ['query']),
    'getCallRecords' : IDL.Func([IDL.Text], [IDL.Vec(CallRecord)], ['query']),
    'getAppRecords' : IDL.Func([IDL.Text], [IDL.Vec(AppRecord)], ['query']),
    'getMediaFiles' : IDL.Func([IDL.Text], [IDL.Vec(MediaFile)], ['query']),
    'getBrowserRecords' : IDL.Func([IDL.Text], [IDL.Vec(BrowserRecord)], ['query']),
    'getLocationRecords' : IDL.Func([IDL.Text], [IDL.Vec(LocationRecord)], ['query']),
    'getAlerts' : IDL.Func([IDL.Text], [IDL.Vec(ForensicAlert)], ['query']),
    'getAuditLogs' : IDL.Func([IDL.Text], [IDL.Vec(AuditLog)], ['query']),
    'addAuditLog' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [AuditLog], []),
    'addMockEvidence' : IDL.Func([IDL.Text], [IDL.Bool], []),
  });
};

export const init = ({ IDL }) => { return []; };