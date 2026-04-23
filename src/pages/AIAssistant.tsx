import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import Icon from "@/components/ui/icon";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

type Message = { id?: number; role: "user" | "assistant"; content: string; created_at?: string };

const PROMPTS = [
  "Создай React-компонент кнопки с анимацией",
  "Исправь ошибки в последнем деплое",
  "Напиши конфиг для Next.js с i18n",
  "Оптимизируй загрузку изображений",
  "Создай хук для работы с API",
  "Напиши Dockerfile для этого проекта",
];

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  const formatContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const lines = part.slice(3, -3).split("\n");
        const lang = lines[0].trim();
        const code = lines.slice(1).join("\n");
        return (
          <div key={i} className="my-3 rounded overflow-hidden border border-neutral-700">
            {lang && <div className="bg-neutral-800 px-4 py-1.5 text-xs text-neutral-400 font-mono">{lang}</div>}
            <pre className="bg-black px-4 py-3 text-xs text-green-400 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">{code}</pre>
          </div>
        );
      }
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part.split(/(\*\*.*?\*\*)/g).map((chunk, j) =>
            chunk.startsWith("**") && chunk.endsWith("**")
              ? <strong key={j} className="font-semibold text-white">{chunk.slice(2, -2)}</strong>
              : chunk
          )}
        </span>
      );
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isUser ? "bg-blue-400 text-black" : "bg-neutral-700 text-white"}`}>
        {isUser ? "Я" : "AI"}
      </div>
      <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${isUser ? "bg-blue-400/10 border border-blue-400/20 text-white" : "bg-neutral-900 border border-neutral-800 text-neutral-200"}`}>
        {formatContent(msg.content)}
        {msg.created_at && (
          <p className="text-xs text-neutral-600 mt-2">{new Date(msg.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</p>
        )}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const { id } = useParams();
  const user = getUser();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadHistory();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHistory = async () => {
    if (!user || !id) return;
    setHistoryLoading(true);

    const [histData, projData] = await Promise.all([
      apiGet("ai_history", { project_id: id, user_id: String(user.user_id) }),
      apiGet("project", { project_id: id, user_id: String(user.user_id) }),
    ]);

    const hist = (histData.messages || []).filter((m: Message) => m.content !== "[очищено]");
    setMessages(hist);
    if (projData.project) setProjectName(projData.project.name);
    setHistoryLoading(false);
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading || !user || !id) return;

    setInput("");
    setError("");
    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const { ok, data } = await apiPost("ai_chat", {
      project_id: Number(id),
      user_id: user.user_id,
      message: msg,
    });

    setLoading(false);
    if (!ok) {
      setError(data.error || "Ошибка AI");
      setMessages((prev) => prev.slice(0, -1));
      return;
    }

    setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleClear = async () => {
    if (!user || !id || !confirm("Очистить историю чата?")) return;
    await apiPost("clear_ai_chat", { project_id: Number(id), user_id: user.user_id });
    setMessages([]);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <Link to={`/dashboard/project/${id}`} className="text-neutral-500 hover:text-white transition-colors">
              <Icon name="ChevronLeft" size={16} />
            </Link>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <span className="text-blue-400">✦</span>
                AI-ассистент
              </h1>
              {projectName && <p className="text-neutral-500 text-xs mt-0.5">{projectName}</p>}
            </div>
          </div>
          <button onClick={handleClear} className="flex items-center gap-1.5 text-neutral-500 hover:text-red-400 transition-colors text-xs">
            <Icon name="Trash2" size={13} />
            Очистить
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 mb-4">
          {historyLoading ? (
            <div className="flex items-center justify-center h-full text-neutral-600 text-sm">Загрузка истории...</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">✦</div>
                <h2 className="text-lg font-semibold text-white mb-1">AI-ассистент разработчика</h2>
                <p className="text-neutral-500 text-sm max-w-md">Генерирую код, исправляю ошибки, анализирую деплои — всё в контексте вашего проекта</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {PROMPTS.map((p) => (
                  <button key={p} onClick={() => sendMessage(p)}
                    className="text-left text-xs text-neutral-400 border border-neutral-800 px-3 py-2.5 hover:border-blue-400/50 hover:text-white transition-colors leading-snug">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => <MessageBubble key={m.id || i} msg={m} />)}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-white shrink-0">AI</div>
                  <div className="bg-neutral-900 border border-neutral-800 px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0,1,2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <span className="text-neutral-500 text-xs">думаю...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 px-4 py-2.5 border border-red-900/50 bg-red-900/10 text-red-400 text-sm flex items-center gap-2 shrink-0">
            <Icon name="AlertCircle" size={14} />
            {error}
          </div>
        )}

        {/* Input */}
        <div className="border border-neutral-800 bg-neutral-900 shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Опишите задачу... (Enter — отправить, Shift+Enter — новая строка)"
            rows={3}
            className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-800">
            <div className="flex gap-2 flex-wrap">
              {["Исправь ошибку", "Добавь типизацию", "Напиши тесты", "Оптимизируй"].map((hint) => (
                <button key={hint} onClick={() => setInput((p) => p ? `${p} ${hint.toLowerCase()}` : hint)}
                  className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
                  {hint}
                </button>
              ))}
            </div>
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-400 text-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
              <Icon name="Send" size={13} />
              {loading ? "Генерация..." : "Отправить"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
