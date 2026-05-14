import os

import MySQLdb
from dotenv import load_dotenv


BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))


def get_db_config(include_db=True):
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "3306")

    if ":" in db_host:
        db_host, db_port = db_host.split(":", 1)

    config = {
        "host": db_host,
        "port": int(db_port),
        "user": os.getenv("DB_USER", "root"),
        "passwd": os.getenv("DB_PASSWORD", ""),
    }

    if include_db:
        config["db"] = os.getenv("DB_NAME", "todo_app")

    return config


def execute_script(cursor, sql):
    for statement in sql.split(";"):
        statement = statement.strip()
        if statement:
            cursor.execute(statement)


def column_exists(cursor, db_name, table_name, column_name):
    cursor.execute(
        """
        SELECT COUNT(*) AS count
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s AND COLUMN_NAME=%s
        """,
        (db_name, table_name, column_name),
    )
    return cursor.fetchone()[0] > 0


def index_exists(cursor, db_name, table_name, index_name):
    cursor.execute(
        """
        SELECT COUNT(*) AS count
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s AND INDEX_NAME=%s
        """,
        (db_name, table_name, index_name),
    )
    return cursor.fetchone()[0] > 0


def add_column_if_missing(cursor, db_name, table_name, column_name, definition):
    if not column_exists(cursor, db_name, table_name, column_name):
        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {definition}")


def add_index_if_missing(cursor, db_name, table_name, index_name, definition):
    if not index_exists(cursor, db_name, table_name, index_name):
        cursor.execute(f"ALTER TABLE {table_name} ADD INDEX {definition}")


def migrate_existing_schema(cursor, db_name):
    add_column_if_missing(
        cursor,
        db_name,
        "tasks",
        "project",
        "project VARCHAR(100) NOT NULL DEFAULT 'General' AFTER title",
    )
    add_column_if_missing(
        cursor,
        db_name,
        "tasks",
        "priority",
        "priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium' AFTER project",
    )
    add_column_if_missing(
        cursor,
        db_name,
        "tasks",
        "due_date",
        "due_date DATE NULL AFTER priority",
    )
    add_index_if_missing(
        cursor,
        db_name,
        "tasks",
        "tasks_due_date_index",
        "tasks_due_date_index (due_date)",
    )
    add_index_if_missing(
        cursor,
        db_name,
        "tasks",
        "tasks_project_index",
        "tasks_project_index (project)",
    )


def main():
    db_name = os.getenv("DB_NAME", "todo_app")

    server_connection = MySQLdb.connect(**get_db_config(include_db=False))
    server_cursor = server_connection.cursor()
    server_cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}`")
    server_connection.commit()
    server_cursor.close()
    server_connection.close()

    connection = MySQLdb.connect(**get_db_config())
    cursor = connection.cursor()

    with open(os.path.join(BASE_DIR, "schema.sql"), encoding="utf-8") as schema_file:
        execute_script(cursor, schema_file.read())

    migrate_existing_schema(cursor, db_name)

    connection.commit()
    cursor.close()
    connection.close()
    print(f"Database '{db_name}' is ready")


if __name__ == "__main__":
    main()
