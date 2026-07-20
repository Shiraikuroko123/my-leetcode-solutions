import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import App from "../App";

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="当前地址">{location.pathname}{location.search}</output>;
}

describe("catalog navigation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("algonote-progress-v1", JSON.stringify({
      solved: ["two-sum"],
      attempted: [],
      starred: ["two-sum"]
    }));
  });

  it("opens real learning-path and progress views with URL-backed filters", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
        <LocationProbe />
      </MemoryRouter>
    );

    const pathsLink = screen.getByRole("link", { name: "学习路径" });
    fireEvent.click(pathsLink);

    expect(await screen.findByRole("heading", { level: 1, name: "按知识体系逐步练习" })).toBeInTheDocument();
    expect(screen.getByLabelText("当前地址")).toHaveTextContent("/paths");
    expect(screen.getByRole("link", { name: "学习路径" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link", { name: /继续练习|开始练习/ })).toHaveLength(10);

    const progressLink = screen.getByRole("link", { name: "我的进度" });
    fireEvent.click(progressLink);

    expect(await screen.findByRole("heading", { level: 1, name: "查看你的练习进度" })).toBeInTheDocument();
    expect(screen.getByLabelText("当前地址")).toHaveTextContent("/progress");
    expect(screen.getByRole("link", { name: "我的进度" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /两数之和/ })).toBeInTheDocument();

    const statusFilter = screen.getByRole("navigation", { name: "练习状态筛选" });
    fireEvent.click(within(statusFilter).getByRole("link", { name: "已尝试" }));

    expect(screen.getByLabelText("当前地址")).toHaveTextContent("/progress?view=attempted");
    expect(screen.getByRole("link", { name: /两数之和/ })).toBeInTheDocument();

    fireEvent.click(within(statusFilter).getByRole("link", { name: "已完成" }));

    expect(screen.getByLabelText("当前地址")).toHaveTextContent("/progress?view=solved");
    expect(within(statusFilter).getByRole("link", { name: "已完成" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /两数之和/ })).toBeInTheDocument();

    fireEvent.click(within(statusFilter).getByRole("link", { name: "已收藏" }));

    expect(screen.getByLabelText("当前地址")).toHaveTextContent("/progress?view=starred");
    expect(screen.getByRole("link", { name: /两数之和/ })).toBeInTheDocument();
  }, 10_000);
});
