// Centralized sound system with admin toggle + preset support
import { supabase } from '@/integrations/supabase/client';

export type CelebrationPreset = 'fanfare' | 'orchestral' | 'chime' | 'victory' | 'off';
export type NotificationPreset = 'ting' | 'bell' | 'pop' | 'chime' | 'off';

interface SoundSettings {
  celebrationMusic: boolean;
  notificationSounds: boolean;
  celebrationPreset: CelebrationPreset;
  notificationPreset: NotificationPreset;
}

let cachedSoundSettings: SoundSettings | null = null;
let settingsLastFetched = 0;

export async function getSoundSettings(): Promise<SoundSettings> {
  const now = Date.now();
  if (cachedSoundSettings && now - settingsLastFetched < 30000) return cachedSoundSettings;

  const { data } = await supabase
    .from('system_config')
    .select('config_key, config_value')
    .in('config_key', ['celebration_music', 'notification_sounds']);

  const settings: SoundSettings = {
    celebrationMusic: true,
    notificationSounds: true,
    celebrationPreset: 'fanfare',
    notificationPreset: 'ting',
  };

  data?.forEach((c: any) => {
    if (c.config_key === 'celebration_music') {
      settings.celebrationMusic = c.config_value?.enabled !== false;
      if (c.config_value?.preset) settings.celebrationPreset = c.config_value.preset;
    }
    if (c.config_key === 'notification_sounds') {
      settings.notificationSounds = c.config_value?.enabled !== false;
      if (c.config_value?.preset) settings.notificationPreset = c.config_value.preset;
    }
  });

  cachedSoundSettings = settings;
  settingsLastFetched = now;
  return settings;
}

export function invalidateSoundCache() {
  cachedSoundSettings = null;
  settingsLastFetched = 0;
}

// ===== CELEBRATION PRESETS =====

function playFanfare(ctx: AudioContext) {
  const notes = [
    { freq: 523, start: 0, dur: 0.15, gain: 0.25 },
    { freq: 659, start: 0.12, dur: 0.15, gain: 0.25 },
    { freq: 784, start: 0.24, dur: 0.15, gain: 0.28 },
    { freq: 1047, start: 0.36, dur: 0.35, gain: 0.3 },
    { freq: 392, start: 0, dur: 0.5, gain: 0.12 },
    { freq: 523, start: 0.36, dur: 0.35, gain: 0.15 },
    { freq: 659, start: 0.36, dur: 0.35, gain: 0.12 },
    { freq: 1568, start: 0.5, dur: 0.2, gain: 0.15 },
    { freq: 2093, start: 0.6, dur: 0.25, gain: 0.1 },
    { freq: 1047, start: 0.7, dur: 0.5, gain: 0.2 },
    { freq: 1319, start: 0.7, dur: 0.5, gain: 0.15 },
    { freq: 1568, start: 0.7, dur: 0.5, gain: 0.12 },
  ];
  playNotes(ctx, notes);
}

function playOrchestral(ctx: AudioContext) {
  const notes = [
    { freq: 440, start: 0, dur: 0.3, gain: 0.2 },
    { freq: 554, start: 0.15, dur: 0.3, gain: 0.2 },
    { freq: 659, start: 0.3, dur: 0.3, gain: 0.22 },
    { freq: 880, start: 0.45, dur: 0.5, gain: 0.28 },
    { freq: 330, start: 0, dur: 0.8, gain: 0.1 },
    { freq: 440, start: 0.45, dur: 0.5, gain: 0.12 },
    { freq: 554, start: 0.45, dur: 0.5, gain: 0.1 },
    { freq: 1760, start: 0.8, dur: 0.3, gain: 0.08 },
    { freq: 880, start: 0.9, dur: 0.4, gain: 0.18 },
    { freq: 1109, start: 0.9, dur: 0.4, gain: 0.14 },
    { freq: 1319, start: 0.9, dur: 0.4, gain: 0.1 },
  ];
  playNotes(ctx, notes);
}

function playChimeCelebration(ctx: AudioContext) {
  const notes = [
    { freq: 1047, start: 0, dur: 0.4, gain: 0.2 },
    { freq: 1319, start: 0.1, dur: 0.4, gain: 0.18 },
    { freq: 1568, start: 0.2, dur: 0.4, gain: 0.16 },
    { freq: 2093, start: 0.3, dur: 0.6, gain: 0.22 },
    { freq: 2637, start: 0.5, dur: 0.5, gain: 0.12 },
    { freq: 3136, start: 0.7, dur: 0.4, gain: 0.08 },
  ];
  playNotes(ctx, notes, 'sine');
}

function playVictory(ctx: AudioContext) {
  const notes = [
    { freq: 392, start: 0, dur: 0.12, gain: 0.25 },
    { freq: 392, start: 0.13, dur: 0.12, gain: 0.25 },
    { freq: 392, start: 0.26, dur: 0.12, gain: 0.25 },
    { freq: 523, start: 0.4, dur: 0.6, gain: 0.3 },
    { freq: 466, start: 0.55, dur: 0.1, gain: 0.2 },
    { freq: 440, start: 0.65, dur: 0.1, gain: 0.2 },
    { freq: 392, start: 0.75, dur: 0.15, gain: 0.22 },
    { freq: 523, start: 0.92, dur: 0.5, gain: 0.3 },
    { freq: 262, start: 0, dur: 0.4, gain: 0.1 },
    { freq: 330, start: 0.4, dur: 0.5, gain: 0.1 },
  ];
  playNotes(ctx, notes);
}

