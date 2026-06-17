import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldBan, ShieldCheck, Users, Search, Loader2, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/common/PageTransition";
import { motion } from "framer-motion";

const AdminUserControl = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["admin-user-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_blocks")
        .select("*")
        .is("unblocked_at", null);
      if (error) throw error;
      return data;
    },
  });

  const blockedUserIds = new Set(blocks.map((b: any) => b.user_id));

  const blockUser = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase.from("user_blocks").insert({
        user_id: userId,
        blocked_by: user!.id,
        reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-blocks"] });
      toast.success("Foydalanuvchi bloklandi");
      setSelectedUserId(null);
      setBlockReason("");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const unblockUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_blocks")
        .update({ unblocked_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("unblocked_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-blocks"] });
      toast.success("Foydalanuvchi blokdan chiqarildi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const filtered = profiles.filter((p: any) =>
    (p.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user_id.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldBan className="h-6 w-6" />
            Foydalanuvchi nazorati
          </h1>
          <p className="text-muted-foreground">Foydalanuvchilarni bloklash va boshqarish</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profiles.length}</p>
                <p className="text-xs text-muted-foreground">Jami foydalanuvchilar</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blockedUserIds.size}</p>
                <p className="text-xs text-muted-foreground">Bloklangan</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ism yoki ID bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {filtered.map((profile: any, i: number) => {
            const isBlocked = blockedUserIds.has(profile.user_id);
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className={isBlocked ? "border-destructive/50" : ""}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBlocked ? "bg-destructive/10" : "bg-muted"}`}>
                        <Users className={`h-5 w-5 ${isBlocked ? "text-destructive" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-medium">{profile.full_name || "Ism ko'rsatilmagan"}</p>
                        <p className="text-xs text-muted-foreground">{profile.phone || "Telefon yo'q"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBlocked ? (
                        <>
                          <Badge variant="destructive">Bloklangan</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unblockUser.mutate(profile.user_id)}
                            disabled={unblockUser.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Blokdan chiqarish
                          </Button>
                        </>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedUserId(profile.user_id)}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Bloklash
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Foydalanuvchini bloklash</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                <strong>{profile.full_name || "Foydalanuvchi"}</strong> bloklash sababini kiriting:
                              </p>
                              <div>
                                <Label>Sabab</Label>
                                <Input
                                  value={blockReason}
                                  onChange={(e) => setBlockReason(e.target.value)}
                                  placeholder="Bloklash sababi..."
                                  className="mt-1"
                                />
                              </div>
                              <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => {
                                  if (selectedUserId) {
                                    blockUser.mutate({ userId: selectedUserId, reason: blockReason });
                                  }
                                }}
                                disabled={blockUser.isPending}
                              >
                                {blockUser.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
                                Bloklash
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminUserControl;
