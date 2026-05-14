from functools import wraps
import datetime
import os
import re

import jwt
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from flask_mysqldb import MySQL
from werkzeug.security import check_password_hash, generate_password_hash


BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})

# ---------------- MYSQL CONFIG ----------------
db_host = os.getenv("DB_HOST", "localhost")
db_port = os.getenv("DB_PORT", "3306")

if ":" in db_host:
    db_host, db_port = db_host.split(":", 1)

app.config["MYSQL_HOST"] = db_host
if db_port and db_port.isdigit():
    app.config["MYSQL_PORT"] = int(db_port)

app.config["MYSQL_USER"] = os.getenv("DB_USER", "root")
app.config["MYSQL_PASSWORD"] = os.getenv("DB_PASSWORD", "")
app.config["MYSQL_DB"] = os.getenv("DB_NAME", "todo_app")
app.config["MYSQL_CURSORCLASS"] = "DictCursor"

secret_key = os.getenv("SECRET_KEY")
if not secret_key:
    raise RuntimeError("SECRET_KEY is required in .env")
app.config["SECRET_KEY"] = secret_key

mysql = MySQL(app)

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def normalize_task(task):
    due_date = task.get("due_date")
    if due_date:
        due_date = due_date.isoformat()

    return {
        "id": task["id"],
        "title": task["title"],
        "project": task.get("project") or "General",
        "priority": task.get("priority") or "medium",
        "due_date": due_date,
        "completed": bool(task.get("completed", False)),
    }


def parse_due_date(value):
    if value in (None, ""):
        return None

    if not isinstance(value, str):
        raise ValueError("Due date must be a string")

    return datetime.datetime.strptime(value, "%Y-%m-%d").date()


def get_task_or_404(task_id):
    cur = mysql.connection.cursor()
    cur.execute(
        """
        SELECT id, title, project, priority, due_date, completed
        FROM tasks
        WHERE id=%s AND user_id=%s
        """,
        (task_id, g.current_user["id"]),
    )
    task = cur.fetchone()
    cur.close()
    return task


def create_token(user):
    now = datetime.datetime.utcnow()
    return jwt.encode(
        {
            "sub": str(user["id"]),
            "username": user["username"],
            "iat": now,
            "exp": now + datetime.timedelta(hours=2),
        },
        app.config["SECRET_KEY"],
        algorithm="HS256",
    )


def auth_required(route):
    @wraps(route)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"message": "Token missing"}), 401

        try:
            payload = jwt.decode(parts[1], app.config["SECRET_KEY"], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token"}), 401

        cur = mysql.connection.cursor()
        cur.execute("SELECT id, username FROM users WHERE id=%s", (payload["sub"],))
        user = cur.fetchone()
        cur.close()

        if not user:
            return jsonify({"message": "User not found"}), 401

        g.current_user = user
        return route(*args, **kwargs)

    return wrapper


# ---------------- REGISTER ----------------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return jsonify({"message": "Username, email, and password are required"}), 400

    if not EMAIL_PATTERN.match(email):
        return jsonify({"message": "Enter a valid email address"}), 400

    cur = mysql.connection.cursor()
    cur.execute(
        "SELECT username, email FROM users WHERE username=%s OR email=%s",
        (username, email),
    )
    user = cur.fetchone()

    if user:
        cur.close()
        if user["email"] == email:
            return jsonify({"message": "Email is already in use"}), 400
        return jsonify({"message": "Username is already in use"}), 400

    cur.execute(
        "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
        (username, email, generate_password_hash(password)),
    )
    mysql.connection.commit()
    cur.close()

    return jsonify({"message": "User created"}), 201


# ---------------- LOGIN ----------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    cur = mysql.connection.cursor()
    cur.execute("SELECT id, username, password FROM users WHERE username=%s", (username,))
    user = cur.fetchone()
    cur.close()

    if not user or not check_password_hash(user["password"], password):
        return jsonify({"message": "Invalid credentials"}), 401

    return jsonify(
        {
            "token": create_token(user),
            "user": {"id": user["id"], "username": user["username"]},
        }
    )


# ---------------- PROTECTED ROUTE ----------------
@app.route("/protected", methods=["GET"])
@auth_required
def protected():
    return jsonify(
        {
            "message": "Access granted",
            "user": g.current_user,
        }
    )


# ---------------- CREATE TASK ----------------
@app.route("/tasks", methods=["POST"])
@auth_required
def create_task():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    project = (data.get("project") or "General").strip() or "General"
    priority = (data.get("priority") or "medium").strip().lower()

    if not title:
        return jsonify({"message": "Task title is required"}), 400

    if priority not in {"low", "medium", "high"}:
        return jsonify({"message": "Priority must be low, medium, or high"}), 400

    try:
        due_date = parse_due_date(data.get("due_date"))
    except ValueError:
        return jsonify({"message": "Due date must use YYYY-MM-DD format"}), 400

    cur = mysql.connection.cursor()
    cur.execute(
        """
        INSERT INTO tasks (user_id, title, project, priority, due_date, completed)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (g.current_user["id"], title, project, priority, due_date, False),
    )
    mysql.connection.commit()
    task_id = cur.lastrowid
    cur.execute(
        "SELECT id, title, project, priority, due_date, completed FROM tasks WHERE id=%s",
        (task_id,),
    )
    task = cur.fetchone()
    cur.close()

    return jsonify(normalize_task(task)), 201


# ---------------- GET TASKS ----------------
@app.route("/tasks", methods=["GET"])
@auth_required
def get_tasks():
    cur = mysql.connection.cursor()
    cur.execute(
        """
        SELECT id, title, project, priority, due_date, completed
        FROM tasks
        WHERE user_id=%s
        ORDER BY completed ASC, due_date IS NULL, due_date ASC, id DESC
        """,
        (g.current_user["id"],),
    )
    tasks = cur.fetchall()
    cur.close()

    return jsonify([normalize_task(task) for task in tasks])


# ---------------- UPDATE TASK ----------------
@app.route("/tasks/<int:task_id>", methods=["PUT"])
@auth_required
def update_task(task_id):
    data = request.get_json(silent=True) or {}
    updates = []
    values = []

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"message": "Task title cannot be empty"}), 400
        updates.append("title=%s")
        values.append(title)

    if "project" in data:
        project = (data.get("project") or "General").strip() or "General"
        updates.append("project=%s")
        values.append(project)

    if "priority" in data:
        priority = (data.get("priority") or "medium").strip().lower()
        if priority not in {"low", "medium", "high"}:
            return jsonify({"message": "Priority must be low, medium, or high"}), 400
        updates.append("priority=%s")
        values.append(priority)

    if "due_date" in data:
        try:
            due_date = parse_due_date(data.get("due_date"))
        except ValueError:
            return jsonify({"message": "Due date must use YYYY-MM-DD format"}), 400
        updates.append("due_date=%s")
        values.append(due_date)

    if "completed" in data:
        updates.append("completed=%s")
        values.append(bool(data.get("completed")))

    if not updates:
        return jsonify({"message": "No task changes provided"}), 400

    values.extend([task_id, g.current_user["id"]])

    cur = mysql.connection.cursor()
    cur.execute(
        f"UPDATE tasks SET {', '.join(updates)} WHERE id=%s AND user_id=%s",
        tuple(values),
    )
    mysql.connection.commit()

    if cur.rowcount == 0:
        cur.close()
        return jsonify({"message": "Task not found"}), 404

    task = get_task_or_404(task_id)
    cur.close()

    return jsonify(normalize_task(task))


# ---------------- DASHBOARD ----------------
@app.route("/dashboard", methods=["GET"])
@auth_required
def dashboard():
    cur = mysql.connection.cursor()

    cur.execute(
        """
        SELECT id, title, project, priority, due_date, completed
        FROM tasks
        WHERE user_id=%s
        ORDER BY completed ASC, due_date IS NULL, due_date ASC, id DESC
        """,
        (g.current_user["id"],),
    )
    tasks = [normalize_task(task) for task in cur.fetchall()]

    cur.execute(
        """
        SELECT project, COUNT(*) AS total, SUM(completed = 1) AS completed
        FROM tasks
        WHERE user_id=%s
        GROUP BY project
        ORDER BY total DESC, project ASC
        """,
        (g.current_user["id"],),
    )
    projects = [
        {
            "name": row["project"] or "General",
            "total": int(row["total"]),
            "completed": int(row["completed"] or 0),
        }
        for row in cur.fetchall()
    ]

    today = datetime.date.today()
    week_start = today - datetime.timedelta(days=today.weekday())
    week_end = week_start + datetime.timedelta(days=6)
    due_today = 0
    overdue = 0
    due_this_week = 0

    for task in tasks:
        if not task["due_date"] or task["completed"]:
            continue

        due_date = datetime.date.fromisoformat(task["due_date"])
        if due_date == today:
            due_today += 1
        if due_date < today:
            overdue += 1
        if week_start <= due_date <= week_end:
            due_this_week += 1

    total = len(tasks)
    completed = sum(1 for task in tasks if task["completed"])
    high_priority_total = sum(1 for task in tasks if task["priority"] == "high")
    high_priority_completed = sum(
        1 for task in tasks if task["priority"] == "high" and task["completed"]
    )

    cur.close()

    return jsonify(
        {
            "user": g.current_user,
            "tasks": tasks,
            "projects": projects,
            "stats": {
                "total": total,
                "completed": completed,
                "completion_rate": round((completed / total) * 100) if total else 0,
                "due_today": due_today,
                "overdue": overdue,
                "due_this_week": due_this_week,
                "high_priority_total": high_priority_total,
                "high_priority_completed": high_priority_completed,
            },
        }
    )


# ---------------- DELETE TASK ----------------
@app.route("/tasks/<int:task_id>", methods=["DELETE"])
@auth_required
def delete_task(task_id):
    cur = mysql.connection.cursor()
    cur.execute(
        "DELETE FROM tasks WHERE id=%s AND user_id=%s",
        (task_id, g.current_user["id"]),
    )
    mysql.connection.commit()

    if cur.rowcount == 0:
        cur.close()
        return jsonify({"message": "Task not found"}), 404

    cur.close()
    return jsonify({"message": "Task deleted"})


# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True)
