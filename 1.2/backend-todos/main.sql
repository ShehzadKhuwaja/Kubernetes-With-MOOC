CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      done BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )