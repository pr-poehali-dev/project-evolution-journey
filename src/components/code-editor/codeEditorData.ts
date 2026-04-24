export type Language = "tsx" | "python" | "css" | "json" | "bash";

export const TEMPLATES: Record<Language, { name: string; code: string }[]> = {
  tsx: [
    {
      name: "React компонент",
      code: `import { useState } from "react";

interface Props {
  title: string;
  onAction?: () => void;
}

export default function MyComponent({ title, onAction }: Props) {
  const [count, setCount] = useState(0);

  return (
    <div className="p-6 border border-neutral-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <p className="text-neutral-400 mb-4">Счётчик: {count}</p>
      <div className="flex gap-2">
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          +1
        </button>
        <button
          onClick={onAction}
          className="px-4 py-2 border border-neutral-700 text-neutral-300 rounded hover:border-white transition-colors"
        >
          Действие
        </button>
      </div>
    </div>
  );
}`,
    },
    {
      name: "API хук",
      code: `import { useState, useEffect } from "react";

function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        return res.json();
      })
      .then((json) => { setData(json); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

// Использование:
// const { data, loading, error } = useApi<User[]>("/api/users");`,
    },
    {
      name: "Форма с валидацией",
      code: `import { useState } from "react";

interface FormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const [form, setForm] = useState<FormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Partial<FormData> = {};
    if (!form.email.includes("@")) errs.email = "Некорректный email";
    if (form.password.length < 6) errs.password = "Минимум 6 символов";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    // ... отправка формы
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          placeholder="Email"
          className="w-full border border-neutral-700 bg-neutral-900 px-3 py-2 rounded text-sm"
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
      </div>
      <button type="submit" disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">
        {loading ? "Вход..." : "Войти"}
      </button>
    </form>
  );
}`,
    },
  ],
  python: [
    {
      name: "Cloud Function",
      code: `import json
import os
import psycopg2

SCHEMA = 'my_schema'

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def resp(status, data):
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(data, ensure_ascii=False, default=str)
    }

def handler(event: dict, context) -> dict:
    """Cloud function — пример обработчика"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}

    if method == 'GET':
        user_id = params.get('user_id', '')
        if not user_id:
            return resp(400, {'error': 'user_id обязателен'})

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name FROM %s.items WHERE user_id = %s ORDER BY created_at DESC"
            % (SCHEMA, int(user_id))
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        items = [{'id': r[0], 'name': r[1]} for r in rows]
        return resp(200, {'items': items})

    return resp(400, {'error': 'Неизвестный метод'})`,
    },
    {
      name: "Работа с S3",
      code: `import os
import boto3
import base64
import json

def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

def upload_file(filename: str, data: bytes, content_type: str) -> str:
    s3 = get_s3()
    key = 'uploads/%s' % filename
    s3.put_object(
        Bucket='files',
        Key=key,
        Body=data,
        ContentType=content_type
    )
    cdn_url = 'https://cdn.poehali.dev/projects/%s/bucket/%s' % (
        os.environ['AWS_ACCESS_KEY_ID'], key
    )
    return cdn_url

def handler(event: dict, context) -> dict:
    body = json.loads(event.get('body') or '{}')
    file_b64 = body.get('file')
    filename = body.get('filename', 'file.png')

    if not file_b64:
        return {'statusCode': 400, 'body': json.dumps({'error': 'file обязателен'})}

    data = base64.b64decode(file_b64)
    url = upload_file(filename, data, 'image/png')

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'url': url})
    }`,
    },
  ],
  css: [
    {
      name: "CSS переменные",
      code: `:root {
  /* Цвета */
  --color-bg: #0a0a0a;
  --color-surface: #171717;
  --color-border: #262626;
  --color-primary: #60a5fa;
  --color-text: #ffffff;
  --color-text-muted: #737373;

  /* Радиусы */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Отступы */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Типографика */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
}

/* Тёмная тема (по умолчанию) */
.dark {
  --color-bg: #0a0a0a;
  --color-text: #ffffff;
}

/* Светлая тема */
.light {
  --color-bg: #ffffff;
  --color-text: #0a0a0a;
}`,
    },
    {
      name: "Анимации",
      code: `/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Slide in from right */
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

/* Spin */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Использование */
.fade-in    { animation: fadeIn 0.3s ease-out; }
.slide-in   { animation: slideInRight 0.25s ease-out; }
.pulse      { animation: pulse 2s infinite; }
.spin       { animation: spin 1s linear infinite; }`,
    },
  ],
  json: [
    {
      name: "package.json",
      code: `{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.1",
    "@tanstack/react-query": "^5.56.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.1",
    "tailwindcss": "^3.4.11",
    "autoprefixer": "^10.4.20"
  }
}`,
    },
    {
      name: "tests.json",
      code: `{
  "tests": [
    {
      "name": "OPTIONS preflight",
      "method": "OPTIONS",
      "path": "/",
      "expectedStatus": 200
    },
    {
      "name": "GET items — нет user_id",
      "method": "GET",
      "path": "/?action=items",
      "expectedStatus": 400,
      "expectedBody": { "error": "string" },
      "bodyMatcher": "partial"
    },
    {
      "name": "GET items — успех",
      "method": "GET",
      "path": "/?action=items&user_id=1",
      "expectedStatus": 200,
      "expectedBody": { "items": [] },
      "bodyMatcher": "partial"
    },
    {
      "name": "POST create — успех",
      "method": "POST",
      "path": "/",
      "body": { "action": "create", "user_id": 1, "name": "Test" },
      "expectedStatus": 201,
      "expectedBody": { "success": true },
      "bodyMatcher": "partial"
    }
  ]
}`,
    },
  ],
  bash: [
    {
      name: "Git команды",
      code: `# Первоначальная настройка
git init
git remote add origin https://github.com/user/repo.git

# Ежедневная работа
git status                    # что изменилось
git add .                     # добавить все файлы
git commit -m "feat: ..."     # зафиксировать
git push origin main          # отправить

# Ветки
git checkout -b feature/auth  # создать новую ветку
git checkout main             # переключиться
git merge feature/auth        # слить ветку
git branch -d feature/auth    # удалить ветку

# Откат
git reset --soft HEAD~1       # откатить коммит (сохранить изменения)
git restore src/file.tsx      # откатить файл

# Просмотр
git log --oneline -10         # последние 10 коммитов
git diff main..feature/auth   # разница между ветками`,
    },
    {
      name: "Bun / npm команды",
      code: `# Установка зависимостей
bun install                   # все зависимости
bun add react router-dom      # добавить пакеты
bun add -d @types/node        # dev зависимости
bun remove lodash             # удалить пакет

# Запуск
bun run dev                   # dev сервер
bun run build                 # сборка
bun run preview               # предпросмотр билда

# Эквиваленты npm
npm install  → bun install
npm run dev  → bun dev
npm run build → bun run build
npx vite     → bunx vite

# Глобальные утилиты
bunx create-vite my-app --template react-ts`,
    },
    {
      name: "Docker",
      code: `# Dockerfile для React + Vite
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# nginx.conf для SPA
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}

# Команды
docker build -t my-app .
docker run -p 3000:80 my-app`,
    },
  ],
};

export const LANG_COLORS: Record<Language, string> = {
  tsx: "text-blue-400",
  python: "text-yellow-400",
  css: "text-purple-400",
  json: "text-green-400",
  bash: "text-neutral-400",
};

export const LANGS: { key: Language; label: string }[] = [
  { key: "tsx", label: "TypeScript / React" },
  { key: "python", label: "Python" },
  { key: "css", label: "CSS" },
  { key: "json", label: "JSON" },
  { key: "bash", label: "Bash / Shell" },
];
