import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ExternalLink,
  FileCode2,
  Lightbulb,
  LoaderCircle,
  Play,
  RotateCcw,
  Star,
  Terminal,
  TriangleAlert,
  Undo2
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AIAssistant } from "../components/AIAssistant";
import { AppHeader } from "../components/AppHeader";
import { CodeEditor } from "../components/CodeEditor";
import { DifficultyBadge } from "../components/DifficultyBadge";
import { useProgress } from "../hooks/useProgress";
import type { Theme } from "../hooks/useTheme";
import { fetchExternalSolution, runCode, type ExternalSolution } from "../lib/api";
import { getFeaturedProblem, getSolutionLanguages, officialProblemUrl, problemBySlug, problems } from "../lib/catalog";
import type { Language, RunResult } from "../types/problem";

type WorkspacePageProps = {
  theme: Theme;
  onToggleTheme: () => void;
};

type ProblemTab = "description" | "solution";
type MobileTab = "problem" | "code" | "result";

function genericStarter(language: Language, title: string) {
  if (language === "python") {
    return `# ${title}\n# 打开左侧官方题面，根据函数签名完成代码。\n\nclass Solution:\n    pass\n\nif __name__ == "__main__":\n    print("请补充测试用例")\n`;
  }
  return `// ${title}\n// 打开左侧官方题面，根据函数签名完成代码。\n\n#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    // TODO: implement\n};\n\nint main() {\n    cout << "请补充测试用例\\n";\n}\n`;
}

function draftKey(slug: string, language: Language) {
  return `algonote-draft:${slug}:${language}`;
}

