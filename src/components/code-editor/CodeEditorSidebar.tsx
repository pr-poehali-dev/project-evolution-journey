import { Language, LANGS, LANG_COLORS, TEMPLATES } from "./codeEditorData";

interface Props {
  lang: Language;
  templateIdx: number;
  onSelectLang: (l: Language) => void;
  onSelectTemplate: (l: Language, idx: number) => void;
}

export default function CodeEditorSidebar({ lang, templateIdx, onSelectLang, onSelectTemplate }: Props) {
  return (
    <aside className="w-52 shrink-0 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        {LANGS.map((l) => (
          <button key={l.key} onClick={() => onSelectLang(l.key)}
            className={`px-3 py-2 text-sm text-left rounded-lg transition-colors flex items-center gap-2 ${lang === l.key ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"}`}>
            <span className={`text-xs font-mono ${LANG_COLORS[l.key]}`}>{l.key}</span>
            <span className="truncate">{l.label}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-neutral-800 pt-4">
        <p className="text-xs text-neutral-600 uppercase tracking-wide mb-2 px-1">Шаблоны</p>
        <div className="flex flex-col gap-1">
          {TEMPLATES[lang].map((t, i) => (
            <button key={i} onClick={() => onSelectTemplate(lang, i)}
              className={`px-3 py-2 text-xs text-left rounded-lg transition-colors ${templateIdx === i && lang === lang ? "bg-blue-400/10 text-blue-400 border border-blue-400/20" : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"}`}>
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
