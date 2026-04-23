import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import Icon from "@/components/ui/icon";

type Member = { id: number; email: string; role: string; status: string; created_at: string };

const ROLE_COLORS: Record<string, string> = {
  admin: "text-blue-400 bg-blue-400/10",
  member: "text-green-400 bg-green-400/10",
  viewer: "text-neutral-400 bg-neutral-800",
};

export default function Team() {
  const user = getUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "viewer" | "admin">("member");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const data = await apiGet("team", { user_id: String(user.user_id) });
    setMembers((data.members || []).filter((m: Member) => m.status !== "removed"));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !user) return;
    setInviting(true); setError(""); setSuccess("");
    const { ok, data } = await apiPost("invite_member", { user_id: user.user_id, email: email.trim(), role });
    setInviting(false);
    if (!ok) { setError(data.error || "Ошибка"); return; }
    setSuccess(`Приглашение отправлено на ${email}`);
    setEmail("");
    load();
  };

  const handleRemove = async (memberId: number) => {
    if (!user || !confirm("Удалить участника?")) return;
    await apiPost("remove_member", { user_id: user.user_id, member_id: memberId });
    load();
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Команда</h1>
          <p className="text-neutral-400 text-sm mt-1">Управляйте доступом участников</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="border border-neutral-800">
            <div className="px-5 py-3 border-b border-neutral-800 flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-500">
              <Icon name="Users" size={12} />
              Участники ({members.length})
            </div>
            {loading ? (
              <div className="px-5 py-8 text-neutral-500 text-sm">Загрузка...</div>
            ) : members.length === 0 ? (
              <div className="px-5 py-12 text-center text-neutral-600 text-sm">Пригласите первого участника</div>
            ) : (
              members.map((m) => (
                <div key={m.id} className="px-5 py-4 border-b border-neutral-800 last:border-0 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                    {m.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{m.email}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Приглашён {new Date(m.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 uppercase tracking-wide rounded ${ROLE_COLORS[m.role] || "text-neutral-400 bg-neutral-800"}`}>
                    {m.role}
                  </span>
                  <span className={`text-xs px-2 py-0.5 ${m.status === "pending" ? "text-yellow-400" : "text-green-400"}`}>
                    {m.status === "pending" ? "Ожидает" : "Активен"}
                  </span>
                  <button onClick={() => handleRemove(m.id)} className="text-neutral-600 hover:text-red-400 transition-colors ml-1">
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="border border-neutral-800 p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Icon name="UserPlus" size={14} />Пригласить</h3>
            <form onSubmit={handleInvite} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-neutral-500">Email</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="bg-neutral-900 border border-neutral-700 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-neutral-500">Роль</label>
                <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}
                  className="bg-neutral-900 border border-neutral-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors">
                  <option value="viewer">Viewer — только просмотр</option>
                  <option value="member">Member — деплои</option>
                  <option value="admin">Admin — полный доступ</option>
                </select>
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              {success && <p className="text-green-400 text-xs">{success}</p>}
              <button type="submit" disabled={inviting}
                className="bg-blue-400 text-black py-2.5 text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
                {inviting ? "Отправка..." : "Пригласить"}
              </button>
            </form>
          </div>

          <div className="border border-neutral-800 p-5 mt-4">
            <h3 className="font-semibold mb-3 text-sm">Роли</h3>
            {[
              { role: "Viewer", desc: "Просмотр проектов и деплоев" },
              { role: "Member", desc: "Создание деплоев, изменение env" },
              { role: "Admin", desc: "Полный доступ, управление командой" },
            ].map((r) => (
              <div key={r.role} className="flex flex-col mb-3 last:mb-0">
                <span className="text-sm font-medium text-white">{r.role}</span>
                <span className="text-xs text-neutral-500">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
