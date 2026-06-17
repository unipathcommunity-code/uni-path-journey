import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Save, DoorOpen, Users, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  capacity: number;
  floor: string | null;
}

interface RoomCRUDProps {
  rooms: Room[];
  onRefresh: () => void;
}

const RoomCRUD = ({ rooms, onRefresh }: RoomCRUDProps) => {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("30");
  const [floor, setFloor] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setName("");
    setCapacity("30");
    setFloor("");
    setShowForm(true);
  };

  const openEdit = (room: Room) => {
    setEditing(room);
    setName(room.name);
    setCapacity(String(room.capacity));
    setFloor(room.floor || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from("rooms").update({
          name: name.trim(),
          capacity: parseInt(capacity) || 30,
          floor: floor.trim() || null,
        }).eq("id", editing.id);
        if (error) throw error;
        toast.success(t("admin.room_updated"));
      } else {
        const { error } = await supabase.from("rooms").insert({
          name: name.trim(),
          capacity: parseInt(capacity) || 30,
          floor: floor.trim() || null,
        });
        if (error) throw error;
        toast.success(t("admin.room_created"));
      }
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("admin.room_deleted"));
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="glass-strong p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <DoorOpen className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold">{t("admin.rooms")}</h2>
            <p className="text-xs text-muted-foreground">{rooms.length} {t("admin.configured_spaces")}</p>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
          <Plus className="w-3.5 h-3.5" /> {t("admin.add_room")}
        </motion.button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{editing ? t("admin.edit_room") : t("admin.add_room")}</h3>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
              </div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("admin.room_name")}
                className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30" />
              <div className="grid grid-cols-2 gap-2">
                <input value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder={t("admin.room_capacity")} type="number"
                  className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30" />
                <input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder={t("admin.room_floor")}
                  className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30" />
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={!name.trim() || saving}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? t("admin.save_changes") : t("admin.create")}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t("admin.no_rooms")}</p>
      ) : (
        <div className="grid gap-2">
          {rooms.map((room) => (
            <motion.div key={room.id} layout className="p-3 rounded-xl bg-muted/20 border border-border/20 flex items-center justify-between group hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <DoorOpen className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">{room.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {room.capacity} {room.floor && `· ${room.floor}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(room)} className="p-1.5 rounded-lg hover:bg-muted/50">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(room.id)} disabled={deleting === room.id} className="p-1.5 rounded-lg hover:bg-destructive/10">
                  {deleting === room.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" /> : <Trash2 className="w-3.5 h-3.5 text-destructive" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default RoomCRUD;
