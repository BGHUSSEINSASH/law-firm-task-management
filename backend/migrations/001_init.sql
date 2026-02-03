CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  username TEXT,
  full_name TEXT,
  full_name_encrypted TEXT,
  email_encrypted TEXT,
  role TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  failed_login_attempts INTEGER DEFAULT 0,
  lock_until TIMESTAMP NULL,
  last_login_at TIMESTAMP NULL,
  password_changed_at TIMESTAMP NULL,
  known_devices JSONB DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  type TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lawyers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  specialization TEXT,
  experience_years INTEGER,
  phone TEXT,
  workload_percentage INTEGER DEFAULT 0,
  assigned_tasks INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  task_code TEXT,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT,
  priority TEXT,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  main_lawyer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  main_lawyer_assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  approval_status TEXT,
  approved_by_admin INTEGER,
  approved_by_main_lawyer INTEGER,
  approved_by_assigned_lawyer INTEGER,
  approved_at_admin TIMESTAMP NULL,
  approved_at_main_lawyer TIMESTAMP NULL,
  approved_at_assigned_lawyer TIMESTAMP NULL,
  due_date TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  archived_at TIMESTAMP NULL,
  escalated_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  entity TEXT,
  entity_id INTEGER,
  action TEXT,
  user_id INTEGER,
  ip TEXT,
  details JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  message TEXT,
  priority TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT,
  token_hash TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  ip TEXT,
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  filename TEXT,
  saved_name TEXT,
  filepath TEXT,
  mimetype TEXT,
  size INTEGER,
  checksum TEXT,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  category TEXT
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  amount NUMERIC(12,2),
  currency TEXT,
  status TEXT,
  issued_at TIMESTAMP NULL,
  due_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stages (
  id SERIAL PRIMARY KEY,
  name TEXT,
  order_index INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
