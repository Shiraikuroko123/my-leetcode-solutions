import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { featuredProblems } from "../src/data/featuredProblems";

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:5173";
const OUTPUT = path.resolve(process.env.QA_OUTPUT || "artifacts/visual-qa");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(`PAGE: ${error.message}`));
  return errors;
}

async function layoutMetrics(page: Page) {
  return page.evaluate(() => ({
    htmlWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    rootWidth: document.querySelector<HTMLElement>("#root")?.scrollWidth ?? 0,
    viewportWidth: window.innerWidth,
    bodyHeight: document.body.scrollHeight,
    viewportHeight: window.innerHeight
  }));
}

type LayoutMetrics = Awaited<ReturnType<typeof layoutMetrics>>;

function assertNoPageOverflow(metrics: LayoutMetrics, label: string) {
  const overflowingRoots = [
    ["html", metrics.htmlWidth],
    ["body", metrics.bodyWidth],
    ["#root", metrics.rootWidth]
  ].filter(([, width]) => Number(width) > metrics.viewportWidth);

  assert(
    overflowingRoots.length === 0,
    `${label} has page-level horizontal overflow: ${JSON.stringify({ ...metrics, overflowingRoots })}`
  );
}

async function tableLayout(page: Page) {
  return page.locator(".problem-table-wrap").evaluate((wrapper) => {
    const table = wrapper.querySelector(".problem-table");
    const bounds = wrapper.getBoundingClientRect();
    return {
      clientWidth: wrapper.clientWidth,
      scrollWidth: wrapper.scrollWidth,
      left: bounds.left,
      right: bounds.right,
      tableDisplay: table ? window.getComputedStyle(table).display : "missing",
      visibleAcceptanceCells: Array.from(wrapper.querySelectorAll("tbody .acceptance-column"))
        .filter((cell) => window.getComputedStyle(cell).display !== "none").length
    };
  });
}

function assertStableBox(
  before: Awaited<ReturnType<ReturnType<Page["locator"]>["boundingBox"]>>,
  after: Awaited<ReturnType<ReturnType<Page["locator"]>["boundingBox"]>>,
  label: string
) {
  assert(before && after, `${label} must remain visible`);
  for (const key of ["x", "y", "width", "height"] as const) {
    assert(Math.abs(before[key] - after[key]) < 0.5, `${label} shifted on ${key}: ${before[key]} -> ${after[key]}`);
  }
}

