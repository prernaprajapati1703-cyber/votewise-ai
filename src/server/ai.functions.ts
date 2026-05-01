import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callAI, extractText, extractToolArgs, SYSTEM_PROMPTS, AIError } from "./ai.server";

const wrap = async <T,>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> => {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof AIError) return { ok: false, error: e.message, status: e.status };
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error", status: 500 };
  }
};

export const chatAsk = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ message: z.string().trim().min(1).max(2000) }).parse(d))
  .handler(async ({ data }) =>
    wrap(async () => {
      const json = await callAI({
        messages: [
          { role: "system", content: SYSTEM_PROMPTS.chat },
          { role: "user", content: data.message },
        ],
      });
      return extractText(json);
    })
  );

export const getGuide = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ userType: z.string().trim().min(1).max(80) }).parse(d)
  )
  .handler(async ({ data }) =>
    wrap(async () => {
      const json = await callAI({
        messages: [
          { role: "system", content: SYSTEM_PROMPTS.guide },
          { role: "user", content: `Profile: ${data.userType}` },
        ],
      });
      return extractText(json);
    })
  );

export const checkMyth = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ statement: z.string().trim().min(3).max(500) }).parse(d)
  )
  .handler(async ({ data }) =>
    wrap(async () => {
      const json = await callAI({
        messages: [
          { role: "system", content: SYSTEM_PROMPTS.myth },
          { role: "user", content: data.statement },
        ],
      });
      return extractText(json);
    })
  );

export const improvePrompt = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ userPrompt: z.string().trim().min(3).max(2000) }).parse(d)
  )
  .handler(async ({ data }) =>
    wrap(async () => {
      const json = await callAI({
        messages: [
          { role: "system", content: SYSTEM_PROMPTS.improve },
          { role: "user", content: data.userPrompt },
        ],
      });
      return extractText(json);
    })
  );

export const generateQuiz = createServerFn({ method: "POST" })
  .inputValidator(() => ({}))
  .handler(async () =>
    wrap(async () => {
      const json = await callAI({
        messages: [
          { role: "system", content: "You generate fair, accurate quiz questions about Indian elections." },
          { role: "user", content: SYSTEM_PROMPTS.quiz },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_quiz",
              description: "Return 5 multiple-choice questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                        answer: { type: "integer", minimum: 0, maximum: 3 },
                        explanation: { type: "string" },
                      },
                      required: ["question", "options", "answer", "explanation"],
                      additionalProperties: false,
                    },
                    minItems: 5,
                    maxItems: 5,
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        toolChoice: { type: "function", function: { name: "return_quiz" } },
      });
      const args = extractToolArgs(json);
      const schema = z.object({
        questions: z.array(
          z.object({
            question: z.string(),
            options: z.array(z.string()).length(4),
            answer: z.number().int().min(0).max(3),
            explanation: z.string(),
          })
        ).length(5),
      });
      return schema.parse(args).questions;
    })
  );