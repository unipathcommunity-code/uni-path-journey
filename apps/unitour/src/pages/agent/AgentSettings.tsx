import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { 
  Settings, 
  User, 
  Phone, 
  Mail,
  Building2,
  Save,
  Loader2,
  Shield,
  Bell,
  Palette
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string;
  company_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  description: string | null;
  user_id: string | null;
}

const AgentSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    phone: "",
    email: "",
    address: "",
    description: "",
  });

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agents")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      
      setFormData({
        name: data.name || "",
        company_name: data.company_name || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        description: data.description || "",
      });
      
      return data as Agent;
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("agents")
        .update({
          name: formData.name,
          company_name: formData.company_name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          description: formData.description,
        })
        .eq("id", agent?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-profile"] });
      setIsEditing(false);
      toast.success("Ma'lumotlar muvaffaqiyatli saqlandi!");
    },
    onError: () => {
      toast.error("Xatolik yuz berdi");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sozlamalar</h1>
        <p className="text-muted-foreground">
          Agent profil va tizim sozlamalari
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil ma'lumotlari
            </CardTitle>
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Bekor qilish" : "Tahrirlash"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Ism</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="company">Kompaniya nomi</Label>
                <Input
                  id="company"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Manzil</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Ta'rif</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!isEditing}
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50"
              />
            </div>

            {isEditing && (
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="w-full md:w-auto"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Saqlash
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Bildirishnomalar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Yangi buyurtmalar</p>
              <p className="text-sm text-muted-foreground">
                Yangi buyurtma kelganda xabar olish
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">To'lov xabarlari</p>
              <p className="text-sm text-muted-foreground">
                Komissiya to'langanda xabar olish
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Yangi turlar</p>
              <p className="text-sm text-muted-foreground">
                Sizga yangi tur biriktirilganda
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="bg-gradient-to-br from-primary/5 to-green-500/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Hisob ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agent ID:</span>
              <span className="font-mono text-xs">{agent?.id?.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-green-600 font-medium">Faol</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentSettings;
