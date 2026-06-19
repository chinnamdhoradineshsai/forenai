import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { OpenAI } from "openai";
import { supabase } from "./lib/supabase.js";
import { RecoveryManager } from "./recovery/recovery_manager.js";
import { HashVerifier } from "./recovery/hash_verifier.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Setup multer for memory storage file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

const manager = new RecoveryManager();

// OpenAI Init
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

/**
 * Endpoint: GET /api/status
 */
app.get("/", (req, res) => {
  res.json({ status: "Online", engine: "Forensic AI Recovery System", port: PORT });
});

app.get("/api/status", (req, res) => {
  res.json({ status: "Online", engine: "Forensic AI Recovery System", port: PORT });
});

/**
 * Endpoint: GET /api/drives
 */
app.get("/api/drives", async (req, res) => {
  try {
    const scanResults = await manager.scanDevice();
    res.json(scanResults.drives);
  } catch (err: any) {
    res.status(400).json({ error: `Failed to fetch drives: ${err.message}` });
  }
});

/**
 * Endpoint: POST /api/scan
 */
app.post("/api/scan", async (req, res) => {
  try {
    const { target_path, scan_type } = req.body;
    const scanResults = await manager.scanDevice(target_path, scan_type);
    res.json(scanResults);
  } catch (err: any) {
    res.status(400).json({ error: `Scan failed: ${err.message}` });
  }
});

/**
 * Endpoint: POST /api/recover
 */
app.post("/api/recover", async (req, res) => {
  try {
    const { selected_files, destination, investigator, case_id } = req.body;
    if (!selected_files || selected_files.length === 0) {
      return res.status(400).json({ error: "No files selected for recovery" });
    }
    if (!destination) {
      return res.status(400).json({ error: "No destination path specified" });
    }
    const result = await manager.runRecovery(selected_files, destination, investigator, case_id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: `Recovery failed: ${err.message}` });
  }
});

/**
 * Endpoint: GET /api/logs
 */
app.get("/api/logs", async (req, res) => {
  try {
    const logs = await manager.getAuditLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(400).json({ error: `Failed to fetch logs: ${err.message}` });
  }
});

/**
 * Endpoint: GET /api/recovered-files
 */
app.get("/api/recovered-files", async (req, res) => {
  try {
    const files = await manager.getRecoveredFiles();
    res.json(files);
  } catch (err: any) {
    res.status(400).json({ error: `Failed to fetch recovered files: ${err.message}` });
  }
});

/**
 * Endpoint: GET /api/recovery-logs
 */
app.get("/api/recovery-logs", async (req, res) => {
  try {
    const logs = await manager.getRecoveryLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(400).json({ error: `Failed to fetch recovery logs: ${err.message}` });
  }
});

/**
 * Endpoint: POST /api/hash
 */
app.post("/api/hash", upload.single("file"), async (req, res) => {
  try {
    if (req.file) {
      const hashes = HashVerifier.calculateBytesHashes(req.file.buffer);
      res.json({
        filename: req.file.originalname,
        size: req.file.size,
        md5: hashes.md5,
        sha1: hashes.sha1,
        sha256: hashes.sha256,
        status: "Verified"
      });
    } else {
      const { file_path, text } = req.body;
      if (file_path) {
        if (!fs.existsSync(file_path)) {
          return res.status(400).json({ error: `File path does not exist: ${file_path}` });
        }
        const hashes = HashVerifier.calculateFileHashes(file_path);
        res.json({
          file_path,
          size: fs.statSync(file_path).size,
          md5: hashes.md5,
          sha1: hashes.sha1,
          sha256: hashes.sha256
        });
      } else if (text) {
        const hashes = HashVerifier.calculateBytesHashes(text);
        res.json({
          source: "text_string",
          md5: hashes.md5,
          sha1: hashes.sha1,
          sha256: hashes.sha256
        });
      } else {
        res.status(400).json({ error: "Provide either a file upload, file_path, or text content" });
      }
    }
  } catch (err: any) {
    res.status(400).json({ error: `Hash calculation failed: ${err.message}` });
  }
});

/**
 * Endpoint: POST /api/malware (YARA Rule Scanner Simulation)
 */
app.post("/api/malware", async (req, res) => {
  try {
    const { rules, target_path } = req.body;
    if (!rules) {
      return res.status(400).json({ error: "No rules specified" });
    }

    const activePath = target_path && fs.existsSync(target_path) ? target_path : manager.upload_dir;
    const result = await runYaraScan(rules, activePath);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: `Malware scan failed: ${err.message}` });
  }
});

