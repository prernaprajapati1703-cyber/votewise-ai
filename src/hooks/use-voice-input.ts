import { useCallback, useEffect, useRef, useState } from "react";

// Browser SpeechRecognition wrapper. Returns transcript and listening state.
// Falls back gracefully when unsupported.

type Recognition = any;

export function useVoiceInput(opts?: { lang?: string; onResult?: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const onResultRef = useRef(opts?.onResult);
  onResultRef.current = opts?.onResult;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const r: Recognition = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = opts?.lang ?? "en-IN";

    r.onresult = (event: any) => {
      let finalText = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      const combined = (finalText || interim).trim();
      setTranscript(combined);
      if (finalText && onResultRef.current) onResultRef.current(finalText.trim());
    };
    r.onerror = (e: any) => {
      setError(e?.error || "voice-error");
      setListening(false);
    };
    r.onend = () => setListening(false);

    recRef.current = r;
    return () => {
      try { r.abort(); } catch {}
    };
  }, [opts?.lang]);

  const start = useCallback(() => {
    setError(null);
    setTranscript("");
    try {
      recRef.current?.start();
      setListening(true);
    } catch (e) {
      // already started — ignore
    }
  }, []);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  return { supported, listening, transcript, error, start, stop };
}