async function main() {
  for (const problem of Object.values(featuredProblems)) {
    for (const language of ["python", "cpp"] as const) {
      assert(
        !/(tests passed|\bexpected\b|\bassert\b|if __name__|int main\s*\()/i.test(problem.starterCode[language]),
        `${problem.slug}/${language} starter must not expose checks or expected results`
      );
    }
  }

  await mkdir(OUTPUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const desktopPage = await desktop.newPage();
  const desktopErrors = await collectErrors(desktopPage);
  desktopPage.on("dialog", (dialog) => void dialog.accept());
  await desktopPage.goto(BASE_URL, { waitUntil: "networkidle" });
  await desktopPage.screenshot({ path: path.join(OUTPUT, "catalog-desktop.png"), fullPage: true });
  const desktopCatalog = await layoutMetrics(desktopPage);
  assertNoPageOverflow(desktopCatalog, "1440px catalog");
  const desktopTable = await tableLayout(desktopPage);
  assert(desktopTable.right <= desktopCatalog.viewportWidth, "Desktop table scroller must remain inside the viewport");
  assert(await desktopPage.locator("tbody tr").count() === 40, "Desktop catalog should render one 40-row page");

  await desktopPage.getByRole("link", { name: "学习路径", exact: true }).click();
  await desktopPage.waitForURL((url) => url.pathname === "/paths");
  await desktopPage.getByRole("heading", { level: 1, name: "按知识体系逐步练习" }).waitFor({ state: "visible" });
  assert(await desktopPage.locator(".learning-path-row").count() === 10, "Learning-path view should render all ten paths");
  await desktopPage.screenshot({ path: path.join(OUTPUT, "paths-desktop.png"), fullPage: true });
  const desktopPaths = await layoutMetrics(desktopPage);
  assertNoPageOverflow(desktopPaths, "1440px learning paths");

  await Promise.all([
    desktopPage.waitForURL((url) => url.pathname === "/"),
    desktopPage.goBack()
  ]);
  await Promise.all([
    desktopPage.waitForURL((url) => url.pathname === "/paths"),
    desktopPage.goForward()
  ]);
  await Promise.all([
    desktopPage.waitForURL((url) => url.pathname === "/"),
    desktopPage.goBack()
  ]);

  await desktopPage.getByRole("link", { name: "我的进度", exact: true }).click();
  await desktopPage.waitForURL((url) => url.pathname === "/progress");
  await desktopPage.getByRole("heading", { level: 1, name: "查看你的练习进度" }).waitFor({ state: "visible" });
  await desktopPage.getByRole("navigation", { name: "练习状态筛选" }).waitFor({ state: "visible" });
  await desktopPage.screenshot({ path: path.join(OUTPUT, "progress-desktop.png"), fullPage: true });
  const desktopProgress = await layoutMetrics(desktopPage);
  assertNoPageOverflow(desktopProgress, "1440px progress");
  await Promise.all([
    desktopPage.waitForURL((url) => url.pathname === "/"),
    desktopPage.goBack()
  ]);

  await desktopPage.getByRole("button", { name: "深度题解" }).click();
  await desktopPage.waitForTimeout(200);
  const featuredCount = Object.keys(featuredProblems).length;
  assert(await desktopPage.locator("tbody tr").count() === featuredCount, `Deep-solution filter should return ${featuredCount} rows`);
  await desktopPage.getByRole("link", { name: /两数之和/ }).click();
  await desktopPage.waitForLoadState("networkidle");
  await desktopPage.locator(".workspace-title span").waitFor({ state: "visible", timeout: 30_000 });
  await desktopPage.locator(".monaco-editor").waitFor({ state: "visible", timeout: 30_000 });
  await desktopPage.waitForTimeout(400);
  assert(
    await desktopPage.evaluate(() => window.localStorage.getItem("algonote-draft:two-sum:python")) === featuredProblems["two-sum"]?.starterCode.python,
    "Initial workspace should save starter code, not the reference answer"
  );
  await desktopPage.screenshot({ path: path.join(OUTPUT, "workspace-desktop.png") });
  const desktopWorkspace = await layoutMetrics(desktopPage);
  assertNoPageOverflow(desktopWorkspace, "1440px workspace");
  await desktopPage.getByRole("button", { name: "运行", exact: true }).click();
  await desktopPage.locator(".console-stdout").getByText("Test 1 error: NotImplementedError", { exact: false }).waitFor({ timeout: 30_000 });
  assert(!(await desktopPage.locator(".console-output").innerText()).includes("[0, 1]"), "Failed checks must not reveal an expected answer");
  await desktopPage.getByRole("button", { name: "问助教" }).click();
  await desktopPage.getByText("从思路开始，不急着看答案").waitFor();
  await desktopPage.waitForTimeout(300);
  const desktopReasoning = desktopPage.getByRole("combobox", { name: "推理强度" });
  await desktopReasoning.selectOption("high");
  assert(await desktopReasoning.inputValue() === "high", "Reasoning selector should accept a supported effort");
  await desktopPage.screenshot({ path: path.join(OUTPUT, "assistant-desktop.png") });
  await desktopPage.getByTitle("关闭助教").click();
  await desktopPage.getByRole("button", { name: "问助教" }).click();
  assert(await desktopReasoning.inputValue() === "high", "Reasoning selector should persist after reopening the drawer");
  await desktopPage.getByTitle("关闭助教").click();
  await desktopPage.locator(".panel-tabs").getByRole("tab", { name: "题解" }).click();
  await desktopPage.getByRole("button", { name: "查看参考题解" }).click();
  await desktopPage.getByRole("button", { name: /加载 Python 标准实现/ }).click();
  await desktopPage.getByText("参考实现 · 不自动保存").waitFor();
  await desktopPage.waitForTimeout(400);
  assert(
    await desktopPage.evaluate(() => window.localStorage.getItem("algonote-draft:two-sum:python")) === featuredProblems["two-sum"]?.starterCode.python,
    "Reference code must not overwrite the user's saved draft"
  );
  await desktopPage.getByRole("button", { name: "运行", exact: true }).click();
  await desktopPage.locator(".console-stdout").getByText("3/3 tests passed", { exact: false }).waitFor({ timeout: 30_000 });
  await desktopPage.screenshot({ path: path.join(OUTPUT, "workspace-run-desktop.png") });
  await desktopPage.getByRole("button", { name: "返回我的代码" }).click();
  await desktopPage.getByText("自动保存").waitFor();
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const mobilePage = await mobile.newPage();
  const mobileErrors = await collectErrors(mobilePage);
  mobilePage.on("dialog", (dialog) => void dialog.accept());
  await mobilePage.goto(BASE_URL, { waitUntil: "networkidle" });
  await mobilePage.getByRole("link", { name: "学习路径", exact: true }).click();
  await mobilePage.waitForURL((url) => url.pathname === "/paths");
  await mobilePage.getByRole("heading", { level: 1, name: "按知识体系逐步练习" }).waitFor({ state: "visible" });
  assert(await mobilePage.locator(".learning-path-row").count() === 10, "Mobile learning-path view should render all ten paths");
  const mobilePaths = await layoutMetrics(mobilePage);
  assertNoPageOverflow(mobilePaths, "390px learning paths");
  await mobilePage.screenshot({ path: path.join(OUTPUT, "paths-mobile.png"), fullPage: true });
  await mobilePage.getByRole("link", { name: "我的进度", exact: true }).click();
  await mobilePage.waitForURL((url) => url.pathname === "/progress");
  await mobilePage.getByRole("heading", { level: 1, name: "查看你的练习进度" }).waitFor({ state: "visible" });
  const mobileProgress = await layoutMetrics(mobilePage);
  assertNoPageOverflow(mobileProgress, "390px progress");
  await mobilePage.screenshot({ path: path.join(OUTPUT, "progress-mobile.png"), fullPage: true });
  await mobilePage.getByRole("link", { name: "题库", exact: true }).click();
  await mobilePage.waitForURL((url) => url.pathname === "/");
  await mobilePage.getByRole("heading", { level: 1, name: "建立你的算法解题系统" }).waitFor({ state: "visible" });
  await mobilePage.getByRole("textbox", { name: "搜索题目" }).fill("两数之和");
  await mobilePage.waitForFunction(() => {
    const rowCount = document.querySelectorAll(".problem-table tbody tr").length;
    return rowCount > 0 && rowCount < 40;
  });
  await mobilePage.screenshot({ path: path.join(OUTPUT, "catalog-mobile.png"), fullPage: true });
  const mobileCatalog = await layoutMetrics(mobilePage);
  assertNoPageOverflow(mobileCatalog, "390px catalog");
  const mobileTable = await tableLayout(mobilePage);
  assert(mobileTable.tableDisplay === "block", `390px table should use compact list layout: ${JSON.stringify(mobileTable)}`);
  assert(mobileTable.visibleAcceptanceCells === 0, `390px compact list should hide acceptance cells: ${JSON.stringify(mobileTable)}`);
  assert(mobileTable.right <= mobileCatalog.viewportWidth, "390px table wrapper must remain inside the viewport");
  await mobilePage.locator(".problem-title-link").first().click();
  await mobilePage.waitForLoadState("networkidle");
  await mobilePage.locator(".workspace-title span").waitFor({ state: "visible", timeout: 30_000 });
  await mobilePage.screenshot({ path: path.join(OUTPUT, "workspace-mobile-problem.png") });
  await mobilePage.getByRole("button", { name: "问助教" }).click();
  await mobilePage.getByRole("combobox", { name: "推理强度" }).waitFor();
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({ path: path.join(OUTPUT, "assistant-mobile.png") });
  const mobileAssistant = await layoutMetrics(mobilePage);
  assertNoPageOverflow(mobileAssistant, "390px assistant");
  await mobilePage.getByTitle("关闭助教").click();
  await mobilePage.locator(".panel-tabs").getByRole("tab", { name: "题解" }).click();
  await mobilePage.getByRole("button", { name: "查看参考题解" }).click();
  await mobilePage.getByRole("button", { name: /加载 Python 标准实现/ }).click();
  await mobilePage.getByRole("tab", { name: "代码", exact: true }).click();
  await mobilePage.locator(".monaco-editor").waitFor({ state: "visible", timeout: 30_000 });
  await mobilePage.screenshot({ path: path.join(OUTPUT, "workspace-mobile-code.png") });
  await mobilePage.getByRole("button", { name: "运行", exact: true }).click();
  await mobilePage.locator(".console-stdout").getByText("3/3 tests passed", { exact: false }).waitFor({ timeout: 30_000 });
  await mobilePage.screenshot({ path: path.join(OUTPUT, "workspace-mobile-result.png") });
  await mobilePage.getByRole("tab", { name: "代码", exact: true }).click();
  await mobilePage.getByRole("button", { name: "返回我的代码" }).click();
  const mobileWorkspace = await layoutMetrics(mobilePage);
  assertNoPageOverflow(mobileWorkspace, "390px workspace");
  await mobile.close();

  const tablet = await browser.newContext({ viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1 });
  const tabletPage = await tablet.newPage();
  const tabletErrors = await collectErrors(tabletPage);
  await tabletPage.goto(BASE_URL, { waitUntil: "networkidle" });
  const tabletCatalog = await layoutMetrics(tabletPage);
  assertNoPageOverflow(tabletCatalog, "768px catalog");
  const tabletTable = await tableLayout(tabletPage);
  assert(tabletTable.tableDisplay === "table", `768px table should retain its wide-table layout: ${JSON.stringify(tabletTable)}`);
  assert(tabletTable.scrollWidth > tabletTable.clientWidth, `768px wide table should scroll locally: ${JSON.stringify(tabletTable)}`);
  assert(tabletTable.right <= tabletCatalog.viewportWidth, "768px table scroller must remain inside the viewport");
  await tabletPage.screenshot({ path: path.join(OUTPUT, "catalog-768.png"), fullPage: true });

  await tabletPage.goto(`${BASE_URL}/paths`, { waitUntil: "networkidle" });
  const tabletPaths = await layoutMetrics(tabletPage);
  assertNoPageOverflow(tabletPaths, "768px learning paths");
  await tabletPage.goto(`${BASE_URL}/progress`, { waitUntil: "networkidle" });
  const tabletProgress = await layoutMetrics(tabletPage);
  assertNoPageOverflow(tabletProgress, "768px progress");

  await tabletPage.goto(`${BASE_URL}/problems/two-sum`, { waitUntil: "networkidle" });
  await tabletPage.locator(".workspace-title span").waitFor({ state: "visible", timeout: 30_000 });
  for (const tabName of ["题目", "代码", "结果"]) {
    await tabletPage.locator(".mobile-workspace-tabs").getByRole("tab", { name: tabName, exact: true }).click();
    const visiblePanels = await tabletPage.locator(".problem-panel, .editor-panel, .console-panel").evaluateAll(
      (panels) => panels.filter((panel) => window.getComputedStyle(panel).display !== "none").length
    );
    assert(visiblePanels === 1, `768px ${tabName} tab should show exactly one workspace panel`);
  }
  const tabletWorkspace = await layoutMetrics(tabletPage);
  assertNoPageOverflow(tabletWorkspace, "768px workspace");
  await tabletPage.screenshot({ path: path.join(OUTPUT, "workspace-768.png") });
  await tablet.close();

  const narrow = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
  const narrowPage = await narrow.newPage();
  const narrowErrors = await collectErrors(narrowPage);
  narrowPage.on("dialog", (dialog) => void dialog.accept());
  await narrowPage.route("**/api/run", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ stdout: "3/3 tests passed\n", stderr: "", code: 0, elapsedMs: 12 })
    });
  });
  await narrowPage.goto(BASE_URL, { waitUntil: "networkidle" });
  const narrowCatalog = await layoutMetrics(narrowPage);
  assertNoPageOverflow(narrowCatalog, "375px catalog");
  const narrowTable = await tableLayout(narrowPage);
  assert(narrowTable.tableDisplay === "block", `375px table should use compact list layout: ${JSON.stringify(narrowTable)}`);
  assert(narrowTable.visibleAcceptanceCells === 0, `375px compact list should hide acceptance cells: ${JSON.stringify(narrowTable)}`);
  assert(narrowTable.right <= narrowCatalog.viewportWidth, "375px table wrapper must remain inside the viewport");
  await narrowPage.screenshot({ path: path.join(OUTPUT, "catalog-375.png") });

  await narrowPage.getByRole("link", { name: "学习路径", exact: true }).click();
  await narrowPage.getByRole("heading", { level: 1, name: "按知识体系逐步练习" }).waitFor({ state: "visible" });
  const narrowPaths = await layoutMetrics(narrowPage);
  assertNoPageOverflow(narrowPaths, "375px learning paths");
  await narrowPage.getByRole("link", { name: "我的进度", exact: true }).click();
  await narrowPage.getByRole("heading", { level: 1, name: "查看你的练习进度" }).waitFor({ state: "visible" });
  const narrowProgress = await layoutMetrics(narrowPage);
  assertNoPageOverflow(narrowProgress, "375px progress");
  await narrowPage.screenshot({ path: path.join(OUTPUT, "progress-375.png"), fullPage: true });

  await narrowPage.goto(`${BASE_URL}/problems/two-sum`, { waitUntil: "networkidle" });
  await narrowPage.locator(".workspace-title span").waitFor({ state: "visible", timeout: 30_000 });
  await narrowPage.getByRole("button", { name: "问助教" }).click();
  await narrowPage.waitForTimeout(300);
  const narrowDrawer = await narrowPage.locator(".assistant-drawer").boundingBox();
  assert(Boolean(narrowDrawer && narrowDrawer.x === 0 && narrowDrawer.width === 375), "375px assistant should fill the viewport");
  const narrowAssistant = await layoutMetrics(narrowPage);
  assertNoPageOverflow(narrowAssistant, "375px assistant");
  await narrowPage.screenshot({ path: path.join(OUTPUT, "assistant-375.png") });
  await narrowPage.getByTitle("关闭助教").click();
  await narrowPage.locator(".panel-tabs").getByRole("tab", { name: "题解" }).click();
  await narrowPage.getByRole("button", { name: "查看参考题解" }).click();
  await narrowPage.getByRole("button", { name: /加载 Python 标准实现/ }).click();
  await narrowPage.getByText("参考 · 不保存").waitFor();
  await narrowPage.locator(".monaco-editor").waitFor({ state: "visible", timeout: 30_000 });

  const narrowToolbarBefore = await narrowPage.locator(".editor-toolbar").boundingBox();
  const narrowRunBefore = await narrowPage.getByRole("button", { name: "运行", exact: true }).boundingBox();
  assert(
    Boolean(narrowRunBefore && narrowRunBefore.x + narrowRunBefore.width <= 375),
    `375px run button should remain fully visible: ${JSON.stringify(narrowRunBefore)}`
  );
  await narrowPage.getByRole("button", { name: "运行", exact: true }).click();
  await narrowPage.locator(".mobile-workspace-tabs").getByRole("tab", { name: "代码", exact: true }).click();
  await narrowPage.waitForFunction(() => document.querySelector(".run-button")?.getAttribute("aria-busy") === "true");
  const narrowToolbarRunning = await narrowPage.locator(".editor-toolbar").boundingBox();
  const narrowRunRunning = await narrowPage.getByRole("button", { name: "运行", exact: true }).boundingBox();
  assertStableBox(narrowToolbarBefore, narrowToolbarRunning, "375px Monaco toolbar while running");
  assertStableBox(narrowRunBefore, narrowRunRunning, "375px run button while running");
  await narrowPage.waitForFunction(() => document.querySelector(".run-button")?.getAttribute("aria-busy") === "false");
  const narrowToolbarAfter = await narrowPage.locator(".editor-toolbar").boundingBox();
  const narrowRunAfter = await narrowPage.getByRole("button", { name: "运行", exact: true }).boundingBox();
  assertStableBox(narrowToolbarBefore, narrowToolbarAfter, "375px Monaco toolbar after running");
  assertStableBox(narrowRunBefore, narrowRunAfter, "375px run button after running");
  await narrowPage.locator(".mobile-workspace-tabs").getByRole("tab", { name: "结果", exact: true }).click();
  await narrowPage.locator(".console-stdout").getByText("3/3 tests passed", { exact: false }).waitFor();
  await narrowPage.screenshot({ path: path.join(OUTPUT, "workspace-375-result.png") });
  const narrowWorkspace = await layoutMetrics(narrowPage);
  assertNoPageOverflow(narrowWorkspace, "375px workspace");
  await narrow.close();

  await browser.close();
  const errors = [...desktopErrors, ...mobileErrors, ...tabletErrors, ...narrowErrors];
  assert(errors.length === 0, `Browser console errors:\n${errors.join("\n")}`);
  console.log(JSON.stringify({
    desktopCatalog,
    desktopPaths,
    desktopProgress,
    desktopWorkspace,
    mobilePaths,
    mobileProgress,
    mobileCatalog,
    mobileAssistant,
    mobileWorkspace,
    tabletCatalog,
    tabletPaths,
    tabletProgress,
    tabletWorkspace,
    narrowCatalog,
    narrowPaths,
    narrowProgress,
    narrowAssistant,
    narrowWorkspace,
    screenshots: OUTPUT
  }, null, 2));
  } finally {
    await browser.close().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
