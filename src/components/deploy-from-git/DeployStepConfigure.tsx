import Icon from "@/components/ui/icon";
import { DetectResult, Project, FRAMEWORK_ICONS } from "./deployFromGitData";

interface Props {
  repoUrl: string;
  detectResult: DetectResult;
  projects: Project[];
  selectedProjectId: number | "new";
  projectName: string;
  branch: string;
  buildCmd: string;
  outDir: string;
  envPairs: { k: string; v: string }[];
  deploying: boolean;
  onBack: () => void;
  onDeploy: () => void;
  onSelectProject: (id: number | "new") => void;
  onChangeProjectName: (name: string) => void;
  onChangeBranch: (branch: string) => void;
  onChangeBuildCmd: (cmd: string) => void;
  onChangeOutDir: (dir: string) => void;
  onAddEnvPair: () => void;
  onChangeEnvPair: (i: number, field: "k" | "v", value: string) => void;
  onRemoveEnvPair: (i: number) => void;
  onResetDetect: () => void;
}

export default function DeployStepConfigure({
  repoUrl, detectResult, projects, selectedProjectId, projectName,
  branch, buildCmd, outDir, envPairs, deploying,
  onBack, onDeploy, onSelectProject, onChangeProjectName,
  onChangeBranch, onChangeBuildCmd, onChangeOutDir,
  onAddEnvPair, onChangeEnvPair, onRemoveEnvPair, onResetDetect,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Detected framework */}
      <div className="flex items-center gap-4 p-4 border border-green-400/30 bg-green-400/5 rounded-lg">
        <span className="text-3xl">{FRAMEWORK_ICONS[detectResult.framework] || "📦"}</span>
        <div>
          <p className="text-sm font-medium text-white">Обнаружен {detectResult.framework}</p>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">{repoUrl}</p>
        </div>
        <button onClick={onResetDetect} className="ml-auto text-neutral-500 hover:text-white transition-colors">
          <Icon name="X" size={14} />
        </button>
      </div>

      {/* Project selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-neutral-400 uppercase tracking-wide">Проект</label>
        <select
          value={selectedProjectId === "new" ? "new" : String(selectedProjectId)}
          onChange={(e) => onSelectProject(e.target.value === "new" ? "new" : Number(e.target.value))}
          className="bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors">
          <option value="new">Создать новый проект</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {selectedProjectId === "new" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-neutral-400 uppercase tracking-wide">Название проекта</label>
          <input value={projectName} onChange={(e) => onChangeProjectName(e.target.value)}
            placeholder="my-awesome-app"
            className="bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
        </div>
      )}

      {/* Branch */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-neutral-400 uppercase tracking-wide">Ветка</label>
        <input value={branch} onChange={(e) => onChangeBranch(e.target.value)} placeholder="main"
          className="bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
      </div>

      {/* Build settings */}
      <div className="border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-neutral-900/60 border-b border-neutral-800">
          <p className="text-sm font-medium">Настройки сборки</p>
          <p className="text-xs text-neutral-500 mt-0.5">Автоопределено — можно изменить</p>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-neutral-400 uppercase tracking-wide">Команда сборки</label>
            <input value={buildCmd} onChange={(e) => onChangeBuildCmd(e.target.value)}
              placeholder="npm run build"
              className="bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-sm text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
            {detectResult.scripts && Object.keys(detectResult.scripts).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(detectResult.scripts).filter(([k]) => ['build', 'generate', 'export'].includes(k)).map(([k]) => (
                  <button key={k} onClick={() => onChangeBuildCmd('npm run ' + k)}
                    className="text-xs px-2 py-0.5 bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors rounded">
                    npm run {k}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-neutral-400 uppercase tracking-wide">Папка с билдом</label>
            <input value={outDir} onChange={(e) => onChangeOutDir(e.target.value)}
              placeholder="dist"
              className="bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-sm text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
            <div className="flex flex-wrap gap-1 mt-1">
              {['dist', 'out', 'build', 'public', '.output/public'].map((d) => (
                <button key={d} onClick={() => onChangeOutDir(d)}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${outDir === d ? "bg-blue-400/20 text-blue-400" : "bg-neutral-800 text-neutral-400 hover:text-white"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Env variables */}
      <div className="border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Переменные окружения</p>
            <p className="text-xs text-neutral-500 mt-0.5">Для сборки — VITE_, NEXT_PUBLIC_ и т.д.</p>
          </div>
          <button onClick={onAddEnvPair} className="flex items-center gap-1 text-xs text-blue-400 hover:text-white transition-colors">
            <Icon name="Plus" size={12} />Добавить
          </button>
        </div>
        {envPairs.length > 0 && (
          <div className="p-4 flex flex-col gap-2">
            {envPairs.map((pair, i) => (
              <div key={i} className="flex gap-2">
                <input value={pair.k} onChange={(e) => onChangeEnvPair(i, "k", e.target.value)}
                  placeholder="VITE_API_URL" className="flex-1 bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-400 transition-colors" />
                <input value={pair.v} onChange={(e) => onChangeEnvPair(i, "v", e.target.value)}
                  placeholder="https://api.example.com" className="flex-1 bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-400 transition-colors" />
                <button onClick={() => onRemoveEnvPair(i)} className="text-neutral-600 hover:text-red-400 transition-colors px-1">
                  <Icon name="X" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-4 py-3 border border-neutral-700 text-neutral-300 text-sm hover:border-neutral-500 transition-colors">
          Назад
        </button>
        <button onClick={onDeploy} disabled={deploying || (!projectName && selectedProjectId === "new")}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-400 text-black font-medium text-sm hover:bg-white transition-colors disabled:opacity-40">
          <Icon name="Rocket" size={14} />
          Задеплоить
        </button>
      </div>
    </div>
  );
}
