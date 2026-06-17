import { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Plus, CheckCircle2, Building2, Loader2 } from 'lucide-react';
import { useBranches } from '@/hooks/useBranches';
import { useApp } from '@/contexts/AppContext';
import { AddBranchModal } from './AddBranchModal';

export function BranchSwitcher() {
  const { language } = useApp();
  const {
    branches,
    activeBranch,
    switchBranch,
    isLoading,
    canAddMore,
    maxBranches,
    branchCount,
  } = useBranches();

  const [open, setOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // If only 1 branch and can't add more, no need for a dropdown UI
  const isSingle = branches.length <= 1 && !canAddMore;

  const tAdd =
    language === 'ru' ? 'Добавить филиал' :
    language === 'uz' ? 'Filial qo\'shish' : 'Add Branch';
  const tBranches =
    language === 'ru' ? 'Филиалы' :
    language === 'uz' ? 'Filiallar' : 'Branches';
  const tLoading =
    language === 'ru' ? 'Загрузка...' :
    language === 'uz' ? 'Yuklanmoqda...' : 'Loading...';
  const tLimitInfo = maxBranches === Infinity ? '' :
    language === 'ru' ? `${branchCount} / ${maxBranches} филиалов`   :
    language === 'uz' ? `${branchCount} / ${maxBranches} ta filial`  :
                        `${branchCount} / ${maxBranches} branches`;

  if (isLoading) {
    return (
      <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-muted/40 flex items-center gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{tLoading}</span>
      </div>
    );
  }

  return (
    <>
      <div ref={ref} className="mx-3 mb-2 relative">
        {/* Trigger button */}
        <button
          onClick={() => !isSingle && setOpen((v) => !v)}
          className={`
            w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl
            border border-border bg-muted/30 hover:bg-muted/60 transition-colors
            ${isSingle ? 'cursor-default' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                {activeBranch?.name ?? (branches[0]?.name ?? tBranches)}
              </p>
              {activeBranch?.city && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 leading-tight">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{activeBranch.city}</span>
                </p>
              )}
            </div>
          </div>
          {!isSingle && (
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            {/* Branch list */}
            <div className="p-1 max-h-48 overflow-y-auto">
              {branches.map((branch) => {
                const isActive = branch.id === activeBranch?.id;
                return (
                  <button
                    key={branch.id}
                    onClick={() => {
                      switchBranch(branch.id);
                      setOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
                      ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{branch.name}</p>
                      {branch.city && (
                        <p className="text-[10px] text-muted-foreground truncate">{branch.city}</p>
                      )}
                    </div>
                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Divider + Add button */}
            <div className="border-t border-border p-1">
              <button
                onClick={() => {
                  setOpen(false);
                  setAddModalOpen(true);
                }}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors
                  ${canAddMore
                    ? 'text-primary hover:bg-primary/10 font-medium'
                    : 'text-muted-foreground/50 cursor-not-allowed'
                  }
                `}
                disabled={!canAddMore}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 text-left">{tAdd}</span>
                {!canAddMore && maxBranches !== Infinity && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-medium">
                    Pro
                  </span>
                )}
              </button>
              {tLimitInfo && (
                <p className="text-[9px] text-muted-foreground/50 px-3 pb-1 text-center">
                  {tLimitInfo}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      <AddBranchModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </>
  );
}
