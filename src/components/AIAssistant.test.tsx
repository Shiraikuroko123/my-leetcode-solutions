import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogProblem } from "../types/problem";
import { AIAssistant } from "./AIAssistant";

const problem: CatalogProblem = {
  id: "1",
  title: "Two Sum",
  titleCn: "两数之和",
  slug: "two-sum",
  difficulty: "easy",
  acceptance: 55.2,
  paidOnly: false,
  tags: [{ slug: "array", name: "Array", nameCn: "数组" }]
};

describe("AIAssistant", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("waits for an explicit question and sends the selected reasoning effort", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (String(input) === "/api/config") {
        return new Response(JSON.stringify({
          aiEnabled: true,
          reasoningEfforts: ["low", "medium", "high", "xhigh", "max", "ultra"],
          reasoningDefault: "xhigh",
          runnerEnabled: true,
          catalogTotal: 4_379
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({ answer: "先尝试维护一个哈希表。", model: "test-model", reasoningEffort: "ultra" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });

    render(<AIAssistant open onClose={() => undefined} problem={problem} summary={[]} language="python" code="# draft" />);

    expect(screen.getByText("从思路开始，不急着看答案")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "推理强度" })).toHaveValue("xhigh"));

    fireEvent.change(screen.getByRole("combobox", { name: "推理强度" }), { target: { value: "ultra" } });
    fireEvent.change(screen.getByPlaceholderText("描述卡住的位置..."), { target: { value: "只给我第一步提示" } });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    await screen.findByText("先尝试维护一个哈希表。");
    const assistantRequest = fetchMock.mock.calls.find(([input]) => String(input) === "/api/assistant");
    expect(assistantRequest).toBeDefined();
    expect(JSON.parse(String(assistantRequest?.[1]?.body))).toMatchObject({
      message: "只给我第一步提示",
      code: "# draft",
      reasoningEffort: "ultra",
      hintMode: "first-step"
    });
    expect(window.localStorage.getItem("algonote-reasoning-effort")).toBe(JSON.stringify("ultra"));
  });

  it("shows a useful error when the provider returns an empty non-JSON response", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input) === "/api/config") {
        return new Response(JSON.stringify({
          aiEnabled: true,
          reasoningEfforts: ["low", "medium", "high"],
          reasoningDefault: "medium",
          runnerEnabled: true,
          catalogTotal: 4_379
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("", { status: 502, statusText: "Bad Gateway" });
    });

    render(<AIAssistant open onClose={() => undefined} problem={problem} summary={[]} language="python" code="# draft" />);
    fireEvent.click(await screen.findByRole("button", { name: "第一步提示" }));

    expect(await screen.findByText(/HTTP 502/)).toBeInTheDocument();
    expect(screen.getByText(/检查 AlgoNote API 与 CCSwitch/)).toBeInTheDocument();
  });
});
