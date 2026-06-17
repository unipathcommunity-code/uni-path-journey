import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Award, ExternalLink, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { useState } from "react";

/**
 * CertificatesList — o'quvchining barcha sertifikatlari (portfolio).
 * QR tugmasi orqali sertifikatni jamoat verifikatsiya sahifasiga ulashish mumkin.
 */
const CertificatesList = () => {
  const { user } = useAuth();
  const [qrFor, setQrFor] = useState<string | null>(null);

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ["student-certificates", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("certificates")
        .select("*").eq("student_id", user.id).order("issued_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const verifyUrl = (token: string) => `${window.location.origin}/verify/${token}`;

  if (isLoading) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Award className="w-4 h-4 text-warning" /> Sertifikatlar
      </h3>
      {certs.length === 0 ? (
        <div className="glass p-6 text-center">
          <p className="text-xs text-muted-foreground">Hozircha sertifikatlar yo'q. O'qituvchidan oling 🎓</p>
        </div>
      ) : (
        <div className="space-y-2">
          {certs.map((c: any, i: number) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass p-3 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{c.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {c.subject || ""} {c.grade ? `· ${c.grade}` : ""} · {new Date(c.issued_at).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setQrFor(qrFor === c.id ? null : c.id)}
                className="p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50" aria-label="QR">
                <QrCode className="w-4 h-4" />
              </button>
              <a href={verifyUrl(c.public_token)} target="_blank" rel="noreferrer"
                className="p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50" aria-label="Open">
                <ExternalLink className="w-4 h-4" />
              </a>
              {qrFor === c.id && (
                <div className="absolute mt-12 ml-12 bg-white p-2 rounded-lg shadow-lg z-10">
                  <QRCode value={verifyUrl(c.public_token)} size={100} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesList;
