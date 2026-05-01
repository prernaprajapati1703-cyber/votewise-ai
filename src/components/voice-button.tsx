import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useEffect } from "react";
import { toast } from "sonner";

export function VoiceButton({
  onTranscript,
  lang = "en-IN",
}: {
  onTranscript: (text: string) => void;
  lang?: string;
}) {
  const v = useVoiceInput({ lang, onResult: onTranscript });

  useEffect(() => {
    if (v.error) toast.error("Voice error: " + v.error);
  }, [v.error]);

  if (!v.supported) {
    return (
      <button
        type="button"
        disabled
        title="Voice input not supported in this browser"
        className="grid place-items-center size-11 rounded-xl bg-muted text-muted-foreground/50 cursor-not-allowed"
      >
        <MicOff className="size-5" />
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={v.listening ? v.stop : v.start}
      title={v.listening ? "Stop listening" : "Speak your question"}
      className={`relative grid place-items-center size-11 rounded-xl transition-colors ${
        v.listening
          ? "bg-primary text-primary-foreground shadow-elegant"
          : "bg-ink text-primary-foreground hover:opacity-90"
      }`}
    >
      <Mic className="size-5" />
      {v.listening && (
        <>
          <span className="absolute inset-0 rounded-xl border-2 border-primary animate-ping" />
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-primary whitespace-nowrap">
            Listening…
          </span>
        </>
      )}
    </motion.button>
  );
}