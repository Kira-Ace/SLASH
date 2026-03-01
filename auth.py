import tkinter as tk
from tkinter import ttk, messagebox
import sqlite3
import bcrypt

# --- BACKEND LOGIC (Database & Security) ---

def setup_database():
    conn = sqlite3.connect('app_data.db')
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

def register_user(username, password):
    if not username or not password:
        return False, "Fields cannot be empty."
    
    # Hash the password
    secure_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    try:
        conn = sqlite3.connect('app_data.db')
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

    conn = sqlite3.connect('app_data.db')
    cursor = conn.cursor()
    cursor.execute('SELECT password_hash FROM users WHERE username = ?', (username,))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        stored_hash = result[0]
        # Compare the plain password with the stored hash
        if bcrypt.checkpw(password.encode('utf-8'), stored_hash):
            return True, "Login Successful!"
    
    return False, "Invalid username or password."


# --- FRONTEND LOGIC (The GUI) ---

class AuthApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Secure Login System")
        self.root.geometry("300x250")

        # Create Tabs for Login and Register
        tab_control = ttk.Notebook(root)
        
        self.login_tab = ttk.Frame(tab_control)
        self.register_tab = ttk.Frame(tab_control)
        
        tab_control.add(self.login_tab, text='Login')
        tab_control.add(self.register_tab, text='Register')
        tab_control.pack(expand=1, fill="both")

        # Build the actual forms
        self.create_login_form()
        self.create_register_form()

    def create_login_form(self):
        # Labels and Entries
        tk.Label(self.login_tab, text="Username:").pack(pady=5)
        self.login_user_entry = tk.Entry(self.login_tab)
        self.login_user_entry.pack()

        tk.Label(self.login_tab, text="Password:").pack(pady=5)
        self.login_pass_entry = tk.Entry(self.login_tab, show="*") # show="*" hides text
        self.login_pass_entry.pack()

        # Button
        tk.Button(self.login_tab, text="Login", command=self.perform_login).pack(pady=20)

    def create_register_form(self):
        # Labels and Entries
        tk.Label(self.register_tab, text="Choose Username:").pack(pady=5)
        self.reg_user_entry = tk.Entry(self.register_tab)
        self.reg_user_entry.pack()

        tk.Label(self.register_tab, text="Choose Password:").pack(pady=5)
        self.reg_pass_entry = tk.Entry(self.register_tab, show="*")
        self.reg_pass_entry.pack()

        # Button
        tk.Button(self.register_tab, text="Create Account", command=self.perform_register).pack(pady=20)

    # --- Button Actions ---

    def perform_login(self):
        user = self.login_user_entry.get()
        pw = self.login_pass_entry.get()
        success, message = login_user(user, pw)
        
        if success:
            messagebox.showinfo("Success", message)
        else:
            messagebox.showerror("Error", message)

    def perform_register(self):
        user = self.reg_user_entry.get()
        pw = self.reg_pass_entry.get()
        success, message = register_user(user, pw)
        
        if success:
            messagebox.showinfo("Success", message)
            self.reg_user_entry.delete(0, tk.END)
            self.reg_pass_entry.delete(0, tk.END)
        else:
            messagebox.showerror("Error", message)

if __name__ == "__main__":
    setup_database()
    root = tk.Tk()
    app = AuthApp(root)
    root.mainloop()