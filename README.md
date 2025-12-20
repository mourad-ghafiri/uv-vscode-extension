# UV - Python Package Manager Extension

A powerful, elegant VS Code extension for [UV](https://github.com/astral-sh/uv) — the extremely fast Python package manager.

---

## 📋 Changelog

### v0.3.1 (2025-12-20)

**Fixed:**
- Fixed project name sanitization for folders with spaces (e.g., "My Project" → "my-project")
- Fixed `.python-version` file format (now writes "3.14.2" instead of full ID)
- Fixed GUI templates (Tkinter, PyQt6) not being created correctly
- Fixed shell redirection issue when adding packages with version specifiers
- Fixed empty project template missing `pyproject.toml`
- Fixed progress notification staying stuck after project creation
- Fixed package install hanging indefinitely for invalid packages (added 60s timeout)
- Fixed category selection failing for multi-codepoint emojis (Desktop GUI)
- Fixed `.vscodeignore` excluding template `.gitignore` files

---

### v0.3.0 (2025-12-18)

**Added:**
- **Project Wizard**: 15 project templates across 7 categories
  - Empty Project, Web API (FastAPI, Flask, Django), CLI (Typer, Click)
  - Data Science (Jupyter, Analysis), AI/ML (LangChain, PyTorch, Scikit-Learn)
  - Automation (Scrapy, Playwright), Desktop GUI (Tkinter, PyQt6)
- Dynamic Python version in templates (uses selected version)
- Post-install instructions for each template

**Changed:**
- Simplified dependency management UI (removed redundant prompts)
- Simplified package details page (View on PyPI only)
- Python version management no longer re-prompts after selection

**Fixed:**
- Fixed `uv run` errors with hatchling build system in templates
- Fixed recursive prompts in Python version management

---

### v0.2.0 (2025-12-18)

**Added:**
- UV installation prompt on activation
- Python version selection during project initialization
- Real package details from PyPI API

**Changed:**
- Simplified project initialization with `uv init`
- Enhanced package details UI with VS Code theme colors

**Fixed:**
- Fixed bug where a "list" folder was incorrectly created

---

## ✨ Features

### 🚀 Project Wizard
- **15 Templates**: Choose from Empty, FastAPI, Flask, Django, Typer, Click, Jupyter, Data Analysis, LangChain, PyTorch, Scikit-Learn, Scrapy, Playwright, Tkinter, or PyQt6
- **4-Step Setup**: Category → Template → Project Name → Python Version
- **Working Code**: Each template includes ready-to-run code
- **Dynamic Python Version**: Templates use your selected Python version

### 📦 Dependency Management
- **Add/Remove/Update**: Full package management with version selection
- **Bulk Operations**: Add multiple packages at once
- **PyPI Integration**: View real package details from PyPI
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


---

## 📖 Quick Start

1. **Create a new project**: `Cmd+Shift+P` → `UV: Initialize Project`
2. **Select category**: Choose project type (Web API, CLI, etc.)
3. **Select template**: Pick a specific framework
4. **Choose Python version**: Select or download a version
5. **Start coding**: Project is ready with working code

### Common Commands

| Command | Description |
|---------|-------------|
| `UV: Initialize Project` | Create project with template wizard |
| `UV: Manage Dependencies` | Add, remove, update packages |
| `UV: Manage Python Versions` | Install, switch Python versions |
| `UV: Sync Environment` | Sync dependencies |
| `UV: Run Current File` | Run active Python file |

### Keyboard Shortcuts

- `Cmd+Shift+U` — Sync environment
- `Cmd+Shift+R` — Run current Python file

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