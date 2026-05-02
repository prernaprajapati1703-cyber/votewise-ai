import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { User, Save, Loader2, Trophy, Calendar } from "lucide-react";
import { z } from "zod";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — VoteSmart" },
      { name: "description", content: "Your VoteSmart account, profile, and quiz history." },
    ],
  }),
  component: () => <RequireAuth><ProfilePage /></RequireAuth>,
});

const nameSchema = z.string().trim().min(1, "Name is required").max(60, "Name too long");

type Attempt = { id: string; score: number; total: number; created_at: string };

function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      const name = data?.display_name ?? "";
      setDisplayName(name);
      setOriginalName(name);
      setLoadingProfile(false);
    })();

    (async () => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("id,score,total,created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error) setAttempts((data ?? []) as Attempt[]);
      setLoadingAttempts(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    const parsed = nameSchema.safeParse(displayName);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: parsed.data })
      .eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("Couldn't save"); return; }
    setOriginalName(parsed.data);
    toast.success("Profile updated");
  };

  const bestScore = attempts.length > 0
    ? attempts.reduce((best, a) => (a.score / a.total > best.score / best.total ? a : best), attempts[0])
    : null;

  const totalAttempts = attempts.length;
  const avgScore = attempts.length > 0
    ? Math.round((attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / attempts.length))
    : 0;

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-3xl px-4 py-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary mb-3"
        >
          <User className="size-4" /> Your account
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-serif text-ink">
          {originalName ? `Hi, ${originalName}` : "Your profile"}
        </h1>
        <p className="text-muted-foreground mt-2">{user?.email}</p>

        {/* Profile editor */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-8 rounded-2xl border border-border/70 bg-card p-6 shadow-soft"
        >
          <h2 className="font-serif text-xl text-ink">Display name</h2>
          <p className="text-sm text-muted-foreground mt-1">How VoteSmart greets you.</p>
          <div className="mt-4 space-y-2">
            <Label htmlFor="display-name">Name</Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loadingProfile}
                placeholder="Your name"
              />
              <Button onClick={save} disabled={saving || loadingProfile || displayName === originalName}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <><Save className="size-4" /> Save</>}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 grid grid-cols-3 gap-3"
        >
          <StatCard label="Quizzes taken" value={String(totalAttempts)} />
          <StatCard label="Avg score" value={totalAttempts ? `${avgScore}%` : "—"} />
          <StatCard label="Best" value={bestScore ? `${bestScore.score}/${bestScore.total}` : "—"} />
        </motion.div>

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 rounded-2xl border border-border/70 bg-card p-6 shadow-soft"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="size-4 text-accent" />
            <h2 className="font-serif text-xl text-ink">Quiz history</h2>
          </div>
          {loadingAttempts && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
          {!loadingAttempts && attempts.length === 0 && (
            <p className="text-sm text-muted-foreground">No quizzes yet — try one to see your scores here.</p>
          )}
          {!loadingAttempts && attempts.length > 0 && (
            <ul className="divide-y divide-border/60">
              {attempts.map((a) => {
                const pct = Math.round((a.score / a.total) * 100);
                const date = new Date(a.created_at);
                return (
                  <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Calendar className="size-3.5" />
                      {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      <span className="opacity-60">·</span>
                      <span>{date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-ink font-medium">{a.score}/{a.total}</span>
                      <span className={`text-xs rounded-full px-2 py-0.5 ${
                        pct === 100 ? "bg-accent/15 text-accent"
                        : pct >= 60 ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                      }`}>{pct}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 text-center shadow-soft">
      <div className="text-2xl font-serif text-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
    </div>
  );
}