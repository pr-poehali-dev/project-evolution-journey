import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import Icon from "@/components/ui/icon";

const FRAMEWORK_ICONS: Record<string, string> = {
  nextjs: "▲", react: "⚛", vue: "💚", nuxt: "💚", svelte: "🔥", astro: "🚀", remix: "💿", other: "📦",
};

const STATUS_COLORS: Record<string, string> = {
  ready: "text-green-400", building: "text-yellow-400", error: "text-red-400",
  queued: "text-neutral-400", cancelled: "text-neutral-500",
};

type Project = {
  id: number; name: string; repo_url: string; framework: string;
  domain: string; last_status: string; last_deploy: string; updated_at: string;
};

export default function Dashboard() {
  const user = getUser();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRepo, setNewRepo] = useState("");
  const [newFramework, setNewFramework] = useState("other");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createStep, setCreateStep] = useState<"template" | "details">("template");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const data = await apiGet("projects", { user_id: String(user.user_id) });
    setProjects(data.projects || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true); setCreateError("");
    const { ok, data } = await apiPost("create_project", {
      user_id: user!.user_id, name: newName.trim(), repo_url: newRepo.trim(), framework: newFramework,
    });
    setCreating(false);
    if (!ok) { setCreateError(data.error || "Ошибка"); return; }
    setShowNew(false); setNewName(""); setNewRepo(""); setNewFramework("other");
    navigate(`/dashboard/project/${data.project_id}`);
  };

  const timeAgo = (iso: string) => {
    if (!iso) return "—";
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}с назад`;
    if (diff < 3600) return `${Math.floor(diff / 60)}м назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}ч назад`;
    return `${Math.floor(diff / 86400)}д назад`;
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Проекты</h1>
          <p className="text-neutral-400 text-sm mt-1">Все ваши приложения в одном месте</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/dashboard/deploy-git"
            className="flex items-center gap-2 border border-neutral-700 text-neutral-300 px-4 py-2 text-sm font-medium hover:border-blue-400 hover:text-blue-400 transition-colors">
            <Icon name="GitBranch" size={14} />
            Deploy from Git
          </a>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 text-sm uppercase tracking-wide font-medium hover:bg-blue-400 transition-colors"
          >
            <Icon name="Plus" size={14} />
            Новый проект
          </button>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-6"
          onClick={() => { setShowNew(false); setCreateStep("template"); }}>
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>

            {createStep === "template" ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold">Новый проект</h2>
                  <button onClick={() => { setShowNew(false); setCreateStep("template"); }} className="text-neutral-500 hover:text-white transition-colors">
                    <Icon name="X" size={16} />
                  </button>
                </div>
                <p className="text-neutral-400 text-sm mb-5">Выбери шаблон или начни с нуля</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                  {[
                    { icon: "⚛", label: "React App", framework: "react", desc: "SPA с Vite + TypeScript" },
                    { icon: "▲", label: "Next.js", framework: "nextjs", desc: "SSR/SSG приложение" },
                    { icon: "💚", label: "Vue.js", framework: "vue", desc: "Progressive framework" },
                    { icon: "🔥", label: "Svelte", framework: "svelte", desc: "Компилируемый UI" },
                    { icon: "🚀", label: "Astro", framework: "astro", desc: "Content-first сайты" },
                    { icon: "📦", label: "Пустой проект", framework: "other", desc: "Начать с нуля" },
                  ].map((t) => (
                    <button key={t.framework}
                      onClick={() => { setNewFramework(t.framework); setCreateStep("details"); }}
                      className={`flex flex-col items-start gap-2 p-4 border rounded-lg text-left transition-colors hover:border-blue-400 hover:bg-blue-400/5 ${newFramework === t.framework ? "border-blue-400 bg-blue-400/5" : "border-neutral-800"}`}>
                      <span className="text-2xl">{t.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{t.label}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setCreateStep("details")}
                  className="w-full py-2.5 text-sm border border-neutral-700 text-neutral-300 hover:border-blue-400 hover:text-blue-400 transition-colors">
                  Продолжить без шаблона →
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => setCreateStep("template")} className="text-neutral-500 hover:text-white transition-colors">
                    <Icon name="ChevronLeft" size={16} />
                  </button>
                  <h2 className="text-lg font-bold">Настройка проекта</h2>
                  <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">{newFramework}</span>
                </div>
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide text-neutral-500">Название</label>
                    <input
                      required autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                      placeholder="my-awesome-app"
                      className="bg-neutral-800 border border-neutral-700 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide text-neutral-500">Git репозиторий (опционально)</label>
                    <input
                      value={newRepo} onChange={(e) => setNewRepo(e.target.value)}
                      placeholder="https://github.com/user/repo"
                      className="bg-neutral-800 border border-neutral-700 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide text-neutral-500">Фреймворк</label>
                    <select
                      value={newFramework} onChange={(e) => setNewFramework(e.target.value)}
                      className="bg-neutral-800 border border-neutral-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors"
                    >
                      {["nextjs","react","vue","nuxt","svelte","astro","remix","other"].map((f) => (
                        <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  {createError && <p className="text-red-400 text-sm">{createError}</p>}
                  <div className="flex gap-3 mt-1">
                    <button type="button" onClick={() => { setShowNew(false); setCreateStep("template"); }}
                      className="flex-1 py-2.5 text-sm border border-neutral-700 text-neutral-300 hover:border-neutral-500 transition-colors">Отмена</button>
                    <button type="submit" disabled={creating} className="flex-1 py-2.5 text-sm bg-blue-400 text-black font-medium hover:bg-white transition-colors disabled:opacity-50">
                      {creating ? "Создание..." : "Создать проект"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => (
            <div key={i} className="border border-neutral-800 p-5 animate-pulse">
              <div className="h-4 bg-neutral-800 rounded w-1/2 mb-3" />
              <div className="h-3 bg-neutral-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-neutral-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="border border-dashed border-neutral-700 flex flex-col items-center justify-center py-24 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-lg font-semibold mb-2">Нет проектов</h3>
          <p className="text-neutral-400 text-sm mb-6">Создайте первый проект и разверните его за секунды</p>
          <button onClick={() => setShowNew(true)} className="bg-blue-400 text-black px-6 py-2.5 text-sm uppercase tracking-wide font-medium hover:bg-white transition-colors">
            Создать проект
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id} to={`/dashboard/project/${p.id}`}
              className="border border-neutral-800 p-5 hover:border-neutral-600 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{FRAMEWORK_ICONS[p.framework] || "📦"}</span>
                  <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">{p.name}</span>
                </div>
                <span className={`text-xs uppercase tracking-wide ${STATUS_COLORS[p.last_status] || "text-neutral-400"}`}>
                  {p.last_status || "—"}
                </span>
              </div>
              <p className="text-neutral-500 text-xs mb-3 truncate">{p.domain || "—"}</p>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 text-xs">{timeAgo(p.last_deploy || p.updated_at)}</span>
                <Icon name="ChevronRight" size={14} className="text-neutral-600 group-hover:text-neutral-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}