import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Brain, Check, X, RotateCcw, Sparkles } from "lucide-react";
import { generateQuiz } from "@/server/ai.functions";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Election Quiz — VoteSmart" },
      { name: "description", content: "5 questions on Indian elections. Test what you know." },
    ],
  }),
  component: () => <RequireAuth><QuizPage /></RequireAuth>,
});

type Q = { question: string; options: string[]; answer: number; explanation: string };

function QuizPage() {
  const fetchQuiz = useServerFn(generateQuiz);
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [savedAttempt, setSavedAttempt] = useState(false);

  const start = async () => {
    setLoading(true);
    setQuestions(null);
    setIdx(0); setPicked(null); setScore(0); setDone(false);
    const res = await fetchQuiz({ data: {} });
    setLoading(false);
    if (!res.ok) { toast.error(res.error); return; }
    setQuestions(res.data);
  };

  useEffect(() => { start(); /* eslint-disable-next-line */ }, []);

  const current = questions?.[idx];

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (current && i === current.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (!questions) return;
    if (idx + 1 >= questions.length) {
      setDone(true);
      void saveAttempt();
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
  };

  const saveAttempt = async () => {
    if (!user || !questions || savedAttempt) return;
    setSavedAttempt(true);
    const { error } = await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      score,
      total: questions.length,
    });
    if (error) {
      console.error("Failed to save attempt:", error);
      setSavedAttempt(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent mb-3">
        <Brain className="size-4" /> Election Quiz
      </div>
      <h1 className="text-3xl md:text-4xl font-serif text-ink">5 questions. Quick.</h1>
      <p className="text-muted-foreground mt-2">
        Pick an answer to see if you're right. No pressure — learning is the win.
      </p>

      {loading && (
        <div className="mt-10 rounded-2xl border border-border/70 bg-card p-8 shadow-soft text-center">
          <Sparkles className="size-6 text-primary mx-auto animate-pulse" />
          <p className="mt-3 text-sm text-muted-foreground">Generating fresh questions…</p>
        </div>
      )}

      {!loading && questions && !done && current && (
        <>
          {/* Progress */}
          <div className="mt-8">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Question {idx + 1} of {questions.length}</span>
              <span>Score: {score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full gradient-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((idx) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="mt-6 rounded-2xl border border-border/70 bg-card p-6 shadow-soft"
            >
              <h2 className="font-serif text-xl text-ink leading-snug">{current.question}</h2>
              <div className="mt-5 grid gap-2">
                {current.options.map((opt, i) => {
                  const isCorrect = i === current.answer;
                  const isPicked = picked === i;
                  const reveal = picked !== null;
                  let cls = "border-border/70 hover:border-primary/50 hover:bg-muted/50";
                  if (reveal && isCorrect) cls = "border-accent bg-accent/10 text-ink";
                  else if (reveal && isPicked && !isCorrect) cls = "border-destructive bg-destructive/10";
                  else if (reveal) cls = "border-border/40 opacity-60";
                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: picked === null ? 0.99 : 1 }}
                      onClick={() => choose(i)}
                      disabled={picked !== null}
                      className={`text-left rounded-xl border px-4 py-3 transition-colors flex items-center justify-between gap-3 ${cls}`}
                    >
                      <span className="text-sm md:text-base">{opt}</span>
                      {reveal && isCorrect && <Check className="size-4 text-accent shrink-0" />}
                      {reveal && isPicked && !isCorrect && <X className="size-4 text-destructive shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>

              {picked !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-xl bg-muted/60 border border-border/60 p-4"
                >
                  <div className="text-xs uppercase tracking-widest text-primary mb-1">Why</div>
                  <p className="text-sm text-foreground/90">{current.explanation}</p>
                  <button
                    onClick={next}
                    className="mt-4 rounded-lg gradient-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-elegant"
                  >
                    {idx + 1 >= questions.length ? "See results" : "Next question →"}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {!loading && done && questions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-10 rounded-2xl border border-border/70 bg-card p-8 shadow-elegant text-center"
        >
          <div className="text-6xl mb-2">{score === questions.length ? "🏆" : score >= 3 ? "🎉" : "📚"}</div>
          <h2 className="font-serif text-2xl text-ink">
            You scored {score} / {questions.length}
          </h2>
          <p className="text-muted-foreground mt-2">
            {score === questions.length
              ? "Perfect! You're an election pro."
              : score >= 3
              ? "Nice work — you know your stuff."
              : "Every quiz makes you sharper. Try again!"}
          </p>
          <button
            onClick={start}
            className="mt-6 inline-flex items-center gap-2 rounded-xl gradient-primary text-primary-foreground px-5 py-3 text-sm font-medium shadow-elegant"
          >
            <RotateCcw className="size-4" /> New quiz
          </button>
        </motion.div>
      )}
    </div>
  );
}