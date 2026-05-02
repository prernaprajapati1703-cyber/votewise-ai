import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { improvePrompt } from "@/server/ai.functions";
import { AIResponse } from "@/components/ai-response";
import { VoiceButton } from "@/components/voice-button";
import { RequireAuth } from "@/components/require-auth";

export const Route = createFileRoute("/improve")({
  head: () => ({
    meta: [
      { title: "Polish Prompt — VoteSmart" },
      { name: "description", content: "Turn a messy question into a sharp, well-structured AI prompt." },
    ],
  }),
  component: () => <RequireAuth><ImprovePage /></RequireAuth>,
});

function ImprovePage() {
  const polish = useServerFn(improvePrompt);
  const [input, setInput] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (input.trim().length < 3) return;
    setText("");
    setLoading(true);
    const res = await polish({ data: { userPrompt: input.trim() } });
    setLoading(false);
    if (!res.ok) { toast.error(res.error); return; }
    setText(res.data);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary mb-3">
          <Wand2 className="size-4" /> Polish Prompt
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-ink">Make your AI prompt shine.</h1>
        <p className="text-muted-foreground mt-2">
          Paste a rough question — get back a clear, structured prompt that works better.
        </p>
      </motion.div>

      <div className="mt-6 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="e.g. tell me about voting"
          className="w-full resize-none bg-transparent outline-none text-ink placeholder:text-muted-foreground/70 leading-relaxed"
        />
        <div className="flex justify-between items-center mt-3">
          <VoiceButton onTranscript={(t) => setInput((c) => (c ? c + " " + t : t))} />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={submit}
            disabled={loading || input.trim().length < 3}
            className="rounded-xl gradient-primary text-primary-foreground px-5 py-2.5 text-sm font-medium shadow-elegant disabled:opacity-40"
          >
            Polish it ✨
          </motion.button>
        </div>
      </div>

      <AIResponse text={text} loading={loading} />
    </div>
  );
}