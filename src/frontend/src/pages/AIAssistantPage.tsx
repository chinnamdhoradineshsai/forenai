import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, 
  Send, 
  Terminal, 
  MessageSquare, 
  User, 
  ShieldAlert,
  HelpCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  FileText,
  Loader2
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface AIAssistantPageProps {
  caseId: string;
  deviceId: string;
  investigatorName?: string;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "Show suspicious activity from the last 7 days.",
  "Identify most contacted individuals from the log database.",
  "List any encryption tools or hidden application packages.",
  "Are there any unusual midnight call patterns or locations?"
];

export function AIAssistantPage({ caseId, deviceId, investigatorName = "Investigator" }: AIAssistantPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome message from the Forensic Copilot
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          sender: "ai",
          text: `### ForenAI Mobile Forensics Assistant Initialized

Hello, **${investigatorName}**. I am your AI Copilot for this forensic investigation.
I have access to the logical extraction records (SMS, calls, app package manifests, browser records, location coordinates) for **Device: ${deviceId || "unassigned"}** in **Case: ${caseId || "unassigned"}**.

How can I assist you with evidence analysis today? You can ask me to search logs, scan for suspicious activity, or summarize communication spikes.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [caseId, deviceId, investigatorName, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
          caseId,
          deviceId
        })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with Forensic AI server.");
      }

      const data = await response.json();
      
      // Also add an audit log to Supabase for the assistant query
      try {
        await supabase.from("audit_logs").insert([
          {
            id: `log_ai_chat_${Date.now()}`,
            caseId: caseId || "case_default",
            action: "AI Assistant Query",
            investigator: investigatorName,
            timestamp: Date.now(),
            details: `Queried forensic assistant: "${textToSend.substring(0, 100)}..."`
          }
        ]);
      } catch (logErr) {
        console.warn("Failed to write AI query audit log:", logErr);
      }

      setMessages(prev => [...prev, {
        sender: "ai",
        text: data.reply || "No reply returned.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: "ai",
        text: `### System Error
Failed to contact the Forensic AI Express server.
- Please verify that the Forensic Express backend server is running on \`http://localhost:8000\`.
- Detail: ${err.message || err}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto h-[calc(100vh-80px)] flex flex-col min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Brain className="text-purple-400" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              Forensic AI Copilot
              <span className="text-[9px] font-mono bg-purple-500/20 border border-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                Active
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Natural language evidence querying and suspicious activity reasoning
            </p>
          </div>
        </div>
        <div className="text-right text-[11px] text-muted-foreground font-mono bg-black/30 border border-white/5 rounded-lg px-3 py-1.5 hidden sm:block">
          <div>Case ID: <span className="text-cyan-400 font-semibold">{caseId || "N/A"}</span></div>
          <div>Device: <span className="text-indigo-400 font-semibold">{deviceId || "N/A"}</span></div>
        </div>
      </div>

      {/* Main Chat Interface Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Suggestion Sidebar */}
        <div className="lg:col-span-1 hidden lg:flex flex-col gap-4 overflow-y-auto pr-1">
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <HelpCircle size={13} className="text-purple-400" />
              Suggested Queries
            </h3>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Ask these specific logical database queries to search patterns in calls, SMS, location records, and apps.
            </p>
            <div className="space-y-2 pt-1">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="w-full text-left text-[11px] p-2.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-purple-500/20 text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer block leading-normal font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Terminal size={13} className="text-cyan-400" />
              Forensic Scope
            </h3>
            <ul className="text-[10px] text-muted-foreground space-y-2 leading-relaxed font-mono">
              <li className="flex items-center gap-1.5"><Clock size={11} className="text-cyan-400" /> Temporal anomalies</li>
              <li className="flex items-center gap-1.5"><UserCheck size={11} className="text-emerald-400" /> Contact aggregations</li>
              <li className="flex items-center gap-1.5"><AlertTriangle size={11} className="text-amber-400" /> Nomedia directories</li>
              <li className="flex items-center gap-1.5"><FileText size={11} className="text-rose-400" /> Manifest signatures</li>
            </ul>
          </div>
        </div>

        {/* Chat Stream Panel */}
        <div className="lg:col-span-3 flex flex-col bg-black/60 border border-white/8 rounded-2xl overflow-hidden shadow-2xl relative">
          {/* CRT scanline simulation */}
          <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-[0.02]" />

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => {
                const isAI = msg.sender === "ai";
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3.5 max-w-[85%] ${isAI ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                      isAI 
                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
                        : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                    }`}>
                      {isAI ? <Brain size={14} /> : <User size={14} />}
                    </div>

                    {/* Chat Bubble */}
                    <div className="space-y-1">
                      <div 
                        className={`p-3.5 rounded-2xl text-[12px] leading-relaxed break-words font-medium border ${
                          isAI 
                            ? "bg-zinc-900/60 border-white/5 text-zinc-300 font-sans" 
                            : "bg-cyan-500/15 border-cyan-500/25 text-cyan-100 font-sans"
                        }`}
                      >
                        {/* Render simple markdown styling block */}
                        <div className="space-y-2 whitespace-pre-wrap">
                          {msg.text.split("\n\n").map((para, pIdx) => {
                            if (para.startsWith("###")) {
                              return <h3 key={pIdx} className="text-sm font-bold text-foreground mt-2 border-b border-white/5 pb-1">{para.replace("###", "").trim()}</h3>;
                            }
                            if (para.startsWith("-") || para.startsWith("*")) {
                              return (
                                <ul key={pIdx} className="list-disc pl-4 space-y-1">
                                  {para.split("\n").map((li, lIdx) => (
                                    <li key={lIdx}>{li.replace(/^[-*]\s+/, "")}</li>
                                  ))}
                                </ul>
                              );
                            }
                            return <p key={pIdx}>{para}</p>;
                          })}
                        </div>
                      </div>
                      <div className={`text-[9px] text-muted-foreground px-1.5 ${isAI ? "text-left" : "text-right"}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {loading && (
              <div className="flex gap-3.5 max-w-[80%] mr-auto">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 animate-pulse">
                  <Brain size={14} />
                </div>
                <div className="bg-zinc-900/40 border border-white/5 p-3.5 rounded-2xl text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-purple-400" />
                  Analyzing database tables and evaluating threat risk vectors...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions for mobile/compact views */}
          <div className="lg:hidden px-4 py-2 border-t border-white/5 flex gap-2 overflow-x-auto scrollbar-none whitespace-nowrap bg-black/40">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="px-2.5 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Panel */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex-shrink-0 p-3 bg-black/40 border-t border-white/8 flex gap-2"
          >
            <input
              type="text"
              placeholder={deviceId ? "Ask the AI copilot about suspicious activities, contacts, or apps..." : "Select/connect a device to start forensic investigation chat..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || !deviceId}
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !deviceId}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-purple-500/20"
            >
              <Send size={12} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
