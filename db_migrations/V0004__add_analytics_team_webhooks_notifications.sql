CREATE TABLE t_p30709305_project_evolution_jo.analytics (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  bandwidth_mb NUMERIC(10,2) DEFAULT 0,
  requests INTEGER DEFAULT 0,
  UNIQUE(project_id, date)
);

CREATE TABLE t_p30709305_project_evolution_jo.team_members (
  id SERIAL PRIMARY KEY,
  owner_user_id INTEGER NOT NULL,
  member_email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p30709305_project_evolution_jo.webhooks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  url VARCHAR(500) NOT NULL,
  events VARCHAR(200) DEFAULT 'deploy.ready,deploy.error',
  secret VARCHAR(100),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p30709305_project_evolution_jo.notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  project_id INTEGER,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);