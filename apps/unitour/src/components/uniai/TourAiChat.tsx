import { useState, useRef, useEffect } from "react";
import { Send, X, Search, Wand2, Loader2, Plane, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureToggles } from "@/hooks/useFeatureToggles";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ChatType = "chat" | "search" | "recommendation";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uniai-chat`;

const TourAiChat = () => {
  const { isFeatureEnabled } = useFeatureToggles();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatType>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isFeatureEnabled("chat_widget")) return null;

  const getTabConfig = (tab: ChatType) => {
    switch (tab) {
      case "search":
        return { icon: Search, title: "Qidiruv", placeholder: "Tur qidirish...", welcome: "Qaysi turni qidiryapsiz? Masalan: 'Dubayga tur' yoki 'Arzon oilaviy turlar'" };
      case "recommendation":
        return { icon: Wand2, title: "Tavsiya", placeholder: "Sizga qanday tur kerak?", welcome: "Byudjetingiz, vaqtingiz va xohishlaringiz haqida ayting, men sizga eng mos turlarni tavsiya qilaman!" };
      default:
        return { icon: Plane, title: "TourAi", placeholder: "Savolingizni yozing...", welcome: "Salom! Men TourAi - sizning sayohat yordamchingizman. Sizga qanday yordam bera olaman?" };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    let assistantContent = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Iltimos, avval tizimga kiring. Chat faqat ro'yxatdan o'tgan foydalanuvchilar uchun ishlaydi." }]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ messages: [...messages, userMessage], type: activeTab }),
      });

      if (!response.ok || !response.body) throw new Error("Xato yuz berdi");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const updateAssistant = (content: string) => {
        assistantContent = content;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          return [...prev, { role: "assistant", content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { assistantContent += content; updateAssistant(assistantContent); }
          } catch { textBuffer = line + "\n" + textBuffer; break; }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Kechirasiz, xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: ChatType) => {
    setActiveTab(tab);
    setMessages([]);
  };

  const config = getTabConfig(activeTab);

  return (
    <>
      {/* Floating Button - icon only on mobile, with label on desktop */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-green-600 text-primary-foreground shadow-lg transition-all hover:shadow-xl active:scale-95",
              isMobile
                ? "bottom-[5.5rem] right-3 w-12 h-12 justify-center p-0"
                : "bottom-6 right-6 px-4 py-3"
            )}
          >
            <Plane className="h-5 w-5" />
            {!isMobile && <span className="font-semibold text-sm">TourAi</span>}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl",
              isMobile
                ? "inset-x-0 bottom-0 top-0 rounded-none"
                : "bottom-6 right-6 h-[520px] w-[400px]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-primary to-green-600 px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Plane className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-base">TourAi</span>
                  <p className="text-[10px] text-white/70 leading-tight">Sayohat yordamchingiz</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full p-1.5 hover:bg-white/10 transition-colors">
                {isMobile ? <X className="h-5 w-5" /> : <Minimize2 className="h-4 w-4" />}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border bg-muted/30">
              {(["chat", "search", "recommendation"] as ChatType[]).map((tab) => {
                const tabConfig = getTabConfig(tab);
                const Icon = tabConfig.icon;
                return (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all",
                      activeTab === tab
                        ? "border-b-2 border-primary text-primary bg-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tabConfig.title}
                  </button>
                );
              })}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="p-3 rounded-full bg-primary/10 mb-3">
                    <config.icon className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{config.welcome}</p>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    message.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                  )}>
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 bg-muted/30 safe-area-bottom">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={config.placeholder}
                  className="flex-1 bg-background text-sm h-10"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-primary hover:bg-primary/90 h-10 w-10">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TourAiChat;
