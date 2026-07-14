import request from "supertest";
import { describe, expect, it } from "vitest";
import { serverCatalog } from "./catalog";
import { createApp } from "./index";

describe("API", () => {
  const app = createApp();

  it("reports the complete catalog", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(serverCatalog.questions).toHaveLength(serverCatalog.total);
    expect(serverCatalog.total).toBeGreaterThan(4_000);
    expect(response.body).toMatchObject({ ok: true, catalogTotal: serverCatalog.total });
  });

  it("rejects invalid runner payloads", async () => {
    const response = await request(app).post("/api/run").send({ language: "javascript", code: "" });
    expect(response.status).toBe(400);
  });

  it("exposes feature availability without secrets", async () => {
    const response = await request(app).get("/api/config");
    expect(response.status).toBe(200);
    expect(response.body.catalogTotal).toBe(serverCatalog.total);
    expect(response.body.reasoningEfforts).toContain(response.body.reasoningDefault);
    expect(response.body.reasoningEfforts).toEqual(expect.arrayContaining(["low", "medium", "high"]));
    expect(response.body).not.toHaveProperty("OPENAI_API_KEY");
    expect(response.body).not.toHaveProperty("ALGONOTE_OPENAI_API_KEY");
  });

  it("rejects a reasoning effort that the provider did not advertise", async () => {
    const previousEfforts = process.env.OPENAI_REASONING_EFFORTS;
    process.env.OPENAI_REASONING_EFFORTS = "low,medium";
    try {
      const response = await request(app).post("/api/assistant").send({
        message: "给我一个提示",
        code: "",
        language: "python",
        reasoningEffort: "ultra",
        problem: {
          id: "1",
          title: "Two Sum",
          titleCn: "两数之和",
          difficulty: "easy",
          tags: ["数组"],
          summary: []
        }
      });
      expect(response.status).toBe(400);
      expect(response.body.supportedEfforts).toEqual(["low", "medium"]);
    } finally {
      if (previousEfforts === undefined) delete process.env.OPENAI_REASONING_EFFORTS;
      else process.env.OPENAI_REASONING_EFFORTS = previousEfforts;
    }
  });
});
