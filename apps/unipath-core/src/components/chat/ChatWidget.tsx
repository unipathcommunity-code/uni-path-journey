import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  file_url?: string;
  file_name?: string;
  is_read: boolean;
  created_at: string;
}

interface ChatWidgetProps {
  conversationId?: string;
  agentId?: string;
  bookingId?: string;
  onClose?: () => void;
  className?: string;
}

const ChatWidget = ({ conversationId: propConvId, agentId, bookingId, onClose, className }: ChatWidgetProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [convId, setConvId] = useState(propConvId);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (convId) loadMessages();
  }, [convId]);

  useEffect(() => {
    if (!convId) return;
    const channel = supabase
      .channel(`chat-${convId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${convId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [convId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    if (!convId) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const getOrCreateConversation = async () => {
    if (convId) return convId;
    if (!user || !agentId) return null;

    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        customer_id: user.id,
        agent_id: agentId,
        booking_id: bookingId || null,
      })
      .select()
      .single();

    if (error) { toast.error("Chat yaratib bo'lmadi"); return null; }
    setConvId(data.id);
    return data.id;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setLoading(true);

    try {
      const cid = await getOrCreateConversation();
      if (!cid) return;

      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: cid,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (err: any) {
      toast.error("Xabar yuborib bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    const cid = await getOrCreateConversation();
    if (!cid) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `chat/${cid}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("booking-documents")
      .upload(filePath, file);

    if (uploadError) { toast.error("Fayl yuklab bo'lmadi"); return; }

    const { data: urlData } = supabase.storage
      .from("booking-documents")
      .getPublicUrl(filePath);

    await supabase.from("chat_messages").insert({
      conversation_id: cid,
      sender_id: user.id,
      content: `📎 ${file.name}`,
      file_url: urlData.publicUrl,
      file_name: file.name,
    });
  };

  if (!user) return null;

  return (
    <div className={cn("flex flex-col bg-card border border-border rounded-2xl shadow-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold text-sm">Chat</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="hover:opacity-70 transition-opacity">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            Xabar yozing...
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex", msg.sender_id === user.id ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
              msg.sender_id === user.id
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            )}>
              <p>{msg.content}</p>
              {msg.file_url && (
                <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs underline mt-1 block opacity-80">
                  {msg.file_name || "Fayl"}
                </a>
              )}
              <span className="text-[10px] opacity-60 mt-1 block">
                {new Date(msg.created_at).toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex gap-2">
        <label className="cursor-pointer flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <Paperclip className="h-5 w-5" />
          <input type="file" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }} />
        </label>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Xabar yozing..."
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={loading || !newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatWidget;
