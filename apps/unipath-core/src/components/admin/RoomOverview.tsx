import { motion } from "framer-motion";
import { DoorOpen, Users } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface Room {
  id: string;
  name: string;
  capacity: number;
  floor: string | null;
}

interface RoomOverviewProps {
  rooms: Room[];
  lessons: { room_id: string | null; status: string; title: string }[];
}

const RoomOverview = ({ rooms, lessons }: RoomOverviewProps) => {
  const { t } = useLanguage();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="glass-strong p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <DoorOpen className="w-5 h-5 text-accent" />
        </div>
        <h2 className="text-lg font-heading font-semibold">{t("admin.room_overview")}</h2>
      </div>

      {rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t("admin.no_rooms")}</p>
      ) : (
        <div className="grid gap-3">
          {rooms.map((room) => {
            const activeLesson = lessons.find((l) => l.room_id === room.id && l.status === "live");
            return (
              <div
                key={room.id}
                className={`p-4 rounded-xl border transition-colors ${
                  activeLesson
                    ? "bg-success/5 border-success/20"
                    : "bg-muted/30 border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{room.name}</p>
                    {room.floor && <p className="text-xs text-muted-foreground">Floor {room.floor}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{room.capacity}</span>
                    {activeLesson && (
                      <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium">
                        LIVE
                      </span>
                    )}
                  </div>
                </div>
                {activeLesson && (
                  <p className="text-xs text-success mt-2">{activeLesson.title}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default RoomOverview;
