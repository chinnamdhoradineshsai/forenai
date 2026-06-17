export interface BackendDrive {
  path: string;
  name: string;
  type: string;
  total: number;
  used: number;
  free: number;
  status: string;
}

export interface RecoverableFile {
  id: string;
  name: string;
  path: string;
  size_bytes?: number;
  size: string;
  deletedTime: string;
  status: "Intact" | "Fragmented" | "Corrupted";
  recoveryRate: number;
  type: "document" | "image" | "database" | "system";
  sectorOffset: string;
  hexSignature: string;
  reason?: string;
}

export interface BackendScanResults {
  sectors_scanned: number;
  deleted_found: number;
  carved_found: number;
  partitions_found: number;
  sector_map: string[];
  deleted_files: RecoverableFile[];
  carved_files: any[];
  partitions: any[];
  drives: BackendDrive[];
}

export interface RecoveryLogEntry {
  id: string;
  timestamp: string;
  action_type?: string;
  investigator?: string;
  case_id?: string;
  filesRecovered?: number;
  files_recovered?: number;
  destination: string;
  hash: string;
  status: string;
}

export interface MalwareScanResult {
  threatScore: number;
  checkedFilesCount: number;
  matches: Array<{
    file: string;
    path: string;
    rule: string;
    severity: "HIGH" | "MEDIUM";
    details: Array<{ string_id: string; match_text: string; offset: number }>;
  }>;
  logs: string[];
}

const BACKEND_URL = "http://localhost:8000";

let isOnlineCached: boolean | null = null;
let lastCheckTime = 0;

export async function checkBackendStatus(): Promise<boolean> {
  const now = Date.now();
  // Cache status for 5 seconds to prevent hammering the endpoint
  if (isOnlineCached !== null && now - lastCheckTime < 5000) {
    return isOnlineCached;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    
    const res = await fetch(`${BACKEND_URL}/api/status`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    isOnlineCached = res.ok;
    lastCheckTime = now;
    return isOnlineCached;
  } catch (err) {
    isOnlineCached = false;
    lastCheckTime = now;
    return false;
  }
}

export async function fetchSystemDrives(): Promise<BackendDrive[]> {
  const online = await checkBackendStatus();
  if (!online) {
    // Return mock drives
    return [
      { path: "C:\\", name: "System (C:)", type: "NTFS", total: 512000000000, used: 320000000000, free: 192000000000, status: "Mounted" },
      { path: "D:\\", name: "Data (D:)", type: "exFAT", total: 1024000000000, used: 450000000000, free: 574000000000, status: "Mounted" }
    ];
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/drives`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch system drives", err);
  }
  return [];
}

export async function startScan(targetPath: string, scanType: "quick" | "deep"): Promise<BackendScanResults> {
  const online = await checkBackendStatus();
  if (!online) {
    throw new Error("Backend offline");
  }

  const res = await fetch(`${BACKEND_URL}/api/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_path: targetPath, scan_type: scanType })
  });

  if (!res.ok) {
    throw new Error("Scan execution failed on backend");
  }
  return await res.json();
}

export async function executeRestore(
  selectedFiles: any[],
  destination: string,
  investigator: string = "Investigator",
  caseId: string = "case_0"
): Promise<any> {
  const online = await checkBackendStatus();
  if (!online) {
    throw new Error("Backend offline");
  }

  const res = await fetch(`${BACKEND_URL}/api/recover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      selected_files: selectedFiles,
      destination,
      investigator,
      case_id: caseId
    })
  });

  if (!res.ok) {
    throw new Error("Recovery execution failed on backend");
  }
  return await res.json();
}

export async function fetchAuditLogs(): Promise<RecoveryLogEntry[]> {
  const online = await checkBackendStatus();
  if (!online) {
    throw new Error("Backend offline");
  }

  const res = await fetch(`${BACKEND_URL}/api/logs`);
  if (!res.ok) {
    throw new Error("Failed to fetch logs");
  }
  return await res.json();
}

export async function computeHash(
  file: File | string,
  algorithm: "MD5" | "SHA-1" | "SHA-256"
): Promise<{ md5: string; sha1: string; sha256: string; size?: number; filename?: string }> {
  const online = await checkBackendStatus();
  if (!online) {
    throw new Error("Backend offline");
  }

  if (typeof file === "string") {
    // Query by local path
    const res = await fetch(`${BACKEND_URL}/api/hash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_path: file })
    });
    if (!res.ok) throw new Error("Hash computation failed");
    return await res.json();
  } else {
    // Upload file
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BACKEND_URL}/api/hash`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("Hash computation failed");
    return await res.json();
  }
}

export async function runMalwareScan(rulesText: string, targetPath: string): Promise<MalwareScanResult> {
  const online = await checkBackendStatus();
  if (!online) {
    throw new Error("Backend offline");
  }

  const res = await fetch(`${BACKEND_URL}/api/malware`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rules: rulesText, target_path: targetPath })
  });

  if (!res.ok) {
    throw new Error("Malware scanning failed");
  }
  return await res.json();
}

export interface DBRecoveredFile {
  id: string;
  file_name: string;
  file_type: string;
  file_size: string;
  recovery_status: string;
  recovery_date: string;
  hash_value: string;
}

export interface DBRecoveryLog {
  id: string;
  operation: string;
  status: string;
  timestamp: string;
}

export async function fetchDBRecoveredFiles(): Promise<DBRecoveredFile[]> {
  const online = await checkBackendStatus();
  if (!online) {
    return [];
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/recovered-files`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch DB recovered files", err);
  }
  return [];
}

export async function fetchDBRecoveryLogs(): Promise<DBRecoveryLog[]> {
  const online = await checkBackendStatus();
  if (!online) {
    return [];
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/recovery-logs`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch DB recovery logs", err);
  }
  return [];
}

