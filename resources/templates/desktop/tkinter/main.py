"""
{{PROJECT_NAME}} - Tkinter Desktop Application
"""
import tkinter as tk
from tkinter import ttk, messagebox


class App(tk.Tk):
    """Main application window."""
    
    def __init__(self):
        super().__init__()
        
        self.title("{{PROJECT_NAME}}")
        self.geometry("400x300")
        self.resizable(True, True)
        
        self._create_widgets()
    
    def _create_widgets(self):
        """Create the UI widgets."""
        # Main frame
        main_frame = ttk.Frame(self, padding=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title label
        title = ttk.Label(
            main_frame,
            text="Welcome to {{PROJECT_NAME}}",
            font=("Helvetica", 16, "bold"),
        )
        title.pack(pady=20)
        
        # Input field
        self.input_var = tk.StringVar()
        input_frame = ttk.Frame(main_frame)
        input_frame.pack(fill=tk.X, pady=10)
        
        ttk.Label(input_frame, text="Name:").pack(side=tk.LEFT)
        ttk.Entry(input_frame, textvariable=self.input_var).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 0)
        )
        
        # Button
        ttk.Button(
            main_frame,
            text="Say Hello",
            command=self._on_button_click,
        ).pack(pady=20)
        
        # Status bar
        self.status = ttk.Label(main_frame, text="Ready")
        self.status.pack(side=tk.BOTTOM, fill=tk.X)
    
    def _on_button_click(self):
        """Handle button click."""
        name = self.input_var.get() or "World"
        messagebox.showinfo("Hello", f"Hello, {name}!")
        self.status.config(text=f"Greeted {name}")


def main():
    """Main entry point."""
    app = App()
    app.mainloop()


if __name__ == "__main__":
    main()
