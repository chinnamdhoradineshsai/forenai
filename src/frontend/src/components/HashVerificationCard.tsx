import { CheckCircle, Copy, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface HashVerificationCardProps {
  computedHash: string;
  expectedHash: string;
  algorithm?: "MD5" | "SHA-1" | "SHA-256";
}

export function HashVerificationCard({
  computedHash,
  expectedHash,
  algorithm = "SHA-256",
}: HashVerificationCardProps) {
  const [copied, setCopied] = useState(false);
  const match = computedHash === expectedHash;

  const handleCopy = () => {
    navigator.clipboard.writeText(computedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-5 space-y-4 border border-emerald-500/20 bg-emerald-950/[0.03]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Evidence Integrity Check
          </h4>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/20">
          {algorithm}
        </span>
      </div>

      <div className="space-y-3 font-mono text-[11px]">
        <div className="p-3 bg-black/30 rounded-lg border border-white/5 space-y-1">
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            Computed Hash Value
          </div>
          <div className="text-foreground break-all leading-normal flex items-start gap-2">
            <span className="flex-1">{computedHash}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 hover:bg-white/5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {copied ? (
                <CheckCircle size={12} className="text-green-400" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>
        </div>

        <div className="p-3 bg-black/30 rounded-lg border border-white/5 space-y-1">
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            Expected Reference Hash
          </div>
          <div className="text-foreground/80 break-all leading-normal">
            {expectedHash}
          </div>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold ${
          match
            ? "bg-green-500/10 border-green-500/20 text-green-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${match ? "bg-green-400" : "bg-red-400"}`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${match ? "bg-green-500" : "bg-red-500"}`}
          />
        </span>
        <span>
          {match
            ? "Forensic signature verified: Zero data modification detected."
            : "Warning: Forensic signatures do NOT match. Evidence may be compromised."}
        </span>
      </div>
    </div>
  );
}
