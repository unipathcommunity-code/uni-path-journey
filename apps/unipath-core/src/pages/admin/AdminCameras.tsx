import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Camera, 
  Plus, 
  ShieldAlert, 
  Tv, 
  Bell, 
  Play, 
  Square, 
  RefreshCw, 
  AlertOctagon, 
  CheckCircle,
  Activity,
  Flame,
  UserCheck,
  Eye,
  Volume2,
  VolumeX
} from 'lucide-react';

interface CameraDevice {
  id: string;
  name: string;
  stream_url_encrypted: string;
  status: 'online' | 'offline';
  last_heartbeat: string | null;
}

interface CameraEvent {
  id: string;
  device_id: string;
  device_name?: string;
  event_type: 'fire_smoke' | 'intrusion' | 'crowd_density' | 'face_match' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  snapshot_url: string | null;
  processed: boolean;
  created_at: string;
}

export default function AdminCameras() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [events, setEvents] = useState<CameraEvent[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());

  // Active stream play status
  const [playingStreams, setPlayingStreams] = useState<Record<string, boolean>>({});

  // Modals & Forms
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [camName, setCamName] = useState('');
  const [camUrl, setCamUrl] = useState('rtsp://192.168.1.100:554/stream1');

  // Live timer update
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio beep player for critical simulated events
  const audioContextRef = useRef<AudioContext | null>(null);
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      
      // Double beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.12);
      }, 180);
    } catch (e) {
      console.warn('Audio simulation failed:', e);
    }
  };

  async function fetchCameraData() {
    if (!activeTenant) { setLoading(false); return; }
    try {
      setLoading(true);
      // 1. Fetch devices
      const { data: devicesData, error: devError } = await supabase
        .from('camera_devices')
        .select('*');

      if (devError) throw devError;
      
      let finalDevices = devicesData || [];

      // Auto-seed default camera devices if empty
      if (finalDevices.length === 0) {
        const seedDevices = [
          {
            tenant_id: activeTenant.id,
            name: "Asosiy Kirish (CCTV 01)",
            stream_url_encrypted: "rtsp://192.168.1.10/live",
            status: "online" as const
          },
          {
            tenant_id: activeTenant.id,
            name: "Tayyor Mahsulot Ombori (CCTV 02)",
            stream_url_encrypted: "rtsp://192.168.1.20/live",
            status: "online" as const
          },
          {
            tenant_id: activeTenant.id,
            name: "Ishlab Chiqarish Zali (CCTV 03)",
            stream_url_encrypted: "rtsp://192.168.1.30/live",
            status: "online" as const
          }
        ];
        
        const { data: seeded, error: seedErr } = await supabase
          .from('camera_devices')
          .insert(seedDevices)
          .select();
        
        if (!seedErr && seeded) {
          finalDevices = seeded;
        }
      }

      setDevices(finalDevices);

      // Play all seeded/online streams by default
      const defaultPlayState: Record<string, boolean> = {};
      finalDevices.forEach(d => {
        if (d.status === 'online') defaultPlayState[d.id] = true;
      });
      setPlayingStreams(defaultPlayState);

      // 2. Fetch AI Events
      const { data: eventsData } = await supabase
        .from('camera_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      let finalEvents = eventsData || [];

      // Auto-seed default events if empty
      if (finalEvents.length === 0 && finalDevices.length > 0) {
        const seedEvents = [
          {
            tenant_id: activeTenant.id,
            device_id: finalDevices[0].id,
            event_type: "face_match" as const,
            severity: "low" as const,
            processed: true,
            snapshot_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            tenant_id: activeTenant.id,
            device_id: finalDevices[1].id,
            event_type: "intrusion" as const,
            severity: "high" as const,
            processed: false,
            snapshot_url: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400",
            created_at: new Date(Date.now() - 600000).toISOString()
          }
        ];

        const { data: seededEvents, error: seedEvErr } = await supabase
          .from('camera_events')
          .insert(seedEvents)
          .select();
        
        if (!seedEvErr && seededEvents) {
          finalEvents = seededEvents;
        }
      }

      const mappedEvents = finalEvents.map(e => ({
        ...e,
        device_name: finalDevices?.find(d => d.id === e.device_id)?.name || 'Kamera'
      }));
      setEvents(mappedEvents);

    } catch (err: any) {
      console.error('Error fetching camera/AI data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCameraData();
  }, [activeTenant]);

  const handleCreateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camName.trim() || !activeTenant) return;

    try {
      const { data, error } = await supabase
        .from('camera_devices')
        .insert({
          tenant_id: activeTenant.id,
          name: camName,
          stream_url_encrypted: camUrl,
          status: 'online'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Kamera qo\'shildi!',
        description: `"${camName}" muvaffaqiyatli ulindi va monitoring boshlandi.`
      });

      setDevices([...devices, data]);
      setPlayingStreams(prev => ({ ...prev, [data.id]: true }));
      setIsCameraModalOpen(false);
      setCamName('');
      setCamUrl('rtsp://192.168.1.100:554/stream1');
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleProcessEvent = async (eventId: string) => {
    try {
      await supabase
        .from('camera_events')
        .update({ processed: true })
        .eq('id', eventId);

      setEvents(events.map(e => e.id === eventId ? { ...e, processed: true } : e));
      toast({
        title: 'Hodisa yopildi',
        description: 'AI xavfsizlik ogohlantirishi muvaffaqiyatli ko\'rib chiqildi.'
      });
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleTriggerSimulateAlert = async () => {
    if (devices.length === 0 || !activeTenant) {
      toast({
        title: 'Kamera yo\'q',
        description: 'Simulyatsiya qilish uchun kamida bitta kamera qo\'shing.',
        variant: 'destructive'
      });
      return;
    }

    const dev = devices[Math.floor(Math.random() * devices.length)];
    const types: Array<'fire_smoke' | 'intrusion' | 'crowd_density'> = ['fire_smoke', 'intrusion', 'crowd_density'];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (selectedType === 'fire_smoke') severity = 'critical';
    if (selectedType === 'intrusion') severity = 'high';
    if (selectedType === 'crowd_density') severity = 'medium';

    try {
      const { data: newEv, error } = await supabase
        .from('camera_events')
        .insert({
          tenant_id: activeTenant.id,
          device_id: dev.id,
          event_type: selectedType,
          severity: severity,
          processed: false,
          snapshot_url: selectedType === 'fire_smoke'
            ? 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400'
            : 'https://images.unsplash.com/photo-1508962914676-134849a727f0?w=400'
        })
        .select()
        .single();

      if (error) throw error;

      setEvents([{ ...newEv, device_name: dev.name }, ...events]);
      
      // Play high-fidelity alert sound
      playAlertSound();

      toast({
        title: 'AI Xavfsizlik Ogohlantirishi!',
        description: `Kamera "${dev.name}" da anomal hodisa: ${selectedType.toUpperCase()}`,
        variant: severity === 'critical' ? 'destructive' : 'default'
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'fire_smoke': return <Flame className="w-4 h-4 text-rose-400" />;
      case 'intrusion': return <AlertOctagon className="w-4 h-4 text-orange-400" />;
      case 'crowd_density': return <Activity className="w-4 h-4 text-amber-400" />;
      default: return <UserCheck className="w-4 h-4 text-blue-400" />;
    }
  };

  // Resolve CCTV simulated stream background images based on camera name
  const getCamImage = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('kirish') || n.includes('gate') || n.includes('entry')) {
      return "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop";
    }
    if (n.includes('ombor') || n.includes('warehouse') || n.includes('storage')) {
      return "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop";
    }
    if (n.includes('ishlab') || n.includes('sehi') || n.includes('workshop') || n.includes('zal') || n.includes('floor')) {
      return "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop";
    }
    return "https://images.unsplash.com/photo-1508962914676-134849a727f0?w=600&auto=format&fit=crop";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <div className="text-muted-foreground font-sans text-sm">Kamera va AI modullari yuklanmoqda...</div>
        </div>
      </div>
    );
  }

  // Active alarms helper
  const activeCriticalAlarms = events.filter(e => !e.processed && (e.severity === 'critical' || e.severity === 'high'));

  return (
    <div className="space-y-6 select-none relative">
      {/* Dynamic CSS styles for simulation enhancements */}
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes alert-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.6); border-color: rgba(239, 68, 68, 1); }
        }
        @keyframes blinking-rec {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .cctv-scanlines::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          z-index: 10;
          background-size: 100% 4px, 6px 100%;
          pointer-events: none;
        }
        .cctv-scanline-laser {
          position: absolute;
          width: 100%;
          height: 2px;
          background: rgba(16, 185, 129, 0.2);
          animation: scanline 6s linear infinite;
          z-index: 11;
          pointer-events: none;
        }
        .cctv-scanline-laser-critical {
          position: absolute;
          width: 100%;
          height: 2px;
          background: rgba(239, 68, 68, 0.4);
          animation: scanline 3s linear infinite;
          z-index: 11;
          pointer-events: none;
        }
        .critical-siren {
          animation: alert-glow 1.5s infinite;
        }
        .rec-dot {
          animation: blinking-rec 1s infinite;
        }
      `}</style>

      {/* Flashing Siren Banner if Critical Alarm exists */}
      {activeCriticalAlarms.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-rose-500 rec-dot flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-400">FAVQULODDA OGOHLANTIRISH: XAVFSIZLIK ANOMALIYASI DETEKTSIYA QILINDI</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kamera: {activeCriticalAlarms[0].device_name || 'Kamera'}. Turi: {activeCriticalAlarms[0].event_type.toUpperCase().replace('_', ' ')}.
              </p>
            </div>
          </div>
          <Button size="sm" variant="destructive" onClick={() => handleProcessEvent(activeCriticalAlarms[0].id)} className="rounded-xl font-bold">
            Signalni O'chirish
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Camera className="w-7 h-7 text-primary" /> AI Smart Camera Surveillance (Operatsion Nazorat)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Real-vaqt rejimida yong'in, cheklangan hududga kirish va to'planish holatlarini aniqlash tizimi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className="rounded-xl border border-border"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 mr-2 text-emerald-400" /> : <VolumeX className="w-4 h-4 mr-2" />}
            Ovozli Signal: {soundEnabled ? "YOQILGAN" : "O'CHIRILGAN"}
          </Button>
          <Button variant="outline" onClick={handleTriggerSimulateAlert} className="rounded-xl border border-border">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin-slow" /> AI Hodisasini Simulyatsiya qilish
          </Button>
          <Button onClick={() => setIsCameraModalOpen(true)} className="gap-2 rounded-xl">
            <Plus className="w-5 h-5" /> Kamera qo'shish
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Ulangan kameralar</p>
              <p className="text-2xl font-bold text-foreground mt-1">{devices.length} ta</p>
            </div>
            <Tv className="w-8 h-8 text-muted-foreground/20" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Faol kameralar (Online)</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {devices.filter(d => d.status === 'online').length} ta
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-500/20" />
          </CardContent>
        </Card>

        <Card className={`bg-card border border-border ${activeCriticalAlarms.length > 0 ? 'border-rose-500/50 bg-rose-500/[0.02]' : ''}`}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Faol xavfsizlik hodisalari</p>
              <p className={`text-2xl font-bold mt-1 ${events.filter(e => !e.processed).length > 0 ? 'text-rose-400' : 'text-foreground'}`}>
                {events.filter(e => !e.processed).length} ta
              </p>
            </div>
            <ShieldAlert className={`w-8 h-8 ${events.filter(e => !e.processed).length > 0 ? 'text-rose-500/30' : 'text-muted-foreground/20'}`} />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Ko'rib chiqildi (Processed)</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {events.filter(e => e.processed).length} ta
              </p>
            </div>
            <Bell className="w-8 h-8 text-emerald-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Stream Previews & AI Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stream Previews */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg">CCTV Video Stream Matrix</CardTitle>
              <CardDescription>Sex, ombor yoki ofislardagi live kameralar matritsasi (AI analiz overlay bilan)</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {devices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Kameralar ulanmagan.</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {devices.map((device) => {
                    const isPlaying = playingStreams[device.id];
                    const activeAlarm = events.find(e => e.device_id === device.id && !e.processed);
                    const isCritical = activeAlarm && (activeAlarm.severity === 'critical' || activeAlarm.severity === 'high');

                    return (
                      <div 
                        key={device.id} 
                        className={`relative aspect-video bg-[#0c0c0e] rounded-xl overflow-hidden border transition-all duration-300 group ${
                          isCritical ? 'critical-siren border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-border hover:border-emerald-500/50'
                        }`}
                      >
                        {/* Stream Active View */}
                        {isPlaying ? (
                          <div className="absolute inset-0 cctv-scanlines bg-cover bg-center" style={{ backgroundImage: `url(${getCamImage(device.name)})` }}>
                            {/* Scanning Laser Line */}
                            <div className={isCritical ? 'cctv-scanline-laser-critical' : 'cctv-scanline-laser'} />

                            {/* Red Smoke Vignette if Fire alarm is active */}
                            {activeAlarm?.event_type === 'fire_smoke' && (
                              <div className="absolute inset-0 bg-rose-600/25 animate-pulse mix-blend-color-burn pointer-events-none" />
                            )}

                            {/* 1. Simulated AI Bounding Boxes */}
                            {activeAlarm ? (
                              // Critical Intrusion or Fire Warning Box
                              <div className="absolute top-[30%] left-[25%] w-[50%] h-[50%] border-2 border-rose-500 rounded flex flex-col justify-between pointer-events-none animate-pulse">
                                <span className="bg-rose-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-br font-bold uppercase tracking-wider self-start">
                                  {activeAlarm.event_type === 'fire_smoke' ? '🔥 WARNING: FLAME [100%]' : '🚨 DETECTED: INTRUDER [99%]'}
                                </span>
                                <span className="text-rose-500 font-mono text-[8px] text-right pr-1 pb-0.5 font-bold uppercase">XAVFSIZLIK TIZIMI JAVOBI FAOL</span>
                              </div>
                            ) : (
                              // Regular Bounding Boxes for normal object detection
                              <>
                                <div className="absolute top-[20%] left-[15%] w-[20%] h-[60%] border border-emerald-500/80 rounded flex flex-col justify-between pointer-events-none">
                                  <span className="bg-emerald-500 text-white font-mono text-[8px] px-1 py-0.2 rounded-br self-start uppercase">PERSON [98%]</span>
                                </div>
                                <div className="absolute top-[40%] left-[45%] w-[40%] h-[40%] border border-sky-500/70 rounded flex flex-col justify-between pointer-events-none">
                                  <span className="bg-sky-500 text-white font-mono text-[8px] px-1 py-0.2 rounded-br self-start uppercase">OBJECT: SAFE AREA</span>
                                </div>
                              </>
                            )}

                            {/* 2. Top-Left Overlay Metadata */}
                            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-wider flex items-center gap-1.5 z-20">
                              <span className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                              <span className="text-white font-sans uppercase">{device.name}</span>
                            </div>

                            {/* 3. Top-Right Blinking REC Indicator */}
                            <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-mono text-white/90 flex items-center gap-1.5 z-20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 rec-dot" />
                              <span>REC</span>
                            </div>

                            {/* 4. Bottom-Left Live Timestamp */}
                            <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-mono text-white/90 z-20">
                              {liveTime.toLocaleDateString()} {liveTime.toLocaleTimeString()}
                            </div>

                            {/* 5. Bottom-Right stream quality and overlay toggle */}
                            <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-mono text-white/70 flex items-center gap-1.5 z-20">
                              <span>1080P · 25 FPS · AI OVERLAY</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPlayingStreams(prev => ({ ...prev, [device.id]: false }));
                                }} 
                                className="w-3.5 h-3.5 rounded bg-muted hover:bg-muted-foreground/30 flex items-center justify-center text-white font-bold ml-1"
                              >
                                <Square className="w-2 h-2" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Offline / Stopped Stream Cover
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <Play 
                              className="w-12 h-12 text-white/40 hover:text-primary transition-all scale-100 hover:scale-110 cursor-pointer" 
                              onClick={() => setPlayingStreams(prev => ({ ...prev, [device.id]: true }))}
                            />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Kamerani tomosha qilish</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Incidents Alert Feed */}
        <div className="space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div>
                <CardTitle className="text-lg">AI Smart Alerts Feed</CardTitle>
                <CardDescription>AI Model tomonidan aniqlangan anomal hodisalar jurnali</CardDescription>
              </div>
              <ShieldAlert className={`w-5 h-5 ${events.filter(e => !e.processed).length > 0 ? 'text-rose-500 animate-bounce' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent className="pt-4">
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">Hech qanday ogohlantirish yo'q.</div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {events.map((event) => (
                    <div 
                      key={event.id} 
                      className={`p-3 border border-border rounded-xl space-y-2.5 transition-all ${
                        event.processed 
                          ? 'opacity-40 bg-muted/5' 
                          : event.severity === 'critical'
                            ? 'bg-rose-500/[0.04] border-rose-500/40 ring-1 ring-rose-500/20'
                            : 'bg-muted/10 border-muted-foreground/20'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                          {getEventIcon(event.event_type)}
                          {event.event_type.toUpperCase().replace('_', ' ')}
                        </span>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${getSeverityBadge(event.severity)}`}>
                          {event.severity}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        <span>Kamera: <b className="text-foreground">{event.device_name}</b></span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
                        <span>{new Date(event.created_at).toLocaleString()}</span>
                        {!event.processed && (
                          <Button 
                            size="sm" 
                            className="h-6 text-[9px] rounded-lg font-bold"
                            onClick={() => handleProcessEvent(event.id)}
                          >
                            Tasdiqlash & Yopish
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Camera Modal */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm bg-card border border-border shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-200">
            <CardHeader>
              <CardTitle className="text-lg">Yangi Smart Kamera Ulash</CardTitle>
              <CardDescription>Sex, omborxona yoki darvozangizdagi live CCTV kamerasini ulaning</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCamera} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cName" className="text-xs">Kamera Nomi (Sex, Ombor, Kirish darvozasi)</Label>
                  <Input 
                    id="cName" 
                    placeholder="Masalan: Asosiy Darvoza CCTV" 
                    value={camName} 
                    onChange={(e) => setCamName(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cUrl" className="text-xs">RTSP / HTTP Stream manzili (Stream URL)</Label>
                  <Input 
                    id="cUrl" 
                    value={camUrl} 
                    onChange={(e) => setCamUrl(e.target.value)}
                    className="rounded-xl border border-border font-mono"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCameraModalOpen(false)} className="rounded-xl">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl font-bold">
                    Kamerani Ulash
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

