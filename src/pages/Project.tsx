import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import Icon from "@/components/ui/icon";

const STATUS_COLORS: Record<string, string> = {
  ready: "text-green-400 bg-green-400/10",
  building: "text-yellow-400 bg-yellow-400/10",
  error: "text-red-400 bg-red-400/10",
  queued: "text-neutral-400 bg-neutral-400/10",
  cancelled: "text-neutral-500 bg-neutral-500/10",
};

type Deployment = {
  id: number; status: string; branch: string; commit_sha: string;
  commit_message: string; url: string; build_log: string;
  duration_seconds: number; created_at: string; finished_at: string;
};
type Domain = { id: number; domain: string; verified: boolean };
type ProjectData = {
  id: number; name: string; repo_url: string; framework: string;
  domain: string; env_vars: Record<string, string>; created_at: string;
};

export default function Project() {
  const { id } = useParams();
  const user = getUser();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"deployments" | "env" | "domains" | "settings">("deployments");
  const [project, setProject] = useState<ProjectData | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<Deployment | null>(null);

  const [deploying, setDeploying] = useState(false);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvVal, setNewEnvVal] = useState("");
  const [envSaving, setEnvSaving] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [domainAdding, setDomainAdding] = useState(false);

  const load = async () => {
    if (!user || !id) return;
    setLoading(true);
    const data = await apiGet("project", { project_id: id, user_id: String(user.user_id) });
    if (data.project) {
      setProject(data.project);
      setDeployments(data.deployments || []);
      setDomains(data.domains || []);
      setEnvVars(data.project.env_vars || {});
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleDeploy = async () => {
    if (!user || !id) return;
    setDeploying(true);
    await apiPost("deploy", { project_id: Number(id), user_id: user.user_id, commit_message: "Manual deploy" });
    setDeploying(false);
    load();
  };

  const handleSaveEnv = async () => {
    if (!user || !id) return;
    setEnvSaving(true);
    await apiPost("update_env", { project_id: Number(id), user_id: user.user_id, env_vars: envVars });
    setEnvSaving(false);
  };

  const handleAddEnv = () => {
    if (!newEnvKey.trim()) return;
    setEnvVars((prev) => ({ ...prev, [newEnvKey.trim()]: newEnvVal }));
    setNewEnvKey(""); setNewEnvVal("");
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim() || !user || !id) return;
    setDomainAdding(true);
    await apiPost("add_domain", { project_id: Number(id), user_id: user.user_id, domain: newDomain.trim() });
    setNewDomain(""); setDomainAdding(false);
    load();
  };

  const fmt = (iso: string) => iso ? new Date(iso).toLocaleString("ru-RU") : "—";

  const tabs = [
    { key: "deployments", label: "Деплои", icon: "Rocket" },
    { key: "env", label: "Переменные", icon: "Key" },
    { key: "domains", label: "Домены", icon: "Globe" },
    { key: "settings", label: "Настройки", icon: "Settings" },
  ] as const;

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-32 text-neutral-500">Загрузка...</div>
    </DashboardLayout>
  );

  if (!project) return (
    <DashboardLayout>
      <div className="flex flex-col items-center py-32 text-neutral-500">
        <p className="mb-4">Проект не найден</p>
        <button onClick={() => navigate("/dashboard")} className="text-blue-400 text-sm hover:underline">← Назад</button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6" onClick={() => setSelectedLog(null)}>
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl p-6 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Лог деплоя #{selectedLog.id}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-neutral-400 hover:text-white"><Icon name="X" size={16} /></button>
            </div>
            <pre className="text-xs text-green-400 bg-black p-4 rounded font-mono leading-relaxed whitespace-pre-wrap">
              {selectedLog.build_log || "Лог недоступен"}
            </pre>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate("/dashboard")} className="text-neutral-500 hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={16} />
        </button>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 uppercase tracking-wide">{project.framework}</span>
      </div>
      <div className="flex items-center gap-4 mb-8 pl-7">
        {project.domain && (
          <a href={`https://${project.domain}`} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:underline flex items-center gap-1">
            <Icon name="ExternalLink" size={12} />
            {project.domain}
          </a>
        )}
        {project.repo_url && (
          <a href={project.repo_url} target="_blank" rel="noreferrer" className="text-neutral-400 text-sm hover:text-white flex items-center gap-1">
            <Icon name="Github" size={12} />
            Репозиторий
          </a>
        )}
      </div>

      <div className="flex gap-1 border-b border-neutral-800 mb-8">
        {tabs.map((t) => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors -mb-px ${
              tab === t.key ? "border-blue-400 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleDeploy} disabled={deploying}
          className="flex items-center gap-2 mb-2 px-4 py-1.5 bg-blue-400 text-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-50 self-center"
        >
          <Icon name="Rocket" size={13} />
          {deploying ? "Деплой..." : "Задеплоить"}
        </button>
      </div>

      {tab === "deployments" && (
        <div className="flex flex-col gap-2">
          {deployments.length === 0 ? (
            <p className="text-neutral-500 py-12 text-center">Нет деплоев</p>
          ) : deployments.map((d) => (
            <div key={d.id} className="border border-neutral-800 px-5 py-4 flex items-center gap-4 hover:border-neutral-700 transition-colors">
              <span className={`text-xs px-2 py-0.5 uppercase tracking-wide rounded ${STATUS_COLORS[d.status] || "text-neutral-400 bg-neutral-800"}`}>
                {d.status}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.commit_message || "—"}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {d.branch} · {d.commit_sha || "—"} · {fmt(d.created_at)}
                  {d.duration_seconds ? ` · ${d.duration_seconds}с` : ""}
                </p>
              </div>
              {d.url && (
                <a href={d.url} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-blue-400 transition-colors">
                  <Icon name="ExternalLink" size={14} />
                </a>
              )}
              <button onClick={() => setSelectedLog(d)} className="text-neutral-400 hover:text-white transition-colors">
                <Icon name="ScrollText" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "env" && (
        <div className="max-w-2xl">
          <p className="text-neutral-400 text-sm mb-6">Переменные окружения доступны в сборке и runtime.</p>
          <div className="flex flex-col gap-2 mb-6">
            {Object.entries(envVars).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 border border-neutral-800 px-4 py-2.5">
                <span className="text-sm font-mono text-blue-400 w-40 shrink-0 truncate">{k}</span>
                <input
                  value={v}
                  onChange={(e) => setEnvVars((prev) => ({ ...prev, [k]: e.target.value }))}
                  className="flex-1 bg-transparent text-sm text-white font-mono focus:outline-none"
                />
                <button onClick={() => setEnvVars((prev) => { const n = { ...prev }; delete n[k]; return n; })} className="text-neutral-600 hover:text-red-400 transition-colors">
                  <Icon name="Trash2" size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <input value={newEnvKey} onChange={(e) => setNewEnvKey(e.target.value)} placeholder="VARIABLE_NAME"
              className="flex-1 bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
            <input value={newEnvVal} onChange={(e) => setNewEnvVal(e.target.value)} placeholder="value"
              className="flex-1 bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
            <button onClick={handleAddEnv} className="px-4 py-2 border border-neutral-700 text-neutral-300 hover:border-blue-400 transition-colors text-sm">
              <Icon name="Plus" size={14} />
            </button>
          </div>
          <button onClick={handleSaveEnv} disabled={envSaving} className="bg-blue-400 text-black px-6 py-2.5 text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
            {envSaving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      )}

      {tab === "domains" && (
        <div className="max-w-2xl">
          <p className="text-neutral-400 text-sm mb-6">Добавьте свой домен и настройте DNS.</p>
          <div className="flex flex-col gap-2 mb-6">
            {project.domain && (
              <div className="border border-neutral-800 px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{project.domain}</span>
                  <span className="ml-3 text-xs bg-green-400/10 text-green-400 px-2 py-0.5">Системный</span>
                </div>
                <Icon name="Check" size={14} className="text-green-400" />
              </div>
            )}
            {domains.map((d) => (
              <div key={d.id} className="border border-neutral-800 px-5 py-3 flex items-center justify-between">
                <span className="text-sm font-medium">{d.domain}</span>
                <span className={`text-xs px-2 py-0.5 ${d.verified ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-400"}`}>
                  {d.verified ? "Активен" : "Ожидает DNS"}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="mydomain.com"
              className="flex-1 bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
            <button onClick={handleAddDomain} disabled={domainAdding} className="px-5 py-2.5 bg-blue-400 text-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
              {domainAdding ? "..." : "Добавить"}
            </button>
          </div>
          {domains.some((d) => !d.verified) && (
            <div className="mt-6 border border-yellow-400/20 bg-yellow-400/5 p-4">
              <p className="text-yellow-400 text-sm font-medium mb-2">Настройте DNS</p>
              <p className="text-neutral-400 text-xs">Добавьте CNAME запись: <span className="font-mono text-white">cname.clodev.ru</span></p>
            </div>
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="max-w-2xl">
          <div className="border border-neutral-800 p-6 mb-4">
            <h3 className="font-semibold mb-4">Информация о проекте</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-neutral-500">ID</span><p className="text-white mt-1">{project.id}</p></div>
              <div><span className="text-neutral-500">Фреймворк</span><p className="text-white mt-1">{project.framework}</p></div>
              <div><span className="text-neutral-500">Создан</span><p className="text-white mt-1">{fmt(project.created_at)}</p></div>
              <div><span className="text-neutral-500">Репозиторий</span><p className="text-white mt-1 truncate">{project.repo_url || "—"}</p></div>
            </div>
          </div>
          <div className="border border-red-900/50 p-6">
            <h3 className="font-semibold text-red-400 mb-2">Опасная зона</h3>
            <p className="text-neutral-400 text-sm mb-4">Удаление проекта необратимо. Все деплои и настройки будут удалены.</p>
            <button
              onClick={async () => {
                if (!confirm("Удалить проект?")) return;
                await apiPost("delete_project", { project_id: Number(id), user_id: user!.user_id });
                navigate("/dashboard");
              }}
              className="border border-red-500 text-red-400 px-4 py-2 text-sm hover:bg-red-500 hover:text-white transition-colors"
            >
              Удалить проект
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
