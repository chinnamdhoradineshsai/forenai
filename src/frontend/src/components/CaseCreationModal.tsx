import { AlertCircle, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface CaseCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    caseNumber: string;
    name: string;
    description: string;
    investigator: string;
  }) => void;
  investigatorName: string;
}

export function CaseCreationModal({
  isOpen,
  onClose,
  onSubmit,
  investigatorName,
}: CaseCreationModalProps) {
  const [caseNumber, setCaseNumber] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [investigator, setInvestigator] = useState(investigatorName);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNumber.trim() || !name.trim() || !investigator.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    onSubmit({ caseNumber, name, description, investigator });
    // Reset fields
    setCaseNumber("");
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg glass-card p-6 md:p-8 space-y-6 overflow-hidden z-10"
            style={{
              background:
                "linear-gradient(135deg, rgba(11, 18, 32, 0.98) 0%, rgba(7, 11, 20, 0.99) 100%)",
            }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Plus size={18} className="text-cyan-400" />
                Initialize Forensic Case
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/25">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Case Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CID/MOB/2024/0187"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Case Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corporate Espionage Investigation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Case Description
                </label>
                <textarea
                  placeholder="Provide investigation context, target suspect details, scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input min-h-[90px] resize-none py-2.5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Assigned Investigator <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={investigator}
                  onChange={(e) => setInvestigator(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, #0ea5e9, #22d3ee)",
                    boxShadow: "0 0 15px rgba(34, 211, 238, 0.3)",
                  }}
                >
                  Create Case
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
