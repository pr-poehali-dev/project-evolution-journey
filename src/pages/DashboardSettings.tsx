import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getUser, setUser, clearUser } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

export default function DashboardSettings() {
  const user = getUser();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const token = user ? btoa(`${user.user_id}:${user.email}`) : "";

  const copy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-8">Настройки аккаунта</h1>

      <div className="max-w-2xl flex flex-col gap-6">
        <div className="border border-neutral-800 p-6">
          <h3 className="font-semibold mb-4">Профиль</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-neutral-500">Email</span><p className="text-white mt-1">{user?.email}</p></div>
            <div>
              <span className="text-neutral-500">Тариф</span>
              <p className="mt-1">
                <span className={`text-xs px-2 py-0.5 uppercase tracking-wide ${user?.plan === "pro" ? "bg-blue-400/20 text-blue-400" : "bg-neutral-800 text-neutral-400"}`}>
                  {user?.plan === "pro" ? "Pro — 500 ₽/мес" : "Старт — Бесплатно"}
                </span>
              </p>
            </div>
          </div>
          {user?.plan !== "pro" && (
            <div className="mt-4 pt-4 border-t border-neutral-800">
              <p className="text-neutral-400 text-sm mb-3">Перейдите на Pro для неограниченных деплоев и кастомных доменов.</p>
              <button className="bg-blue-400 text-black px-5 py-2 text-sm font-medium hover:bg-white transition-colors">
                Перейти на Pro — 500 ₽/мес
              </button>
            </div>
          )}
        </div>

        <div className="border border-neutral-800 p-6">
          <h3 className="font-semibold mb-2">API Token</h3>
          <p className="text-neutral-400 text-sm mb-4">Используйте токен для интеграции с CI/CD.</p>
          <div className="flex gap-2">
            <input readOnly value={token} className="flex-1 bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm font-mono text-neutral-300 focus:outline-none" />
            <button onClick={copy} className="px-4 py-2.5 border border-neutral-700 text-sm text-neutral-300 hover:border-blue-400 transition-colors">
              {copied ? "Скопировано!" : "Копировать"}
            </button>
          </div>
        </div>

        <div className="border border-neutral-800 p-6">
          <h3 className="font-semibold mb-4">Сессия</h3>
          <button
            onClick={() => { clearUser(); navigate("/"); }}
            className="border border-neutral-700 text-neutral-300 px-5 py-2 text-sm hover:border-neutral-500 transition-colors"
          >
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
