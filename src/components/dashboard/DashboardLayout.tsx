import { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getUser, clearUser } from "@/lib/auth";
import Icon from "@/components/ui/icon";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  useEffect(() => {
    if (!user) navigate("/login");
  }, []);

  if (!user) return null;

  const nav = [
    { label: "Проекты", href: "/dashboard", icon: "LayoutGrid" },
    { label: "Настройки", href: "/dashboard/settings", icon: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <header className="border-b border-neutral-800 px-6 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="text-base font-bold tracking-tight">
            CLO<span className="text-blue-400">DEV</span>
          </Link>
          <nav className="flex gap-1">
            {nav.map((n) => (
              <Link
                key={n.href}
                to={n.href}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
                  location.pathname === n.href
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Icon name={n.icon} size={14} />
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">{user.email}</span>
          <span className={`text-xs px-2 py-0.5 uppercase tracking-wide ${user.plan === "pro" ? "bg-blue-400/20 text-blue-400" : "bg-neutral-800 text-neutral-400"}`}>
            {user.plan}
          </span>
          <button
            onClick={() => { clearUser(); navigate("/"); }}
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Выйти
          </button>
        </div>
      </header>
      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
