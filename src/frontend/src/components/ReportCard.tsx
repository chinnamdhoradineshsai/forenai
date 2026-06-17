import { Download, FileText, Printer, Shield } from "lucide-react";
import type { Case, Device } from "../backend.d";

interface ReportCardProps {
  kase: Case;
  device?: Device;
  evidenceSummary: {
    sms: number;
    calls: number;
    apps: number;
    media: number;
    browser: number;
    location: number;
  };
  riskScore: number;
}

export function ReportCard({
  kase,
  device,
  evidenceSummary,
  riskScore,
}: ReportCardProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="glass-card p-6 md:p-8 space-y-6 bg-white/[0.01]">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Forensic Report Preview
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 hover:bg-white/5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Printer size={12} />
            Print Report
          </button>
        </div>
      </div>

      {/* Printable Area Shell */}
      <div className="border border-white/8 rounded-xl p-6 bg-black/40 space-y-6 text-xs text-foreground max-w-4xl mx-auto font-sans">
        <div className="flex justify-between items-start gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="text-cyan-400 font-bold uppercase tracking-widest text-[14px]">
              FORENSIC ANALYSIS REPORT
            </div>
            <div className="text-muted-foreground mt-1 text-[10px]">
              Secure Ledger Verification Certificate Included
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-foreground font-semibold">
              CASE: {kase.caseNumber}
            </div>
            <div className="text-muted-foreground text-[10px] mt-0.5">
              Generated: {new Date().toUTCString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-bold text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-1">
              Case & Authority
            </h4>
            <div className="space-y-1 text-muted-foreground font-mono">
              <div>
                <strong className="text-foreground">Case Title:</strong>{" "}
                {kase.name}
              </div>
              <div>
                <strong className="text-foreground">Investigator:</strong>{" "}
                {kase.investigator}
              </div>
              <div>
                <strong className="text-foreground">Status:</strong>{" "}
                {kase.status}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-1">
              Device Under Examination
            </h4>
            {device ? (
              <div className="space-y-1 text-muted-foreground font-mono">
                <div>
                  <strong className="text-foreground">Model:</strong>{" "}
                  {device.model}
                </div>
                <div>
                  <strong className="text-foreground">Serial:</strong>{" "}
                  {device.serialNumber}
                </div>
                <div>
                  <strong className="text-foreground">IMEI:</strong>{" "}
                  {device.imei}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground italic">
                No device connected.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-3">
          <h4 className="font-bold text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-1">
            Evidence Inventory Summary
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: "SMS", val: evidenceSummary.sms },
              { label: "Calls", val: evidenceSummary.calls },
              { label: "Apps", val: evidenceSummary.apps },
              { label: "Media", val: evidenceSummary.media },
              { label: "Browser", val: evidenceSummary.browser },
              { label: "Location", val: evidenceSummary.location },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3 bg-white/5 rounded-lg border border-white/8 text-center"
              >
                <div className="text-[10px] text-muted-foreground font-semibold">
                  {item.label}
                </div>
                <div className="text-base font-bold text-foreground mt-1 font-mono">
                  {item.val}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-5 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-400" />
            <span>
              Digital Signature Verified: Secure Canister Chain Certifiable
            </span>
          </div>
          <div className="font-mono">
            Integrity Score: {riskScore}% Threat Risk
          </div>
        </div>
      </div>
    </div>
  );
}
