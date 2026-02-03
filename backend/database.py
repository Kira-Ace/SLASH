import sqlite3
import os


def get_db_path(db_name='app_data.db'):
    """Get the database path in the database folder."""
    db_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database')
    return os.path.join(db_dir, db_name)


def setup_database():
    conn = sqlite3.connect(get_db_path('app_data.db'))
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash BLOB NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
