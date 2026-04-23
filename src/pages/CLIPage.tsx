import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Icon from "@/components/ui/icon";
import { getUser } from "@/lib/auth";

type Section = "install" | "deploy" | "env" | "logs" | "domains" | "db";

const SECTIONS: { key: Section; label: string; icon: string; desc: string }[] = [
  { key: "install", label: "Установка", icon: "Download", desc: "Установка CLI инструментов" },
  { key: "deploy", label: "Деплой", icon: "Rocket", desc: "Сборка и публикация" },
  { key: "env", label: "Переменные", icon: "Key", desc: "Управление env" },
  { key: "logs", label: "Логи", icon: "ScrollText", desc: "Просмотр логов" },
  { key: "domains", label: "Домены", icon: "Globe", desc: "DNS и домены" },
  { key: "db", label: "База данных", icon: "Database", desc: "Миграции и запросы" },
];

type Command = { desc: string; cmd: string; note?: string };

const COMMANDS: Record<Section, Command[]> = {
  install: [
    { desc: "Установить Bun (рекомендуется)", cmd: "curl -fsSL https://bun.sh/install | bash" },
    { desc: "Или через npm", cmd: "npm install -g bun" },
    { desc: "Создать новый проект Vite + React + TypeScript", cmd: "bunx create-vite my-app --template react-ts\ncd my-app\nbun install" },
    { desc: "Установить Tailwind CSS", cmd: "bun add -d tailwindcss postcss autoprefixer\nbunx tailwindcss init -p" },
    { desc: "Запустить dev-сервер", cmd: "bun run dev" },
    { desc: "Собрать проект", cmd: "bun run build" },
  ],
  deploy: [
    { desc: "Инициализировать git-репозиторий", cmd: "git init\ngit add .\ngit commit -m 'Initial commit'" },
    { desc: "Подключить GitHub", cmd: "git remote add origin https://github.com/ВАШ_АККАУНТ/РЕПОЗИТОРИЙ.git\ngit push -u origin main" },
    { desc: "Запушить изменения (триггер автодеплоя)", cmd: "git add .\ngit commit -m 'feat: новая функция'\ngit push" },
    { desc: "Сборка для production", cmd: "bun run build\n# Результат в папке dist/", note: "Папку dist/ не добавляй в git — она создаётся при деплое" },
    { desc: "Проверить билд локально", cmd: "bun run preview\n# Открой http://localhost:4173" },
    { desc: "Просмотр статуса деплоя через API", cmd: `curl "https://functions.poehali.dev/YOUR_FUNC_ID?action=project&project_id=ID&user_id=UID"` },
  ],
  env: [
    { desc: "Создать .env файл для локальной разработки", cmd: "touch .env.local\n\n# Добавь переменные:\nVITE_API_URL=https://functions.poehali.dev/...\nVITE_APP_NAME=MyApp", note: "Файл .env.local нельзя коммитить в git — добавь в .gitignore" },
    { desc: "Добавить .env в .gitignore", cmd: "echo '.env\n.env.local\n.env.production' >> .gitignore" },
    { desc: "Использование в коде", cmd: "// В React/Vite — только переменные с префиксом VITE_\nconst apiUrl = import.meta.env.VITE_API_URL;\nconst isProd = import.meta.env.PROD; // true в production" },
    { desc: "Пример .env.local", cmd: "VITE_API_URL=https://functions.poehali.dev/abc123\nVITE_APP_TITLE=Мой сайт\nVITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX" },
    { desc: "Проверить переменные", cmd: "# Вывести все VITE_ переменные\nbunx vite --debug" },
  ],
  logs: [
    { desc: "Просмотр логов через API", cmd: `curl "https://functions.poehali.dev/YOUR_FUNC?action=project\\n  &project_id=ID&user_id=UID" | python3 -m json.tool` },
    { desc: "Следить за изменениями (dev)", cmd: "# В dev режиме логи видны в консоли браузера (F12)\nbun run dev" },
    { desc: "Логи ошибок в коде", cmd: "// Удобная обёртка для логов\nconst log = {\n  info: (...args: unknown[]) => console.log('[INFO]', ...args),\n  error: (...args: unknown[]) => console.error('[ERROR]', ...args),\n  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),\n};\n\nlog.info('Деплой начат', { projectId: 42 });" },
    { desc: "Логи Python функции", cmd: "import logging\nlogging.basicConfig(level=logging.INFO)\nlogger = logging.getLogger(__name__)\n\ndef handler(event, context):\n    logger.info('Запрос получен: %s', event.get('httpMethod'))\n    # ..." },
    { desc: "Профилирование производительности", cmd: "// Замерить время выполнения\nconsole.time('fetch-data');\nconst data = await fetchData();\nconsole.timeEnd('fetch-data'); // fetch-data: 123ms" },
  ],
  domains: [
    { desc: "Проверить DNS через nslookup", cmd: "nslookup mydomain.com\nnslookup -type=CNAME mydomain.com" },
    { desc: "Проверить DNS через dig", cmd: "dig mydomain.com\ndig CNAME mydomain.com\ndig +short mydomain.com" },
    { desc: "Проверить SSL сертификат", cmd: "curl -vI https://mydomain.com 2>&1 | grep -E 'SSL|certificate|expire'" },
    { desc: "Тест доступности сайта", cmd: "curl -o /dev/null -s -w 'HTTP: %{http_code}\\nВремя: %{time_total}s\\n' https://mydomain.com" },
    { desc: "Добавить CNAME запись (пример для CloudFlare)", cmd: "# В DNS провайдере добавь:\nТип: CNAME\nИмя: @ (или www)\nЦель: cname.clodev.ru\nProxy: OFF (серый облачко)\n\n# Для поддомена:\nИмя: app\nЦель: cname.clodev.ru" },
    { desc: "Проверить распространение DNS", cmd: "# Онлайн: https://dnschecker.org\n# Или:\nfor ns in 8.8.8.8 1.1.1.1 77.88.8.8; do\n  echo \"DNS $ns:\"\n  nslookup mydomain.com $ns | grep Address\ndone" },
  ],
  db: [
    { desc: "Подключиться к PostgreSQL", cmd: "psql $DATABASE_URL\n\n# Или указать явно:\npsql 'postgresql://user:pass@host:5432/dbname'" },
    { desc: "Просмотр таблиц", cmd: "\\dt schema.*        -- список таблиц в схеме\n\\d schema.tablename -- структура таблицы\n\\dn                 -- список схем" },
    { desc: "Базовые SELECT запросы", cmd: "-- Все записи\nSELECT * FROM schema.users LIMIT 10;\n\n-- С фильтрацией\nSELECT id, email, created_at\nFROM schema.users\nWHERE created_at > NOW() - INTERVAL '7 days'\nORDER BY created_at DESC;" },
    { desc: "Пример миграции (SQL файл)", cmd: "-- db_migrations/V0001__create_users.sql\nCREATE TABLE IF NOT EXISTS schema.users (\n  id         SERIAL PRIMARY KEY,\n  email      VARCHAR(255) NOT NULL UNIQUE,\n  name       VARCHAR(100),\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\nCREATE INDEX idx_users_email ON schema.users(email);" },
    { desc: "Добавить колонку (ALTER TABLE)", cmd: "-- db_migrations/V0002__add_column.sql\nALTER TABLE schema.users\n  ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free',\n  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();" },
    { desc: "psycopg2 в Python функции", cmd: "import psycopg2\nimport os\n\nconn = psycopg2.connect(os.environ['DATABASE_URL'])\ncur = conn.cursor()\n\n# SELECT\ncur.execute('SELECT id, email FROM schema.users WHERE id = %s', (user_id,))\n# ВНИМАНИЕ: в простом запросе используй форматирование:\ncur.execute('SELECT id FROM schema.users WHERE id = %s' % int(user_id))\nrow = cur.fetchone()\n\n# INSERT\ncur.execute('INSERT INTO schema.users (email) VALUES (\\'%s\\') RETURNING id' % email)\nnew_id = cur.fetchone()[0]\nconn.commit()\ncur.close()\nconn.close()" },
  ],
};

