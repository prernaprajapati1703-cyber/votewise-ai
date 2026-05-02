import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Send, MessageSquare, Plus, Trash2, Loader2 } from "lucide-react";
import { chatAsk } from "@/server/ai.functions";
import { AIResponse } from "@/components/ai-response";
import { VoiceButton } from "@/components/voice-button";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Ask AI — VoteSmart" },
      { name: "description", content: "Ask any election question in English or Hindi and get a clear, friendly answer." },
    ],
  }),
  component: () => <RequireAuth><ChatPage /></RequireAuth>,
});

const EXAMPLES = [
  "How do I register to vote in India?",
  "What documents do I need at the polling booth?",
  "Can I change my polling station?",
  "What is NOTA?",
];

type Conversation = { id: string; title: string; updated_at: string };
type Message = { id: string; role: "user" | "assistant"; content: string; created_at: string };

function ChatPage() {
  const ask = useServerFn(chatAsk);
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversation list
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingConvos(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false });
      setLoadingConvos(false);
      if (error) { toast.error("Couldn't load chats"); return; }
      setConversations((data ?? []) as Conversation[]);
    })();
  }, [user]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id,role,content,created_at")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      if (error) { toast.error("Couldn't load messages"); return; }
      setMessages((data ?? []) as Message[]);
    })();
  }, [activeId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    setInput("");
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) { toast.error("Couldn't delete"); return; }
    setConversations((cs) => cs.filter((c) => c.id !== id));
    if (activeId === id) newChat();
    toast.success("Chat deleted");
  };

  const submit = async (msg?: string) => {
    if (!user) return;
    const message = (msg ?? input).trim();
    if (!message) return;
    setInput("");

    let convoId = activeId;
    // Create conversation on first message
    if (!convoId) {
      const title = message.slice(0, 60);
      const { data: convo, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title })
        .select("id,title,updated_at")
        .single();
      if (error || !convo) { toast.error("Couldn't start chat"); return; }
      convoId = convo.id;
      setActiveId(convoId);
      setConversations((cs) => [convo as Conversation, ...cs]);
    }

    // Insert user message locally + DB
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    await supabase.from("messages").insert({
      conversation_id: convoId,
      user_id: user.id,
      role: "user",
      content: message,
    });

    setLoading(true);
    const res = await ask({ data: { message } });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: res.data,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, aiMsg]);
    await supabase.from("messages").insert({
      conversation_id: convoId,
      user_id: user.id,
      role: "assistant",
      content: res.data,
    });
    // Bump conversation updated_at so it sorts to the top
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convoId);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 grid gap-6 md:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="md:sticky md:top-24 md:self-start">
        <button
          onClick={newChat}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-elegant"
        >
          <Plus className="size-4" /> New chat
        </button>
        <div className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground px-1">Recent</div>
        <div className="mt-2 space-y-1 max-h-[60vh] md:max-h-[70vh] overflow-y-auto pr-1">
          {loadingConvos && <Loader2 className="size-4 animate-spin text-muted-foreground mx-auto mt-4" />}
          {!loadingConvos && conversations.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-2">No chats yet — ask a question to start one.</p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-1 rounded-lg transition-colors ${
                activeId === c.id ? "bg-muted" : "hover:bg-muted/60"
              }`}
            >
              <button
                onClick={() => setActiveId(c.id)}
                className="flex-1 text-left px-3 py-2 text-sm text-ink truncate"
                title={c.title}
              >
                {c.title}
              </button>
              <button
                onClick={() => deleteConversation(c.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition"
                title="Delete chat"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <section>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary mb-3">
            <MessageSquare className="size-4" /> Ask AI
          </div>
          <h1 className="text-2xl md:text-3xl font-serif text-ink">
            {messages.length === 0 ? "Have an election question?" : conversations.find((c) => c.id === activeId)?.title ?? "Chat"}
          </h1>
          {messages.length === 0 && (
            <p className="text-muted-foreground mt-2">
              Type or speak — VoteSmart answers in English and हिंदी, in plain language.
            </p>
          )}
        </motion.div>

        {/* Messages */}
        <div ref={scrollRef} className="mt-6 space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl gradient-primary text-primary-foreground px-4 py-2.5 text-sm shadow-elegant">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={m.id} className="rounded-2xl border border-border/70 bg-card p-4">
                <AIResponse text={m.content} loading={false} />
              </div>
            ),
          )}
          {loading && (
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <AIResponse text="" loading={true} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
          <div className="flex gap-3 items-start">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="e.g. How do I register to vote?"
              rows={2}
              className="flex-1 resize-none bg-transparent outline-none text-ink placeholder:text-muted-foreground/70 leading-relaxed"
              maxLength={2000}
            />
            <div className="flex flex-col gap-2 items-center">
              <VoiceButton onTranscript={(t) => setInput((cur) => (cur ? cur + " " + t : t))} />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => submit()}
                disabled={loading || !input.trim()}
                className="grid place-items-center size-11 rounded-xl gradient-primary text-primary-foreground shadow-elegant disabled:opacity-40 disabled:shadow-none"
                title="Send"
              >
                <Send className="size-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <button
                key={e}
                onClick={() => submit(e)}
                className="text-xs rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground hover:text-ink hover:border-primary/50 transition-colors"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}