// ===== NOTIFICATION PRESETS =====

function playTing(ctx: AudioContext) {
  const notes = [
    { freq: 880, start: 0, dur: 0.15, gain: 0.3 },
    { freq: 1175, start: 0.12, dur: 0.18, gain: 0.3 },
    { freq: 1397, start: 0.25, dur: 0.25, gain: 0.25 },
  ];
  playNotes(ctx, notes);
}

function playBell(ctx: AudioContext) {
  const notes = [
    { freq: 1200, start: 0, dur: 0.5, gain: 0.2 },
    { freq: 1800, start: 0, dur: 0.3, gain: 0.1 },
    { freq: 2400, start: 0, dur: 0.15, gain: 0.06 },
  ];
  playNotes(ctx, notes);
}

function playPop(ctx: AudioContext) {
  const notes = [
    { freq: 600, start: 0, dur: 0.06, gain: 0.35 },
    { freq: 900, start: 0.04, dur: 0.08, gain: 0.2 },
  ];
  playNotes(ctx, notes);
}

function playChimeNotif(ctx: AudioContext) {
  const notes = [
    { freq: 1047, start: 0, dur: 0.2, gain: 0.2 },
    { freq: 1319, start: 0.12, dur: 0.2, gain: 0.18 },
    { freq: 1568, start: 0.24, dur: 0.3, gain: 0.15 },
  ];
  playNotes(ctx, notes);
}

// ===== HELPER =====

function playNotes(
  ctx: AudioContext,
  notes: Array<{ freq: number; start: number; dur: number; gain: number }>,
  defaultType: OscillatorType = 'sine'
) {
  notes.forEach(({ freq, start, dur, gain: vol }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    osc.type = freq < 500 ? 'triangle' : defaultType;
    gain.gain.setValueAtTime(0, ctx.currentTime + start);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur + 0.05);
  });
}

function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

/** Play a celebration sound based on admin preset */
export async function playCelebrationJingle() {
  const settings = await getSoundSettings();
  if (!settings.celebrationMusic || settings.celebrationPreset === 'off') return;
  const ctx = createAudioContext();
  if (!ctx) return;
  playCelebrationPreset(ctx, settings.celebrationPreset);
}

/** Play notification sound based on admin preset */
export async function playNotificationTing() {
  const settings = await getSoundSettings();
  if (!settings.notificationSounds || settings.notificationPreset === 'off') return;
  const ctx = createAudioContext();
  if (!ctx) return;
  playNotifPreset(ctx, settings.notificationPreset);
}

/** Preview a specific celebration preset (for admin UI) */
export function previewCelebrationPreset(preset: CelebrationPreset) {
  if (preset === 'off') return;
  const ctx = createAudioContext();
  if (!ctx) return;
  playCelebrationPreset(ctx, preset);
}

/** Preview a specific notification preset (for admin UI) */
export function previewNotificationPreset(preset: NotificationPreset) {
  if (preset === 'off') return;
  const ctx = createAudioContext();
  if (!ctx) return;
  playNotifPreset(ctx, preset);
}

function playCelebrationPreset(ctx: AudioContext, preset: CelebrationPreset) {
  switch (preset) {
    case 'fanfare': playFanfare(ctx); break;
    case 'orchestral': playOrchestral(ctx); break;
    case 'chime': playChimeCelebration(ctx); break;
    case 'victory': playVictory(ctx); break;
  }
}

function playNotifPreset(ctx: AudioContext, preset: NotificationPreset) {
  switch (preset) {
    case 'ting': playTing(ctx); break;
    case 'bell': playBell(ctx); break;
    case 'pop': playPop(ctx); break;
    case 'chime': playChimeNotif(ctx); break;
  }
}

// Preset labels for the admin UI
export const CELEBRATION_PRESETS: { value: CelebrationPreset; label: string; labelUz: string; labelRu: string }[] = [
  { value: 'fanfare', label: 'Fanfare', labelUz: 'Fanfar', labelRu: 'Фанфары' },
  { value: 'orchestral', label: 'Orchestral', labelUz: 'Orkestral', labelRu: 'Оркестровый' },
  { value: 'chime', label: 'Crystal Chime', labelUz: 'Kristal jarang', labelRu: 'Хрустальный звон' },
  { value: 'victory', label: 'Victory March', labelUz: "G'alaba marshi", labelRu: 'Марш победы' },
  { value: 'off', label: 'Off (No Music)', labelUz: "O'chirilgan", labelRu: 'Выключено' },
];

export const NOTIFICATION_PRESETS: { value: NotificationPreset; label: string; labelUz: string; labelRu: string }[] = [
  { value: 'ting', label: 'Classic Ting', labelUz: 'Klassik Ting', labelRu: 'Классический тинг' },
  { value: 'bell', label: 'Soft Bell', labelUz: "Yumshoq qo'ng'iroq", labelRu: 'Мягкий колокольчик' },
  { value: 'pop', label: 'Quick Pop', labelUz: 'Tez pop', labelRu: 'Быстрый поп' },
  { value: 'chime', label: 'Gentle Chime', labelUz: 'Ohista jarang', labelRu: 'Нежный звон' },
  { value: 'off', label: 'Off (Silent)', labelUz: "Ovozsiz", labelRu: 'Без звука' },
];
