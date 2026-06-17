import { FileText, Sparkles } from "lucide-react";
import { RecoverableFile } from "../services/backendApi";

interface FilePreviewProps {
  file: RecoverableFile;
  generateHexDump: (sig: string, name: string) => Array<{ offset: string; hex: string; ascii: string }>;
}

export function FilePreview({ file, generateHexDump }: FilePreviewProps) {
  const hexLines = generateHexDump(file.hexSignature || "", file.name || "");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fadeIn">
      {/* Metadata specs */}
      <div className="lg:col-span-2 glass-card p-6 space-y-4">
        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest border-b border-white/5 pb-2">
          Metadata Details
        </h3>
        
        <div className="space-y-3 text-xs leading-relaxed">
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">File Name:</span>
            <span className="col-span-2 text-foreground font-semibold break-all">{file.name}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Location:</span>
            <span className="col-span-2 text-muted-foreground font-mono break-all">{file.path}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Bytes Size:</span>
            <span className="col-span-2 text-foreground font-mono">{file.size}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Deleted On:</span>
            <span className="col-span-2 text-foreground font-mono">{file.deletedTime}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Start Block:</span>
            <span className="col-span-2 text-orange-400 font-mono">{file.sectorOffset}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Sig Header:</span>
            <span className="col-span-2 text-foreground font-mono break-all">{file.hexSignature}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Health Grade:</span>
            <span className={`col-span-2 font-bold ${file.status === "Intact" ? "text-green-400" : "text-amber-400"}`}>
              {file.status} ({file.recoveryRate}%)
            </span>
          </div>
        </div>

        {/* Dynamic preview visualization */}
        <div className="border border-white/5 bg-black/40 rounded-xl p-4 flex flex-col items-center justify-center min-h-[160px] text-center">
          {file.type === "image" ? (
            <div className="space-y-3">
              <div className="w-16 h-16 rounded bg-orange-500/10 mx-auto flex items-center justify-center">
                <Sparkles size={24} className="text-orange-400" />
              </div>
              <span className="text-[11px] text-muted-foreground font-semibold">[JPEG Carved Image Preview Available]</span>
            </div>
          ) : (
            <div className="space-y-3">
              <FileText size={28} className="text-muted-foreground mx-auto" />
              <span className="text-[11px] text-muted-foreground">Binary database / document stream cannot be rendered visually. Use hex inspector.</span>
            </div>
          )}
        </div>
      </div>

      {/* HEX Viewer */}
      <div className="lg:col-span-3 glass-card p-6 space-y-4">
        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest border-b border-white/5 pb-2">
          Low-Level Hexadecimal Inspector
        </h3>

        <div className="font-mono text-[10px] bg-black/50 p-4 rounded-xl border border-white/5 overflow-x-auto select-text scrollbar-thin">
          <div className="grid grid-cols-12 gap-2 text-muted-foreground/60 border-b border-white/5 pb-1 mb-2 font-bold uppercase tracking-wider">
            <span className="col-span-2">Offset</span>
            <span className="col-span-7 text-center">Hexadecimal Bytes</span>
            <span className="col-span-3 text-right">ASCII</span>
          </div>
          <div className="space-y-1.5">
            {hexLines.map((line, idx) => (
              <div key={`hex-${idx}`} className="grid grid-cols-12 gap-2 hover:bg-white/5 py-0.5 rounded transition-colors">
                <span className="col-span-2 text-orange-400/90">{line.offset}</span>
                <span className="col-span-7 text-foreground/80 tracking-wide font-medium">{line.hex}</span>
                <span className="col-span-3 text-right text-green-400/95 font-semibold">{line.ascii}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
