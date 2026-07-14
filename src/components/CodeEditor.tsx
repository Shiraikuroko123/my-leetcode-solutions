import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import "monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution";
import "monaco-editor/esm/vs/basic-languages/python/python.contribution";
import type { Language } from "../types/problem";

type MonacoWorkerHost = typeof globalThis & {
  MonacoEnvironment: { getWorker: () => Worker };
};

(globalThis as MonacoWorkerHost).MonacoEnvironment = {
  getWorker: () => new EditorWorker()
};
loader.config({ monaco });
monaco.editor.defineTheme("algonote-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [{ token: "comment", foreground: "7EA66C" }],
  colors: {}
});

type CodeEditorProps = {
  code: string;
  language: Language;
  theme: "light" | "dark";
  onChange: (code: string) => void;
};

export function CodeEditor({ code, language, theme, onChange }: CodeEditorProps) {
  return (
    <Editor
      className="code-editor"
      height="100%"
      language={language === "cpp" ? "cpp" : "python"}
      theme={theme === "dark" ? "algonote-dark" : "light"}
      value={code}
      onChange={(value) => onChange(value || "")}
      loading={<div className="editor-loading">正在加载编辑器...</div>}
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        fontFamily: '"Cascadia Code", "SFMono-Regular", Consolas, monospace',
        fontSize: 14,
        lineHeight: 22,
        padding: { top: 14, bottom: 14 },
        scrollBeyondLastLine: false,
        tabSize: 4,
        wordWrap: "off",
        renderLineHighlight: "line",
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
        fixedOverflowWidgets: true
      }}
    />
  );
}
