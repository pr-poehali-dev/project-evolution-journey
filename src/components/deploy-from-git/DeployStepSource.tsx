import Icon from "@/components/ui/icon";
import { SOURCES, normalizeGitUrl } from "./deployFromGitData";

interface Props {
  sourceIdx: number;
  repoUrl: string;
  gitToken: string;
  showToken: boolean;
  detecting: boolean;
  detectError: string;
  onSelectSource: (i: number) => void;
  onChangeUrl: (url: string) => void;
  onChangeToken: (token: string) => void;
  onToggleToken: () => void;
  onDetect: () => void;
}

export default function DeployStepSource({
  sourceIdx, repoUrl, gitToken, showToken, detecting, detectError,
  onSelectSource, onChangeUrl, onChangeToken, onToggleToken, onDetect,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        {SOURCES.map((s, i) => (
          <button key={i} onClick={() => onSelectSource(i)}
            className={`flex items-start gap-3 p-4 border rounded-lg text-left transition-colors ${sourceIdx === i ? "border-blue-400 bg-blue-400/5" : "border-neutral-800 hover:border-neutral-600"}`}>
            <Icon name={s.icon} size={18} className={sourceIdx === i ? "text-blue-400" : "text-neutral-500"} />
            <div>
              <p className="text-sm font-medium text-white">{s.label}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{s.hint}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-neutral-400 uppercase tracking-wide">Git URL репозитория</label>
          <input
            value={repoUrl}
            onChange={(e) => { onChangeUrl(e.target.value); }}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = e.clipboardData.getData("text");
              onChangeUrl(normalizeGitUrl(pasted));
            }}
            placeholder={SOURCES[sourceIdx].placeholder}
            className="bg-neutral-900 border border-neutral-700 px-4 py-3 text-sm text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors"
            onKeyDown={(e) => e.key === "Enter" && repoUrl.trim() && onDetect()}
          />
          <p className="text-xs text-neutral-600">Пример: https://github.com/user/repo</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <button onClick={onToggleToken} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors self-start">
            <Icon name={showToken ? "ChevronUp" : "ChevronDown"} size={12} />
            {showToken ? "Скрыть" : "Приватный репозиторий? Добавь токен"}
          </button>
          {showToken && (
            <div className="flex flex-col gap-1">
              <input
                type="password" value={gitToken} onChange={(e) => onChangeToken(e.target.value)}
                placeholder="GitHub: ghp_... / GitLab: glpat-... / Bitbucket: token"
                className="bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors"
              />
              <p className="text-xs text-neutral-600">Токен не сохраняется — используется только для клонирования</p>
            </div>
          )}
        </div>
      </div>

      {detectError && (
        <div className="flex items-start gap-3 bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3">
          <Icon name="AlertCircle" size={14} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-300">{detectError}</p>
        </div>
      )}

      <button
        onClick={onDetect}
        disabled={!repoUrl.trim() || detecting}
        className="flex items-center justify-center gap-2 py-3 bg-blue-400 text-black font-medium text-sm hover:bg-white transition-colors disabled:opacity-40"
      >
        {detecting ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Анализируем репозиторий...
          </>
        ) : (
          <><Icon name="Search" size={14} />Анализировать репозиторий</>
        )}
      </button>
    </div>
  );
}
