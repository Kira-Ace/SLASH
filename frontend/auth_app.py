import tkinter as tk
from tkinter import ttk, messagebox
from frontend.calendar_window import CalendarWindow
from backend.auth import register_user, login_user


class AuthApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Secure Login System")
        self.root.geometry("300x250")

        tab_control = ttk.Notebook(root)
        
        self.login_tab = ttk.Frame(tab_control)
        self.register_tab = ttk.Frame(tab_control)
        
        tab_control.add(self.login_tab, text='Login')
        tab_control.add(self.register_tab, text='Register')
        tab_control.pack(expand=1, fill="both")

        self.create_login_form()
        self.create_register_form()

    def create_login_form(self):
        tk.Label(self.login_tab, text="Username:").pack(pady=5)
        self.login_user_entry = tk.Entry(self.login_tab)
        self.login_user_entry.pack()

        tk.Label(self.login_tab, text="Password:").pack(pady=5)
        self.login_pass_entry = tk.Entry(self.login_tab, show="*") # show="*" hides pass
        self.login_pass_entry.pack()

        tk.Button(self.login_tab, text="Login", command=self.perform_login).pack(pady=20)

    def create_register_form(self):
        tk.Label(self.register_tab, text="Choose Username:").pack(pady=5)
        self.reg_user_entry = tk.Entry(self.register_tab)
        self.reg_user_entry.pack()

        tk.Label(self.register_tab, text="Choose Password:").pack(pady=5)
        self.reg_pass_entry = tk.Entry(self.register_tab, show="*")
        self.reg_pass_entry.pack()

        tk.Button(self.register_tab, text="Create Account", command=self.perform_register).pack(pady=20)

    def perform_login(self):
        user = self.login_user_entry.get()
        pw = self.login_pass_entry.get()
        success, message = login_user(user, pw)
        
        if success:
            messagebox.showinfo("Success", message)
            self.root.destroy()  # Close the login window
            calendar_app = CalendarWindow(user)  # Open calendar window
            calendar_app.run()
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
