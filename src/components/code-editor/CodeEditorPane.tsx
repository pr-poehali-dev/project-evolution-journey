import { useRef } from "react";
import { Language, LANG_COLORS, TEMPLATES } from "./codeEditorData";

interface Props {
  lang: Language;
  templateIdx: number;
  code: string;
  lineCount: number;
  onCodeChange: (code: string) => void;
}

const FILE_NAMES: Record<Language, string> = {
  tsx: "component.tsx",
  python: "index.py",
  css: "styles.css",
  json: "config.json",
  bash: "script.sh",
};

export default function CodeEditorPane({ lang, templateIdx, code, lineCount, onCodeChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newCode = code.substring(0, start) + "  " + code.substring(end);
      onCodeChange(newCode);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 2; });
    }
  };

  return (
    <div className="flex-1 min-w-0 border border-neutral-800 rounded-lg overflow-hidden flex flex-col">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-900 border-b border-neutral-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <span className={`text-xs font-mono ${LANG_COLORS[lang]}`}>{FILE_NAMES[lang]}</span>
        <span className="ml-auto text-xs text-neutral-600">{TEMPLATES[lang][templateIdx]?.name}</span>
      </div>

      <div className="flex flex-1 overflow-hidden bg-neutral-950">
        <div className="select-none pt-4 pb-4 px-3 text-right bg-neutral-900/40 border-r border-neutral-800 min-w-[3rem]">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="text-xs text-neutral-700 leading-6 font-mono">{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 bg-transparent text-sm text-green-400 font-mono p-4 resize-none focus:outline-none leading-6 overflow-auto"
        />
      </div>
    </div>
  );
}
