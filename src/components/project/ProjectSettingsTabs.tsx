import Icon from "@/components/ui/icon";
import { apiPost } from "@/lib/api";
import { ProjectData, Domain, Webhook, Integration } from "./projectTypes";

interface Props {
  tab: string;
  project: ProjectData;
  projectId: string;
  userId: number;
  // env
  envByEnv: Record<string, Record<string, string>>;
  envTab: "all" | "production" | "preview" | "development";
  newEnvKey: string;
  newEnvVal: string;
  envSaving: boolean;
  onSetEnvTab: (t: "all" | "production" | "preview" | "development") => void;
  onSetEnvByEnv: (val: Record<string, Record<string, string>>) => void;
  onSetNewEnvKey: (v: string) => void;
  onSetNewEnvVal: (v: string) => void;
  onSaveEnvEnv: () => void;
  // domains
  domains: Domain[];
  newDomain: string;
  domainAdding: boolean;
  onSetNewDomain: (v: string) => void;
  onAddDomain: () => void;
  // webhooks
  webhooks: Webhook[];
  newWHUrl: string;
  newWHEvents: string;
  whAdding: boolean;
  onSetNewWHUrl: (v: string) => void;
  onSetNewWHEvents: (v: string) => void;
  onAddWebhook: () => void;
  onToggleWH: (id: number, active: boolean) => void;
  // integrations
  integrations: Integration[];
  intLoading: boolean;
  tgToken: string;
  tgChat: string;
  slackUrl: string;
  onSetTgToken: (v: string) => void;
  onSetTgChat: (v: string) => void;
  onSetSlackUrl: (v: string) => void;
  onSaveIntegration: (type: string, config: Record<string, string>) => void;
  // settings / github
  ghConfig: { secret: string; auto_deploy: boolean; branch: string } | null;
  ghBranch: string;
  ghSaving: boolean;
  ghCopied: boolean;
  webhookUrl: string;
  onSetGhBranch: (v: string) => void;
  onSetupGithub: (enable: boolean) => void;
  onCopyWebhookUrl: () => void;
  onNavigateDashboard: () => void;
  fmt: (iso: string) => string;
}

