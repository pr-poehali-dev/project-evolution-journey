import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

const STATUS_COLORS: Record<string, string> = {
  ready: "text-green-400 bg-green-400/10",
  building: "text-yellow-400 bg-yellow-400/10",
  error: "text-red-400 bg-red-400/10",
  queued: "text-neutral-400 bg-neutral-400/10",
  cancelled: "text-neutral-500 bg-neutral-500/10",
};

type Deployment = { id: number; status: string; branch: string; commit_sha: string; commit_message: string; url: string; build_log: string; duration_seconds: number; created_at: string; finished_at: string; };
type Domain = { id: number; domain: string; verified: boolean };
type AnalyticsRow = { date: string; views: number; unique_visitors: number; bandwidth_mb: number; requests: number };
type Webhook = { id: number; url: string; events: string; active: boolean; created_at: string };
type ProjectData = { id: number; name: string; repo_url: string; framework: string; domain: string; env_vars: Record<string, string>; created_at: string; };

type Tab = "deployments" | "analytics" | "usage" | "env" | "domains" | "webhooks" | "integrations" | "settings";
type UsageStat = { date: string; bandwidth_mb: number; requests: number; build_seconds: number };
type Integration = { id: number; type: string; config: Record<string, string>; active: boolean; created_at: string };

export default function Project() {
  const { id } = useParams();
  const user = getUser();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("deployments");
  const [project, setProject] = useState<ProjectData | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<Deployment | null>(null);

  const [deploying, setDeploying] = useState(false);
  const [deployBranch, setDeployBranch] = useState("main");

  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [newEnvKey, setNewEnvKey] = useState(""); const [newEnvVal, setNewEnvVal] = useState("");
  const [envSaving, setEnvSaving] = useState(false);

  const [newDomain, setNewDomain] = useState(""); const [domainAdding, setDomainAdding] = useState(false);

  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newWHUrl, setNewWHUrl] = useState(""); const [newWHEvents, setNewWHEvents] = useState("deploy.ready,deploy.error");
  const [whAdding, setWhAdding] = useState(false); const [whSecret, setWhSecret] = useState("");

  const [usageStats, setUsageStats] = useState<UsageStat[]>([]);
  const [usageTotals, setUsageTotals] = useState<Record<string, number>>({});
  const [usageLoading, setUsageLoading] = useState(false);

  const [envTab, setEnvTab] = useState<"all" | "production" | "preview" | "development">("all");
  const [envByEnv, setEnvByEnv] = useState<Record<string, Record<string, string>>>({ all: {}, production: {}, preview: {}, development: {} });

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [intLoading, setIntLoading] = useState(false);
  const [tgToken, setTgToken] = useState(""); const [tgChat, setTgChat] = useState("");
  const [slackUrl, setSlackUrl] = useState("");
  const [rollbacking, setRollbacking] = useState<number | null>(null);

  const [ghConfig, setGhConfig] = useState<{ secret: string; auto_deploy: boolean; branch: string } | null>(null);
  const [ghBranch, setGhBranch] = useState("main");
  const [ghSaving, setGhSaving] = useState(false);
  const [ghCopied, setGhCopied] = useState(false);

  const load = async () => {
    if (!user || !id) return;
    setLoading(true);
    const data = await apiGet("project", { project_id: id, user_id: String(user.user_id) });
    if (data.project) { setProject(data.project); setDeployments(data.deployments || []); setDomains(data.domains || []); setEnvVars(data.project.env_vars || {}); }
    setLoading(false);
  };

  const loadAnalytics = async () => {
    if (!user || !id) return;
    setAnalyticsLoading(true);
    const data = await apiGet("analytics", { project_id: id, user_id: String(user.user_id) });
    setAnalytics((data.analytics || []).reverse());
    setTotals(data.totals || {});
    setAnalyticsLoading(false);
  };

  const loadWebhooks = async () => {
    if (!user || !id) return;
    const data = await apiGet("webhooks", { project_id: id, user_id: String(user.user_id) });
    setWebhooks(data.webhooks || []);
  };

  const loadUsage = async () => {
    if (!user || !id) return;
    setUsageLoading(true);
    const data = await apiGet("usage", { project_id: id, user_id: String(user.user_id) });
    setUsageStats(data.stats || []);
    setUsageTotals(data.totals || {});
    setUsageLoading(false);
  };

  const loadEnvEnvs = async () => {
    if (!user || !id) return;
    const data = await apiGet("env_envs", { project_id: id, user_id: String(user.user_id) });
    setEnvByEnv({ all: data.all || {}, production: data.production || {}, preview: data.preview || {}, development: data.development || {} });
  };

  const loadIntegrations = async () => {
    if (!user) return;
    setIntLoading(true);
    const data = await apiGet("integrations", { user_id: String(user.user_id) });
    const list: Integration[] = data.integrations || [];
    setIntegrations(list);
    const tg = list.find((i) => i.type === "telegram");
    const sl = list.find((i) => i.type === "slack");
    if (tg) { setTgToken(tg.config.token || ""); setTgChat(tg.config.chat_id || ""); }
    if (sl) { setSlackUrl(sl.config.webhook_url || ""); }
    setIntLoading(false);
  };

  const handleRollback = async (depId: number) => {
    if (!user || !id || !confirm("Откатить проект к этому деплою?")) return;
    setRollbacking(depId);
    await apiPost("rollback", { project_id: Number(id), user_id: user.user_id, deployment_id: depId });
    setRollbacking(null);
    load();
  };

  const handleSaveEnvEnv = async () => {
    if (!user || !id) return;
    setEnvSaving(true);
    await apiPost("update_env_envs", { project_id: Number(id), user_id: user.user_id, env_type: envTab, env_vars: envByEnv[envTab] });
    setEnvSaving(false);
  };

  const handleSaveIntegration = async (type: string, config: Record<string, string>) => {
    if (!user) return;
    const existing = integrations.find((i) => i.type === type);
    await apiPost("save_integration", { user_id: user.user_id, type, config, id: existing?.id });
    loadIntegrations();
  };

  const loadGithubConfig = async () => {
    if (!user || !id) return;
    const data = await apiGet("github_config", { project_id: id, user_id: String(user.user_id) });
    if (data.branch !== undefined) {
      setGhConfig({ secret: data.secret, auto_deploy: data.auto_deploy, branch: data.branch });
      setGhBranch(data.branch || "main");
    }
  };

  const handleSetupGithub = async (enable: boolean) => {
    if (!user || !id) return;
    setGhSaving(true);
    const data = await apiPost("setup_github", { project_id: Number(id), user_id: user.user_id, auto_deploy: enable, branch: ghBranch });
    if (data.data?.secret !== undefined) {
      setGhConfig({ secret: data.data.secret, auto_deploy: enable, branch: ghBranch });
    }
    setGhSaving(false);
  };

  const webhookUrl = `${func2url.register}?project_id=${id}`;
  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl).then(() => { setGhCopied(true); setTimeout(() => setGhCopied(false), 2000); });
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (tab === "analytics" && analytics.length === 0) loadAnalytics(); }, [tab]);
  useEffect(() => { if (tab === "webhooks") loadWebhooks(); }, [tab]);
  useEffect(() => { if (tab === "usage") loadUsage(); }, [tab]);
  useEffect(() => { if (tab === "env") loadEnvEnvs(); }, [tab]);
  useEffect(() => { if (tab === "integrations") loadIntegrations(); }, [tab]);
  useEffect(() => { if (tab === "settings") loadGithubConfig(); }, [tab]);

  const handleDeploy = async () => {
    if (!user || !id) return;
    setDeploying(true);
    await apiPost("deploy", { project_id: Number(id), user_id: user.user_id, branch: deployBranch, commit_message: "Manual deploy" });
    setDeploying(false);
    load();
  };

  const handleSaveEnv = async () => { if (!user || !id) return; setEnvSaving(true); await apiPost("update_env", { project_id: Number(id), user_id: user.user_id, env_vars: envVars }); setEnvSaving(false); };
  const handleAddEnv = () => { if (!newEnvKey.trim()) return; setEnvVars((p) => ({ ...p, [newEnvKey.trim()]: newEnvVal })); setNewEnvKey(""); setNewEnvVal(""); };
  const handleAddDomain = async () => { if (!newDomain.trim() || !user || !id) return; setDomainAdding(true); await apiPost("add_domain", { project_id: Number(id), user_id: user.user_id, domain: newDomain.trim() }); setNewDomain(""); setDomainAdding(false); load(); };

  const handleAddWebhook = async () => {
    if (!newWHUrl.trim() || !user || !id) return;
    setWhAdding(true);
    const { data } = await apiPost("add_webhook", { project_id: Number(id), user_id: user.user_id, url: newWHUrl.trim(), events: newWHEvents });
    setWhAdding(false);
    if (data.secret) setWhSecret(data.secret);
    setNewWHUrl(""); loadWebhooks();
  };

  const handleToggleWH = async (whId: number, active: boolean) => {
    if (!user) return;
    await apiPost("toggle_webhook", { webhook_id: whId, user_id: user.user_id, active });
    loadWebhooks();
  };

  const fmt = (iso: string) => iso ? new Date(iso).toLocaleString("ru-RU") : "—";
  const fmtDate = (s: string) => new Date(s).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  const maxViews = Math.max(...analytics.map((a) => a.views), 1);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "deployments", label: "Деплои", icon: "Rocket" },
    { key: "analytics", label: "Аналитика", icon: "BarChart2" },
    { key: "usage", label: "Usage", icon: "Activity" },
    { key: "env", label: "Переменные", icon: "Key" },
    { key: "domains", label: "Домены", icon: "Globe" },
    { key: "webhooks", label: "Webhooks", icon: "Webhook" },
    { key: "integrations", label: "Интеграции", icon: "Plug" },
    { key: "settings", label: "Настройки", icon: "Settings" },
  ];

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-32 text-neutral-500">Загрузка...</div></DashboardLayout>;
  if (!project) return <DashboardLayout><div className="flex flex-col items-center py-32 text-neutral-500"><p className="mb-4">Проект не найден</p><button onClick={() => navigate("/dashboard")} className="text-blue-400 text-sm hover:underline">← Назад</button></div></DashboardLayout>;

  return (
    <DashboardLayout>
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6" onClick={() => setSelectedLog(null)}>
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl p-6 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Лог деплоя #{selectedLog.id}</h3>
              <button onClick={() => setSelectedLog(null)}><Icon name="X" size={16} /></button>
            </div>
            <pre className="text-xs text-green-400 bg-black p-4 font-mono leading-relaxed whitespace-pre-wrap">{selectedLog.build_log || "Лог недоступен"}</pre>
          </div>
        </div>
      )}

      {whSecret && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6" onClick={() => setWhSecret("")}>
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-3">Webhook создан</h3>
            <p className="text-neutral-400 text-sm mb-3">Сохраните секрет — он показывается только один раз:</p>
            <code className="block bg-black text-green-400 text-xs p-3 break-all mb-4">{whSecret}</code>
            <button onClick={() => setWhSecret("")} className="w-full py-2 bg-blue-400 text-black text-sm font-medium">Закрыть</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate("/dashboard")} className="text-neutral-500 hover:text-white transition-colors"><Icon name="ChevronLeft" size={16} /></button>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 uppercase tracking-wide">{project.framework}</span>
      </div>
      <div className="flex items-center gap-4 mb-8 pl-7">
        {project.domain && <a href={`https://${project.domain}`} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:underline flex items-center gap-1"><Icon name="ExternalLink" size={12} />{project.domain}</a>}
        {project.repo_url && <a href={project.repo_url} target="_blank" rel="noreferrer" className="text-neutral-400 text-sm hover:text-white flex items-center gap-1"><Icon name="Github" size={12} />Репозиторий</a>}
      </div>

      <div className="flex gap-1 border-b border-neutral-800 mb-8 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors -mb-px whitespace-nowrap ${tab === t.key ? "border-blue-400 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}>
            <Icon name={t.icon} size={13} />{t.label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-2 mb-2">
          <Link to={`/dashboard/project/${id}/ai`}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-700 text-neutral-300 text-sm hover:border-blue-400 hover:text-blue-400 transition-colors">
            <span className="text-blue-400">✦</span> AI
          </Link>
          <input value={deployBranch} onChange={(e) => setDeployBranch(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-xs text-white w-24 focus:outline-none focus:border-blue-400" placeholder="main" />
          <button onClick={handleDeploy} disabled={deploying}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-400 text-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
            <Icon name="Rocket" size={13} />{deploying ? "Деплой..." : "Задеплоить"}
          </button>
        </div>
      </div>

      {/* DEPLOYMENTS */}
      {tab === "deployments" && (
        <div className="flex flex-col gap-2">
          {deployments.length === 0 ? <p className="text-neutral-500 py-12 text-center">Нет деплоев</p>
          : deployments.map((d) => (
            <div key={d.id} className="border border-neutral-800 px-5 py-4 flex items-center gap-4 hover:border-neutral-700 transition-colors">
              <span className={`text-xs px-2 py-0.5 uppercase tracking-wide rounded shrink-0 ${STATUS_COLORS[d.status] || "text-neutral-400 bg-neutral-800"}`}>{d.status}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.commit_message || "—"}</p>
                <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2">
                  <span className="flex items-center gap-1"><Icon name="GitBranch" size={10} />{d.branch}</span>
                  <span>{d.commit_sha || "—"}</span>
                  <span>{fmt(d.created_at)}</span>
                  {d.duration_seconds ? <span>{d.duration_seconds}с</span> : null}
                </p>
              </div>
              {d.preview_url && <a href={d.preview_url} target="_blank" rel="noreferrer" className="text-xs text-purple-400 hover:underline flex items-center gap-1"><Icon name="Eye" size={10} />Preview</a>}
              {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-blue-400 transition-colors"><Icon name="ExternalLink" size={14} /></a>}
              <button onClick={() => setSelectedLog(d)} className="text-neutral-400 hover:text-white transition-colors"><Icon name="ScrollText" size={14} /></button>
              {d.status === "ready" && (
                <button onClick={() => handleRollback(d.id)} disabled={rollbacking === d.id}
                  className="text-xs text-neutral-500 hover:text-yellow-400 transition-colors flex items-center gap-1 disabled:opacity-40">
                  <Icon name="RotateCcw" size={12} />{rollbacking === d.id ? "..." : "Rollback"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ANALYTICS */}
      {tab === "analytics" && (
        <div>
          {analyticsLoading ? <p className="text-neutral-500">Загрузка...</p> : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: "Просмотры", value: totals.views?.toLocaleString(), icon: "Eye" },
                  { label: "Уникальные", value: totals.unique_visitors?.toLocaleString(), icon: "Users" },
                  { label: "Запросы", value: totals.requests?.toLocaleString(), icon: "Zap" },
                  { label: "Трафик", value: `${totals.bandwidth_mb?.toFixed(1)} МБ`, icon: "HardDrive" },
                ].map((s) => (
                  <div key={s.label} className="border border-neutral-800 p-5">
                    <div className="flex items-center gap-2 text-neutral-500 text-xs uppercase tracking-wide mb-2"><Icon name={s.icon} size={12} />{s.label}</div>
                    <div className="text-2xl font-bold text-blue-400">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="border border-neutral-800 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-6">Просмотры за 30 дней</h3>
                <div className="flex items-end gap-1 h-32">
                  {analytics.map((a) => (
                    <div key={a.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {fmtDate(a.date)}: {a.views}
                      </div>
                      <div className="w-full bg-blue-400 rounded-sm hover:bg-blue-300 transition-colors cursor-default"
                        style={{ height: `${Math.max(4, (a.views / maxViews) * 100)}%` }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-neutral-600 mt-2">
                  <span>{analytics.length > 0 ? fmtDate(analytics[0].date) : ""}</span>
                  <span>{analytics.length > 0 ? fmtDate(analytics[analytics.length - 1].date) : ""}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* USAGE */}
      {tab === "usage" && (
        <div>
          {usageLoading ? <p className="text-neutral-500">Загрузка...</p> : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Трафик", value: `${usageTotals.bandwidth_mb?.toFixed(1) || 0} МБ`, icon: "HardDrive" },
                  { label: "Запросы", value: (usageTotals.requests || 0).toLocaleString(), icon: "Zap" },
                  { label: "Время сборок", value: `${Math.round((usageTotals.build_seconds || 0) / 60)} мин`, icon: "Clock" },
                  { label: "Деплоев", value: String(usageTotals.deploys || 0), icon: "Rocket" },
                ].map((s) => (
                  <div key={s.label} className="border border-neutral-800 p-5">
                    <div className="flex items-center gap-2 text-neutral-500 text-xs uppercase tracking-wide mb-2"><Icon name={s.icon} size={12} />{s.label}</div>
                    <div className="text-2xl font-bold text-blue-400">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border border-neutral-800 p-5">
                  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Успешных деплоев</p>
                  <p className="text-2xl font-bold text-green-400">{usageTotals.success_deploys || 0}</p>
                </div>
                <div className="border border-neutral-800 p-5">
                  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Ошибок деплоя</p>
                  <p className="text-2xl font-bold text-red-400">{usageTotals.error_deploys || 0}</p>
                </div>
              </div>
              {usageStats.length > 0 && (
                <div className="border border-neutral-800 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-6">Запросы за 30 дней</h3>
                  <div className="flex items-end gap-0.5 h-28">
                    {(() => { const maxR = Math.max(...usageStats.map((s) => s.requests), 1); return usageStats.map((s) => (
                      <div key={s.date} className="flex-1 group relative flex flex-col justify-end h-full">
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {fmtDate(s.date)}: {s.requests.toLocaleString()}
                        </div>
                        <div className="w-full bg-blue-400 hover:bg-blue-300 transition-colors" style={{ height: `${Math.max(2, (s.requests / maxR) * 100)}%` }} />
                      </div>
                    )); })()}
                  </div>
                  <div className="flex justify-between text-xs text-neutral-600 mt-2">
                    <span>{usageStats.length > 0 ? fmtDate(usageStats[0].date) : ""}</span>
                    <span>{usageStats.length > 0 ? fmtDate(usageStats[usageStats.length - 1].date) : ""}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ENV VARS */}
      {tab === "env" && (
        <div className="max-w-2xl">
          <div className="flex gap-1 mb-6 border border-neutral-800 p-1 w-fit">
            {(["all", "production", "preview", "development"] as const).map((e) => (
              <button key={e} onClick={() => setEnvTab(e)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${envTab === e ? "bg-blue-400 text-black" : "text-neutral-400 hover:text-white"}`}>
                {e === "all" ? "Все среды" : e === "production" ? "Production" : e === "preview" ? "Preview" : "Development"}
              </button>
            ))}
          </div>
          <p className="text-neutral-500 text-xs mb-4">
            {envTab === "all" ? "Доступны во всех средах" : envTab === "production" ? "Только в продакшн деплоях" : envTab === "preview" ? "Только в preview ветках" : "Только локально (development)"}
          </p>
          <div className="flex flex-col gap-2 mb-6">
            {Object.entries(envByEnv[envTab] || {}).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 border border-neutral-800 px-4 py-2.5">
                <span className="text-sm font-mono text-blue-400 w-40 shrink-0 truncate">{k}</span>
                <input value={v} onChange={(e) => setEnvByEnv((p) => ({ ...p, [envTab]: { ...p[envTab], [k]: e.target.value } }))}
                  className="flex-1 bg-transparent text-sm text-white font-mono focus:outline-none" />
                <button onClick={() => setEnvByEnv((p) => { const n = { ...p[envTab] }; delete n[k]; return { ...p, [envTab]: n }; })} className="text-neutral-600 hover:text-red-400 transition-colors"><Icon name="Trash2" size={13} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <input value={newEnvKey} onChange={(e) => setNewEnvKey(e.target.value)} placeholder="VARIABLE_NAME"
              className="flex-1 bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
            <input value={newEnvVal} onChange={(e) => setNewEnvVal(e.target.value)} placeholder="value"
              className="flex-1 bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
            <button onClick={() => { if (!newEnvKey.trim()) return; setEnvByEnv((p) => ({ ...p, [envTab]: { ...p[envTab], [newEnvKey.trim()]: newEnvVal } })); setNewEnvKey(""); setNewEnvVal(""); }}
              className="px-4 py-2 border border-neutral-700 text-neutral-300 hover:border-blue-400 transition-colors"><Icon name="Plus" size={14} /></button>
          </div>
          <button onClick={handleSaveEnvEnv} disabled={envSaving} className="bg-blue-400 text-black px-6 py-2.5 text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
            {envSaving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      )}

      {/* DOMAINS */}
      {tab === "domains" && (
        <div className="max-w-2xl">
          <p className="text-neutral-400 text-sm mb-6">Добавьте свой домен и настройте DNS.</p>
          <div className="flex flex-col gap-2 mb-6">
            {project.domain && (
              <div className="border border-neutral-800 px-5 py-3 flex items-center justify-between">
                <div><span className="text-sm font-medium">{project.domain}</span><span className="ml-3 text-xs bg-green-400/10 text-green-400 px-2 py-0.5">Системный</span></div>
                <Icon name="Check" size={14} className="text-green-400" />
              </div>
            )}
            {domains.map((d) => (
              <div key={d.id} className="border border-neutral-800 px-5 py-3 flex items-center justify-between">
                <span className="text-sm font-medium">{d.domain}</span>
                <span className={`text-xs px-2 py-0.5 ${d.verified ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-400"}`}>{d.verified ? "Активен" : "Ожидает DNS"}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-6">
            <input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="mydomain.com"
              className="flex-1 bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
            <button onClick={handleAddDomain} disabled={domainAdding} className="px-5 py-2.5 bg-blue-400 text-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
              {domainAdding ? "..." : "Добавить"}
            </button>
          </div>
          {domains.some((d) => !d.verified) && (
            <div className="border border-yellow-400/20 bg-yellow-400/5 p-4">
              <p className="text-yellow-400 text-sm font-medium mb-1">Настройте DNS</p>
              <p className="text-neutral-400 text-xs">Добавьте CNAME запись: <span className="font-mono text-white">cname.clodev.ru</span></p>
            </div>
          )}
        </div>
      )}

      {/* WEBHOOKS */}
      {tab === "webhooks" && (
        <div className="max-w-2xl">
          <p className="text-neutral-400 text-sm mb-6">Получайте HTTP-уведомления о событиях деплоя.</p>
          <div className="flex flex-col gap-2 mb-8">
            {webhooks.length === 0 ? <p className="text-neutral-600 text-sm">Webhooks не настроены</p>
            : webhooks.map((w) => (
              <div key={w.id} className="border border-neutral-800 px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-white truncate">{w.url}</p>
                  <p className="text-xs text-neutral-500 mt-1">{w.events}</p>
                </div>
                <button onClick={() => handleToggleWH(w.id, !w.active)}
                  className={`text-xs px-3 py-1 border transition-colors ${w.active ? "border-green-500/40 text-green-400 hover:bg-green-500/10" : "border-neutral-700 text-neutral-500 hover:border-neutral-500"}`}>
                  {w.active ? "Активен" : "Отключён"}
                </button>
              </div>
            ))}
          </div>
          <div className="border border-neutral-800 p-5">
            <h3 className="text-sm font-semibold mb-4">Добавить webhook</h3>
            <div className="flex flex-col gap-3">
              <input value={newWHUrl} onChange={(e) => setNewWHUrl(e.target.value)} placeholder="https://your-server.com/webhook"
                className="bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 uppercase tracking-wide">События</label>
                <div className="flex flex-wrap gap-2">
                  {["deploy.ready", "deploy.error", "deploy.queued"].map((ev) => (
                    <label key={ev} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={newWHEvents.includes(ev)}
                        onChange={(e) => setNewWHEvents((prev) => e.target.checked ? [...new Set([...prev.split(","), ev])].join(",") : prev.split(",").filter((x) => x !== ev).join(","))}
                        className="accent-blue-400" />
                      <span className="text-neutral-300 font-mono text-xs">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={handleAddWebhook} disabled={whAdding} className="bg-blue-400 text-black px-5 py-2.5 text-sm font-medium hover:bg-white transition-colors disabled:opacity-50 w-fit">
                {whAdding ? "Создание..." : "Создать webhook"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTEGRATIONS */}
      {tab === "integrations" && (
        <div className="max-w-2xl">
          {intLoading ? <p className="text-neutral-500">Загрузка...</p> : (
            <div className="flex flex-col gap-6">
              {/* Telegram */}
              <div className="border border-neutral-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center text-sm">✈️</div>
                    <div>
                      <h3 className="font-semibold">Telegram</h3>
                      <p className="text-neutral-500 text-xs">Уведомления о деплоях в Telegram</p>
                    </div>
                  </div>
                  {integrations.find((i) => i.type === "telegram") && (
                    <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5">Подключён</span>
                  )}
                </div>
                <div className="flex flex-col gap-2 mb-4">
                  <input value={tgToken} onChange={(e) => setTgToken(e.target.value)} placeholder="Bot Token (от @BotFather)"
                    className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
                  <input value={tgChat} onChange={(e) => setTgChat(e.target.value)} placeholder="Chat ID (от @userinfobot)"
                    className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
                </div>
                <button onClick={() => handleSaveIntegration("telegram", { token: tgToken, chat_id: tgChat })}
                  disabled={!tgToken || !tgChat}
                  className="px-4 py-2 bg-blue-400 text-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-40">
                  Сохранить
                </button>
              </div>

              {/* Slack */}
              <div className="border border-neutral-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center text-sm">#</div>
                    <div>
                      <h3 className="font-semibold">Slack</h3>
                      <p className="text-neutral-500 text-xs">Уведомления о деплоях в Slack канал</p>
                    </div>
                  </div>
                  {integrations.find((i) => i.type === "slack") && (
                    <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5">Подключён</span>
                  )}
                </div>
                <input value={slackUrl} onChange={(e) => setSlackUrl(e.target.value)} placeholder="Slack Webhook URL"
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors mb-4" />
                <button onClick={() => handleSaveIntegration("slack", { webhook_url: slackUrl })}
                  disabled={!slackUrl}
                  className="px-4 py-2 bg-blue-400 text-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-40">
                  Сохранить
                </button>
              </div>

              {/* GitHub — info */}
              <div className="border border-neutral-800 p-6 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-700 rounded flex items-center justify-center"><Icon name="Github" size={16} /></div>
                  <div>
                    <h3 className="font-semibold">GitHub</h3>
                    <p className="text-neutral-500 text-xs">Автодеплой при push — настраивается через репозиторий</p>
                  </div>
                  <span className="ml-auto text-xs bg-neutral-800 text-neutral-500 px-2 py-0.5">Скоро</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SETTINGS */}
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
          {/* GitHub Autodeploy */}
          <div className="border border-neutral-800 p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Icon name="Github" size={20} className="text-neutral-300" />
                <div>
                  <h3 className="font-semibold">GitHub Autodeploy</h3>
                  <p className="text-neutral-500 text-xs">Автоматический деплой при push в репозиторий</p>
                </div>
              </div>
              {ghConfig?.auto_deploy && <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5">Активен</span>}
            </div>

            <div className="flex gap-2 mb-4">
              <input value={ghBranch} onChange={(e) => setGhBranch(e.target.value)} placeholder="main"
                className="w-36 bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
              <span className="text-neutral-500 text-sm self-center">— ветка для автодеплоя</span>
            </div>

            <div className="flex gap-2 mb-5">
              <button onClick={() => handleSetupGithub(true)} disabled={ghSaving}
                className="px-4 py-2 bg-blue-400 text-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-40">
                {ghSaving ? "..." : ghConfig?.auto_deploy ? "Обновить" : "Включить"}
              </button>
              {ghConfig?.auto_deploy && (
                <button onClick={() => handleSetupGithub(false)} disabled={ghSaving}
                  className="px-4 py-2 border border-neutral-700 text-neutral-400 text-sm hover:border-red-500 hover:text-red-400 transition-colors disabled:opacity-40">
                  Отключить
                </button>
              )}
            </div>

            {ghConfig?.secret && (
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded">
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">Настройка в GitHub → Settings → Webhooks → Add webhook</p>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-neutral-500 shrink-0">Payload URL</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <code className="text-blue-400 text-xs truncate">{webhookUrl}</code>
                      <button onClick={copyWebhookUrl} className="text-neutral-500 hover:text-white transition-colors shrink-0">
                        <Icon name={ghCopied ? "Check" : "Copy"} size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-neutral-500 shrink-0">Content type</span>
                    <code className="text-white text-xs">application/json</code>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-neutral-500 shrink-0">Secret</span>
                    <code className="text-green-400 text-xs font-mono">{ghConfig.secret}</code>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-neutral-500 shrink-0">Events</span>
                    <span className="text-white text-xs">Just the push event</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border border-red-900/50 p-6">
            <h3 className="font-semibold text-red-400 mb-2">Опасная зона</h3>
            <p className="text-neutral-400 text-sm mb-4">Удаление проекта необратимо.</p>
            <button onClick={async () => { if (!confirm("Удалить проект?")) return; await apiPost("delete_project", { project_id: Number(id), user_id: user!.user_id }); navigate("/dashboard"); }}
              className="border border-red-500 text-red-400 px-4 py-2 text-sm hover:bg-red-500 hover:text-white transition-colors">Удалить проект</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}