import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Send, MessageSquare } from "lucide-react";
import { chatAsk } from "@/server/ai.functions";
import { AIResponse } from "@/components/ai-response";
import { VoiceButton } from "@/components/voice-button";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Ask AI — VoteSmart" },
      { name: "description", content: "Ask any election question in English or Hindi and get a clear, friendly answer." },
    ],
  }),
  component: ChatPage,
});

const EXAMPLES = [
  "How do I register to vote in India?",
  "What documents do I need at the polling booth?",
  "Can I change my polling station?",
  "What is NOTA?",
];

function ChatPage() {
  const ask = useServerFn(chatAsk);
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (msg?: string) => {
    const message = (msg ?? input).trim();
    if (!message) return;
    setLoading(true);
    setAnswer("");
    const res = await ask({ data: { message } });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setAnswer(res.data);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary mb-3">
          <MessageSquare className="size-4" /> Ask AI
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-ink">Have an election question?</h1>
        <p className="text-muted-foreground mt-2">
          Type or speak — VoteSmart answers in English and हिंदी, in plain language.
        </p>
      </motion.div>

      <div className="mt-6 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
        <div className="flex gap-3 items-start">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. How do I register to vote?"
            rows={3}
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
              title="Ask"
            >
              <Send className="size-5" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((e) => (
          <button
            key={e}
            onClick={() => { setInput(e); submit(e); }}
            className="text-xs rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground hover:text-ink hover:border-primary/50 transition-colors"
          >
            {e}
          </button>
        ))}
      </div>

      <AIResponse text={answer} loading={loading} />
    </div>
  );
}