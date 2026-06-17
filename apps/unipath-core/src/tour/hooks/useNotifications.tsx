import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationSound, showBrowserNotification, requestPushPermission } from "@/hooks/usePushNotification";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: "system" | "booking" | "document" | "tour";
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { playSound, toggleMute, isMuted } = useNotificationSound();

  // Request push permission on mount
  useEffect(() => {
    if (user?.id) {
      requestPushPermission();
    }
  }, [user?.id]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Realtime subscription with sound + browser push
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          queryClient.setQueryData(
            ["notifications", user.id],
            (old: Notification[] = []) => [newNotif, ...old]
          );
          
          // Play sound
          playSound();
          
          // Show browser push notification
          showBrowserNotification(newNotif.title, newNotif.message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, playSound]);

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user?.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    toggleMute,
    isMuted,
  };
};

// Admin function to create notification
export const createNotification = async (options: {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  category?: "system" | "booking" | "document" | "tour";
  relatedEntityType?: string;
  relatedEntityId?: string;
}) => {
  const { error } = await (supabase as any)
    .from("notifications")
    .insert({
      user_id: options.userId,
      title: options.title,
      message: options.message,
      type: options.type || "info",
      category: options.category || "system",
      related_entity_type: options.relatedEntityType,
      related_entity_id: options.relatedEntityId,
    });

  if (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
};
