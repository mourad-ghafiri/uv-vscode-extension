# UV - Python Package Manager Extension

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=MouradGHAFIRI.uv-vscode-extension)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> A powerful VS Code extension for [UV](https://github.com/astral-sh/uv) — the extremely fast Python package manager.

**Features at a glance:** Project templates • Dependency management • Python version switching • Virtual environments • HTTP server • Testing • And more!

---

## 📋 Changelog

### v1.0.0 (2025-12-20) 🎉

**First stable release!** A comprehensive VS Code extension for UV, the extremely fast Python package manager.

**✨ Core Features:**
- **Project Wizard** — 15 templates across 7 categories (Web API, CLI, Data Science, AI/ML, Automation, Desktop GUI)
- **Dependency Management** — Add, remove, update packages with PyPI integration and auto-sync
- **Python Version Management** — Install, list, and switch Python versions with automatic venv recreation
- **Virtual Environments** — Create, activate, and manage venvs with terminal integration
- **Run with UV** — Execute Python files from Play button, context menu, or command palette
- **Testing** — Run pytest/unittest with coverage reports
- **HTTP Server** — Serve static files with browser integration
- **Build & Publish** — Build packages and publish to PyPI
- **Status Bar** — Project info, Python version, dependencies, venv status always visible

**🖥️ UI Features:**
- Sidebar tree views for dependencies, environments, and cache
- Right-click context menus for Python files
- Play button dropdown with "Run with UV" option
- Quick Actions menu for common operations

---

### v0.4.1 (2025-12-20)

**Fixed:**
- Fixed `.python-version` writing full toolchain ID instead of version number when switching Python versions

---

### v0.4.0 (2025-12-20)

**Added:**
- "Run with UV" option in the Play button dropdown menu for Python files

---

### v0.3.2 (2025-12-20)

**Fixed:**
- Fixed UV not detected after installation until full VS Code restart
- Changed "Reload Window" to "Restart VS Code" after UV installation to properly refresh PATH

---

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

### 🚀 Project Wizard — Start Projects in Seconds

Create fully-configured Python projects with a 4-step wizard:

| Category | Templates |
|----------|-----------|
| **Empty** | Minimal Python project |
| **Web API** | FastAPI, Flask, Django |
| **CLI** | Typer, Click |
| **Data Science** | Jupyter, Data Analysis |
| **AI/ML** | LangChain, PyTorch, Scikit-Learn |
| **Automation** | Scrapy, Playwright |
| **Desktop GUI** | Tkinter, PyQt6 |

Each template includes working code, proper dependencies, and your selected Python version.

---

### 📦 Dependency Management — Full Package Control

| Feature | Description |
|---------|-------------|
| **Add Packages** | Production, dev, or optional dependencies with version selection |
| **Remove Packages** | One-click removal with confirmation |
| **Update Packages** | Update individual or all packages |
| **Bulk Add** | Add multiple packages at once (comma-separated) |
| **PyPI Details** | View package info, homepage, and documentation |
| **Dependency Tree** | Visualize all dependencies and their relationships |
| **Auto-sync** | Environment syncs automatically after changes |

**Tree View:** See all your dependencies in the sidebar explorer panel.

---

### 🐍 Python Version Management

| Feature | Description |
|---------|-------------|
| **List Versions** | See installed and available Python versions |
| **Install Version** | Download any Python version directly via UV |
| **Switch Version** | Change project Python version with auto-venv recreation |
| **Toolchain Info** | View detailed toolchain information |

---

### 🔧 Virtual Environments

- **Create venv** — Create `.venv` with your chosen Python version
- **Activate/Deactivate** — Manage venv state with one click
- **Terminal Integration** — Venv auto-activated in VS Code terminal
- **Explorer View** — See all environments in the sidebar

---

### ▶️ Run Python Files

- **Run with UV** — Available in the Play button dropdown
- **Right-click Run** — Run any `.py` file from context menu
- **Interactive Run** — Run custom commands with `uv run`

---

### 🧪 Testing

- **Run Test File** — Execute tests with pytest or unittest
- **Run Test Method** — Run individual test functions
- **Manage Tests** — Configure test settings
- **Coverage Reports** — Generate HTML, XML, or terminal coverage

---

### 🌐 HTTP Server

- **Quick Start** — Serve any folder as static files
- **Browser Support** — Open in Safari, Chrome, Firefox, Edge, or Brave
- **Status Bar** — Start/stop server from status bar

---

### 📦 Build & Publish

- **Build Package** — Build your package for distribution
- **Publish** — Publish to PyPI or other registries
- **Export Lockfile** — Export dependencies to requirements format

---

### 📊 Status Bar Integration

Always-visible information at a glance:

| Item | Action on Click |
|------|-----------------|
| **UV Project** | Show quick actions |
| **Python Version** | Manage Python versions |
| **Dependencies** | Manage dependencies |
| **venv Status** | Activate/create venv |
| **HTTP Server** | Start/stop server |

---

### 🔧 Additional Commands

| Command | Description |
|---------|-------------|
| `UV: Sync Environment` | Sync dependencies with lockfile |
| `UV: Update Lockfile` | Update uv.lock file |
| `UV: Manage Cache` | View and clean UV cache |
| `UV: Pip Interface` | Access pip-compatible commands |
| `UV: Run Tools` | Run Python tools (`uvx`) |
| `UV: Self Management` | Update UV itself |
| `UV: Show Help` | View UV documentation |
---

## 📖 Quick Start

### 1. Install UV (if needed)

The extension will prompt you to install UV if not found. Or install manually:

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Create a New Project

1. Open Command Palette: `Cmd+Shift+P` (macOS) / `Ctrl+Shift+P` (Windows/Linux)
2. Run `UV: Initialize Project`
3. Select a category and template
4. Enter project name
5. Choose Python version
6. Start coding!

### 3. Keyboard Shortcuts

| Shortcut | Command |
|----------|---------|
| `Cmd+Shift+U` | Sync environment |
| `Cmd+Shift+R` | Run current Python file |

---

## 📋 All Commands

| Command | Description |
|---------|-------------|
| `UV: Initialize Project` | Create new project with template wizard |
| `UV: Manage Dependencies` | Add, remove, update packages |
| `UV: Bulk Add Dependencies` | Add multiple packages at once |
| `UV: Show Dependency Details` | View package info from PyPI |
| `UV: Show Dependency Tree` | Visualize dependency graph |
| `UV: Manage Python Versions` | Install, switch Python versions |
| `UV: Create Virtual Environment` | Create new venv |
| `UV: Activate Virtual Environment` | Activate venv in terminal |
| `UV: Sync Environment` | Sync dependencies |
| `UV: Update Lockfile` | Update uv.lock |
| `UV: Run with UV` | Run current Python file |
| `UV: Run Command (Interactive)` | Run custom uv command |
| `UV: Run Test File` | Run tests in file |
| `UV: Run HTTP Server` | Start/stop HTTP server |
| `UV: Build Package` | Build for distribution |
| `UV: Publish Package` | Publish to PyPI |
| `UV: Export Lockfile` | Export to requirements.txt |
| `UV: Manage Cache` | View and clean cache |
| `UV: Quick Actions` | Show all actions menu |

---

## 🔧 Requirements

- **VS Code** 1.85.0 or higher
- **UV** (will prompt to install if not found)

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

MIT License — see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- [📦 VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=MouradGHAFIRI.uv-vscode-extension)
- [🐙 GitHub Repository](https://github.com/mourad-ghafiri/uv-vscode-extension)
- [🐛 Report Issues](https://github.com/mourad-ghafiri/uv-vscode-extension/issues)
- [📚 UV Documentation](https://docs.astral.sh/uv/)
- [⚡ UV Project](https://github.com/astral-sh/uv)

---

<p align="center">
  <strong>Made with ❤️ for the Python community</strong><br>
  <sub>by <a href="https://github.com/mourad-ghafiri">Mourad GHAFIRI</a></sub>
</p>