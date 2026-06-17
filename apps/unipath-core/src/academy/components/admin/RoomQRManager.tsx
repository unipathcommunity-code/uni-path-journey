import { useState } from "react";
import { motion } from "framer-motion";
import { QrCode, Power, PowerOff, Download, Loader2, X } from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  qr_code: string | null;
  checkin_active: boolean;
  floor: string | null;
}

interface Props {
  rooms: Room[];
  onRefresh: () => void;
}

const RoomQRManager = ({ rooms, onRefresh }: Props) => {
  const { t } = useLanguage();
  const [toggling, setToggling] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState<Room | null>(null);

  const toggle = async (room: Room) => {
    setToggling(room.id);
    try {
      const { error } = await supabase
        .from("rooms")
        .update({ checkin_active: !room.checkin_active })
        .eq("id", room.id);
      if (error) throw error;
      toast.success(!room.checkin_active ? t("admin.checkin_enabled") : t("admin.checkin_disabled"));
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setToggling(null);
    }
  };

  const downloadQR = (room: Room) => {
    const canvas = document.getElementById(`qr-canvas-${room.id}`) as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${room.name.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h2 className="text-base font-heading font-semibold">{t("admin.qr_manager")}</h2>
            <p className="text-xs text-muted-foreground">{t("admin.qr_manager_desc")}</p>
          </div>
        </div>

        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t("admin.no_rooms")}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.map((room) => (
              <motion.div key={room.id} layout className="p-3 rounded-xl bg-muted/20 border border-border/30 flex flex-col items-center gap-2">
                <div className="flex items-center justify-between w-full">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{room.name}</p>
                    <p className="text-[10px] text-muted-foreground">{room.floor || "—"}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${room.checkin_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {room.checkin_active ? "ON" : "OFF"}
                  </span>
                </div>
                <button onClick={() => setZoomed(room)} className="p-2 bg-white rounded-xl">
                  {room.qr_code ? (
                    <QRCodeSVG value={room.qr_code} size={100} level="H" />
                  ) : (
                    <div className="w-[100px] h-[100px] flex items-center justify-center text-xs text-muted-foreground">—</div>
                  )}
                </button>
                {/* hidden canvas for download */}
                {room.qr_code && (
                  <div className="hidden">
                    <QRCodeCanvas id={`qr-canvas-${room.id}`} value={room.qr_code} size={512} level="H" />
                  </div>
                )}
                <div className="flex gap-1 w-full">
                  <button
                    onClick={() => toggle(room)}
                    disabled={toggling === room.id}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
                      room.checkin_active ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-success/10 text-success hover:bg-success/20"
                    }`}
                  >
                    {toggling === room.id ? <Loader2 className="w-3 h-3 animate-spin" /> : room.checkin_active ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                    {room.checkin_active ? t("admin.turn_off") : t("admin.turn_on")}
                  </button>
                  <button onClick={() => downloadQR(room)} className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted">
                    <Download className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {zoomed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomed(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong p-6 max-w-sm w-full text-center space-y-4 relative"
          >
            <button onClick={() => setZoomed(null)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted/50">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold font-heading">{zoomed.name}</h3>
            <div className="bg-white p-4 rounded-2xl mx-auto inline-block">
              {zoomed.qr_code && <QRCodeSVG value={zoomed.qr_code} size={260} level="H" />}
            </div>
            <p className="text-xs text-muted-foreground">{t("admin.qr_zoom_desc")}</p>
            <button onClick={() => downloadQR(zoomed)} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> {t("admin.download_qr")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default RoomQRManager;
