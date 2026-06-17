import { useEffect, useRef, useCallback } from "react";

const NOTIFICATION_SOUND_URL = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGVDPm2Yt8GcalNLZ5e0uI1dR0Njl7K3j2FKRWOXsbeOX0lEY5ext49fSkRjl7G3j19KRGOXsbeOX0pEY5ext49fSkRjl7G3j19KQw==";

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("notification_muted");
    mutedRef.current = stored === "true";
    
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
  }, []);

  const playSound = useCallback(() => {
    if (!mutedRef.current && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    localStorage.setItem("notification_muted", String(mutedRef.current));
    return mutedRef.current;
  }, []);

  const isMuted = useCallback(() => mutedRef.current, []);

  return { playSound, toggleMute, isMuted };
}

export async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showBrowserNotification(title: string, body: string, icon?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  
  const notification = new Notification(title, {
    body,
    icon: icon || "/favicon.png",
    badge: "/favicon.png",
    tag: "unitour-notification",
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
}
