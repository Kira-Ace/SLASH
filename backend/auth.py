import sqlite3
import bcrypt
import os


def get_db_path(db_name='app_data.db'):
    """Get the database path in the database folder."""
    db_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database')
    return os.path.join(db_dir, db_name)


def register_user(username, password):
    if not username or not password:
        return False, "Fields cannot be empty."
    
    secure_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    try:
        conn = sqlite3.connect(get_db_path('app_data.db'))
        cursor = conn.cursor()
        cursor.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', 
                       (username, secure_password))
        conn.commit()
        conn.close()
        return True, "Account created successfully!"
    except sqlite3.IntegrityError:
        return False, "Username already exists."


def login_user(username, password):
    if not username or not password:
        return False, "Fields cannot be empty."

    conn = sqlite3.connect(get_db_path('app_data.db'))
    cursor = conn.cursor()
    cursor.execute('SELECT password_hash FROM users WHERE username = ?', (username,))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        stored_hash = result[0]
        if bcrypt.checkpw(password.encode('utf-8'), stored_hash):
            return True, "Login Successful!"
    
    return False, "Invalid username or password."
