# UV - Python Package Manager Extension

A powerful, elegant VS Code extension for [UV](https://github.com/astral-sh/uv) — the extremely fast Python package manager.

---

## 📋 Changelog

### v0.2.0 (2025-12-18)

**Added:**
- UV installation prompt on activation - prompts to install UV if not found
- Python version selection during project initialization
- Real package details from PyPI API (author, license, dependencies, versions)

**Changed:**
- Simplified project initialization - uses standard `uv init` (creates main.py, .gitignore, pyproject.toml, README.md, .python-version)
- Enhanced package details UI with VS Code theme colors

**Fixed:**
- Fixed bug where a "list" folder was incorrectly created

**Removed:**
- Complex project templates (FastAPI, Flask, etc.) in favor of simple init

---

## ✨ Features

### 🚀 Project Initialization
- **Simple Setup**: Run `UV: Initialize Project` to create a new Python project
- **Python Version Selection**: Choose any Python version during setup (auto-installs if needed)
- **Standard Structure**: Creates `main.py`, `.gitignore`, `pyproject.toml`, and `.venv`
- **UV Installation Check**: Prompts to install UV if not found on your system

### 📦 Dependency Management
- **Add/Remove/Update**: Full package management with version selection
- **Bulk Operations**: Add multiple packages at once
- **PyPI Integration**: View real package details from PyPI (author, license, dependencies, versions)
- **Auto-sync**: Environment syncs automatically after changes

### 🐍 Python Version Management
- **Install Any Version**: Download and install Python versions via UV
- **Switch Versions**: Change Python version and auto-recreate `.venv`
- **Status Bar Integration**: See current Python version at a glance

### 🔧 Virtual Environment
- **Create/Activate**: Manage virtual environments with one click
- **Terminal Integration**: Venv activated in VS Code terminal
- **Environment Tree View**: See all venvs and their status

### 🌐 HTTP Server
- **Quick Server**: Serve any folder as static files
- **Browser Integration**: Open in any detected browser
- **Status Bar Control**: Start/stop from status bar

### 🧪 Testing
- **Run Tests**: With pytest or unittest
- **CodeLens**: Play icons next to test functions
- **Coverage Reports**: HTML, XML, or terminal output

### 📊 Status Bar
- **Project Status**: UV project info always visible
- **Python Version**: Click to manage versions
- **Dependencies Count**: Click to manage packages
- **Quick Actions**: Click for common operations

---

## 🚀 Installation

1. **Install UV** (if not already):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Install this extension** from the VS Code marketplace

3. **Restart VS Code**

---

## 📖 Quick Start

1. **Create a new project**: `Cmd+Shift+P` → `UV: Initialize Project`
2. **Select Python version**: Choose from installed or download a new one
3. **Start coding**: Your project is ready with `main.py` and `.venv`

### Common Commands

| Command | Description |
|---------|-------------|
| `UV: Initialize Project` | Create a new Python project |
| `UV: Manage Dependencies` | Add, remove, update packages |
| `UV: Manage Python Versions` | Install, switch Python versions |
| `UV: Sync Environment` | Sync dependencies |
| `UV: Run Current File` | Run active Python file |
| `UV: Manage Tests` | Run and configure tests |

### Keyboard Shortcuts

- `Cmd+Shift+U` — Sync environment
- `Cmd+Shift+R` — Run current Python file

---

## ⚙️ Configuration

```json
{
  "uv.path": "uv",
  "uv.autoSync": true,
  "uv.showNotifications": true,
  "uv.terminal.integrated": true
}
```

---

## 🛠️ Development

```bash
git clone https://github.com/mourad-ghafiri/uv-vscode-extension.git
cd uv-vscode-extension
npm install
npm run compile
# Press F5 to launch Extension Development Host
```

---

## 📄 License

MIT

---

## 🔗 Links

- [GitHub Repository](https://github.com/mourad-ghafiri/uv-vscode-extension)
- [Report Issues](https://github.com/mourad-ghafiri/uv-vscode-extension/issues)
- [UV Documentation](https://docs.astral.sh/uv/)
- [UV Project](https://github.com/astral-sh/uv)

---

**Made with ❤️ for the Python community**