import tkinter as tk
from backend.database import setup_database
from frontend.auth_app import AuthApp


if __name__ == "__main__":
    setup_database()
    root = tk.Tk()
    app = AuthApp(root)
    root.mainloop()