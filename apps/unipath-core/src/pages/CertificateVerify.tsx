import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, CheckCircle2, XCircle, Loader2, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG as QRCode } from "qrcode.react";

/**
 * CertificateVerify — har kim QR orqali kelib sertifikatning haqiqiyligini ko'radi.
 * /verify/:token (public)
 */
const CertificateVerify = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<any>(null);
  const [studentName, setStudentName] = useState<string>("—");
  const [issuerName, setIssuerName] = useState<string>("—");
  const [orgName, setOrgName] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (!token) { setLoading(false); return; }
      const { data: c } = await supabase.from("certificates")
        .select("*").eq("public_token", token).maybeSingle();
      setCert(c);
      if (c) {
        const [{ data: s }, { data: t }, { data: o }] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("user_id", c.student_id).maybeSingle(),
          supabase.from("profiles").select("full_name").eq("user_id", c.issued_by).maybeSingle(),
          supabase.from("organizations").select("name").eq("id", c.organization_id).maybeSingle(),
        ]);
        setStudentName(s?.full_name || "—");
        setIssuerName(t?.full_name || "—");
        setOrgName(o?.name || "");
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const verifyUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen bg-background nova-grid-bg p-4 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-6 max-w-lg w-full">
        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : !cert ? (
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
            <h2 className="font-bold text-foreground">Topilmadi</h2>
            <p className="text-sm text-muted-foreground">Bunday sertifikat mavjud emas yoki bekor qilingan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Haqiqiy sertifikat
            </div>
            <div className="text-center py-4 border-y border-border/30">
              <Award className="w-12 h-12 text-warning mx-auto mb-2" />
              <h1 className="text-xl font-bold text-gradient-primary">{cert.title}</h1>
              {cert.subject && <p className="text-sm text-muted-foreground mt-1">{cert.subject}</p>}
              {cert.grade && <p className="text-2xl font-bold text-warning mt-2">{cert.grade}</p>}
              {cert.score !== null && cert.score !== undefined && (
                <p className="text-sm text-muted-foreground">Ball: <b className="text-foreground">{cert.score}</b></p>
              )}
            </div>
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">O'quvchi:</span> <b>{studentName}</b></p>
              <p className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Bergan:</span> <b>{issuerName}</b></p>
              {orgName && <p className="text-muted-foreground text-xs ml-5">{orgName}</p>}
              <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Sana:</span> <b>{new Date(cert.issued_at).toLocaleDateString()}</b></p>
            </div>
            {cert.description && (
              <p className="text-xs text-muted-foreground italic border-l-2 border-warning/40 pl-3">{cert.description}</p>
            )}
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="bg-white p-2 rounded-lg">
                <QRCode value={verifyUrl} size={120} />
              </div>
              <p className="text-[10px] text-muted-foreground">ID: {cert.public_token.slice(0, 12)}…</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CertificateVerify;
