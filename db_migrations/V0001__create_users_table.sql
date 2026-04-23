CREATE TABLE t_p30709305_project_evolution_jo.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);