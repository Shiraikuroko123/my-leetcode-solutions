import { Router } from "express";
import { z } from "zod";
import { attachFeaturedTests } from "../featuredTestHarnesses";
import { createRateLimiter } from "../rateLimit";

const router = Router();

const requestSchema = z.object({
  language: z.enum(["python", "cpp"]),
  code: z.string().min(1).max(50_000),
  stdin: z.string().max(10_000).default(""),
  problemSlug: z.string().max(200).optional()
});

type PistonStage = {
  stdout?: string;
  stderr?: string;
  output?: string;
  code?: number | null;
  signal?: string | null;
};

type PistonResponse = {
  compile?: PistonStage;
  run?: PistonStage;
  message?: string;
};

router.post("/", createRateLimiter(30, 60_000), async (request, response) => {
  const parsed = requestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "代码或输入格式无效。", issues: parsed.error.issues });
    return;
  }

  const { language, code, stdin, problemSlug } = parsed.data;
  const executableCode = attachFeaturedTests(problemSlug, language, code);
  const pistonUrl = (process.env.PISTON_URL || "http://127.0.0.1:2000/api/v2").replace(/\/$/, "");
  const runtime = language === "cpp" ? "c++" : "python";
  const fileName = language === "cpp" ? "main.cpp" : "main.py";
  const startedAt = performance.now();

  try {
    const upstream = await fetch(`${pistonUrl}/execute`, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "AlgoNote runner/1.0" },
      body: JSON.stringify({
        language: runtime,
        version: "*",
        files: [{ name: fileName, content: executableCode }],
        stdin,
        compile_timeout: 10_000,
        run_timeout: 3_000,
        compile_memory_limit: 256_000_000,
        run_memory_limit: 256_000_000
      }),
      signal: AbortSignal.timeout(20_000)
    });

    const payload = (await upstream.json()) as PistonResponse;
    if (!upstream.ok) {
      response.status(502).json({ error: payload.message || "代码沙箱暂时不可用。" });
      return;
    }

    const compileError = payload.compile?.stderr || (payload.compile?.code ? payload.compile.output : "");
    const run = payload.run || {};
    response.json({
      stdout: run.stdout || "",
      stderr: [compileError, run.stderr].filter(Boolean).join("\n"),
      code: run.code ?? payload.compile?.code ?? null,
      signal: run.signal ?? payload.compile?.signal ?? null,
      elapsedMs: Math.round(performance.now() - startedAt)
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "代码执行超时，请检查死循环或稍后重试。"
      : "无法连接代码沙箱，请检查 PISTON_URL。";
    response.status(502).json({ error: message });
  }
});

export default router;
