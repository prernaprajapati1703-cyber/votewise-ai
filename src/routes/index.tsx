import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MessageSquare, BookOpenCheck, ShieldAlert, Brain, Wand2, ArrowRight, Vote } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VoteSmart AI — Your AI Election Companion" },
      { name: "description", content: "Ask AI election questions, bust myths, get a voting guide, and quiz yourself — built for Indian voters." },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { to: "/chat", icon: MessageSquare, title: "Ask AI", desc: "Get clear, bilingual answers to election questions.", tint: "from-primary/15 to-primary/5" },
  { to: "/guide", icon: BookOpenCheck, title: "Voting Guide", desc: "Personalized step-by-step for your profile.", tint: "from-accent/15 to-accent/5" },
  { to: "/myth", icon: ShieldAlert, title: "Myth Buster", desc: "Check election claims — true, false, or partial.", tint: "from-primary/15 to-accent/10" },
  { to: "/quiz", icon: Brain, title: "Election Quiz", desc: "5 questions. Test what you really know.", tint: "from-accent/15 to-primary/10" },
  { to: "/improve", icon: Wand2, title: "Polish Prompt", desc: "Turn messy questions into great ones.", tint: "from-primary/10 to-primary/5" },
] as const;

function Index() {
  return (
    <div className="relative overflow-hidden">
      {/* Decorative blobs */}
      <div aria-hidden className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/20 blur-3xl animate-blob" />
      <div aria-hidden className="absolute top-40 -right-32 size-96 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />

      <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 md:pt-24 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 backdrop-blur px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground mb-6">
            <Vote className="size-3.5 text-primary" /> Built for Indian voters
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold leading-[1.05] text-ink">
            Make every vote{" "}
            <span className="bg-clip-text text-transparent bg-[image:var(--gradient-primary)]">
              an informed one.
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            VoteSmart AI is your friendly companion for elections in India.
            Ask anything in English or हिंदी, bust myths in seconds, and learn the
            process step-by-step — with a warm, human voice (not a textbook).
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/chat"
              className="group inline-flex items-center gap-2 rounded-xl gradient-primary text-primary-foreground px-5 py-3 text-sm font-medium shadow-elegant hover:opacity-95 transition-opacity"
            >
              Ask the AI <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/quiz"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-ink hover:bg-muted transition-colors"
            >
              Take the quiz
            </Link>
          </div>
        </motion.div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.to}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
            >
              <Link
                to={f.to}
                className="group block rounded-2xl border border-border/70 bg-card p-6 hover:shadow-elegant transition-all hover:-translate-y-0.5"
              >
                <div className={`size-11 rounded-xl bg-gradient-to-br ${f.tint} grid place-items-center mb-4 ring-1 ring-border/60`}>
                  <f.icon className="size-5 text-ink" />
                </div>
                <h3 className="font-serif text-xl text-ink">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="size-3.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