export default function CLIPage() {
  const user = getUser();
  const [section, setSection] = useState<Section>("install");
  const [copied, setCopied] = useState<number | null>(null);

  const copyCmd = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const commands = COMMANDS[section];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">CLI & Команды</h1>
          <p className="text-neutral-400 text-sm mt-1">Готовые команды для работы из терминала</p>
        </div>
        {user && (
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-lg">
            <Icon name="User" size={13} className="text-neutral-500" />
            <span className="text-xs text-neutral-400 font-mono">user_id: <span className="text-blue-400">{user.user_id}</span></span>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-48 shrink-0">
          <div className="flex flex-col gap-1">
            {SECTIONS.map((s) => (
              <button key={s.key} onClick={() => setSection(s.key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors text-left ${section === s.key ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"}`}>
                <Icon name={s.icon} size={14} />
                <div>
                  <p className="leading-none">{s.label}</p>
                  <p className="text-xs text-neutral-600 mt-0.5 leading-none">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-3 bg-blue-400/5 border border-blue-400/20 rounded-lg">
            <p className="text-xs text-blue-400 font-medium mb-1">Совет</p>
            <p className="text-xs text-neutral-400">Нажми на команду — она скопируется в буфер обмена</p>
          </div>
        </aside>

        {/* Commands */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {commands.map((cmd, idx) => (
            <div key={idx} className="border border-neutral-800 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/60 border-b border-neutral-800">
                <span className="text-sm text-neutral-300">{cmd.desc}</span>
                <button onClick={() => copyCmd(cmd.cmd, idx)}
                  className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors px-2 py-1 rounded border border-neutral-700 hover:border-neutral-500 shrink-0 ml-4">
                  <Icon name={copied === idx ? "Check" : "Copy"} size={11} />
                  {copied === idx ? "Скопировано" : "Копировать"}
                </button>
              </div>
              <button onClick={() => copyCmd(cmd.cmd, idx)}
                className="w-full text-left bg-black px-4 py-4 hover:bg-neutral-950 transition-colors group">
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed group-hover:text-green-300 transition-colors">{cmd.cmd}</pre>
              </button>
              {cmd.note && (
                <div className="px-4 py-2 bg-yellow-400/5 border-t border-yellow-400/20">
                  <p className="text-xs text-yellow-400/80">⚠ {cmd.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
