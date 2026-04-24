import { RefObject } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  step: "deploying" | "done";
  deployStatus: "building" | "ready" | "error";
  repoUrl: string;
  buildLog: string;
  deployUrl: string;
  deployDuration: number;
  deployError: string;
  logRef: RefObject<HTMLPreElement>;
  onGoToDashboard: () => void;
  onDeployAnother: () => void;
}

export default function DeployStepProgress({
  step, deployStatus, repoUrl, buildLog, deployUrl,
  deployDuration, deployError, logRef,
  onGoToDashboard, onDeployAnother,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 p-4 border border-neutral-800 rounded-lg">
        {step === "deploying" ? (
          <svg className="animate-spin w-5 h-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : deployStatus === "ready" ? (
          <div className="w-5 h-5 bg-green-400/20 rounded-full flex items-center justify-center shrink-0">
            <Icon name="Check" size={12} className="text-green-400" />
          </div>
        ) : (
          <div className="w-5 h-5 bg-red-400/20 rounded-full flex items-center justify-center shrink-0">
            <Icon name="X" size={12} className="text-red-400" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-white">
            {step === "deploying" ? "Деплой выполняется..." : deployStatus === "ready" ? "Деплой завершён!" : "Ошибка деплоя"}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">{repoUrl}</p>
        </div>
        {deployDuration > 0 && (
          <span className="ml-auto text-xs text-neutral-500">{deployDuration}с</span>
        )}
      </div>

      {/* Build log */}
      <div className="border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-neutral-900/60 border-b border-neutral-800 flex items-center gap-2">
          <Icon name="ScrollText" size={13} className="text-neutral-500" />
          <span className="text-xs text-neutral-400">Build Log</span>
          {step === "deploying" && <span className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse" />}
        </div>
        <pre ref={logRef} className="bg-black text-xs text-green-400 font-mono p-4 max-h-96 overflow-auto leading-relaxed whitespace-pre-wrap">
          {buildLog}
        </pre>
      </div>

      {deployStatus === "ready" && deployUrl && (
        <div className="flex items-center gap-3 p-4 bg-green-400/5 border border-green-400/20 rounded-lg">
          <Icon name="Globe" size={16} className="text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-400 mb-0.5">Сайт доступен по адресу:</p>
            <a href={deployUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm text-green-400 hover:text-white transition-colors font-mono truncate block">
              {deployUrl}
            </a>
          </div>
          <a href={deployUrl} target="_blank" rel="noopener noreferrer"
            className="shrink-0 px-3 py-1.5 bg-green-400 text-black text-xs font-medium hover:bg-white transition-colors">
            Открыть
          </a>
        </div>
      )}

      {deployStatus === "error" && deployError && (
        <div className="flex items-start gap-3 p-4 bg-red-400/5 border border-red-400/20 rounded-lg">
          <Icon name="AlertCircle" size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400 font-medium">Ошибка</p>
            <p className="text-xs text-red-300/70 mt-0.5">{deployError}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button onClick={onGoToDashboard}
          className="flex-1 py-2.5 text-sm border border-neutral-700 text-neutral-300 hover:border-neutral-500 transition-colors">
          К проектам
        </button>
        {deployStatus !== "building" && (
          <button onClick={onDeployAnother}
            className="flex-1 py-2.5 text-sm bg-neutral-800 text-white hover:bg-neutral-700 transition-colors">
            Деплоить ещё
          </button>
        )}
      </div>
    </div>
  );
}
