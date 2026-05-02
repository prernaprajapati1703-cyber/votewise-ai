import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BookOpenCheck, GraduationCap, Sparkles, UserPlus, UsersRound, Plane, Accessibility } from "lucide-react";
import { getGuide } from "@/server/ai.functions";
import { AIResponse } from "@/components/ai-response";
import { RequireAuth } from "@/components/require-auth";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Voting Guide — VoteSmart" },
      { name: "description", content: "Personalized step-by-step voting guides for first-time voters, students, seniors, NRIs, and more." },
    ],
  }),
  component: () => <RequireAuth><GuidePage /></RequireAuth>,
});

const PROFILES = [
  { id: "First-time Voter (18-22, India)", label: "First-time Voter", icon: UserPlus },
  { id: "College Student living away from home in India", label: "Student", icon: GraduationCap },
  { id: "Senior Citizen (60+) in India, may need assistance", label: "Senior Citizen", icon: UsersRound },
  { id: "NRI (Non-Resident Indian) wanting to vote", label: "NRI Voter", icon: Plane },
  { id: "Person with Disability voting in India (PwD)", label: "Person with Disability", icon: Accessibility },
] as const;

function GuidePage() {
  const fetchGuide = useServerFn(getGuide);
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const pick = async (p: typeof PROFILES[number]) => {
    setActive(p.id);
    setText("");
    setLoading(true);
    const res = await fetchGuide({ data: { userType: p.id } });
    setLoading(false);
    if (!res.ok) { toast.error(res.error); return; }
    setText(res.data);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent mb-3">
          <BookOpenCheck className="size-4" /> Voting Guide
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-ink">Pick the guide that fits you.</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Tailored steps, document checklist, and Do's & Don'ts — written to feel like advice from a friend.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROFILES.map((p, i) => {
          const isActive = active === p.id;
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              onClick={() => pick(p)}
              className={`text-left rounded-2xl border p-5 transition-all ${
                isActive
                  ? "border-primary bg-primary/5 shadow-elegant"
                  : "border-border/70 bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-xl bg-muted grid place-items-center">
                  <p.icon className="size-5 text-ink" />
                </div>
                {isActive && <Sparkles className="size-4 text-primary" />}
              </div>
              <div className="mt-3 font-serif text-lg text-ink">{p.label}</div>
              <div className="text-xs text-muted-foreground mt-1">Tap for full guide</div>
            </motion.button>
          );
        })}
      </div>

      <AIResponse text={text} loading={loading} />
    </div>
  );
}