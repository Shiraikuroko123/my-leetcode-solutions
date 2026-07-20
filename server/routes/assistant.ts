import { createHash } from "node:crypto";
import { Router } from "express";
import OpenAI from "openai";
import { z } from "zod";
import {
  REASONING_EFFORTS,
  resolveOpenAIApiKey,
  resolveOpenAIBaseUrl,
  resolveOpenAIApiMode,
  resolveReasoningConfig
} from "../openaiConfig";
import { createRateLimiter } from "../rateLimit";

const router = Router();

const FIRST_HINT_PATTERN = /第一步提示|不暴露答案|不要答案|不要给出答案/i;

function readChatContent(content: unknown) {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
      return "";
    })
    .join("")
    .trim();
}

function protectFirstHint(answer: string) {
  const withoutCodeBlock = answer.replace(/```[\s\S]*?```/g, "").trim();
  if (!withoutCodeBlock) {
    return "先写出一个最小输入例子，观察题目要求你在每一步保留什么信息。你觉得下一次判断需要访问哪些已见数据？";
  }
  return withoutCodeBlock;
}

const REASONING_RANK: Record<string, number> = {
  none: 0,
  minimal: 1,
  low: 2,
  medium: 3,
  high: 4,
  xhigh: 5,
  max: 6,
  ultra: 7
};

function resolveChatReasoningFallback(requested: string, error: unknown): string | null | undefined {
  const status = error && typeof error === "object" && "status" in error ? Number(error.status) : undefined;
  const message = error instanceof Error ? error.message : String(error);
  const looksLikeUnsupportedReasoning = /reasoning[\s_-]*effort|unsupported.*reasoning/i.test(message)
    || (/invalid value/i.test(message) && /supported values/i.test(message));
  if (![400, 422].includes(status ?? 0) || !looksLikeUnsupportedReasoning) return undefined;

  const supportedSection = message.match(/supported values are:\s*(.*)$/i)?.[1] || "";
  const supported = [...supportedSection.matchAll(/'([^']+)'/g)].map((match) => match[1].toLowerCase());
  if (!supported.length) return null;

  const requestedRank = REASONING_RANK[requested] ?? Number.POSITIVE_INFINITY;
  const ranked = supported
    .filter((value) => value in REASONING_RANK && REASONING_RANK[value] <= requestedRank)
    .sort((left, right) => REASONING_RANK[left] - REASONING_RANK[right]);
  return ranked[ranked.length - 1] || supported[0] || null;
}

const requestSchema = z.object({
  message: z.string().min(1).max(4_000),
  code: z.string().max(30_000).default(""),
  language: z.enum(["python", "cpp"]),
  reasoningEffort: z.enum(REASONING_EFFORTS).optional(),
  hintMode: z.enum(["first-step"]).optional(),
  problem: z.object({
    id: z.string().max(20),
    title: z.string().max(200),
    titleCn: z.string().max(200),
    difficulty: z.enum(["easy", "medium", "hard"]),
    tags: z.array(z.string().max(80)).max(20),
    summary: z.array(z.string().max(1_000)).max(8).default([])
  })
});

router.post("/", createRateLimiter(12, 60_000), async (request, response) => {
  const parsed = requestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "助教请求格式无效。" });
    return;
  }

  const { supportedEfforts, defaultEffort } = resolveReasoningConfig();
  const reasoningEffort = parsed.data.reasoningEffort ?? defaultEffort;
  if (!supportedEfforts.includes(reasoningEffort)) {
    response.status(400).json({
      error: `当前服务不支持推理强度 ${reasoningEffort}。`,
      supportedEfforts
    });
    return;
  }

  const apiKey = resolveOpenAIApiKey();
  if (!apiKey) {
    response.status(503).json({ error: "AI 助教尚未配置。请在服务端设置 ALGONOTE_OPENAI_API_KEY 或 OPENAI_API_KEY。", code: "AI_NOT_CONFIGURED" });
    return;
  }

  const { message, code, language, problem, hintMode } = parsed.data;
  const firstHint = hintMode === "first-step" || FIRST_HINT_PATTERN.test(message);
  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  const apiMode = resolveOpenAIApiMode();
  const client = new OpenAI({ apiKey, baseURL: resolveOpenAIBaseUrl() });
  const rawSession = String(request.header("x-session-id") || request.ip || "anonymous");
  const safetyIdentifier = createHash("sha256")
    .update(`${process.env.OPENAI_SAFETY_SALT || "algonote"}:${rawSession}`)
    .digest("hex");

  const context = [
    `题目：${problem.id}. ${problem.titleCn} (${problem.title})`,
    `难度：${problem.difficulty}`,
    `标签：${problem.tags.join("、") || "未分类"}`,
    problem.summary.length ? `本站原创摘要：${problem.summary.join(" ")}` : "本站没有收录完整题面，请避免猜测未提供的约束。",
    `当前语言：${language}`,
    code ? `用户当前代码：\n\n${code}` : "用户尚未提供代码。",
    firstHint ? "当前模式：第一步提示。" : "当前模式：常规辅导。",
    `用户问题：${message}`
  ].join("\n");

  const instruction = [
    "你是中文算法助教。优先用提问、反例和渐进提示帮助用户自己完成；只有用户明确要求标准答案时才给完整代码。检查代码时指出具体行与失败用例。不得声称执行过未执行的代码；题面信息不足时明确说明，并建议打开官方题面核对。",
    firstHint
      ? "这是第一步提示模式：只给一个可执行的思考起点，最多三句话；禁止完整算法、伪代码、代码块、最终答案、具体下标或最终数值。结尾用一个问题让用户继续思考。"
      : "回答要围绕用户当前问题，避免在用户没有要求时直接贴出完整实现。"
  ].join("\n");

  try {
    let answer = "";

    if (apiMode === "responses") {
      const result = await client.responses.create({
        model,
        store: false,
        safety_identifier: safetyIdentifier,
        reasoning: { effort: reasoningEffort as OpenAI.ReasoningEffort },
        text: { verbosity: "medium" },
        input: [
          { role: "developer", content: instruction },
          { role: "user", content: context }
        ]
      });
      answer = result.output_text?.trim() || "";
    } else {
      const createChatCompletion = (effort: string | null) => client.chat.completions.create({
        model,
        ...(effort ? { reasoning_effort: effort as OpenAI.ChatCompletionReasoningEffort } : {}),
        messages: [
          { role: "system", content: instruction },
          { role: "user", content: context }
        ]
      });
      let result;
      try {
        result = await createChatCompletion(reasoningEffort);
      } catch (error) {
        const fallback = resolveChatReasoningFallback(reasoningEffort, error);
        if (fallback === undefined) throw error;
        console.warn(`AI provider rejected reasoning effort ${reasoningEffort}; retrying with ${fallback || "provider default"}.`);
        result = await createChatCompletion(fallback);
      }
      answer = readChatContent(result.choices[0]?.message?.content);
    }

    if (!answer) throw new Error("AI provider returned an empty answer");

    response.json({
      answer: firstHint ? protectFirstHint(answer) : answer,
      model,
      reasoningEffort,
      hintMode: firstHint ? "first-step" : undefined
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unknown OpenAI error";
    console.error("AI tutor request failed:", messageText);
    response.status(502).json({ error: "AI 助教暂时无法回答，请检查 CCSwitch 的 /v1/chat/completions 配置后重试。", code: "AI_UPSTREAM_ERROR" });
  }
});

export default router;
