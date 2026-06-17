interface EvidenceTableProps {
  headers: string[];
  children: React.ReactNode;
  gridTemplateColumns: string;
}

export function EvidenceTable({
  headers,
  children,
  gridTemplateColumns,
}: EvidenceTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.01]">
      {/* Table Header */}
      <div
        className="grid gap-3 px-4 py-3 border-b border-white/8 bg-white/[0.02] sticky top-0 backdrop-blur-sm z-10"
        style={{ gridTemplateColumns }}
      >
        {headers.map((h) => (
          <span
            key={h}
            className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/75"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Table Body */}
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  );
}
