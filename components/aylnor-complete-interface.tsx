"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, BookOpen, Code, Calculator, Beaker, Languages, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AylnorLogoUnique } from "@/components/aylnor-logo-unique";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context?: string;
}

const contextOptions = [
  { value: 'general', label: 'عام', icon: Globe, color: 'bg-blue-500' },
  { value: 'programming', label: 'برمجة', icon: Code, color: 'bg-purple-500' },
  { value: 'mathematics', label: 'رياضيات', icon: Calculator, color: 'bg-green-500' },
  { value: 'science', label: 'علوم', icon: Beaker, color: 'bg-orange-500' },
  { value: 'arabic', label: 'عربي', icon: BookOpen, color: 'bg-red-500' },
  { value: 'english', label: 'إنجليزي', icon: Languages, color: 'bg-indigo-500' },
];

export function AylnorCompleteInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedContext, setSelectedContext] = useState('general');
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Welcome message
    setMessages([{
      id: "1",
      role: "assistant",
      content: "مرحباً بك في Aylnor.ai! 🎓\n\nأنا مساعدك الذكي المتكامل لمعهد الشموخ. يمكنني مساعدتك في:\n\n📚 جميع المواد الدراسية\n💻 البرمجة والتقنية\n🔢 الرياضيات والعلوم\n📖 اللغة العربية والإنجليزية\n\nاختر السياق المناسب من الأعلى وابدأ السؤال!",
      timestamp: new Date(),
      context: 'general'
    }]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: mounted ? Date.now().toString() : '1',
      role: "user",
      content: input,
      timestamp: mounted ? new Date() : new Date(Date.now() - 60000),
      context: selectedContext
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          context: selectedContext,
          model: 'auto'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
          context: selectedContext
        };

        setMessages((prev) => [...prev, aiResponse]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
        timestamp: new Date(),
        context: selectedContext
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AylnorLogoUnique size="lg" />
            <div className="mt-4 text-muted-foreground">جاري تحميل Aylnor.ai...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AylnorLogoUnique size="md" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Aylnor.ai</h1>
              <p className="text-xs text-muted-foreground">المساعد الذكي لمعهد الشموخ</p>
            </div>
          </div>
          
          {/* Context Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">السياق:</span>
            <div className="flex gap-1">
              {contextOptions.map((context) => {
                const Icon = context.icon;
                return (
                  <Button
                    key={context.value}
                    variant={selectedContext === context.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedContext(context.value)}
                    className="h-8 px-2"
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline text-xs mr-1">{context.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {message.context && (
                  <div className="text-xs opacity-70 mb-1">
                    {contextOptions.find(c => c.value === message.context)?.label}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString('ar-SA')}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-muted rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب سؤالك هنا..."
            className="flex-1 min-h-[60px] resize-none"
            disabled={isTyping}
          />
          <Button type="submit" disabled={isTyping || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
