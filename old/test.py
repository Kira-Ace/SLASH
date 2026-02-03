import sqlite3
import bcrypt
import os

def get_db_path(db_name='app_datatest.db'):
    """Get the database path in the database folder."""
    db_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database')
    return os.path.join(db_dir, db_name)

def setup_database():
    conn = sqlite3.connect(get_db_path('app_datatest.db'))
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash BLOB NOT NULL
    )
''')
    
    conn.commit() # save
    conn.close() # close

def register_user(username, password):
    if not username or not password:
        return False, "Field cannot be empty."
    
    #encryption
    secure_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    try:
        conn = sqlite3.connect(get_db_path('app_datatest.db'))
        cursor = conn.cursor()  
        cursor.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', # security
                    (username, secure_password))
        conn.commit()
        conn.close()
        return True, "Account Created!"
    except sqlite3.IntegrityError:
        return False, "Username already exists."


def login_user(username, password):
    conn = sqlite3.connect(get_db_path('app_datatest.db'))
    cursor = conn.cursor()
    
    cursor.execute('SELECT password_hash FROM users WHERE username = ?', (username,))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        stored_hash = result[0]
        
        if bcrypt.checkpw(password.encode('utf-8'), stored_hash):
            return True, "Login Successful."
    
    return False, "Invalid Credentials."
    
def tempfront(username, password):
    print("Register")
    username = input('Username? : ')
    password = input('Password? ')
    success, message = register_user(username, password)
    if success:
        print(message)
    else:
        print(message)

tempfront("", "")