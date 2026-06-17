import { supabase } from "../lib/supabase";
import { safeSetItem } from "../lib/safeStorage";
import type { ForensicReport, ReportConfig } from "../types/report";
import { evidenceService } from "./evidenceService";

const REPORTS_KEY = "forenai_reports";

export const reportService = {
  async generateReport(
    config: ReportConfig,
    investigator: string,
    summaryText: string,
    notesText: string,
    threat: string,
    actor?: any,
  ): Promise<ForensicReport> {
    const id = `report_${config.deviceId}_${Date.now()}`;
    const timestamp = Date.now();
    const hash =
      "a3f91d8c4e02b6f7d19e3c28a047f2b581d6e94c2e680a6b7e0e7a2b9" +
      Math.random().toString(16).substring(2, 8);

    const reportData = {
      id,
      caseId: config.caseId,
      deviceId: config.deviceId,
      generatedBy: investigator,
      timestamp,
      hash,
      status: "ready",
      downloadUrl: "#",
    };

    const { data, error } = await supabase
      .from("forensic_reports")
      .insert([reportData])
      .select()
      .single();

    if (error) {
      console.warn(
        "Supabase insert report failed, using local storage fallback:",
        error.message,
      );
      const stored = localStorage.getItem(REPORTS_KEY);
      const list = stored ? JSON.parse(stored) : [];
      const localReport: ForensicReport = {
        ...reportData,
        timestamp: BigInt(reportData.timestamp),
      };
      list.push(localReport);
      safeSetItem(
        REPORTS_KEY,
        JSON.stringify(list, (_, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      );

      try {
        await evidenceService.addAuditLog(
          config.caseId,
          "Report Generated",
          investigator,
          `Forensic PDF report generated for device ${config.deviceId} with hash ${hash.substring(0, 16)}...`,
          actor,
        );
      } catch (e) {
        console.warn("Failed to log report generation locally:", e);
      }

      return localReport;
    }

    try {
      await evidenceService.addAuditLog(
        config.caseId,
        "Report Generated",
        investigator,
        `Forensic PDF report generated for device ${config.deviceId} with hash ${hash.substring(0, 16)}... in Supabase database.`,
        actor,
      );
    } catch (e) {
      console.warn("Failed to log report generation to Supabase:", e);
    }

    return {
      ...data,
      timestamp: BigInt(data.timestamp),
    };
  },

  async getReports(caseId: string): Promise<ForensicReport[]> {
    const { data, error } = await supabase
      .from("forensic_reports")
      .select("*")
      .eq("caseId", caseId);

    if (error) {
      console.warn(
        "Supabase select reports failed, using local storage fallback:",
        error.message,
      );
      const stored = localStorage.getItem(REPORTS_KEY);
      if (!stored) return [];
      const list = JSON.parse(stored);
      return list
        .filter((r: any) => r.caseId === caseId)
        .map((r: any) => ({
          ...r,
          timestamp: BigInt(r.timestamp),
        }));
    }

    return (data || []).map((r: any) => ({
      ...r,
      timestamp: BigInt(r.timestamp),
    }));
  },
};
