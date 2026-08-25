import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] text-white relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-md mx-auto">
        {/* 3D 404 number */}
        <div className="relative mb-8">
          <span
            className="text-[160px] md:text-[200px] font-black leading-none tracking-tighter select-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 30px rgba(139,92,246,0.15))',
            }}
          >
            404
          </span>
          {/* Glow ring behind */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-white/[0.04]"
            style={{ boxShadow: '0 0 60px rgba(139,92,246,0.1)' }} />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white/90">
          Sahifa topilmadi
        </h2>
        <p className="text-white/40 text-sm leading-relaxed mb-8">
          Siz qidirayotgan sahifa mavjud emas, ko'chirilgan yoki o'chirilgan bo'lishi mumkin.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-white/10 text-white/80 hover:bg-white/[0.06] hover:text-white rounded-xl gap-2 font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Orqaga qaytish
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="bg-primary text-primary-foreground rounded-xl gap-2 font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <Home className="w-4 h-4" /> Bosh sahifa
          </Button>
        </div>

        <p className="text-[11px] text-white/20 mt-12">
          UniPath SaaS Platform
        </p>
      </div>
    </div>
  );
};

export default NotFound;
