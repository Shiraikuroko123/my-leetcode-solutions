import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import express from "express";
import helmet from "helmet";
import { serverCatalog } from "./catalog";
import { resolveOpenAIApiKey, resolveReasoningConfig } from "./openaiConfig";
import assistantRouter from "./routes/assistant";
import runnerRouter from "./routes/runner";
import solutionsRouter from "./routes/solutions";
import { solutionManifest } from "./solutionManifest";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          workerSrc: ["'self'", "blob:"]
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );
  app.use(express.json({ limit: "128kb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, catalogTotal: serverCatalog.total });
  });

  app.get("/api/config", (_request, response) => {
    const reasoning = resolveReasoningConfig();
    response.json({
      aiEnabled: Boolean(resolveOpenAIApiKey()),
      reasoningEfforts: reasoning.supportedEfforts,
      reasoningDefault: reasoning.defaultEffort,
      runnerEnabled: true,
      catalogTotal: serverCatalog.total,
      catalogSyncedAt: serverCatalog.syncedAt,
      solutionCoverage: solutionManifest.counts
    });
  });

  app.use("/api/run", runnerRouter);
  app.use("/api/solutions", solutionsRouter);
  app.use("/api/assistant", assistantRouter);

  const distPath = path.resolve("dist");
  if (existsSync(distPath)) {
    app.use(express.static(distPath, { index: false }));
    app.get("/{*splat}", (_request, response) => {
      response.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    console.error(error);
    response.status(500).json({ error: "服务器处理请求时发生错误。" });
  });

  return app;
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  const port = Number(process.env.PORT || 8787);
  const host = process.env.HOST || "127.0.0.1";
  createApp().listen(port, host, () => {
    console.log(`AlgoNote API listening on http://${host}:${port}`);
  });
}
