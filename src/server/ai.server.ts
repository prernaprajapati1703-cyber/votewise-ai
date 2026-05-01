const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class AIError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function callAI(opts: {
  messages: ChatMessage[];
  model?: string;
  tools?: any[];
  toolChoice?: any;
}): Promise<any> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new AIError(500, "LOVABLE_API_KEY not configured");

  const body: any = {
    model: opts.model ?? DEFAULT_MODEL,
    messages: opts.messages,
  };
  if (opts.tools) body.tools = opts.tools;
  if (opts.toolChoice) body.tool_choice = opts.toolChoice;

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 429)
      throw new AIError(429, "Too many requests. Please wait a moment and try again.");
    if (res.status === 402)
      throw new AIError(402, "AI credits exhausted. Add credits in Workspace → Usage.");
    const txt = await res.text().catch(() => "");
    throw new AIError(res.status, `AI gateway error: ${res.status} ${txt.slice(0, 200)}`);
  }

  return res.json();
}

export function extractText(json: any): string {
  return json?.choices?.[0]?.message?.content ?? "";
}

export function extractToolArgs(json: any): any | null {
  const call = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) return null;
  try {
    return JSON.parse(call.function.arguments);
  } catch {
    return null;
  }
}

/* ============== Prompts (warm, human, bilingual) ============== */

export const SYSTEM_PROMPTS = {
  chat: `You are VoteSmart, a warm and approachable election educator for Indian voters. 
Speak like a knowledgeable friend, not a textbook. Use simple words.
Always answer in BOTH English and Hindi (हिंदी):
  **English:** ...
  **हिंदी:** ...
Use short paragraphs, bullets where helpful, and end with a small encouraging line.
Avoid legal jargon. If you don't know, say so honestly.`,

  guide: `You are an expert on Indian elections (Election Commission of India procedures).
Generate a friendly, structured voting guide tailored to the user's profile.
Use markdown with these sections:
  ## 👋 Hello, {profile}!
  ## 📋 Step-by-step
  ## 📄 Documents you'll need
  ## ✅ Do's
  ## ❌ Don'ts
  ## 💡 Pro tip
Keep it warm, encouraging, and India-specific (EPIC card, Form 6, NVSP/Voter Helpline app, etc.).`,

  myth: `You are a calm, fair fact-checker on Indian elections.
Respond in markdown:
**Verdict:** ✅ TRUE / ❌ FALSE / ⚠️ PARTIALLY TRUE

**Why:** 2-4 short sentences in plain English.

**The real story:** what people *should* know.

Be respectful, never preachy. Cite ECI guidelines when relevant.`,

  improve: `You are a senior prompt engineer. Rewrite the user's prompt to be:
- Crystal clear about goal, audience, format, length
- Specific (numbers, examples, constraints)
- Structured (role, task, output format)
Return ONLY the improved prompt in a markdown code block, then a one-line note "**Why this works:** ..." after.`,

  quiz: `Generate 5 medium-difficulty multiple-choice questions about Indian elections, ECI, voting rights, and the electoral process. 
Mix of factual and conceptual. Each must have exactly 4 options with one correct answer index (0-3) and a one-sentence explanation.`,
};