export function WorkspacePage({ theme, onToggleTheme }: WorkspacePageProps) {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const problem = problemBySlug.get(slug);
  const featured = getFeaturedProblem(slug);
  const progress = useProgress();
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState("");
  const [problemTab, setProblemTab] = useState<ProblemTab>("description");
  const [mobileTab, setMobileTab] = useState<MobileTab>("problem");
  const [revealedHints, setRevealedHints] = useState(0);
  const [solutionUnlocked, setSolutionUnlocked] = useState(false);
  const [externalSolution, setExternalSolution] = useState<ExternalSolution | null>(null);
  const [solutionError, setSolutionError] = useState("");
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [runError, setRunError] = useState("");
  const [running, setRunning] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [referenceMode, setReferenceMode] = useState(false);
  const solutionRequestId = useRef(0);
  const loadedDraftKey = useRef("");

  const index = useMemo(() => problems.findIndex((item) => item.slug === slug), [slug]);
  const previous = index > 0 ? problems[index - 1] : undefined;
  const next = index >= 0 && index < problems.length - 1 ? problems[index + 1] : undefined;
  const availableLanguages = problem ? getSolutionLanguages(problem) : [];
  const hasReference = Boolean(featured || availableLanguages.includes(language));

  useEffect(() => {
    if (!problem) return;
    const key = draftKey(problem.slug, language);
    const starter = featured?.starterCode[language] || genericStarter(language, problem.title);
    const saved = window.localStorage.getItem(key);
    const contaminatedByReference = Boolean(saved && featured && saved === featured.solutionCode[language]);
    loadedDraftKey.current = key;
    setReferenceMode(false);
    setCode(contaminatedByReference ? starter : saved || starter);
    if (contaminatedByReference) window.localStorage.setItem(key, starter);
    setRunResult(null);
    setRunError("");
    setExternalSolution(null);
    setSolutionError("");
    setSolutionUnlocked(false);
    setLoadingSolution(false);
    solutionRequestId.current += 1;
  }, [featured, language, problem]);

  useEffect(() => {
    setProblemTab("description");
    setMobileTab("problem");
    setRevealedHints(0);
    setAssistantOpen(false);
  }, [slug]);

  useEffect(() => {
    if (!problem || !code || referenceMode) return;
    const key = draftKey(problem.slug, language);
    if (loadedDraftKey.current !== key) return;
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(key, code);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [code, language, problem, referenceMode]);

  if (!problem) {
    return (
      <div className="not-found">
        <FileCode2 size={32} />
        <h1>没有找到这道题</h1>
        <p>题目可能已更名，或本地目录需要重新同步。</p>
        <Link to="/">返回题库</Link>
      </div>
    );
  }

  const changeLanguage = (nextLanguage: Language) => setLanguage(nextLanguage);

  const resetCode = () => {
    const starter = featured?.starterCode[language] || genericStarter(language, problem.title);
    if (code !== starter && !window.confirm("重置会覆盖当前编辑器内容，是否继续？")) return;
    loadedDraftKey.current = draftKey(problem.slug, language);
    setReferenceMode(false);
    setCode(starter);
    setRunResult(null);
    setRunError("");
  };

  const execute = async () => {
    setRunning(true);
    setRunError("");
    setRunResult(null);
    setMobileTab("result");
    progress.markAttempted(problem.slug);
    try {
      const result = await runCode(language, code);
      setRunResult(result);
      if (result.code === 0 && /tests? passed/i.test(result.stdout)) progress.markSolved(problem.slug);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "代码执行失败。" );
    } finally {
      setRunning(false);
    }
  };

  const revealReference = async () => {
    setSolutionUnlocked(true);
    setSolutionError("");
    if (featured || !hasReference) return;
    const requestId = ++solutionRequestId.current;
    setLoadingSolution(true);
    try {
      const solution = await fetchExternalSolution(problem.slug, language);
      if (requestId === solutionRequestId.current) setExternalSolution(solution);
    } catch (error) {
      if (requestId === solutionRequestId.current) {
        setSolutionError(error instanceof Error ? error.message : "暂时无法获取参考代码。" );
      }
    } finally {
      if (requestId === solutionRequestId.current) setLoadingSolution(false);
    }
  };

  const loadReferenceIntoEditor = () => {
    const reference = featured?.solutionCode[language] || externalSolution?.code;
    if (!reference) return;
    if (!window.confirm("参考实现会临时替换编辑器显示。你的代码会保留，参考实现不会自动保存，是否继续？")) return;
    if (!referenceMode) window.localStorage.setItem(draftKey(problem.slug, language), code);
    setReferenceMode(true);
    setCode(reference);
    setRunResult(null);
    setRunError("");
    setMobileTab("code");
  };

  const restoreMyCode = () => {
    const key = draftKey(problem.slug, language);
    const starter = featured?.starterCode[language] || genericStarter(language, problem.title);
    loadedDraftKey.current = key;
    setReferenceMode(false);
    setCode(window.localStorage.getItem(key) || starter);
    setRunResult(null);
    setRunError("");
  };

  const navigateProblem = (targetSlug?: string) => {
    if (targetSlug) navigate(`/problems/${targetSlug}`);
  };

  const output = runResult?.stdout || "";
  const errors = runResult?.stderr || runError;

  return (
    <div className="workspace-app">
      <AppHeader compact theme={theme} onToggleTheme={onToggleTheme} />
      <nav className="workspace-toolbar" aria-label="题目工具栏">
        <div className="workspace-title-group">
          <Link className="icon-button" to="/" title="返回题库" aria-label="返回题库"><ArrowLeft size={18} /></Link>
          <div className="workspace-title">
            <span>{problem.id}. {problem.titleCn}</span>
            <small>{problem.title}</small>
          </div>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <div className="workspace-actions">
          <button className={`icon-button${progress.starred.has(problem.slug) ? " is-starred" : ""}`} type="button" onClick={() => progress.toggleStarred(problem.slug)} title="收藏" aria-label="收藏">
            <Star size={17} fill={progress.starred.has(problem.slug) ? "currentColor" : "none"} />
          </button>
          <button className={`icon-button${progress.solved.has(problem.slug) ? " is-solved" : ""}`} type="button" onClick={() => progress.toggleSolved(problem.slug)} title="切换完成状态" aria-label="切换完成状态">
            {progress.solved.has(problem.slug) ? <CheckCircle2 size={18} /> : <Circle size={18} />}
          </button>
          <button className="icon-button" type="button" disabled={!previous} onClick={() => navigateProblem(previous?.slug)} title="上一题" aria-label="上一题"><ChevronLeft size={18} /></button>
          <button className="icon-button" type="button" disabled={!next} onClick={() => navigateProblem(next?.slug)} title="下一题" aria-label="下一题"><ChevronRight size={18} /></button>
          <a className="secondary-button" href={officialProblemUrl(problem)} target="_blank" rel="noreferrer">官方题面<ExternalLink size={15} /></a>
          <button className="primary-button" type="button" onClick={() => setAssistantOpen(true)}><Bot size={16} />问助教</button>
        </div>
      </nav>

      <div className="mobile-workspace-tabs" role="tablist" aria-label="练习区域">
        <button role="tab" aria-selected={mobileTab === "problem"} className={mobileTab === "problem" ? "is-active" : ""} type="button" onClick={() => setMobileTab("problem")}>题目</button>
        <button role="tab" aria-selected={mobileTab === "code"} className={mobileTab === "code" ? "is-active" : ""} type="button" onClick={() => setMobileTab("code")}>代码</button>
        <button role="tab" aria-selected={mobileTab === "result"} className={mobileTab === "result" ? "is-active" : ""} type="button" onClick={() => setMobileTab("result")}>结果</button>
      </div>

      <main className={`workspace-grid mobile-show-${mobileTab}`}>
        <section className="problem-panel">
          <div className="panel-tabs" role="tablist">
            <button role="tab" aria-selected={problemTab === "description"} className={problemTab === "description" ? "is-active" : ""} type="button" onClick={() => setProblemTab("description")}>题目</button>
            <button role="tab" aria-selected={problemTab === "solution"} className={problemTab === "solution" ? "is-active" : ""} type="button" onClick={() => setProblemTab("solution")}>题解</button>
          </div>

          <div className="problem-scroll">
            {problemTab === "description" ? (
              <article className="problem-copy">
                <header>
                  <h1>{problem.id}. {problem.titleCn}</h1>
                  <div className="problem-meta">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    <span>通过率 {problem.acceptance.toFixed(1)}%</span>
                    {problem.paidOnly && <span>会员题</span>}
                  </div>
                </header>

                <div className="tag-list">
                  {problem.tags.map((tag) => <span key={tag.slug}>{tag.nameCn}</span>)}
                </div>

                {featured ? (
                  <>
                    <section>
                      {featured.summary.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </section>
                    <section>
                      <h2>示例</h2>
                      {featured.examples.map((example, exampleIndex) => (
                        <div className="example-block" key={`${example.input}-${exampleIndex}`}>
                          <p><strong>输入</strong><code>{example.input}</code></p>
                          <p><strong>输出</strong><code>{example.output}</code></p>
                          {example.explanation && <p><strong>说明</strong><span>{example.explanation}</span></p>}
                        </div>
                      ))}
                    </section>
                    <section>
                      <h2>约束摘要</h2>
                      <ul>{featured.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul>
                    </section>
                    <section className="hint-section">
                      <h2>渐进提示</h2>
                      {featured.hints.slice(0, revealedHints).map((hint, hintIndex) => (
                        <div className="hint-row" key={hint}><Lightbulb size={16} /><span><strong>提示 {hintIndex + 1}</strong>{hint}</span></div>
                      ))}
                      {revealedHints < featured.hints.length && (
                        <button className="secondary-button" type="button" onClick={() => setRevealedHints((value) => value + 1)}><Lightbulb size={15} />显示下一条提示</button>
                      )}
                    </section>
                    <p className="content-note">题意为本站原创摘要，请以 LeetCode 官方题面中的完整约束与函数签名为准。</p>
                  </>
                ) : (
                  <div className="official-only-state">
                    <ExternalLink size={24} />
                    <h2>完整题面请在 LeetCode 查看</h2>
                    <p>本站已同步公开目录、难度与算法标签，但不批量转载完整题面。打开官方页面阅读后，可回到右侧继续编码。</p>
                    <a className="primary-button" href={officialProblemUrl(problem)} target="_blank" rel="noreferrer">打开官方题面<ExternalLink size={15} /></a>
                  </div>
                )}
              </article>
            ) : (
              <article className="solution-copy">
                {!solutionUnlocked ? (
                  <div className="solution-gate">
                    <Lightbulb size={27} />
                    <h2>先保留一点思考空间</h2>
                    <p>{featured
                      ? "建议先尝试提示并写出暴力解法，再查看完整推导。"
                      : hasReference
                        ? "可按需读取 MIT 许可的第三方参考实现；本站不会把它标成原创标准答案。"
                        : availableLanguages.length
                          ? `当前仅收录 ${availableLanguages[0] === "python" ? "Python" : "C++"} 参考实现，请切换语言查看。`
                          : "当前清单尚未收录这道题的 Python 或 C++ 参考实现，可打开官方题面后继续独立编码。"}</p>
                    <button className="primary-button" type="button" disabled={!hasReference} onClick={() => void revealReference()}>
                      <FileCode2 size={16} />{hasReference ? "查看参考题解" : `${language === "python" ? "Python" : "C++"} 暂无参考`}
                    </button>
                  </div>
                ) : (
                  <>
                    {featured && (
                      <>
                        <h1>{featured.approach.title}</h1>
                        {featured.approach.intuition.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                        <h2>步骤</h2>
                        <ol>{featured.approach.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                        <div className="complexity-row">
                          <span><strong>时间</strong>{featured.approach.time}</span>
                          <span><strong>空间</strong>{featured.approach.space}</span>
                        </div>
                        <button className="primary-button" type="button" onClick={loadReferenceIntoEditor}><FileCode2 size={16} />加载 {language === "python" ? "Python" : "C++"} 标准实现</button>
                        <p className="content-note">本站原创思路与实现，可直接运行内置测试。</p>
                      </>
                    )}

                    {!featured && (
                      <div className="external-solution-state">
                        {loadingSolution && <p className="inline-loading"><LoaderCircle size={16} />正在读取开源参考代码...</p>}
                        {solutionError && <div className="inline-error"><TriangleAlert size={17} />{solutionError}</div>}
                        {externalSolution && (
                          <>
                            <h1>开源参考实现</h1>
                            <p>代码来自 <a href={externalSolution.repositoryUrl} target="_blank" rel="noreferrer">walkccc/LeetCode</a>，采用 {externalSolution.license} 许可。此实现可能只包含 LeetCode 类定义，运行前需要自行补充测试入口。</p>
                            <button className="primary-button" type="button" onClick={loadReferenceIntoEditor}><FileCode2 size={16} />加载至编辑器</button>
                            <a className="text-link" href={externalSolution.sourceUrl} target="_blank" rel="noreferrer">查看原始文件<ExternalLink size={14} /></a>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </article>
            )}
          </div>
        </section>

        <section className="editor-panel">
          <div className="editor-toolbar">
            <div className="segmented-control segmented-control--dark" aria-label="编程语言">
              <button className={language === "python" ? "is-active" : ""} type="button" onClick={() => changeLanguage("python")}>Python</button>
              <button className={language === "cpp" ? "is-active" : ""} type="button" onClick={() => changeLanguage("cpp")}>C++</button>
            </div>
            <div className="editor-actions">
              {referenceMode ? (
                <span className="draft-status draft-status--reference">
                  <FileCode2 size={13} />
                  <span className="draft-status-long">参考实现 · 不自动保存</span>
                  <span className="draft-status-short">参考 · 不保存</span>
                </span>
              ) : (
                <span className="draft-status"><Check size={13} />自动保存</span>
              )}
              {referenceMode && (
                <button className="icon-button icon-button--editor" type="button" onClick={restoreMyCode} title="返回我的代码" aria-label="返回我的代码"><Undo2 size={16} /></button>
              )}
              <button className="icon-button icon-button--editor" type="button" onClick={resetCode} title="重置代码" aria-label="重置代码"><RotateCcw size={16} /></button>
              <button className="run-button" type="button" disabled={running} onClick={() => void execute()}>
                {running ? <LoaderCircle className="spin" size={16} /> : <Play size={16} fill="currentColor" />}运行
              </button>
            </div>
          </div>
          <div className="editor-area">
            <CodeEditor code={code} language={language} theme={theme} onChange={setCode} />
          </div>
        </section>

        <section className="console-panel">
          <div className="console-header">
            <span><Terminal size={15} />运行结果</span>
            {runResult && <small>{runResult.elapsedMs} ms · 退出码 {runResult.code ?? "-"}</small>}
          </div>
          <div className="console-output" aria-live="polite">
            {running && <p className="inline-loading"><LoaderCircle className="spin" size={16} />正在隔离沙箱中运行...</p>}
            {!running && !runResult && !runError && (
              <p className="console-placeholder">{featured
                ? "点击“运行”执行当前文件。深度题解模板已包含可见测试用例。"
                : "点击“运行”执行当前文件。第三方参考通常只含 Solution 类，需要自行补充 main 或测试入口。"}</p>
            )}
            {output && <pre className="console-stdout">{output}</pre>}
            {errors && <pre className="console-stderr">{errors}</pre>}
            {runResult && !output && !errors && <p className="console-placeholder">程序正常退出，但没有输出。若代码只有 Solution 类，请添加 main 或测试入口。</p>}
          </div>
        </section>
      </main>

      <AIAssistant key={problem.slug} open={assistantOpen} onClose={() => setAssistantOpen(false)} problem={problem} summary={featured?.summary || []} language={language} code={code} />
      {assistantOpen && <button className="drawer-backdrop" type="button" onClick={() => setAssistantOpen(false)} aria-label="关闭助教" />}
    </div>
  );
}
