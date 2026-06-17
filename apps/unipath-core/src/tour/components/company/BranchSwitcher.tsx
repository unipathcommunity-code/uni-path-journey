import { Building2, Check, ChevronsUpDown, Layers } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useBranch } from '@/tour/hooks/useBranches';
import { Link } from "react-router-dom";

const BranchSwitcher = ({ dark = false }: { dark?: boolean }) => {
  const { branches, currentBranchId, setCurrentBranchId, current } = useBranch();

  const label = current ? current.name : "Hamma filiallar";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
            dark
              ? "bg-background/10 hover:bg-background/15 text-background"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${dark ? "bg-background/15" : "bg-background"}`}>
            {current ? <Building2 className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Layers className="h-3.5 w-3.5" strokeWidth={1.75} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase opacity-60 leading-none">Filial</p>
            <p className="text-sm font-medium truncate leading-tight mt-0.5">{label}</p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1.5" align="start">
        <button
          onClick={() => setCurrentBranchId(null)}
          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted text-left"
        >
          <Layers className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <span className="flex-1">Hamma filiallar</span>
          {!currentBranchId && <Check className="h-4 w-4 text-primary" strokeWidth={2} />}
        </button>
        <div className="h-px bg-border my-1" />
        {branches.map((b) => (
          <button
            key={b.id}
            onClick={() => setCurrentBranchId(b.id)}
            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted text-left"
          >
            <Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <div className="flex-1 min-w-0">
              <p className="truncate">{b.name}</p>
              {b.city && <p className="text-[10px] text-muted-foreground truncate">{b.city}</p>}
            </div>
            {currentBranchId === b.id && <Check className="h-4 w-4 text-primary" strokeWidth={2} />}
          </button>
        ))}
        <div className="h-px bg-border my-1" />
        <Link
          to="/company/branches"
          className="block w-full text-center text-xs text-primary hover:underline px-2.5 py-1.5"
        >
          Filiallarni boshqarish
        </Link>
      </PopoverContent>
    </Popover>
  );
};

export default BranchSwitcher;
