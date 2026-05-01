import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

export function AIResponse({ text, loading }: { text?: string; loading?: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Sparkles className="size-4 text-primary animate-pulse" />
            VoteSmart is thinking…
          </div>
          <div className="space-y-3">
            <div className="h-3 rounded shimmer bg-muted" />
            <div className="h-3 rounded shimmer bg-muted w-5/6" />
            <div className="h-3 rounded shimmer bg-muted w-4/6" />
            <div className="h-3 rounded shimmer bg-muted w-3/6" />
          </div>
        </motion.div>
      ) : text ? (
        <motion.div
          key="text"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary mb-3">
            <Sparkles className="size-3.5" /> AI Response
          </div>
          <article className="prose prose-sm md:prose-base max-w-none prose-headings:font-serif prose-headings:text-ink prose-p:text-foreground/90 prose-strong:text-ink prose-code:text-ink prose-code:bg-muted prose-code:px-1 prose-code:rounded">
            <ReactMarkdown>{text}</ReactMarkdown>
          </article>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}