import { supabase } from "../lib/supabase";
import { safeSetItem } from "../lib/safeStorage";
import type { Case, CaseInput } from "../types/case";
import { evidenceService } from "./evidenceService";

const CASES_STORAGE_KEY = "forenai_cases";

export const caseService = {
  async getAllCases(actor?: any): Promise<Case[]> {
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .order("createdTimestamp", { ascending: false });

    if (error) {
      console.warn(
        "Supabase select cases failed, using local storage fallback:",
        error.message,
      );
      const stored = localStorage.getItem(CASES_STORAGE_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        return list.map((item: any) => ({
          ...item,
          createdTimestamp: BigInt(item.createdTimestamp),
        }));
      }
      // No static fallback — return empty so the UI shows the real empty state
      return [];
    }

    return (data || []).map((c: any) => ({
      ...c,
      createdTimestamp: BigInt(c.createdTimestamp),
    }));
  },

  async createCase(input: CaseInput, actor?: any): Promise<Case> {
    const id =
      "case_" + input.caseNumber.replace(/\//g, "_") + "_" + Date.now();
    const newCase = {
      id,
      caseNumber: input.caseNumber,
      name: input.name,
      description: input.description,
      investigator: input.investigator,
      status: "active",
      createdTimestamp: Math.floor(Date.now() / 1000),
    };

    const { data, error } = await supabase
      .from("cases")
      .insert([newCase])
      .select()
      .single();

    if (error) {
      console.warn(
        "Supabase insert case failed, fallback to local storage:",
        error.message,
      );
      const stored = localStorage.getItem(CASES_STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      const localCase: Case = {
        ...newCase,
        createdTimestamp: BigInt(newCase.createdTimestamp),
      };
      list.push(localCase);
      safeSetItem(
        CASES_STORAGE_KEY,
        JSON.stringify(list, (_, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      );

      const logsStored = localStorage.getItem(`forenai_logs_${id}`);
      const logs = logsStored ? JSON.parse(logsStored) : [];
      logs.push({
        id: `log_${id}_created`,
        caseId: id,
        action: "Case Created",
        investigator: input.investigator,
        timestamp: BigInt(Date.now()),
        details: `Case ${input.caseNumber} (${input.name}) initialized.`,
      });
      safeSetItem(
        `forenai_logs_${id}`,
        JSON.stringify(logs, (_, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      );

      return localCase;
    }

    await evidenceService.addAuditLog(
      id,
      "Case Created",
      input.investigator,
      `Case ${input.caseNumber} (${input.name}) initialized in Supabase ledger.`,
      actor,
    );

    return {
      ...data,
      createdTimestamp: BigInt(data.createdTimestamp),
    };
  },

  async updateCaseStatus(
    id: string,
    status: string,
    actor?: any,
  ): Promise<boolean> {
    const { error } = await supabase
      .from("cases")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.warn(
        "Supabase update case failed, fallback to local storage:",
        error.message,
      );
      const stored = localStorage.getItem(CASES_STORAGE_KEY);
      if (!stored) return false;
      const list = JSON.parse(stored);
      const idx = list.findIndex((c: any) => c.id === id);
      if (idx === -1) return false;
      list[idx].status = status;
      safeSetItem(
        CASES_STORAGE_KEY,
        JSON.stringify(list, (_, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      );
      return true;
    }

    return true;
  },

  async deleteCase(caseId: string, actor?: any): Promise<boolean> {
    // 1. Delete from Supabase (cascades automatically to devices & evidence rows)
    const { error } = await supabase.from("cases").delete().eq("id", caseId);

    if (error) {
      console.warn(
        "Supabase delete case failed, fallback to local storage:",
        error.message,
      );
    }

    // 2. Local storage cleanups
    // Retrieve devices for this case first to clear their details
    const devicesStored = localStorage.getItem(`forenai_devices_${caseId}`);
    if (devicesStored) {
      try {
        const devicesList = JSON.parse(devicesStored);
        devicesList.forEach((d: any) => {
          localStorage.removeItem(`forenai_device_details_${d.id}`);
          localStorage.removeItem(`forenai_evidence_extracted_${d.id}`);
          localStorage.removeItem(`forenai_dynamic_evidence_${d.id}`);
          localStorage.removeItem(`forenai_whatsapp_chats_${d.id}`);
        });
      } catch (e) {
        console.warn("Failed to parse local devices during case cleanup:", e);
      }
    }

    // Clear case specific logs and devices lists
    localStorage.removeItem(`forenai_devices_${caseId}`);
    localStorage.removeItem(`forenai_logs_${caseId}`);

    // Filter out case from main cases list
    const casesStored = localStorage.getItem(CASES_STORAGE_KEY);
    if (casesStored) {
      try {
        const casesList = JSON.parse(casesStored);
        const filteredCases = casesList.filter((c: any) => c.id !== caseId);
        safeSetItem(
          CASES_STORAGE_KEY,
          JSON.stringify(filteredCases, (_, v) =>
            typeof v === "bigint" ? v.toString() : v,
          ),
        );
      } catch (e) {
        console.warn("Failed to update local cases list during cleanup:", e);
      }
    }

    return true;
  },
};
