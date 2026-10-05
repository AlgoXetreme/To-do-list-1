CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL, password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL, description TEXT DEFAULT '',
  date DATE NOT NULL,
  original_date DATE,  -- set when a backlog task is rescheduled
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  category VARCHAR(30) DEFAULT 'Other',
  status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  is_special BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
