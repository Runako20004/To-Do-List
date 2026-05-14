# To-Do-List

A full-stack task management application built with React, TypeScript, Flask, and MySQL.To-Do-List gives users a clean dashboard for creating, organizing, tracking, and completing tasks with authentication, project grouping, priorities, due dates, and productivity statistics.

## Features

- User registration and login with JWT-based authentication
- Password hashing on the backend
- Protected dashboard for authenticated users
- Create, view, update, complete, and delete tasks
- Organize tasks by project
- Set task priority as low, medium, or high
- Add optional due dates
- Search tasks by title, project, or priority
- Dashboard summary with totals, completion rate, overdue tasks, due-today tasks, due-this-week tasks, and high-priority progress
- MySQL-backed persistence
- Responsive React interface styled with Tailwind CSS

## Tech Stack

**Frontend**

- React
- TypeScript
- React Router
- Axios
- Tailwind CSS
- Lucide React icons

**Backend**

- Python
- Flask
- Flask-CORS
- Flask-MySQLdb
- PyJWT
- python-dotenv
- Werkzeug password hashing

**Database**

- MySQL

## Project Structure

```text
To-Do-List/
|-- backend/
|   |-- app.py              # Flask API and authentication logic
|   |-- init_db.py          # Database creation and migration helper
|   |-- migrate_email.py    # Email migration helper for older schemas
|   `-- schema.sql          # MySQL schema
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/     # Shared UI components
|   |   |-- pages/          # Login, register, and dashboard pages
|   |   `-- services/       # API client and shared types
|   |-- package.json
|   `-- tailwind.config.js
|-- LICENSE
`-- README.md
```

## Prerequisites

Make sure you have the following installed:

- Node.js and npm
- Python 3
- MySQL Server
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Runako20004
cd To-Do-List
```

### 2. Configure the backend

Create a virtual environment:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

Install the backend dependencies:

```bash
pip install Flask Flask-Cors Flask-MySQLdb PyJWT python-dotenv mysqlclient
```

Create a `.env` file inside the `backend` directory:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=todo_app
SECRET_KEY=replace_this_with_a_secure_secret_key
```

Initialize the database:

```bash
python init_db.py
```

Start the Flask API:

```bash
python app.py
```

By default, the backend runs at:

```text
http://127.0.0.1:5000
```

### 3. Configure the frontend

Open a new terminal, then install frontend dependencies:

```bash
cd frontend
npm install
```

Optional: create a `frontend/.env` file if your backend URL is different:

```env
REACT_APP_API_URL=http://127.0.0.1:5000
```

Start the React development server:

```bash
npm start
```

The frontend runs at:

```text
http://localhost:3000
```

## API Overview

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/register` | Create a new user account | No |
| `POST` | `/login` | Log in and receive a JWT | No |
| `GET` | `/protected` | Validate authenticated access | Yes |
| `GET` | `/tasks` | Get the current user's tasks | Yes |
| `POST` | `/tasks` | Create a new task | Yes |
| `PUT` | `/tasks/<task_id>` | Update a task | Yes |
| `DELETE` | `/tasks/<task_id>` | Delete a task | Yes |
| `GET` | `/dashboard` | Get dashboard tasks, projects, and statistics | Yes |

Authenticated requests must include:

```text
Authorization: Bearer <token>
```

## Task Data Model

```json
{
  "id": 1,
  "title": "Finish project report",
  "project": "School",
  "priority": "high",
  "due_date": "2026-05-14",
  "completed": false
}
```

## Available Frontend Scripts

Run these commands from the `frontend` directory:

```bash
npm start
```

Starts the development server.

```bash
npm test
```

Runs the test watcher.

```bash
npm run build
```

Builds the app for production.

## Environment Variables

### Backend

| Variable | Description | Default |
| --- | --- | --- |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | Empty string |
| `DB_NAME` | MySQL database name | `todo_app` |
| `SECRET_KEY` | Secret used to sign JWT tokens | Required |

### Frontend

| Variable | Description | Default |
| --- | --- | --- |
| `REACT_APP_API_URL` | Backend API base URL | `http://127.0.0.1:5000` |

## Security Notes

- Keep `.env` files out of version control.
- Use a strong `SECRET_KEY` in production.
- Use a dedicated MySQL user instead of the root user in production.
- Run the frontend and backend behind HTTPS when deployed.
- Review CORS settings before deploying outside local development.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
