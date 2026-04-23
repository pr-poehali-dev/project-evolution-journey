import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiPost } from "@/lib/api";
import { setUser } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const action = tab === "login" ? "login" : "register";
    const { ok, data } = await apiPost(action, { email, password, plan });
    setLoading(false);
    if (!ok) { setError(data.error || "Ошибка"); return; }
    setUser({ user_id: data.user_id, email, plan: data.plan });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6">
      <Link to="/" className="text-xl font-bold tracking-tight text-white mb-10">
        CLO<span className="text-blue-400">DEV</span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="flex border border-neutral-800 mb-6">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-2.5 text-sm uppercase tracking-wide transition-colors ${
                tab === t ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {t === "login" ? "Войти" : "Регистрация"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-neutral-500">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-neutral-900 border border-neutral-700 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-neutral-500">Пароль</label>
            <input
              type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 8 символов"
              className="bg-neutral-900 border border-neutral-700 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {tab === "register" && (
            <div className="flex gap-2">
              {(["free", "pro"] as const).map((p) => (
                <button
                  key={p} type="button" onClick={() => setPlan(p)}
                  className={`flex-1 py-2 text-xs uppercase tracking-wide border transition-colors ${
                    plan === p ? (p === "pro" ? "bg-blue-400 text-black border-blue-400" : "bg-white text-black border-white") : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                  }`}
                >
                  {p === "free" ? "Старт — бесплатно" : "Pro — 500 ₽/мес"}
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="bg-blue-400 text-black py-3 uppercase text-sm tracking-wide font-medium hover:bg-white transition-colors disabled:opacity-50 mt-1"
          >
            {loading ? "Загрузка..." : tab === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
      </div>
    </div>
  );
}
