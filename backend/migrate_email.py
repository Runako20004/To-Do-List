import os

import MySQLdb
from dotenv import load_dotenv


BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))


def column_exists(cursor):
    cursor.execute(
        """
        SELECT COUNT(*) AS count
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA=%s AND TABLE_NAME='users' AND COLUMN_NAME='email'
        """,
        (os.getenv("DB_NAME", "todo_app"),),
    )
    return cursor.fetchone()[0] > 0


def index_exists(cursor):
    cursor.execute(
        """
        SELECT COUNT(*) AS count
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA=%s AND TABLE_NAME='users' AND INDEX_NAME='users_email_unique'
        """,
        (os.getenv("DB_NAME", "todo_app"),),
    )
    return cursor.fetchone()[0] > 0


def main():
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "3306")

    if ":" in db_host:
        db_host, db_port = db_host.split(":", 1)

    connection = MySQLdb.connect(
        host=db_host,
        port=int(db_port),
        user=os.getenv("DB_USER", "root"),
        passwd=os.getenv("DB_PASSWORD", ""),
        db=os.getenv("DB_NAME", "todo_app"),
    )

    cursor = connection.cursor()

    if not column_exists(cursor):
        cursor.execute("ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL AFTER username")

    cursor.execute(
        "UPDATE users SET email = CONCAT('user', id, '@todo.local') WHERE email IS NULL OR email = ''"
    )
    cursor.execute("ALTER TABLE users MODIFY email VARCHAR(255) NOT NULL")

    if not index_exists(cursor):
        cursor.execute("ALTER TABLE users ADD UNIQUE KEY users_email_unique (email)")

    connection.commit()
    cursor.close()
    connection.close()
    print("users.email migration complete")


if __name__ == "__main__":
    main()
