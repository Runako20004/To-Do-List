CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  UNIQUE KEY users_username_unique (username),
  UNIQUE KEY users_email_unique (email)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  project VARCHAR(100) NOT NULL DEFAULT 'General',
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  due_date DATE NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX tasks_user_id_index (user_id),
  INDEX tasks_due_date_index (due_date),
  INDEX tasks_project_index (project),
  CONSTRAINT tasks_user_id_foreign
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);
