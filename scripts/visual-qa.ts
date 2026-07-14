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
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
    bodyHeight: document.body.scrollHeight,
    viewportHeight: window.innerHeight
  }));
}

async function main() {
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
  assert(desktopCatalog.bodyWidth <= desktopCatalog.viewportWidth, "Desktop catalog has body-level horizontal overflow");
  assert(await desktopPage.locator("tbody tr").count() === 40, "Desktop catalog should render one 40-row page");

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
  assert(desktopWorkspace.bodyWidth <= desktopWorkspace.viewportWidth, "Desktop workspace has horizontal overflow");
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
  await mobilePage.getByRole("textbox", { name: "搜索题目" }).fill("两数之和");
  await mobilePage.waitForTimeout(250);
  await mobilePage.screenshot({ path: path.join(OUTPUT, "catalog-mobile.png"), fullPage: true });
  const mobileCatalog = await layoutMetrics(mobilePage);
  assert(mobileCatalog.bodyWidth <= mobileCatalog.viewportWidth, "Mobile catalog has body-level horizontal overflow");
  await mobilePage.locator(".problem-title-link").first().click();
  await mobilePage.waitForLoadState("networkidle");
  await mobilePage.locator(".workspace-title span").waitFor({ state: "visible", timeout: 30_000 });
  await mobilePage.screenshot({ path: path.join(OUTPUT, "workspace-mobile-problem.png") });
  await mobilePage.getByRole("button", { name: "问助教" }).click();
  await mobilePage.getByRole("combobox", { name: "推理强度" }).waitFor();
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({ path: path.join(OUTPUT, "assistant-mobile.png") });
  const mobileAssistant = await layoutMetrics(mobilePage);
  assert(mobileAssistant.bodyWidth <= mobileAssistant.viewportWidth, "Mobile assistant has horizontal overflow");
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
  assert(mobileWorkspace.bodyWidth <= mobileWorkspace.viewportWidth, "Mobile workspace has horizontal overflow");
  await mobile.close();

  const compact = await browser.newContext({ viewport: { width: 320, height: 720 }, deviceScaleFactor: 1 });
  const compactPage = await compact.newPage();
  const compactErrors = await collectErrors(compactPage);
  compactPage.on("dialog", (dialog) => void dialog.accept());
  await compactPage.goto(`${BASE_URL}/problems/two-sum`, { waitUntil: "networkidle" });
  await compactPage.locator(".workspace-title span").waitFor({ state: "visible", timeout: 30_000 });
  await compactPage.getByRole("button", { name: "问助教" }).click();
  await compactPage.waitForTimeout(300);
  const compactDrawer = await compactPage.locator(".assistant-drawer").boundingBox();
  assert(Boolean(compactDrawer && compactDrawer.x === 0 && compactDrawer.width === 320), "320px assistant should fill the viewport");
  await compactPage.screenshot({ path: path.join(OUTPUT, "assistant-compact.png") });
  await compactPage.getByTitle("关闭助教").click();
  await compactPage.locator(".panel-tabs").getByRole("tab", { name: "题解" }).click();
  await compactPage.getByRole("button", { name: "查看参考题解" }).click();
  await compactPage.getByRole("button", { name: /加载 Python 标准实现/ }).click();
  await compactPage.getByText("参考 · 不保存").waitFor();
  const compactRunButton = await compactPage.getByRole("button", { name: "运行", exact: true }).boundingBox();
  await compactPage.screenshot({ path: path.join(OUTPUT, "workspace-compact-code.png") });
  assert(
    Boolean(compactRunButton && compactRunButton.x + compactRunButton.width <= 320),
    `320px run button should remain fully visible: ${JSON.stringify(compactRunButton)}`
  );
  const compactWorkspace = await layoutMetrics(compactPage);
  assert(compactWorkspace.bodyWidth <= compactWorkspace.viewportWidth, "320px workspace has horizontal overflow");
  await compact.close();

  await browser.close();
  const errors = [...desktopErrors, ...mobileErrors, ...compactErrors];
  assert(errors.length === 0, `Browser console errors:\n${errors.join("\n")}`);
  console.log(JSON.stringify({ desktopCatalog, desktopWorkspace, mobileCatalog, mobileAssistant, mobileWorkspace, compactWorkspace, screenshots: OUTPUT }, null, 2));
  } finally {
    await browser.close().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