export default function ProjectSettingsTabs({
  tab, project, projectId, userId,
  envByEnv, envTab, newEnvKey, newEnvVal, envSaving,
  onSetEnvTab, onSetEnvByEnv, onSetNewEnvKey, onSetNewEnvVal, onSaveEnvEnv,
  domains, newDomain, domainAdding, onSetNewDomain, onAddDomain,
  webhooks, newWHUrl, newWHEvents, whAdding,
  onSetNewWHUrl, onSetNewWHEvents, onAddWebhook, onToggleWH,
  integrations, intLoading, tgToken, tgChat, slackUrl,
  onSetTgToken, onSetTgChat, onSetSlackUrl, onSaveIntegration,
  ghConfig, ghBranch, ghSaving, ghCopied, webhookUrl,
  onSetGhBranch, onSetupGithub, onCopyWebhookUrl,
  onNavigateDashboard, fmt,
}: Props) {
  return (
    <>
      {/* ENV VARS */}
      {tab === "env" && (
        <div className="max-w-2xl">
          <div className="flex gap-1 mb-6 border border-neutral-800 p-1 w-fit">
            {(["all", "production", "preview", "development"] as const).map((e) => (
              <button key={e} onClick={() => onSetEnvTab(e)}
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
                <input value={v} onChange={(e) => onSetEnvByEnv({ ...envByEnv, [envTab]: { ...envByEnv[envTab], [k]: e.target.value } })}
                  className="flex-1 bg-transparent text-sm text-white font-mono focus:outline-none" />
                <button onClick={() => { const n = { ...envByEnv[envTab] }; delete n[k]; onSetEnvByEnv({ ...envByEnv, [envTab]: n }); }} className="text-neutral-600 hover:text-red-400 transition-colors"><Icon name="Trash2" size={13} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <input value={newEnvKey} onChange={(e) => onSetNewEnvKey(e.target.value)} placeholder="VARIABLE_NAME"
              className="flex-1 bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
            <input value={newEnvVal} onChange={(e) => onSetNewEnvVal(e.target.value)} placeholder="value"
              className="flex-1 bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
            <button onClick={() => { if (!newEnvKey.trim()) return; onSetEnvByEnv({ ...envByEnv, [envTab]: { ...envByEnv[envTab], [newEnvKey.trim()]: newEnvVal } }); onSetNewEnvKey(""); onSetNewEnvVal(""); }}
              className="px-4 py-2 border border-neutral-700 text-neutral-300 hover:border-blue-400 transition-colors"><Icon name="Plus" size={14} /></button>
          </div>
          <button onClick={onSaveEnvEnv} disabled={envSaving} className="bg-blue-400 text-black px-6 py-2.5 text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
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
            <input value={newDomain} onChange={(e) => onSetNewDomain(e.target.value)} placeholder="mydomain.com"
              className="flex-1 bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
            <button onClick={onAddDomain} disabled={domainAdding} className="px-5 py-2.5 bg-blue-400 text-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
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
                <button onClick={() => onToggleWH(w.id, !w.active)}
                  className={`text-xs px-3 py-1 border transition-colors ${w.active ? "border-green-500/40 text-green-400 hover:bg-green-500/10" : "border-neutral-700 text-neutral-500 hover:border-neutral-500"}`}>
                  {w.active ? "Активен" : "Отключён"}
                </button>
              </div>
            ))}
          </div>
          <div className="border border-neutral-800 p-5">
            <h3 className="text-sm font-semibold mb-4">Добавить webhook</h3>
            <div className="flex flex-col gap-3">
              <input value={newWHUrl} onChange={(e) => onSetNewWHUrl(e.target.value)} placeholder="https://your-server.com/webhook"
                className="bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500 uppercase tracking-wide">События</label>
                <div className="flex flex-wrap gap-2">
                  {["deploy.ready", "deploy.error", "deploy.queued"].map((ev) => (
                    <label key={ev} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={newWHEvents.includes(ev)}
                        onChange={(e) => onSetNewWHEvents(e.target.checked ? [...new Set([...newWHEvents.split(","), ev])].join(",") : newWHEvents.split(",").filter((x) => x !== ev).join(","))}
                        className="accent-blue-400" />
                      <span className="text-neutral-300 font-mono text-xs">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={onAddWebhook} disabled={whAdding} className="bg-blue-400 text-black px-5 py-2.5 text-sm font-medium hover:bg-white transition-colors disabled:opacity-50 w-fit">
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
                  <input value={tgToken} onChange={(e) => onSetTgToken(e.target.value)} placeholder="Bot Token (от @BotFather)"
                    className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
                  <input value={tgChat} onChange={(e) => onSetTgChat(e.target.value)} placeholder="Chat ID (от @userinfobot)"
                    className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
                </div>
                <button onClick={() => onSaveIntegration("telegram", { token: tgToken, chat_id: tgChat })}
                  disabled={!tgToken || !tgChat}
                  className="px-4 py-2 bg-blue-400 text-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-40">
                  Сохранить
                </button>
              </div>

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
                <input value={slackUrl} onChange={(e) => onSetSlackUrl(e.target.value)} placeholder="Slack Webhook URL"
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors mb-4" />
                <button onClick={() => onSaveIntegration("slack", { webhook_url: slackUrl })}
                  disabled={!slackUrl}
                  className="px-4 py-2 bg-blue-400 text-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-40">
                  Сохранить
                </button>
              </div>

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
              <input value={ghBranch} onChange={(e) => onSetGhBranch(e.target.value)} placeholder="main"
                className="w-36 bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors" />
              <span className="text-neutral-500 text-sm self-center">— ветка для автодеплоя</span>
            </div>
            <div className="flex gap-2 mb-5">
              <button onClick={() => onSetupGithub(true)} disabled={ghSaving}
                className="px-4 py-2 bg-blue-400 text-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-40">
                {ghSaving ? "..." : ghConfig?.auto_deploy ? "Обновить" : "Включить"}
              </button>
              {ghConfig?.auto_deploy && (
                <button onClick={() => onSetupGithub(false)} disabled={ghSaving}
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
                      <button onClick={onCopyWebhookUrl} className="text-neutral-500 hover:text-white transition-colors shrink-0">
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
            <button onClick={async () => {
              if (!confirm("Удалить проект?")) return;
              await apiPost("delete_project", { project_id: Number(projectId), user_id: userId });
              onNavigateDashboard();
            }} className="border border-red-500 text-red-400 px-4 py-2 text-sm hover:bg-red-500 hover:text-white transition-colors">
              Удалить проект
            </button>
          </div>
        </div>
      )}
    </>
  );
}
