import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";
import {
  Tab, Deployment, Domain, AnalyticsRow, Webhook, ProjectData,
  UsageStat, Integration,
} from "@/components/project/projectTypes";
import ProjectTabsContent from "@/components/project/ProjectTabsContent";
import ProjectSettingsTabs from "@/components/project/ProjectSettingsTabs";

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
  const buildingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (data.project) {
      setProject(data.project);
      const deps = data.deployments || [];
      setDeployments(deps);
      setDomains(data.domains || []);
      setEnvVars(data.project.env_vars || {});
      const hasBuilding = deps.some((d: Deployment) => d.status === "building" || d.status === "queued");
      if (hasBuilding) startBuildingPoll();
      else stopBuildingPoll();
    }
    setLoading(false);
  };

  const startBuildingPoll = () => {
    if (buildingPollRef.current) return;
    buildingPollRef.current = setInterval(async () => {
      if (!user || !id) return;
      const data = await apiGet("project", { project_id: id, user_id: String(user.user_id) });
      if (data.project) {
        const deps = data.deployments || [];
        setDeployments(deps);
        setProject(data.project);
        const stillBuilding = deps.some((d: Deployment) => d.status === "building" || d.status === "queued");
        if (!stillBuilding) stopBuildingPoll();
      }
    }, 4000);
  };

  const stopBuildingPoll = () => {
    if (buildingPollRef.current) { clearInterval(buildingPollRef.current); buildingPollRef.current = null; }
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

  useEffect(() => { load(); return () => stopBuildingPoll(); }, [id]);
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

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "deployments", label: "Деплои", icon: "Rocket" },
    { key: "analytics", label: "Аналитика", icon: "BarChart2" },
    { key: "usage", label: "Usage", icon: "Activity" },
    { key: "env", label: "Переменные", icon: "Key" },
    { key: "domains", label: "Домены", icon: "Globe" },
    { key: "webhooks", label: "Webhooks", icon: "Webhook" },
    { key: "integrations", label: "Интеграции", icon: "Plug" },
    { key: "devtools", label: "Dev Tools", icon: "Terminal" },
    { key: "settings", label: "Настройки", icon: "Settings" },
  ];

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-32 text-neutral-500">Загрузка...</div></DashboardLayout>;
  if (!project) return <DashboardLayout><div className="flex flex-col items-center py-32 text-neutral-500"><p className="mb-4">Проект не найден</p><button onClick={() => navigate("/dashboard")} className="text-blue-400 text-sm hover:underline">← Назад</button></div></DashboardLayout>;

  const settingsTabs: Tab[] = ["env", "domains", "webhooks", "integrations", "settings"];

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
          <Link to={`/dashboard/deploy-git?repo=${encodeURIComponent(project?.repo_url || '')}`}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-700 text-neutral-300 text-sm hover:border-blue-400 hover:text-blue-400 transition-colors">
            <Icon name="GitBranch" size={13} /> Git Deploy
          </Link>
          <input value={deployBranch} onChange={(e) => setDeployBranch(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-xs text-white w-24 focus:outline-none focus:border-blue-400" placeholder="main" />
          <button onClick={handleDeploy} disabled={deploying}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-400 text-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
            <Icon name="Rocket" size={13} />{deploying ? "Деплой..." : "Задеплоить"}
          </button>
        </div>
      </div>

      {/* Tabs: deployments, analytics, usage, devtools */}
      {(["deployments", "analytics", "usage", "devtools"] as Tab[]).includes(tab) && (
        <ProjectTabsContent
          tab={tab}
          project={project}
          projectId={id!}
          deployments={deployments}
          analytics={analytics}
          totals={totals}
          analyticsLoading={analyticsLoading}
          usageStats={usageStats}
          usageTotals={usageTotals}
          usageLoading={usageLoading}
          envVars={envVars}
          rollbacking={rollbacking}
          onSetTab={(t) => setTab(t as Tab)}
          onSetSelectedLog={setSelectedLog}
          onRollback={handleRollback}
          fmt={fmt}
          fmtDate={fmtDate}
        />
      )}

      {/* Tabs: env, domains, webhooks, integrations, settings */}
      {settingsTabs.includes(tab) && (
        <ProjectSettingsTabs
          tab={tab}
          project={project}
          projectId={id!}
          userId={user!.user_id}
          envByEnv={envByEnv}
          envTab={envTab}
          newEnvKey={newEnvKey}
          newEnvVal={newEnvVal}
          envSaving={envSaving}
          onSetEnvTab={setEnvTab}
          onSetEnvByEnv={setEnvByEnv}
          onSetNewEnvKey={setNewEnvKey}
          onSetNewEnvVal={setNewEnvVal}
          onSaveEnvEnv={handleSaveEnvEnv}
          domains={domains}
          newDomain={newDomain}
          domainAdding={domainAdding}
          onSetNewDomain={setNewDomain}
          onAddDomain={handleAddDomain}
          webhooks={webhooks}
          newWHUrl={newWHUrl}
          newWHEvents={newWHEvents}
          whAdding={whAdding}
          onSetNewWHUrl={setNewWHUrl}
          onSetNewWHEvents={setNewWHEvents}
          onAddWebhook={handleAddWebhook}
          onToggleWH={handleToggleWH}
          integrations={integrations}
          intLoading={intLoading}
          tgToken={tgToken}
          tgChat={tgChat}
          slackUrl={slackUrl}
          onSetTgToken={setTgToken}
          onSetTgChat={setTgChat}
          onSetSlackUrl={setSlackUrl}
          onSaveIntegration={handleSaveIntegration}
          ghConfig={ghConfig}
          ghBranch={ghBranch}
          ghSaving={ghSaving}
          ghCopied={ghCopied}
          webhookUrl={webhookUrl}
          onSetGhBranch={setGhBranch}
          onSetupGithub={handleSetupGithub}
          onCopyWebhookUrl={copyWebhookUrl}
          onNavigateDashboard={() => navigate("/dashboard")}
          fmt={fmt}
        />
      )}
    </DashboardLayout>
  );
}
