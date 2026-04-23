import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Icon from "@/components/ui/icon";

type Category = "buttons" | "forms" | "cards" | "alerts" | "badges" | "navigation" | "layout";

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: "buttons", label: "Кнопки", icon: "MousePointer" },
  { key: "forms", label: "Формы", icon: "FormInput" },
  { key: "cards", label: "Карточки", icon: "LayoutGrid" },
  { key: "alerts", label: "Алерты", icon: "AlertCircle" },
  { key: "badges", label: "Бейджи", icon: "Tag" },
  { key: "navigation", label: "Навигация", icon: "Menu" },
  { key: "layout", label: "Лейаут", icon: "Columns" },
];

type Component = { name: string; preview: React.ReactNode; code: string };

const COMPONENTS: Record<Category, Component[]> = {
  buttons: [
    {
      name: "Primary Button",
      preview: <button className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors">Нажми меня</button>,
      code: `<button className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors">
  Нажми меня
</button>`,
    },
    {
      name: "Secondary Button",
      preview: <button className="px-4 py-2 border border-neutral-600 text-neutral-300 text-sm font-medium rounded hover:border-white hover:text-white transition-colors">Отмена</button>,
      code: `<button className="px-4 py-2 border border-neutral-600 text-neutral-300 text-sm font-medium rounded hover:border-white hover:text-white transition-colors">
  Отмена
</button>`,
    },
    {
      name: "Danger Button",
      preview: <button className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium rounded hover:bg-red-500 hover:text-white transition-colors">Удалить</button>,
      code: `<button className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium rounded hover:bg-red-500 hover:text-white transition-colors">
  Удалить
</button>`,
    },
    {
      name: "Icon Button",
      preview: <button className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white text-sm rounded hover:bg-neutral-700 transition-colors"><span>🚀</span>Задеплоить</button>,
      code: `<button className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white text-sm rounded hover:bg-neutral-700 transition-colors">
  <span>🚀</span>
  Задеплоить
</button>`,
    },
    {
      name: "Loading Button",
      preview: <button disabled className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded opacity-60 cursor-not-allowed"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Загрузка...</button>,
      code: `<button disabled className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded opacity-60 cursor-not-allowed">
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
  </svg>
  Загрузка...
</button>`,
    },
    {
      name: "Ghost Button",
      preview: <button className="px-4 py-2 text-blue-400 text-sm font-medium hover:bg-blue-400/10 rounded transition-colors">Подробнее →</button>,
      code: `<button className="px-4 py-2 text-blue-400 text-sm font-medium hover:bg-blue-400/10 rounded transition-colors">
  Подробнее →
</button>`,
    },
  ],
  forms: [
    {
      name: "Text Input",
      preview: <input className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white rounded placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Введите текст..." />,
      code: `<input
  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white rounded placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
  placeholder="Введите текст..."
/>`,
    },
    {
      name: "Textarea",
      preview: <textarea rows={3} className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white rounded placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors resize-none" placeholder="Введите сообщение..." />,
      code: `<textarea
  rows={3}
  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white rounded placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
  placeholder="Введите сообщение..."
/>`,
    },
    {
      name: "Select",
      preview: <select className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white rounded focus:outline-none focus:border-blue-500 transition-colors"><option>React</option><option>Vue</option><option>Next.js</option></select>,
      code: `<select className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white rounded focus:outline-none focus:border-blue-500 transition-colors">
  <option>React</option>
  <option>Vue</option>
  <option>Next.js</option>
</select>`,
    },
    {
      name: "Checkbox",
      preview: <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer"><input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-500" />Принять условия</label>,
      code: `<label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
  <input type="checkbox" className="w-4 h-4 accent-blue-500" />
  Принять условия
</label>`,
    },
    {
      name: "Form Group",
      preview: (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400 uppercase tracking-wide">Email</label>
          <input className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white rounded focus:outline-none focus:border-blue-500 transition-colors" placeholder="user@example.com" />
          <p className="text-xs text-neutral-500">Мы не передаём ваш email третьим лицам</p>
        </div>
      ),
      code: `<div className="flex flex-col gap-1">
  <label className="text-xs text-neutral-400 uppercase tracking-wide">Email</label>
  <input
    className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white rounded focus:outline-none focus:border-blue-500 transition-colors"
    placeholder="user@example.com"
  />
  <p className="text-xs text-neutral-500">Мы не передаём ваш email третьим лицам</p>
</div>`,
    },
  ],
  cards: [
    {
      name: "Basic Card",
      preview: (
        <div className="border border-neutral-800 rounded-lg p-5 bg-neutral-900">
          <h3 className="font-semibold text-white mb-1">Заголовок карточки</h3>
          <p className="text-neutral-400 text-sm">Описание и дополнительная информация внутри карточки.</p>
        </div>
      ),
      code: `<div className="border border-neutral-800 rounded-lg p-5 bg-neutral-900">
  <h3 className="font-semibold text-white mb-1">Заголовок карточки</h3>
  <p className="text-neutral-400 text-sm">Описание и дополнительная информация.</p>
</div>`,
    },
    {
      name: "Stat Card",
      preview: (
        <div className="border border-neutral-800 rounded-lg p-5">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Деплоев</p>
          <p className="text-3xl font-bold text-blue-400">142</p>
          <p className="text-xs text-green-400 mt-1">↑ 12% за месяц</p>
        </div>
      ),
      code: `<div className="border border-neutral-800 rounded-lg p-5">
  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Деплоев</p>
  <p className="text-3xl font-bold text-blue-400">142</p>
  <p className="text-xs text-green-400 mt-1">↑ 12% за месяц</p>
</div>`,
    },
    {
      name: "Project Card",
      preview: (
        <div className="border border-neutral-800 rounded-lg p-5 hover:border-neutral-600 transition-colors cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><span>⚛</span><span className="font-medium text-sm">my-react-app</span></div>
            <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded">ready</span>
          </div>
          <p className="text-xs text-neutral-500">2 минуты назад · ветка main</p>
        </div>
      ),
      code: `<div className="border border-neutral-800 rounded-lg p-5 hover:border-neutral-600 transition-colors cursor-pointer">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <span>⚛</span>
      <span className="font-medium text-sm">my-react-app</span>
    </div>
    <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded">ready</span>
  </div>
  <p className="text-xs text-neutral-500">2 минуты назад · ветка main</p>
</div>`,
    },
  ],
  alerts: [
    {
      name: "Success Alert",
      preview: <div className="flex items-start gap-3 bg-green-400/10 border border-green-400/30 rounded-lg px-4 py-3"><span className="text-green-400 mt-0.5">✅</span><div><p className="text-sm font-medium text-green-400">Успешно!</p><p className="text-xs text-green-300/70 mt-0.5">Деплой завершён без ошибок.</p></div></div>,
      code: `<div className="flex items-start gap-3 bg-green-400/10 border border-green-400/30 rounded-lg px-4 py-3">
  <span className="text-green-400 mt-0.5">✅</span>
  <div>
    <p className="text-sm font-medium text-green-400">Успешно!</p>
    <p className="text-xs text-green-300/70 mt-0.5">Деплой завершён без ошибок.</p>
  </div>
</div>`,
    },
    {
      name: "Error Alert",
      preview: <div className="flex items-start gap-3 bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3"><span className="text-red-400 mt-0.5">❌</span><div><p className="text-sm font-medium text-red-400">Ошибка</p><p className="text-xs text-red-300/70 mt-0.5">Не удалось выполнить сборку.</p></div></div>,
      code: `<div className="flex items-start gap-3 bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3">
  <span className="text-red-400 mt-0.5">❌</span>
  <div>
    <p className="text-sm font-medium text-red-400">Ошибка</p>
    <p className="text-xs text-red-300/70 mt-0.5">Не удалось выполнить сборку.</p>
  </div>
</div>`,
    },
    {
      name: "Warning Alert",
      preview: <div className="flex items-start gap-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-4 py-3"><span className="text-yellow-400 mt-0.5">⚠️</span><div><p className="text-sm font-medium text-yellow-400">Внимание</p><p className="text-xs text-yellow-300/70 mt-0.5">DNS не настроен для домена.</p></div></div>,
      code: `<div className="flex items-start gap-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-4 py-3">
  <span className="text-yellow-400 mt-0.5">⚠️</span>
  <div>
    <p className="text-sm font-medium text-yellow-400">Внимание</p>
    <p className="text-xs text-yellow-300/70 mt-0.5">DNS не настроен для домена.</p>
  </div>
</div>`,
    },
    {
      name: "Info Alert",
      preview: <div className="flex items-start gap-3 bg-blue-400/10 border border-blue-400/30 rounded-lg px-4 py-3"><span className="text-blue-400 mt-0.5">ℹ️</span><div><p className="text-sm font-medium text-blue-400">Информация</p><p className="text-xs text-blue-300/70 mt-0.5">Новая версия платформы доступна.</p></div></div>,
      code: `<div className="flex items-start gap-3 bg-blue-400/10 border border-blue-400/30 rounded-lg px-4 py-3">
  <span className="text-blue-400 mt-0.5">ℹ️</span>
  <div>
    <p className="text-sm font-medium text-blue-400">Информация</p>
    <p className="text-xs text-blue-300/70 mt-0.5">Новая версия платформы доступна.</p>
  </div>
</div>`,
    },
  ],
  badges: [
    {
      name: "Status Badges",
      preview: (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-0.5 rounded bg-green-400/10 text-green-400">ready</span>
          <span className="text-xs px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-400">building</span>
          <span className="text-xs px-2 py-0.5 rounded bg-red-400/10 text-red-400">error</span>
          <span className="text-xs px-2 py-0.5 rounded bg-neutral-700 text-neutral-300">queued</span>
          <span className="text-xs px-2 py-0.5 rounded bg-blue-400/10 text-blue-400">preview</span>
        </div>
      ),
      code: `<span className="text-xs px-2 py-0.5 rounded bg-green-400/10 text-green-400">ready</span>
<span className="text-xs px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-400">building</span>
<span className="text-xs px-2 py-0.5 rounded bg-red-400/10 text-red-400">error</span>
<span className="text-xs px-2 py-0.5 rounded bg-neutral-700 text-neutral-300">queued</span>
<span className="text-xs px-2 py-0.5 rounded bg-blue-400/10 text-blue-400">preview</span>`,
    },
    {
      name: "Plan Badges",
      preview: (
        <div className="flex gap-2">
          <span className="text-xs px-2 py-0.5 uppercase tracking-wide bg-neutral-800 text-neutral-400">free</span>
          <span className="text-xs px-2 py-0.5 uppercase tracking-wide bg-blue-400/20 text-blue-400">pro</span>
          <span className="text-xs px-2 py-0.5 uppercase tracking-wide bg-yellow-400/20 text-yellow-400">enterprise</span>
        </div>
      ),
      code: `<span className="text-xs px-2 py-0.5 uppercase tracking-wide bg-neutral-800 text-neutral-400">free</span>
<span className="text-xs px-2 py-0.5 uppercase tracking-wide bg-blue-400/20 text-blue-400">pro</span>
<span className="text-xs px-2 py-0.5 uppercase tracking-wide bg-yellow-400/20 text-yellow-400">enterprise</span>`,
    },
  ],
  navigation: [
    {
      name: "Tab Bar",
      preview: (
        <div className="flex gap-1 border-b border-neutral-800">
          {["Деплои", "Аналитика", "Настройки"].map((t, i) => (
            <button key={t} className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${i === 0 ? "border-blue-400 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}>{t}</button>
          ))}
        </div>
      ),
      code: `<div className="flex gap-1 border-b border-neutral-800">
  {tabs.map((t) => (
    <button key={t} onClick={() => setTab(t)}
      className={\`px-4 py-2 text-sm border-b-2 -mb-px transition-colors \${
        activeTab === t
          ? "border-blue-400 text-white"
          : "border-transparent text-neutral-500 hover:text-neutral-300"
      }\`}>
      {t}
    </button>
  ))}
</div>`,
    },
    {
      name: "Breadcrumb",
      preview: (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-400 hover:text-white cursor-pointer">Проекты</span>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400 hover:text-white cursor-pointer">my-app</span>
          <span className="text-neutral-600">/</span>
          <span className="text-white">Деплои</span>
        </div>
      ),
      code: `<div className="flex items-center gap-2 text-sm">
  <span className="text-neutral-400 hover:text-white cursor-pointer">Проекты</span>
  <span className="text-neutral-600">/</span>
  <span className="text-neutral-400 hover:text-white cursor-pointer">my-app</span>
  <span className="text-neutral-600">/</span>
  <span className="text-white">Деплои</span>
</div>`,
    },
    {
      name: "Sidebar Nav",
      preview: (
        <div className="flex flex-col gap-1 w-40">
          {[{ icon: "🚀", label: "Деплои", active: true }, { icon: "📊", label: "Аналитика", active: false }, { icon: "🔑", label: "Переменные", active: false }].map((item) => (
            <button key={item.label} className={`flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors text-left ${item.active ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"}`}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      ),
      code: `<div className="flex flex-col gap-1">
  {items.map((item) => (
    <button key={item.label}
      className={\`flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors \${
        item.active
          ? "bg-neutral-800 text-white"
          : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
      }\`}>
      <span>{item.icon}</span>
      {item.label}
    </button>
  ))}
</div>`,
    },
  ],
  layout: [
    {
      name: "2-Column Grid",
      preview: (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-neutral-800 rounded p-3 text-xs text-neutral-400 text-center">Колонка 1</div>
          <div className="bg-neutral-800 rounded p-3 text-xs text-neutral-400 text-center">Колонка 2</div>
        </div>
      ),
      code: `<div className="grid grid-cols-2 gap-4">
  <div>Колонка 1</div>
  <div>Колонка 2</div>
</div>`,
    },
    {
      name: "4-Column Stats",
      preview: (
        <div className="grid grid-cols-4 gap-2">
          {["Деплои", "Трафик", "Запросы", "Ошибки"].map((l) => (
            <div key={l} className="bg-neutral-800 rounded p-2 text-center">
              <p className="text-blue-400 font-bold text-lg">{Math.floor(Math.random() * 100)}</p>
              <p className="text-xs text-neutral-500">{l}</p>
            </div>
          ))}
        </div>
      ),
      code: `<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {stats.map((s) => (
    <div key={s.label} className="border border-neutral-800 p-5">
      <p className="text-2xl font-bold text-blue-400">{s.value}</p>
      <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
    </div>
  ))}
</div>`,
    },
    {
      name: "Sidebar Layout",
      preview: (
        <div className="flex gap-3 h-24">
          <div className="w-20 bg-neutral-800 rounded text-xs text-neutral-500 flex items-center justify-center">Sidebar</div>
          <div className="flex-1 bg-neutral-800/50 rounded text-xs text-neutral-500 flex items-center justify-center">Контент</div>
        </div>
      ),
      code: `<div className="flex gap-6">
  <aside className="w-48 shrink-0">
    {/* Sidebar */}
  </aside>
  <main className="flex-1 min-w-0">
    {/* Контент */}
  </main>
</div>`,
    },
    {
      name: "Divider",
      preview: (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-neutral-300">Блок выше</p>
          <hr className="border-neutral-800" />
          <p className="text-sm text-neutral-300">Блок ниже</p>
        </div>
      ),
      code: `<hr className="border-neutral-800" />

{/* Или с текстом */}
<div className="flex items-center gap-3">
  <hr className="flex-1 border-neutral-800" />
  <span className="text-xs text-neutral-500">или</span>
  <hr className="flex-1 border-neutral-800" />
</div>`,
    },
  ],
};

export default function UIKit() {
  const [category, setCategory] = useState<Category>("buttons");
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const copyCode = (code: string, name: string) => {
    navigator.clipboard.writeText(code);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  const components = COMPONENTS[category].filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">UI Kit</h1>
          <p className="text-neutral-400 text-sm mt-1">Готовые компоненты — копируй и используй</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск компонентов..."
          className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-400 transition-colors w-52"
        />
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-44 shrink-0">
          <div className="flex flex-col gap-1">
            {CATEGORIES.map((cat) => (
              <button key={cat.key} onClick={() => setCategory(cat.key)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left ${category === cat.key ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"}`}>
                <Icon name={cat.icon} size={14} />
                {cat.label}
                <span className="ml-auto text-xs text-neutral-600">{COMPONENTS[cat.key].length}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Components */}
        <div className="flex-1 min-w-0">
          {components.length === 0 ? (
            <p className="text-neutral-500 py-16 text-center">Ничего не найдено</p>
          ) : (
            <div className="flex flex-col gap-4">
              {components.map((comp) => (
                <div key={comp.name} className="border border-neutral-800 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
                    <span className="text-sm font-medium text-neutral-300">{comp.name}</span>
                    <button
                      onClick={() => copyCode(comp.code, comp.name)}
                      className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors px-2 py-1 border border-neutral-700 rounded hover:border-neutral-500"
                    >
                      <Icon name={copied === comp.name ? "Check" : "Copy"} size={12} />
                      {copied === comp.name ? "Скопировано" : "Копировать"}
                    </button>
                  </div>

                  {/* Preview */}
                  <div className="px-6 py-8 bg-neutral-950 flex items-center justify-center min-h-[80px]">
                    <div className="w-full max-w-sm">{comp.preview}</div>
                  </div>

                  {/* Code */}
                  <div className="border-t border-neutral-800 bg-black px-4 py-4">
                    <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre leading-relaxed">{comp.code}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
