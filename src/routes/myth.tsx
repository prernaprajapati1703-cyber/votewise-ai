import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ShieldAlert, Search } from "lucide-react";
import { checkMyth } from "@/server/ai.functions";
import { AIResponse } from "@/components/ai-response";
import { VoiceButton } from "@/components/voice-button";
import { RequireAuth } from "@/components/require-auth";

export const Route = createFileRoute("/myth")({
  head: () => ({
    meta: [
      { title: "Myth Buster — VoteSmart" },
      { name: "description", content: "Check election claims and rumors. Get a fair, sourced verdict in seconds." },
    ],
  }),
  component: () => <RequireAuth><MythPage /></RequireAuth>,
});

const SAMPLES = [
  "I can vote online from home in India.",
  "Indelible ink lasts for one year.",
  "If I don't have a Voter ID, I can't vote.",
  "EVMs can be hacked over the internet.",
];

function MythPage() {
  const check = useServerFn(checkMyth);
  const [statement, setStatement] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (s?: string) => {
    const claim = (s ?? statement).trim();
    if (claim.length < 3) { toast.error("Please enter a claim (3+ chars)"); return; }
    setText("");
    setLoading(true);
    const res = await check({ data: { statement: claim } });
    setLoading(false);
    if (!res.ok) { toast.error(res.error); return; }
    setText(res.data);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary mb-3">
          <ShieldAlert className="size-4" /> Myth Buster
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-ink">Heard a claim? Check it.</h1>
        <p className="text-muted-foreground mt-2">
          Enter any election claim. We'll verify it fairly and explain the reasoning.
        </p>
      </motion.div>

      <div className="mt-6 rounded-2xl border border-border/70 bg-card p-3 shadow-soft flex items-center gap-2">
        <Search className="size-5 text-muted-foreground ml-2 shrink-0" />
        <input
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="Enter a claim to fact-check…"
          maxLength={500}
          className="flex-1 bg-transparent outline-none text-ink placeholder:text-muted-foreground/70 py-2"
        />
        <VoiceButton onTranscript={(t) => setStatement(t)} />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => submit()}
          disabled={loading || !statement.trim()}
          className="rounded-xl gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-elegant disabled:opacity-40"
        >
          Check
        </motion.button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatement(s); submit(s); }}
            className="text-xs rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground hover:text-ink hover:border-primary/50 transition-colors"
          >
            "{s}"
          </button>
        ))}
      </div>

      <AIResponse text={text} loading={loading} />
    </div>
  );
}