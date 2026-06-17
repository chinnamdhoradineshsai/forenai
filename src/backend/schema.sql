-- Supabase PostgreSQL Database Schema for ForenAI Mobile Forensics

-- Drop existing tables if they exist (clean setup)
DROP TABLE IF EXISTS "recovered_files" CASCADE;
DROP TABLE IF EXISTS "recovery_logs" CASCADE;
DROP TABLE IF EXISTS "timeline_events" CASCADE;
DROP TABLE IF EXISTS "ai_analysis" CASCADE;
DROP TABLE IF EXISTS "forensic_reports" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "forensic_alerts" CASCADE;
DROP TABLE IF EXISTS "location_records" CASCADE;
DROP TABLE IF EXISTS "browser_records" CASCADE;
DROP TABLE IF EXISTS "media_files" CASCADE;
DROP TABLE IF EXISTS "app_records" CASCADE;
DROP TABLE IF EXISTS "call_records" CASCADE;
DROP TABLE IF EXISTS "sms_records" CASCADE;
DROP TABLE IF EXISTS "devices" CASCADE;
DROP TABLE IF EXISTS "cases" CASCADE;

-- 1. Cases Table
CREATE TABLE "cases" (
    "id" TEXT PRIMARY KEY,
    "caseNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "investigator" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdTimestamp" BIGINT NOT NULL
);

-- 2. Devices Table
CREATE TABLE "devices" (
    "id" TEXT PRIMARY KEY,
    "caseId" TEXT NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
    "model" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "androidVersion" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "imei" TEXT NOT NULL,
    "usbStatus" TEXT NOT NULL,
    "batteryLevel" BIGINT NOT NULL,
    "storageTotal" TEXT NOT NULL,
    "storageUsed" TEXT NOT NULL,
    "extractionStatus" TEXT NOT NULL,
    "lastExtractionTimestamp" TEXT NOT NULL,
    "securityPatch" TEXT,
    "buildNumber" TEXT,
    "modelNumber" TEXT,
    "deviceFingerprint" TEXT,
    "bootloaderStatus" TEXT,
    "rootStatus" TEXT,
    "macAddress" TEXT
);

-- 3. SMS Records Table
CREATE TABLE "sms_records" (
    "id" TEXT PRIMARY KEY,
    "deviceId" TEXT NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
    "sender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "isSuspicious" BOOLEAN NOT NULL,
    "isRecovered" BOOLEAN DEFAULT false
);

-- 4. Call Records Table
CREATE TABLE "call_records" (
    "id" TEXT PRIMARY KEY,
    "deviceId" TEXT NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
    "caller" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "callType" TEXT NOT NULL,
    "isSuspicious" BOOLEAN NOT NULL,
    "isRecovered" BOOLEAN DEFAULT false
);

-- 5. App Records Table
CREATE TABLE "app_records" (
    "id" TEXT PRIMARY KEY,
    "deviceId" TEXT NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "installDate" TEXT NOT NULL,
    "permissions" TEXT[] NOT NULL,
    "isSuspicious" BOOLEAN NOT NULL,
    "source" TEXT NOT NULL,
    "size" TEXT NOT NULL
);

-- 6. Media Files Table
CREATE TABLE "media_files" (
    "id" TEXT PRIMARY KEY,
    "deviceId" TEXT NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL,
    "path" TEXT NOT NULL,
    "isRecovered" BOOLEAN DEFAULT false
);

-- 7. Browser Records Table
CREATE TABLE "browser_records" (
    "id" TEXT PRIMARY KEY,
    "deviceId" TEXT NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "visitCount" BIGINT NOT NULL,
    "lastVisited" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "isSuspicious" BOOLEAN NOT NULL,
    "isRecovered" BOOLEAN DEFAULT false
);

-- 8. Location Records Table
CREATE TABLE "location_records" (
    "id" TEXT PRIMARY KEY,
    "deviceId" TEXT NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "accuracy" BIGINT NOT NULL,
    "source" TEXT NOT NULL,
    "isRecovered" BOOLEAN DEFAULT false
);

-- 9. Forensic Alerts Table
CREATE TABLE "forensic_alerts" (
    "id" TEXT PRIMARY KEY,
    "deviceId" TEXT NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL
);

-- 10. Audit Logs Table
CREATE TABLE "audit_logs" (
    "id" TEXT PRIMARY KEY,
    "caseId" TEXT NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
    "action" TEXT NOT NULL,
    "investigator" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "details" TEXT NOT NULL
);

