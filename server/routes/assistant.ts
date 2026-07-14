import { createHash } from "node:crypto";
import { Router } from "express";
import OpenAI from "openai";
import { z } from "zod";
import { createRateLimiter } from "../rateLimit";

const router = Router();

const requestSchema = z.object({
  message: z.string().min(1).max(4_000),
  code: z.string().max(30_000).default(""),
  language: z.enum(["python", "cpp"]),
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

  if (!process.env.OPENAI_API_KEY) {
    response.status(503).json({ error: "AI 助教尚未配置。请在服务端设置 OPENAI_API_KEY。", code: "AI_NOT_CONFIGURED" });
    return;
  }

  const { message, code, language, problem } = parsed.data;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    `用户问题：${message}`
  ].join("\n");

  try {
    const result = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      store: false,
      safety_identifier: safetyIdentifier,
      reasoning: { effort: "low" },
      text: { verbosity: "medium" },
      input: [
        {
          role: "developer",
          content: "你是中文算法助教。优先用提问、反例和渐进提示帮助用户自己完成；只有用户明确要求标准答案时才给完整代码。检查代码时指出具体行与失败用例。不得声称执行过未执行的代码；题面信息不足时明确说明，并建议打开官方题面核对。"
        },
        { role: "user", content: context }
      ]
    });

    response.json({ answer: result.output_text, model: process.env.OPENAI_MODEL || "gpt-5.6-luna" });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unknown OpenAI error";
    console.error("AI tutor request failed:", messageText);
    response.status(502).json({ error: "AI 助教暂时无法回答，请稍后重试。" });
  }
});

export default router;
