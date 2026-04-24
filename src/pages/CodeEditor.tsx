import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Icon from "@/components/ui/icon";
import { Language, TEMPLATES } from "@/components/code-editor/codeEditorData";
import CodeEditorSidebar from "@/components/code-editor/CodeEditorSidebar";
import CodeEditorPane from "@/components/code-editor/CodeEditorPane";

export default function CodeEditor() {
  const [lang, setLang] = useState<Language>("tsx");
  const [templateIdx, setTemplateIdx] = useState(0);
  const [code, setCode] = useState(TEMPLATES.tsx[0].code);
  const [copied, setCopied] = useState(false);

  const selectTemplate = (l: Language, idx: number) => {
    setLang(l);
    setTemplateIdx(idx);
    setCode(TEMPLATES[l][idx].code);
  };

  const handleSelectLang = (l: Language) => {
    setLang(l);
    setTemplateIdx(0);
    setCode(TEMPLATES[l][0].code);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.split("\n").length;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Code Editor</h1>
          <p className="text-neutral-400 text-sm mt-1">Редактор с шаблонами — копируй готовый код</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">{lineCount} строк</span>
          <button onClick={copyCode} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-700 text-neutral-300 text-sm hover:border-blue-400 hover:text-blue-400 transition-colors">
            <Icon name={copied ? "Check" : "Copy"} size={13} />
            {copied ? "Скопировано" : "Копировать"}
          </button>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        <CodeEditorSidebar
          lang={lang}
          templateIdx={templateIdx}
          onSelectLang={handleSelectLang}
          onSelectTemplate={selectTemplate}
        />
        <CodeEditorPane
          lang={lang}
          templateIdx={templateIdx}
          code={code}
          lineCount={lineCount}
          onCodeChange={setCode}
        />
      </div>
    </DashboardLayout>
  );
}
