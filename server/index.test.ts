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
    expect(response.body).not.toHaveProperty("OPENAI_API_KEY");
  });
});
