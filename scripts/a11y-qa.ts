import AxeBuilder from "@axe-core/playwright";
import { chromium, type Page } from "playwright";

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:5173";

type Finding = {
  page: string;
  id: string;
  impact: string | null;
  help: string;
  targets: unknown[];
  failureSummaries: Array<string | undefined>;
};

async function audit(page: Page, name: string) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.map<Finding>((violation) => ({
    page: name,
    id: violation.id,
    impact: violation.impact ?? null,
    help: violation.help,
    targets: violation.nodes.slice(0, 5).map((node) => node.target),
    failureSummaries: violation.nodes.slice(0, 5).map((node) => node.failureSummary)
  }));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    const findings = await audit(page, "catalog-desktop");

    await page.goto(`${BASE_URL}/problems/two-sum`, { waitUntil: "networkidle" });
    await page.locator(".workspace-title span").waitFor({ state: "visible", timeout: 30_000 });
    findings.push(...await audit(page, "workspace-desktop"));

    await page.getByRole("button", { name: "问助教" }).click();
    await page.waitForTimeout(300);
    findings.push(...await audit(page, "assistant-desktop"));
    await page.getByTitle("关闭助教").click();

    await page.getByRole("button", { name: "切换深色主题" }).click();
    await page.waitForTimeout(300);
    findings.push(...await audit(page, "workspace-desktop-dark"));
    await page.getByRole("button", { name: "问助教" }).click();
    await page.waitForTimeout(300);
    findings.push(...await audit(page, "assistant-desktop-dark"));
    await page.getByTitle("关闭助教").click();

    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    findings.push(...await audit(page, "catalog-desktop-dark"));

    const severe = findings.filter((finding) => finding.impact === "critical" || finding.impact === "serious");
    console.log(JSON.stringify({ violations: findings, severeCount: severe.length }, null, 2));
    if (severe.length) throw new Error(`Accessibility audit found ${severe.length} serious or critical violations`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
