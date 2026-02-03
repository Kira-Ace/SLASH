import tkinter as tk
from tkinter import ttk
import calendar
from datetime import datetime


class CalendarWindow:
    def __init__(self, username):
        self.username = username
        self.root = tk.Tk()
        self.root.title(f"Calendar - {username}")
        self.root.geometry("400x500")
        
        self.current_date = datetime.now()
        
        self.create_widgets()
        
    def create_widgets(self):
        # Header with username
        header_frame = ttk.Frame(self.root)
        header_frame.pack(pady=10)
        tk.Label(header_frame, text=f"Welcome, {self.username}!", font=("Arial", 14, "bold")).pack()
        
        # Month/Year navigation
        nav_frame = ttk.Frame(self.root)
        nav_frame.pack(pady=10)
        
        tk.Button(nav_frame, text="◀ Previous", command=self.prev_month).pack(side=tk.LEFT, padx=5)
        self.month_year_label = tk.Label(nav_frame, text="", font=("Arial", 12, "bold"), width=20)
        self.month_year_label.pack(side=tk.LEFT, padx=10)
        tk.Button(nav_frame, text="Next ▶", command=self.next_month).pack(side=tk.LEFT, padx=5)
        
        # Calendar display
        self.calendar_frame = ttk.Frame(self.root)
        self.calendar_frame.pack(pady=10, padx=10, fill=tk.BOTH, expand=True)
        
        self.update_calendar()
        
        # Footer with today button
        footer_frame = ttk.Frame(self.root)
        footer_frame.pack(pady=10)
        tk.Button(footer_frame, text="Go to Today", command=self.go_to_today).pack()
        
    def update_calendar(self):
        # Clear previous calendar
        for widget in self.calendar_frame.winfo_children():
            widget.destroy()
        
        # Update month/year label
        self.month_year_label.config(text=self.current_date.strftime("%B %Y"))
        
        # Get calendar for current month
        cal = calendar.monthcalendar(self.current_date.year, self.current_date.month)
        
        # Days of week header
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        for day in days:
            label = tk.Label(self.calendar_frame, text=day, font=("Arial", 10, "bold"), fg="blue")
            label.grid(row=0, column=days.index(day), padx=5, pady=5)
        
        # Calendar days
        today = datetime.now()
        for week_num, week in enumerate(cal, start=1):
            for day_num, day in enumerate(week):
                if day == 0:
                    label = tk.Label(self.calendar_frame, text="")
                else:
                    # Highlight today
                    if (day == today.day and 
                        self.current_date.month == today.month and 
                        self.current_date.year == today.year):
                        label = tk.Label(self.calendar_frame, text=str(day), 
                                        font=("Arial", 11, "bold"), 
                                        fg="white", bg="green", width=4, height=2)
                    else:
                        label = tk.Label(self.calendar_frame, text=str(day), 
                                        font=("Arial", 11), width=4, height=2, 
                                        relief=tk.SUNKEN, borderwidth=1)
                label.grid(row=week_num, column=day_num, padx=2, pady=2)
    
    def prev_month(self):
        if self.current_date.month == 1:
            self.current_date = self.current_date.replace(year=self.current_date.year - 1, month=12)
        else:
            self.current_date = self.current_date.replace(month=self.current_date.month - 1)
        self.update_calendar()
    
    def next_month(self):
        if self.current_date.month == 12:
            self.current_date = self.current_date.replace(year=self.current_date.year + 1, month=1)
        else:
            self.current_date = self.current_date.replace(month=self.current_date.month + 1)
        self.update_calendar()
    
    def go_to_today(self):
        self.current_date = datetime.now()
        self.update_calendar()
    
    def run(self):
        self.root.mainloop()