/**
 * Endpoint: POST /api/ai/chat (Investigation Assistant Chat API)
 */
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, caseId, deviceId } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message parameter is required." });
    }

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID is required to query evidence." });
    }

    // Query evidence from Supabase for this device to provide real-world context
    const [
      { data: sms },
      { data: calls },
      { data: apps },
      { data: locations },
      { data: media },
      { data: browser },
      { data: alerts }
    ] = await Promise.all([
      supabase.from("sms_records").select("*").eq("deviceId", deviceId),
      supabase.from("call_records").select("*").eq("deviceId", deviceId),
      supabase.from("app_records").select("*").eq("deviceId", deviceId),
      supabase.from("location_records").select("*").eq("deviceId", deviceId),
      supabase.from("media_files").select("*").eq("deviceId", deviceId),
      supabase.from("browser_records").select("*").eq("deviceId", deviceId),
      supabase.from("forensic_alerts").select("*").eq("deviceId", deviceId)
    ]);

    const evidenceContext = {
      caseId,
      deviceId,
      appsCount: apps?.length || 0,
      smsCount: sms?.length || 0,
      callsCount: calls?.length || 0,
      mediaCount: media?.length || 0,
      browserCount: browser?.length || 0,
      locationsCount: locations?.length || 0,
      alerts: (alerts || []).map(a => ({ title: a.title, severity: a.severity, desc: a.description })),
      suspiciousApps: (apps || []).filter(a => a.isSuspicious).map(a => ({ name: a.name, package: a.packageName, source: a.source })),
      suspiciousSms: (sms || []).filter(s => s.isSuspicious).map(s => ({ sender: s.sender, content: s.content, time: s.timestamp })),
      suspiciousCalls: (calls || []).filter(c => c.isSuspicious).map(c => ({ caller: c.caller, number: c.number, time: c.timestamp, type: c.callType })),
      suspiciousBrowser: (browser || []).filter(b => b.isSuspicious).map(b => ({ title: b.title, url: b.url, time: b.lastVisited })),
      locationTraces: (locations || []).slice(0, 10).map(l => ({ lat: l.lat, lng: l.lng, address: l.address, time: l.timestamp }))
    };

    // System prompt for forensic AI model
    const systemPrompt = `You are ForenAI, a state-of-the-art Digital Mobile Forensics AI Copilot.
Your job is to assist forensic investigators in analyzing evidence acquired from Android devices.
You have access to the actual acquired database records for Device ID "${deviceId}".
Do NOT invent evidence. Use ONLY the records presented below.
If there are no records, state that the device extraction has either not been performed or returned empty rows.

Evidence Context:
${JSON.stringify(evidenceContext, null, 2)}

Provide professional, detailed, and evidence-backed forensic analysis.
Structure your findings clearly with markdown headings, tables, or lists:
1. Executive Summary
2. Detailed Findings (citing specific SMS, call logs, location traces, or package names)
3. Suspicious Indicators & Risk Scores (VPNs, hidden files, midnight calls, encryption apps)
4. Recommended Next Steps for Chain of Custody / Legal Prosecutions.

Format your responses concisely but professionally.`;

    if (!process.env.OPENAI_API_KEY) {
      // Fallback response if OpenAI key is missing to ensure a working fallback
      return res.json({
        reply: `### ForenAI Investigation Report (Local Mode)

[!] OpenAI API key is not configured in the backend environment. 

**Summary of Extracted Database Evidence (Device: ${deviceId}):**
- **Sms Records:** Found ${evidenceContext.smsCount} records, including ${evidenceContext.suspiciousSms.length} flagged as suspicious.
- **Call History:** Found ${evidenceContext.callsCount} records, including ${evidenceContext.suspiciousCalls.length} suspicious contacts.
- **Installed Apps:** Found ${evidenceContext.appsCount} user packages, with ${evidenceContext.suspiciousApps.length} suspicious apps (e.g. stealth encryption/VPN tools).
- **Location History:** Found ${evidenceContext.locationsCount} GPS tracks.
- **Forensic Alerts:** Found ${evidenceContext.alerts.length} active indicators.

**Suspicious Communications Flagged:**
${evidenceContext.suspiciousSms.map(s => `- **${s.sender}**: "${s.content}" at ${s.time}`).join("\n") || "No suspicious communications."}

**Recommendations:**
1. Check for sideloaded encryption APKs on the device system path.
2. Cross-reference GPS tracks with the incident timeline.`
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.2
    });

    res.json({ reply: completion.choices[0]?.message?.content || "No response received." });
  } catch (err: any) {
    res.status(500).json({ error: `AI Assistant failed: ${err.message}` });
  }
});

/**
 * Local YARA Scanner Simulation in TypeScript
 */
