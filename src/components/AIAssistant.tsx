import { useMemo, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { askTutor } from "../lib/api";
import type { CatalogProblem, Language } from "../types/problem";

type Message = { role: "user" | "assistant"; content: string };

type AIAssistantProps = {
  open: boolean;
  onClose: () => void;
  problem: CatalogProblem;
  summary: string[];
  language: Language;
  code: string;
};

function getSessionId() {
  const key = "algonote-session-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

export function AIAssistant({ open, onClose, problem, summary, language, code }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = useMemo(getSessionId, []);

  const send = async (preset?: string) => {
    const content = (preset || input).trim();
    if (!content || loading) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", content }]);
    setLoading(true);
    try {
      const result = await askTutor({ message: content, code, language, problem, summary, sessionId });
      setMessages((current) => [...current, { role: "assistant", content: result.answer }]);
    } catch (error) {
      const content = error instanceof Error ? error.message : "助教暂时无法回答。";
      setMessages((current) => [...current, { role: "assistant", content }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={`assistant-drawer${open ? " assistant-drawer--open" : ""}`} aria-hidden={!open}>
      <div className="assistant-header">
        <div>
          <span className="assistant-title"><Bot size={18} /> 算法助教</span>
          <small>结合当前题目与代码回答</small>
        </div>
        <button className="icon-button" type="button" onClick={onClose} title="关闭助教" aria-label="关闭助教">
          <X size={18} />
        </button>
      </div>

      <div className="assistant-messages" aria-live="polite">
        {messages.length === 0 && (
          <div className="assistant-empty">
            <Sparkles size={22} />
            <strong>从思路开始，不急着看答案</strong>
            <p>助教会读取当前编辑器代码。题面不足时会提醒你打开官方页面核对。</p>
            <div className="assistant-prompts">
              <button type="button" onClick={() => void send("给我一个不暴露答案的第一步提示")}>第一步提示</button>
              <button type="button" onClick={() => void send("检查我当前代码的逻辑错误，并给出一个失败用例")}>检查代码</button>
              <button type="button" onClick={() => void send("帮我分析这道题应该使用的数据结构")}>选择数据结构</button>
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <div className={`chat-message chat-message--${message.role}`} key={`${message.role}-${index}`}>
            {message.role === "assistant" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            ) : <p>{message.content}</p>}
          </div>
        ))}
        {loading && <div className="assistant-thinking"><span />正在分析当前代码...</div>}
      </div>

      <form
        className="assistant-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="描述卡住的位置..."
          rows={3}
          maxLength={4000}
        />
        <button className="icon-button icon-button--primary" type="submit" disabled={!input.trim() || loading} title="发送" aria-label="发送">
          <Send size={17} />
        </button>
      </form>
    </aside>
  );
}
