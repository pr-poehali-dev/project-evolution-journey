import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getUser, clearUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import Icon from "@/components/ui/icon";

type Notification = { id: number; project_id: number; type: string; message: string; read: boolean; created_at: string };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadNotifs();
  }, []);

  const loadNotifs = async () => {
    if (!user) return;
    const data = await apiGet("notifications", { user_id: String(user.user_id) });
    setNotifs(data.notifications || []);
    setUnread(data.unread || 0);
  };

  const handleMarkRead = async () => {
    if (!user) return;
    await apiPost("mark_read", { user_id: user.user_id });
    setUnread(0);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (!user) return null;

  const nav = [
    { label: "Проекты", href: "/dashboard", icon: "LayoutGrid" },
    { label: "UI Kit", href: "/dashboard/ui-kit", icon: "Palette" },
    { label: "Editor", href: "/dashboard/editor", icon: "Code" },
    { label: "CLI", href: "/dashboard/cli", icon: "Terminal" },
    { label: "Команда", href: "/dashboard/team", icon: "Users" },
    { label: "Настройки", href: "/dashboard/settings", icon: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <header className="border-b border-neutral-800 px-6 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-base font-bold tracking-tight">
            CLO<span className="text-blue-400">DEV</span>
          </Link>
          <nav className="flex gap-1">
            {nav.map((n) => (
              <Link key={n.href} to={n.href}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${location.pathname === n.href ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"}`}>
                <Icon name={n.icon} size={14} />{n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-400 hidden sm:block">{user.email}</span>
          <span className={`text-xs px-2 py-0.5 uppercase tracking-wide hidden sm:block ${user.plan === "pro" ? "bg-blue-400/20 text-blue-400" : "bg-neutral-800 text-neutral-400"}`}>{user.plan}</span>

          <div className="relative">
            <button
              onClick={() => { setShowNotifs((p) => !p); if (!showNotifs && unread > 0) handleMarkRead(); }}
              className="relative p-2 text-neutral-400 hover:text-white transition-colors"
            >
              <Icon name="Bell" size={16} />
              {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full" />}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-10 w-80 bg-neutral-900 border border-neutral-700 shadow-xl z-50">
                <div className="px-4 py-3 border-b border-neutral-800 flex justify-between items-center">
                  <span className="text-sm font-semibold">Уведомления</span>
                  <button onClick={() => setShowNotifs(false)} className="text-neutral-500 hover:text-white"><Icon name="X" size={14} /></button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <p className="px-4 py-8 text-neutral-600 text-sm text-center">Нет уведомлений</p>
                  ) : notifs.map((n) => (
                    <div key={n.id} className={`px-4 py-3 border-b border-neutral-800 last:border-0 ${!n.read ? "bg-blue-400/5" : ""}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-xs mt-0.5">{n.type === "deploy.ready" ? "✅" : "❌"}</span>
                        <div className="flex-1">
                          <p className="text-sm text-white leading-snug">{n.message}</p>
                          <p className="text-xs text-neutral-500 mt-1">{new Date(n.created_at).toLocaleString("ru-RU")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => { clearUser(); navigate("/"); }} className="text-sm text-neutral-400 hover:text-white transition-colors p-2">
            <Icon name="LogOut" size={15} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}