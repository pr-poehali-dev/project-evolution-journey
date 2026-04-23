CREATE TABLE t_p30709305_project_evolution_jo.projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  repo_url VARCHAR(500),
  framework VARCHAR(50) DEFAULT 'other',
  domain VARCHAR(200),
  env_vars JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p30709305_project_evolution_jo.deployments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  branch VARCHAR(100) DEFAULT 'main',
  commit_sha VARCHAR(40),
  commit_message VARCHAR(500),
  url VARCHAR(500),
  build_log TEXT DEFAULT '',
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);

CREATE TABLE t_p30709305_project_evolution_jo.domains (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  domain VARCHAR(200) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);