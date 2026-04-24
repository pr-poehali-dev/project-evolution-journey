import Icon from "@/components/ui/icon";
import { Deployment, AnalyticsRow, UsageStat, ProjectData, STATUS_COLORS } from "./projectTypes";
import DevToolsHttpTester from "./DevToolsHttpTester";

interface Props {
  tab: string;
  project: ProjectData;
  projectId: string;
  deployments: Deployment[];
  analytics: AnalyticsRow[];
  totals: Record<string, number>;
  analyticsLoading: boolean;
  usageStats: UsageStat[];
  usageTotals: Record<string, number>;
  usageLoading: boolean;
  envVars: Record<string, string>;
  rollbacking: number | null;
  onSetTab: (tab: string) => void;
  onSetSelectedLog: (d: Deployment) => void;
  onRollback: (id: number) => void;
  fmt: (iso: string) => string;
  fmtDate: (s: string) => string;
}

export default function ProjectTabsContent({
  tab, project, projectId, deployments, analytics, totals, analyticsLoading,
  usageStats, usageTotals, usageLoading, envVars, rollbacking,
  onSetTab, onSetSelectedLog, onRollback, fmt, fmtDate,
}: Props) {
  const maxViews = Math.max(...analytics.map((a) => a.views), 1);

  return (
    <>
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
              <button onClick={() => onSetSelectedLog(d)} className="text-neutral-400 hover:text-white transition-colors"><Icon name="ScrollText" size={14} /></button>
              {d.status === "ready" && (
                <button onClick={() => onRollback(d.id)} disabled={rollbacking === d.id}
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

      {/* DEV TOOLS */}
      {tab === "devtools" && (
        <div className="flex flex-col gap-6">
          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/60 border-b border-neutral-800">
              <div className="flex items-center gap-2"><Icon name="Key" size={14} className="text-blue-400" /><span className="text-sm font-medium">Переменные окружения</span></div>
              <button onClick={() => onSetTab("env")} className="text-xs text-neutral-400 hover:text-blue-400 transition-colors">Редактировать →</button>
            </div>
            <div className="bg-black px-4 py-3">
              {Object.keys(envVars).length === 0 ? (
                <p className="text-xs text-neutral-600 py-2">Нет переменных</p>
              ) : Object.entries(envVars).map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 py-1.5 border-b border-neutral-900 last:border-0">
                  <span className="text-xs font-mono text-blue-400 w-48 shrink-0">{k}</span>
                  <span className="text-xs font-mono text-neutral-500">{"*".repeat(Math.min(v.length, 16))}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/60 border-b border-neutral-800">
              <div className="flex items-center gap-2"><Icon name="ScrollText" size={14} className="text-green-400" /><span className="text-sm font-medium">Лог последнего деплоя</span></div>
              {deployments[0] && <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[deployments[0].status] || "text-neutral-400 bg-neutral-800"}`}>{deployments[0].status}</span>}
            </div>
            <pre className="bg-black text-xs text-green-400 font-mono p-4 max-h-64 overflow-auto leading-relaxed whitespace-pre-wrap">
              {deployments[0]?.build_log || "Нет деплоев"}
            </pre>
          </div>

          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-neutral-900/60 border-b border-neutral-800 flex items-center gap-2">
              <Icon name="Zap" size={14} className="text-yellow-400" />
              <span className="text-sm font-medium">HTTP тестер</span>
            </div>
            <DevToolsHttpTester projectUrl={project?.domain ? `https://${project.domain}` : ""} />
          </div>

          <div className="border border-neutral-800 rounded-lg p-5">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2"><Icon name="Link" size={14} className="text-neutral-400" />Быстрые ссылки</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "UI Kit", icon: "Palette", href: "/dashboard/ui-kit" },
                { label: "Code Editor", icon: "Code", href: "/dashboard/editor" },
                { label: "CLI команды", icon: "Terminal", href: "/dashboard/cli" },
                { label: "AI Ассистент", icon: "Sparkles", href: `/dashboard/project/${projectId}/ai` },
              ].map((link) => (
                <a key={link.label} href={link.href}
                  className="flex items-center gap-2 px-3 py-2.5 border border-neutral-800 text-sm text-neutral-400 hover:border-blue-400 hover:text-blue-400 transition-colors rounded-lg">
                  <Icon name={link.icon} size={14} />{link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="border border-neutral-800 rounded-lg p-5">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2"><Icon name="Info" size={14} className="text-neutral-400" />Технические детали</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Project ID", value: String(project?.id || "—") },
                { label: "Фреймворк", value: project?.framework || "—" },
                { label: "Деплоев всего", value: String(deployments.length) },
                { label: "Последний commit", value: deployments[0]?.commit_sha?.slice(0, 7) || "—" },
                { label: "Ветка", value: deployments[0]?.branch || "—" },
                { label: "Домен", value: project?.domain || "—" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border border-neutral-800 px-3 py-2 rounded">
                  <span className="text-neutral-500 text-xs">{item.label}</span>
                  <span className="text-white text-xs font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
