export interface ReportConfig {
  caseId: string;
  deviceId: string;
  sections: {
    deviceInfo: boolean;
    smsSummary: boolean;
    callLogs: boolean;
    appAnalysis: boolean;
    browserHistory: boolean;
    locations: boolean;
    forensicAlerts: boolean;
    aiFindings: boolean;
  };
  format: string;
  includeSuspiciousOnly: boolean;
  signatureRequired: boolean;
}

export interface ForensicReport {
  id: string;
  caseId: string;
  deviceId: string;
  generatedBy: string;
  timestamp: bigint;
  hash: string;
  downloadUrl?: string;
  status: string;
}
