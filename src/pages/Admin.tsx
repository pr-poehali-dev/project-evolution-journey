import { useState, useEffect } from "react";
import func2url from "../../backend/func2url.json";

const API = func2url.register;

type ContentMap = Record<string, { value: string; label: string }>;
type User = { id: number; email: string; plan: string; created_at: string };
type Stats = { total: number; pro: number; free: number; revenue: number };

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<"content" | "billing">("content");

  const [content, setContent] = useState<ContentMap>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [contentLoading, setContentLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "admin_login", password }),
    });
    const data = await res.json();
    setAuthLoading(false);
    if (res.ok) {
      setAuthed(true);
      loadContent();
    } else {
      setAuthError(data.error || "Ошибка");
    }
  };

  const loadContent = async () => {
    setContentLoading(true);
    const res = await fetch(`${API}?action=content`);
    const data = await res.json();
    setContentLoading(false);
    setContent(data.content || {});
    const initial: Record<string, string> = {};
    Object.entries(data.content || {}).forEach(([k, v]) => {
      initial[k] = (v as { value: string }).value;
    });
    setEdits(initial);
  };

  const loadBilling = async () => {
    setBillingLoading(true);
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "billing", password }),
    });
    const data = await res.json();
    setBillingLoading(false);
    setUsers(data.users || []);
    setStats(data.stats || null);
  };

  useEffect(() => {
    if (authed && tab === "billing" && users.length === 0) {
      loadBilling();
    }
  }, [tab, authed]);

  const handleSave = async () => {
    setSaveMsg("");
    const updates: Record<string, string> = {};
    Object.keys(edits).forEach((k) => {
      if (edits[k] !== content[k]?.value) updates[k] = edits[k];
    });
    if (!Object.keys(updates).length) {
      setSaveMsg("Нет изменений");
      return;
    }
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_content", password, updates }),
    });
    if (res.ok) {
      setSaveMsg("Сохранено!");
      loadContent();
    } else {
      setSaveMsg("Ошибка сохранения");
    }
    setTimeout(() => setSaveMsg(""), 3000);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-white text-2xl font-bold tracking-tight mb-2">
            CLO<span className="text-blue-400">DEV</span>
          </div>
          <p className="text-neutral-400 text-sm mb-8 uppercase tracking-widest">Панель администратора</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-neutral-500">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="bg-neutral-900 border border-neutral-700 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            {authError && (
              <p className="text-red-400 text-sm">{authError}</p>
            )}
            <button
              type="submit"
              disabled={authLoading}
              className="bg-blue-400 text-black py-3 uppercase text-sm tracking-wide font-medium hover:bg-white transition-colors disabled:opacity-50"
            >
              {authLoading ? "Вход..." : "Войти"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-6 py-4 flex justify-between items-center">
        <div className="text-lg font-bold tracking-tight">
          CLO<span className="text-blue-400">DEV</span>
          <span className="text-neutral-500 text-sm font-normal ml-3 uppercase tracking-widest">Admin</span>
        </div>
        <button
          onClick={() => { setAuthed(false); setPassword(""); }}
          className="text-neutral-400 hover:text-white text-sm uppercase tracking-wide transition-colors"
        >
          Выйти
        </button>
      </header>

      <div className="flex border-b border-neutral-800 px-6">
        {(["content", "billing"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-4 px-6 text-sm uppercase tracking-wide border-b-2 transition-colors ${
              tab === t ? "border-blue-400 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t === "content" ? "Тексты сайта" : "Биллинг"}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {tab === "content" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Редактор текстов</h2>
              <div className="flex items-center gap-4">
                {saveMsg && (
                  <span className={`text-sm ${saveMsg === "Сохранено!" ? "text-green-400" : "text-neutral-400"}`}>
                    {saveMsg}
                  </span>
                )}
                <button
                  onClick={handleSave}
                  className="bg-blue-400 text-black px-6 py-2 text-sm uppercase tracking-wide font-medium hover:bg-white transition-colors"
                >
                  Сохранить
                </button>
              </div>
            </div>

            {contentLoading ? (
              <p className="text-neutral-500">Загрузка...</p>
            ) : (
              <div className="flex flex-col gap-6">
                {Object.entries(content).map(([key, { label }]) => (
                  <div key={key} className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wide text-neutral-400">{label}</label>
                    <textarea
                      value={edits[key] || ""}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                      rows={edits[key]?.length > 80 ? 3 : 1}
                      className="bg-neutral-900 border border-neutral-700 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors resize-none w-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "billing" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Биллинг</h2>
              <button
                onClick={loadBilling}
                className="border border-neutral-700 text-neutral-300 px-4 py-2 text-sm uppercase tracking-wide hover:border-blue-400 hover:text-white transition-colors"
              >
                Обновить
              </button>
            </div>

            {billingLoading ? (
              <p className="text-neutral-500">Загрузка...</p>
            ) : (
              <>
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                      { label: "Всего пользователей", value: stats.total },
                      { label: "Pro", value: stats.pro },
                      { label: "Free", value: stats.free },
                      { label: "Выручка", value: `${stats.revenue.toLocaleString()} ₽` },
                    ].map((s) => (
                      <div key={s.label} className="bg-neutral-900 border border-neutral-800 p-5">
                        <div className="text-2xl font-bold text-blue-400 mb-1">{s.value}</div>
                        <div className="text-xs uppercase tracking-wide text-neutral-500">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border border-neutral-800">
                  <div className="grid grid-cols-4 px-4 py-2 text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-800">
                    <span>ID</span><span>Email</span><span>Тариф</span><span>Дата</span>
                  </div>
                  {users.length === 0 ? (
                    <p className="px-4 py-6 text-neutral-600 text-sm">Нет пользователей</p>
                  ) : (
                    users.map((u) => (
                      <div key={u.id} className="grid grid-cols-4 px-4 py-3 text-sm border-b border-neutral-800 last:border-0 hover:bg-neutral-900 transition-colors">
                        <span className="text-neutral-500">{u.id}</span>
                        <span className="text-white truncate">{u.email}</span>
                        <span>
                          <span className={`px-2 py-0.5 text-xs uppercase tracking-wide ${u.plan === "pro" ? "bg-blue-400/20 text-blue-400" : "bg-neutral-800 text-neutral-400"}`}>
                            {u.plan === "pro" ? "Pro" : "Free"}
                          </span>
                        </span>
                        <span className="text-neutral-500">{new Date(u.created_at).toLocaleDateString("ru-RU")}</span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
