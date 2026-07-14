import { Router } from "express";
import { z } from "zod";
import { serverProblemBySlug } from "../catalog";
import { createRateLimiter } from "../rateLimit";
import { solutionManifest } from "../solutionManifest";

const router = Router();
const languageSchema = z.enum(["python", "cpp"]);
const sourceCache = new Map<string, { code: string; expiresAt: number }>();
const SOURCE_CACHE_TTL_MS = 6 * 60 * 60 * 1_000;
const SOURCE_CACHE_MAX_ENTRIES = 500;

function cacheSource(key: string, code: string) {
  if (sourceCache.size >= SOURCE_CACHE_MAX_ENTRIES) {
    const oldestKey = sourceCache.keys().next().value as string | undefined;
    if (oldestKey) sourceCache.delete(oldestKey);
  }
  sourceCache.set(key, { code, expiresAt: Date.now() + SOURCE_CACHE_TTL_MS });
}

router.get("/:slug/:language", createRateLimiter(60, 60_000), async (request, response) => {
  const language = languageSchema.safeParse(request.params.language);
  const problem = serverProblemBySlug.get(String(request.params.slug));

  if (!language.success || !problem) {
    response.status(404).json({ error: "没有找到对应题目或语言。" });
    return;
  }

  if (!/^\d+$/.test(problem.id)) {
    response.status(404).json({ error: "该系列题目暂无开源参考代码。" });
    return;
  }

  const source = solutionManifest.solutions[problem.id]?.[language.data];
  if (!source) {
    response.status(404).json({ error: "开源代码清单暂未收录这道题的该语言实现。" });
    return;
  }
  const sourceUrl = source.rawUrl;
  const cacheKey = `${problem.id}:${language.data}`;
  const cached = sourceCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    response.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    response.json({
      code: cached.code,
      sourceUrl,
      repositoryUrl: solutionManifest.repositoryUrl,
      license: solutionManifest.license,
      attribution: "Reference implementation from walkccc/LeetCode"
    });
    return;
  }
  if (cached) sourceCache.delete(cacheKey);

  try {
    let upstream: Response | undefined;
    try {
      upstream = await fetch(sourceUrl, {
        headers: { "user-agent": "AlgoNote solution proxy/1.0" },
        signal: AbortSignal.timeout(8_000)
      });
    } catch {
      // Some corporate and campus networks block raw.githubusercontent.com.
    }

    if (!upstream?.ok) {
      const encodedPath = source.path.split("/").map(encodeURIComponent).join("/");
      const apiUrl = `https://api.github.com/repos/walkccc/LeetCode/contents/${encodedPath}?ref=main`;
      const headers: Record<string, string> = {
        accept: "application/vnd.github.raw+json",
        "user-agent": "AlgoNote solution proxy/1.0"
      };
      if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      upstream = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(12_000) });
    }

    if (upstream.status === 404) {
      response.status(404).json({ error: "上游仓库暂未收录这道题的该语言实现。" });
      return;
    }
    if (!upstream.ok) {
      response.status(502).json({ error: "参考代码源暂时不可用。" });
      return;
    }

    const code = await upstream.text();
    cacheSource(cacheKey, code);
    response.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    response.json({
      code,
      sourceUrl,
      repositoryUrl: solutionManifest.repositoryUrl,
      license: solutionManifest.license,
      attribution: "Reference implementation from walkccc/LeetCode"
    });
  } catch {
    response.status(502).json({ error: "无法连接参考代码源。" });
  }
});

export default router;
