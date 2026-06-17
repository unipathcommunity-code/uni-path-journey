import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Loader2, Crown, UserCircle2, UserPlus, Trash2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompany } from "@/hooks/useTourCompany";
import { useMyBranches, useBranch, Branch } from "@/hooks/useTourBranches";

const CompanyTeam = () => {
  const { data } = useMyCompany();
  const company = data?.company;
  const myRole = data?.role;
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const { data: branches = [] } = useMyBranches();
  const { currentBranchId } = useBranch();

  const { data: members, isLoading } = useQuery({
    queryKey: ["company-members", company?.id, currentBranchId],
    enabled: !!company?.id,
    queryFn: async () => {
      let q = (supabase as any).from("tour_company_members").select("*").eq("company_id", company!.id).order("joined_at", { ascending: true });
      if (currentBranchId) q = q.eq("branch_id", currentBranchId);
      const { data: ms, error } = await q;
      if (error) throw error;
      const ids = (ms || []).map((m: any) => m.user_id);
      if (!ids.length) return [];
      const { data: profiles } = await (supabase as any).from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids);
      const map = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      return (ms || []).map((m: any) => ({ ...m, profile: map.get(m.user_id) }));
    },
  });

  const branchMap = new Map<string, Branch>(branches.map((b) => [b.id, b]));

  const updateBranch = useMutation({
    mutationFn: async ({ id, branch_id }: { id: string; branch_id: string | null }) => {
      const { error } = await (supabase as any).from("tour_company_members").update({ branch_id }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Filial yangilandi");
      qc.invalidateQueries({ queryKey: ["company-members"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const invite = useMutation({
    mutationFn: async () => {
      throw new Error("Bu funksiya tez orada qo'shiladi. Hozircha super admindan so'rang.");
    },
    onError: (e: any) => toast.info(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("tour_company_members").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Xodim olib tashlandi");
      qc.invalidateQueries({ queryKey: ["company-members"] });
    },
  });

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" strokeWidth={1.75} /> Jamoa
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Xodimlar va ularning filiallari</p>
      </div>

      {myRole === "owner" && (
        <Card className="p-4 rounded-2xl border-border/60">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <h3 className="font-semibold text-sm tracking-tight">Xodim qo'shish</h3>
          </div>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="xodim@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && invite.mutate()}
              className="rounded-xl"
            />
            <Button onClick={() => invite.mutate()} disabled={invite.isPending || !inviteEmail.trim()} className="rounded-xl">
              {invite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" strokeWidth={1.75} />}
              Taklif
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Xodim avval UniTour'da ro'yxatdan o'tgan bo'lishi shart.
          </p>
        </Card>
      )}

      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <h3 className="font-semibold text-sm tracking-tight">A'zolar</h3>
          <Badge variant="secondary" className="text-[10px] font-normal">{members?.length ?? 0}</Badge>
        </div>
        <div className="p-2">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : !members?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">A'zolar yo'q</p>
          ) : (
            <div className="space-y-1">
              {members.filter((m: any) => m.is_active).map((m: any) => {
                const branch = branchMap.get(m.branch_id);
                return (
                  <div key={m.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {m.profile?.avatar_url ? (
                        <img src={m.profile.avatar_url} className="h-8 w-8 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCircle2 className="h-4 w-4 text-primary" strokeWidth={1.75} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{m.profile?.full_name || "Foydalanuvchi"}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          {branch ? (
                            <><Building2 className="h-3 w-3" strokeWidth={1.75} /> {branch.name}</>
                          ) : (
                            "Filial tayinlanmagan"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {myRole === "owner" && m.role !== "owner" && branches.length > 0 && (
                        <Select
                          value={m.branch_id || "none"}
                          onValueChange={(v) => updateBranch.mutate({ id: m.id, branch_id: v === "none" ? null : v })}
                        >
                          <SelectTrigger className="h-7 text-xs w-32 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-xs">— filial yo'q —</SelectItem>
                            {branches.map((b) => (
                              <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Badge variant={m.role === "owner" ? "default" : "secondary"} className="text-[10px] font-normal gap-1">
                        {m.role === "owner" && <Crown className="h-3 w-3" strokeWidth={1.75} />}
                        {m.role === "owner" ? "Egasi" : "Xodim"}
                      </Badge>
                      {myRole === "owner" && m.role !== "owner" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => { if (confirm("O'chirilsinmi?")) remove.mutate(m.id); }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" strokeWidth={1.75} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CompanyTeam;