async function runYaraScan(ruleText: string, targetDir: string): Promise<any> {
  const matches: any[] = [];
  const logs: string[] = [];
  logs.push(`[*] Parsing rule text (${ruleText.length} bytes)...`);

  const ruleBlocks = ruleText.match(/rule\s+(\w+)\s*\{(.*?)\}/gs) || [];
  const rules: any[] = [];

  for (const block of ruleBlocks) {
    const nameMatch = block.match(/rule\s+(\w+)/);
    if (!nameMatch) continue;
    const ruleName = nameMatch[1];
    logs.push(`[*] Found rule definition: '${ruleName}'`);

    const stringsBlock = block.match(/strings:(.*?)(?:condition:|$)/s);
    const stringsToFind: any[] = [];

    if (stringsBlock) {
      const lines = stringsBlock[1].split("\n");
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        const m = line.match(/\$(\w+)\s*=\s*(.*)/);
        if (m) {
          const varName = m[1];
          let patternVal = m[2].trim();
          let isRegex = false;

          if (patternVal.startsWith('"') && patternVal.endsWith('"')) {
            patternVal = patternVal.slice(1, -1);
          } else if (patternVal.startsWith("/") && patternVal.endsWith("/")) {
            patternVal = patternVal.slice(1, -1);
            isRegex = true;
          }

          stringsToFind.push({ name: varName, value: patternVal, isRegex });
          logs.push(`  + String variable: $${varName} = '${patternVal}' (Regex: ${isRegex})`);
        }
      }
    }

    rules.push({ name: ruleName, strings: stringsToFind });
  }

  logs.push(`[*] Parsed ${rules.length} compiled rules successfully.`);

  if (rules.length === 0) {
    logs.push("[!] No valid YARA rules parsed. Using default suspicious patterns.");
    rules.push({
      name: "Suspicious_Android_Activity",
      strings: [
        { name: "s1", value: "su -c", isRegex: false },
        { name: "s2", value: "chmod 777", isRegex: false }
      ]
    });
  }

  logs.push(`[*] Beginning scan of directory: '${targetDir}'...`);
  let checkedFilesCount = 0;

  const walk = (dir: string) => {
    if (checkedFilesCount > 15) return;
    let files: string[] = [];
    try {
      files = fs.readdirSync(dir);
    } catch (e) {
      return;
    }

    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file !== "node_modules" && file !== ".git" && file !== ".old") {
            walk(fullPath);
          }
        } else {
          if (stat.size > 10 * 1024 * 1024) continue; // skip large files
          checkedFilesCount++;

          const content = fs.readFileSync(fullPath, { encoding: "utf8", flag: "r" });

          for (const rule of rules) {
            let ruleMatched = false;
            const details: any[] = [];

            for (const s of rule.strings) {
              if (s.isRegex) {
                const regex = new RegExp(s.value, "gi");
                let match;
                while ((match = regex.exec(content)) !== null) {
                  ruleMatched = true;
                  details.push({
                    string_id: `$${s.name}`,
                    match_text: match[0],
                    offset: match.index
                  });
                  if (details.length >= 3) break;
                }
              } else {
                let pos = content.indexOf(s.value);
                while (pos !== -1) {
                  ruleMatched = true;
                  details.push({
                    string_id: `$${s.name}`,
                    match_text: s.value,
                    offset: pos
                  });
                  if (details.length >= 3) break;
                  pos = content.indexOf(s.value, pos + s.value.length);
                }
              }
            }

            if (ruleMatched) {
              matches.push({
                file,
                path: dir,
                rule: rule.name,
                details,
                severity: rule.name.toLowerCase().includes("malware") || rule.name.toLowerCase().includes("suspicious") ? "HIGH" : "MEDIUM"
              });
              logs.push(`[ALERT] File '${file}' matched YARA rule '${rule.name}'!`);
            }
          }
        }
      } catch (e) {}
    }
  };

  walk(targetDir);
  logs.push(`[*] Scan complete. Checked ${checkedFilesCount} files.`);

  const highMatches = matches.filter(m => m.severity === "HIGH").length;
  const medMatches = matches.filter(m => m.severity === "MEDIUM").length;
  const threatScore = Math.min(100, highMatches * 35 + medMatches * 15);

  // Log in Supabase audit logs
  try {
    await supabase.from("audit_logs").insert([
      {
        id: `log_yara_${Date.now()}`,
        caseId: "case_default",
        action: "YARA Malware Scan",
        investigator: "Investigator",
        timestamp: Date.now(),
        details: `Ran malware signature rules on ${targetDir}. Checked ${checkedFilesCount} files, found ${matches.length} rule alerts. Threat Score: ${threatScore}%`
      }
    ]);
  } catch (e) {
    console.warn("Failed to write YARA scan log to Supabase:", e);
  }

  return {
    threatScore,
    checkedFilesCount,
    matches,
    logs
  };
}

// Start Server
app.listen(PORT, () => {
  console.log(`[*] Forensic AI Web API Server starting on port ${PORT}...`);
});
export default app;