-- 11. Forensic Reports Table
CREATE TABLE "forensic_reports" (
    "id" TEXT PRIMARY KEY,
    "caseId" TEXT NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
    "deviceId" TEXT NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
    "generatedBy" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "hash" TEXT NOT NULL,
    "downloadUrl" TEXT DEFAULT '#',
    "status" TEXT NOT NULL
);

-- 12. AI Analysis Table
CREATE TABLE "ai_analysis" (
    "deviceId" TEXT PRIMARY KEY REFERENCES "devices"("id") ON DELETE CASCADE,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "threatLevel" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyFindings" TEXT[] NOT NULL,
    "recommendedActions" TEXT[] NOT NULL,
    "alertCounts" JSONB NOT NULL,
    "suspiciousEntities" JSONB NOT NULL
);

-- 13. Timeline Events Table
CREATE TABLE "timeline_events" (
    "id" TEXT PRIMARY KEY,
    "deviceId" TEXT NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
    "timestamp" TEXT NOT NULL,
    "unixTime" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isSuspicious" BOOLEAN NOT NULL,
    "metadata" JSONB
);

-- 14. Recovered Files Table
CREATE TABLE "recovered_files" (
    "id" TEXT PRIMARY KEY,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" TEXT NOT NULL,
    "recovery_status" TEXT NOT NULL,
    "recovery_date" TEXT NOT NULL,
    "hash_value" TEXT NOT NULL
);

-- 15. Recovery Logs Table
CREATE TABLE "recovery_logs" (
    "id" TEXT PRIMARY KEY,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL
);


-- Enable Row Level Security (RLS) on all tables for Supabase integration
ALTER TABLE "cases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "devices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sms_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "call_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "app_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "browser_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "location_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forensic_alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forensic_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "timeline_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recovered_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recovery_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on recovered_files" ON "recovered_files" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on recovered_files" ON "recovered_files" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on recovery_logs" ON "recovery_logs" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on recovery_logs" ON "recovery_logs" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on cases" ON "cases" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on cases" ON "cases" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on cases" ON "cases" FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on devices" ON "devices" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on devices" ON "devices" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on devices" ON "devices" FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on sms_records" ON "sms_records" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on sms_records" ON "sms_records" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on call_records" ON "call_records" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on call_records" ON "call_records" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on app_records" ON "app_records" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on app_records" ON "app_records" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on media_files" ON "media_files" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on media_files" ON "media_files" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on browser_records" ON "browser_records" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on browser_records" ON "browser_records" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on location_records" ON "location_records" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on location_records" ON "location_records" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on forensic_alerts" ON "forensic_alerts" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on forensic_alerts" ON "forensic_alerts" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on audit_logs" ON "audit_logs" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on audit_logs" ON "audit_logs" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on forensic_reports" ON "forensic_reports" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on forensic_reports" ON "forensic_reports" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on ai_analysis" ON "ai_analysis" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on ai_analysis" ON "ai_analysis" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on timeline_events" ON "timeline_events" FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on timeline_events" ON "timeline_events" FOR INSERT WITH CHECK (true);

-- Allow public delete access on all tables for dynamic data management
CREATE POLICY "Allow public delete access on cases" ON "cases" FOR DELETE USING (true);
CREATE POLICY "Allow public delete access on devices" ON "devices" FOR DELETE USING (true);
CREATE POLICY "Allow public delete access on sms_records" ON "sms_records" FOR DELETE USING (true);
CREATE POLICY "Allow public delete access on call_records" ON "call_records" FOR DELETE USING (true);
CREATE POLICY "Allow public delete access on app_records" ON "app_records" FOR DELETE USING (true);
CREATE POLICY "Allow public delete access on media_files" ON "media_files" FOR DELETE USING (true);
CREATE POLICY "Allow public delete access on browser_records" ON "browser_records" FOR DELETE USING (true);
CREATE POLICY "Allow public delete access on location_records" ON "location_records" FOR DELETE USING (true);
CREATE POLICY "Allow public delete access on forensic_alerts" ON "forensic_alerts" FOR DELETE USING (true);
CREATE POLICY "Allow public delete access on ai_analysis" ON "ai_analysis" FOR DELETE USING (true);
CREATE POLICY "Allow public delete access on timeline_events" ON "timeline_events" FOR DELETE USING (true);
CREATE POLICY "Allow public delete access on forensic_reports" ON "forensic_reports" FOR DELETE USING (true);
CREATE POLICY "Allow public delete access on recovered_files" ON "recovered_files" FOR DELETE USING (true);
CREATE POLICY "Allow public delete access on recovery_logs" ON "recovery_logs" FOR DELETE USING (true);

