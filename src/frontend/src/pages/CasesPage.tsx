import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Folder, Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import { CaseCard } from "../components/CaseCard";
import { CaseCreationModal } from "../components/CaseCreationModal";
import type { Page } from "../components/Sidebar";
import { caseService } from "../services/caseService";

interface CasesPageProps {
  onNavigate: (page: Page) => void;
  setSelectedCaseId: (id: string) => void;
  investigatorName: string;
}

export function CasesPage({
  onNavigate,
  setSelectedCaseId,
  investigatorName,
}: CasesPageProps) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases", !!actor],
    queryFn: () => caseService.getAllCases(actor),
  });

  const createCaseMutation = useMutation({
    mutationFn: (newCase: {
      caseNumber: string;
      name: string;
      description: string;
      investigator: string;
    }) => caseService.createCase(newCase, actor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });

  const deleteCaseMutation = useMutation({
    mutationFn: (caseId: string) => caseService.deleteCase(caseId, actor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });

  const handleDeleteCase = async (caseId: string) => {
    if (
      confirm(
        "Are you sure you want to permanently delete this forensic case and all its associated devices and evidence? This action cannot be undone.",
      )
    ) {
      const toastId = toast.loading("Deleting forensic case...");
      try {
        await deleteCaseMutation.mutateAsync(caseId);
        toast.success("Forensic case successfully deleted", { id: toastId });
      } catch (err) {
        console.error("Failed to delete case:", err);
        toast.error("Failed to delete case. Please try again.", {
          id: toastId,
        });
      }
    }
  };

  const filteredCases = cases.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.investigator.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)",
            }}
          >
            <Folder size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Forensic Cases
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Secure ledger tracking for digital mobile investigations
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #0ea5e9, #22d3ee)",
            boxShadow: "0 0 15px rgba(34, 211, 238, 0.3)",
          }}
        >
          <Plus size={14} />
          Initialize Case
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search by case title, number, or investigator..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input pl-10"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-cyan-400" size={24} />
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="glass-card p-10 text-center text-muted-foreground space-y-2">
          <div>No cases found matching your search.</div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((k) => (
            <CaseCard
              key={k.id}
              kase={k}
              onClick={() => {
                setSelectedCaseId(k.id);
                onNavigate("casedetails");
              }}
              onDelete={() => handleDeleteCase(k.id)}
            />
          ))}
        </div>
      )}

      <CaseCreationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => createCaseMutation.mutate(data)}
        investigatorName={investigatorName}
      />
    </div>
  );
}
