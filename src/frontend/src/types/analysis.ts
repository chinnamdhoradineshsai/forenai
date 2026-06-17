import { ForensicAlert } from './evidence';

export interface AIAnalysisResult { 
  summary: string;
  riskScore: number;
  threatLevel: string;
  keyFindings: string[];
  recommendedActions: string[];
  alertCounts: {
    high: number;
    medium: number;
    low: number;
  };
  suspiciousEntities: {
    contacts: string[];
    apps: string[];
    urls: string[];
  };
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  unixTime: number;
  type: string;
  title: string;
  description: string;
  isSuspicious: boolean;
  metadata?: Record<string, any>;
}
