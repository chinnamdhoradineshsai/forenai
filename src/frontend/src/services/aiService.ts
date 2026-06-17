// No static mock data — all values are fetched from Supabase or dynamically generated.
import { supabase } from "../lib/supabase";
import type { AIAnalysisResult } from "../types/analysis";
import { getOrGenerateDynamicEvidence } from "./evidenceService";

export const aiService = {
  async getRiskScore(deviceId: string, actor?: any): Promise<number> {
    const { data, error } = await supabase
      .from("ai_analysis")
      .select("riskScore")
      .eq("deviceId", deviceId)
      .maybeSingle();

    if (error || !data) {
      try {
        const dynamic = getOrGenerateDynamicEvidence(deviceId);
        return dynamic.aiAnalysis.riskScore;
      } catch (e) {
        return 0;
      }
    }
    return data?.riskScore ?? 0;
  },

  async getAIAnalysisResult(
    deviceId: string,
    actor?: any,
  ): Promise<AIAnalysisResult> {
    const { data, error } = await supabase
      .from("ai_analysis")
      .select("*")
      .eq("deviceId", deviceId)
      .maybeSingle();

    if (error || !data) {
      try {
        const dynamic = getOrGenerateDynamicEvidence(deviceId);
        return dynamic.aiAnalysis;
      } catch (e) {
        // No data available — return a neutral zero-risk result
        return {
          summary:
            "No AI analysis data available for this device. Perform a device extraction to generate a forensic risk assessment.",
          riskScore: 0,
          threatLevel: "medium",
          keyFindings: [],
          recommendedActions: [],
          alertCounts: { high: 0, medium: 0, low: 0 },
          suspiciousEntities: { contacts: [], apps: [], urls: [] },
        };
      }
    }

    return data as AIAnalysisResult;
  },
};
