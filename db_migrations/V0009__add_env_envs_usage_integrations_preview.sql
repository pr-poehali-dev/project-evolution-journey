-- Env переменные по средам
ALTER TABLE t_p30709305_project_evolution_jo.projects
  ADD COLUMN IF NOT EXISTS env_production JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS env_preview JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS env_development JSONB DEFAULT '{}';

-- Usage статистика
CREATE TABLE IF NOT EXISTS t_p30709305_project_evolution_jo.usage_stats (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  bandwidth_mb NUMERIC DEFAULT 0,
  requests INTEGER DEFAULT 0,
  build_seconds INTEGER DEFAULT 0,
  UNIQUE(project_id, date)
);

-- Интеграции (Slack, Telegram)
CREATE TABLE IF NOT EXISTS t_p30709305_project_evolution_jo.integrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(30) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Preview деплои — добавляем поле preview_url
ALTER TABLE t_p30709305_project_evolution_jo.deployments
  ADD COLUMN IF NOT EXISTS preview_url VARCHAR(255);

-- Тестовые usage данные для test проектов
INSERT INTO t_p30709305_project_evolution_jo.usage_stats (project_id, date, bandwidth_mb, requests, build_seconds)
SELECT 2, CURRENT_DATE - (n || ' days')::interval, (random()*200+50)::numeric(8,2), (random()*5000+500)::int, (random()*120+20)::int
FROM generate_series(0, 29) n
ON CONFLICT DO NOTHING;

INSERT INTO t_p30709305_project_evolution_jo.usage_stats (project_id, date, bandwidth_mb, requests, build_seconds)
SELECT 3, CURRENT_DATE - (n || ' days')::interval, (random()*500+100)::numeric(8,2), (random()*12000+1000)::int, (random()*180+30)::int
FROM generate_series(0, 29) n
ON CONFLICT DO NOTHING;

INSERT INTO t_p30709305_project_evolution_jo.usage_stats (project_id, date, bandwidth_mb, requests, build_seconds)
SELECT 4, CURRENT_DATE - (n || ' days')::interval, (random()*100+20)::numeric(8,2), (random()*2000+200)::int, (random()*90+15)::int
FROM generate_series(0, 6) n
ON CONFLICT DO NOTHING;