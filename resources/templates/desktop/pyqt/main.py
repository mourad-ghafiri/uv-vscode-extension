"""
{{PROJECT_NAME}} - PyQt6 Desktop Application
"""
import sys
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout,
    QLabel, QLineEdit, QPushButton, QMessageBox,
)
from PyQt6.QtCore import Qt


class MainWindow(QMainWindow):
    """Main application window."""
    
    def __init__(self):
        super().__init__()
        
        self.setWindowTitle("{{PROJECT_NAME}}")
        self.setMinimumSize(400, 300)
        
        self._create_widgets()
    
    def _create_widgets(self):
        """Create the UI widgets."""
        # Central widget
        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setContentsMargins(40, 40, 40, 40)
        
        # Title
        title = QLabel("Welcome to {{PROJECT_NAME}}")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setStyleSheet("font-size: 18px; font-weight: bold;")
        layout.addWidget(title)
        
        layout.addSpacing(20)
        
        # Input field
        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText("Enter your name...")
        layout.addWidget(self.input_field)
        
        layout.addSpacing(10)
        
        # Button
        button = QPushButton("Say Hello")
        button.clicked.connect(self._on_button_click)
        layout.addWidget(button)
        
        layout.addStretch()
        
        # Status label
        self.status = QLabel("Ready")
        self.status.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.status)
    
    def _on_button_click(self):
        """Handle button click."""
        name = self.input_field.text() or "World"
        QMessageBox.information(self, "Hello", f"Hello, {name}!")
        self.status.setText(f"Greeted {name}")


def main():
    """Main entry point."""
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
