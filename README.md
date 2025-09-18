# UV - Python Package Manager Extension

An Elegant, and robust universal extension for [uv](https://github.com/astral-sh/uv) — the extremely fast Python package manager. Compatible with VS Code, Cursor, Windsurf, and other VS Code-compatible editors.

---

## ✨ Key Features

### 🚀 Project Initialization & Templates
- **Project Wizard**: Guided, multi-step project creation with rich template selection (Web, API, CLI, Data Science, AI, Microservices, GUI, Full-Stack, Empty).
- **Framework, Database, AI, Test, Cache, and Feature Selection**: Choose frameworks (FastAPI, Flask, Django, Typer, Click, Tkinter, etc.), databases, AI integrations, test frameworks, cache systems, and extra features.
- **Automatic Git Initialization**: Optionally initializes a git repo with a comprehensive `.gitignore`.
- **Automatic Dependency Installation & Sync**: All selected features are installed and synced.

### 📦 Unified Dependency Management
- **Single Interface**: Add, remove, update, and view details for all dependencies.
- **Categorized**: Production, Development, and Optional dependencies with icons and collapsible sections.
- **Bulk Add**: Add multiple packages at once.
- **Version/Source Selection**: Specify version, range, or git repo for each dependency.
- **Rich Details**: Webview with package info, PyPI links, and update/remove actions.
- **Auto-sync**: Environment syncs automatically after changes (configurable).

### 🐍 Python Version Management
- **Install, Switch, Uninstall**: Full control over Python versions (including toolchain selection).
- **Project/Global Versioning**: Set per-project Python version, reflected in `.python-version` and `pyproject.toml`.
- **Automatic Environment Recreation**: Venv is recreated and dependencies re-synced on version switch.
- **Status Bar Integration**: See and manage Python version instantly.

### 🔧 Virtual Environment & Pip Tools
- **Create/Activate/Deactivate venvs**: With one click or command.
- **Integrated Terminal Activation**: venvs activated in VS Code terminal.
- **Pip Interface**: Use pip commands within UV-managed environments.
- **Environment Tree View**: See all venvs and their status.

### 🌐 HTTP Server Control
- **Start/Stop HTTP Server**: Serve any folder as static files using Python's `http.server`.
- **Status Bar Control**: Always-visible globe icon to start/stop server.
- **Folder & Port Selection**: QuickPick for workspace root or any top-level folder, and port input.
- **Browser Integration**: QuickPick to open in any detected browser (Safari, Chrome, Firefox, Edge, Brave, etc.).
- **Error Handling**: Clear messages for port-in-use, Python not found, or server errors.
- **Output Channel**: View server logs and errors in VS Code.

### 🖥️ Status Bar
- **Multi-panel**: Main status, project name, Python version, dependency count, venv status, HTTP server.
- **Always Visible**: Status bar is shown even in empty folders.
- **Quick Actions**: Click main status for a menu of common operations.
- **Debounced Refresh**: Efficient updates on file/environment changes.

### 🗂️ Tree Views
- **Dependencies, Environments, Cache**: Dedicated activity bar views.
- **Collapsible, Real-time**: Grouped, collapsible, and auto-refreshing.
- **Context Menus**: Right-click for quick actions.

### 🧪 Testing Features
- **Run All Tests**: With pytest or unittest fallback.
- **Run Specific Test File/Method**: From context menu or CodeLens play icons.
- **Test Discovery**: Lists all test files and methods.
- **Coverage Reports**: Generate HTML, XML, or terminal coverage.
- **Test Framework Configuration**: Install and configure pytest, unittest, nose2, or hypothesis.
- **Install Common Test Dependencies**: Quick multi-select and install.

### ⚡ Quick Actions & Commands
- **Run Python Files**: Instantly run any `.py` file in UV environment.
- **Run Custom Commands**: In UV-managed shell.
- **Show Dependency Tree**: Visualize all dependencies.
- **Build/Publish/Export**: Package operations for Python projects.
- **Bulk Operations**: Add/update/remove multiple dependencies.
- **Keyboard Shortcuts**: For sync, run, and more.

### 🗄️ Cache & Utilities
- **View Cache Info**: Directory and size.
- **Clean Cache**: One-click cache cleanup.
- **Self Management**: Update/uninstall UV.
- **Help System**: Access UV documentation.

### 🧠 Smart Context Menus & CodeLens
- **Adaptive Menus**: Show relevant actions based on file/type/context.
- **Explorer, Editor, File Menus**: UV actions everywhere you need them.
- **CodeLens Play Icons**: Next to test methods for instant run.

### 🛡️ Performance & Robustness
- **Command Queueing**: Prevents parallel UV command execution for stability.
- **Debounced UI Updates**: Efficient status bar and tree refresh.
- **Error Handling**: User-friendly messages for all error cases.
- **Cross-platform**: Works on macOS, Windows, and Linux.

---

## 🚀 Installation

1. Install UV from [https://github.com/astral-sh/uv](https://github.com/astral-sh/uv)
2. Install this extension from your editor's marketplace:
   - **VS Code**: VS Code Marketplace
   - **Cursor**: Cursor Extension Marketplace
   - **Windsurf**: Windsurf Extension Marketplace
   - **Other VS Code-compatible editors**: Use the `.vsix` file from releases
3. Restart your editor

---

## 📖 Usage

### 🎯 Quick Start

- **Initialize a Project**: `Cmd+Shift+P` (or `Ctrl+Shift+P` on Windows/Linux) → "UV: Initialize Project"
- **Manage Dependencies**: Click the dependencies count in status bar or use "UV: Manage Dependencies"
- **Sync Environment**: Click the UV status bar item or use `Cmd+Shift+U` (or `Ctrl+Shift+U` on Windows/Linux)

### 📊 Status Bar Information

- **Main Status**: UV project status, always visible, click for quick actions.
- **Project Name**: Click to view dependency tree.
- **Python Version**: Click to manage versions.
- **Dependencies Count**: Click to manage dependencies.
- **Venv Status**: Click to activate/deactivate/create venv.
- **HTTP Server**: Click globe icon to start/stop server or open in browser.

### 📂 Tree Views

- **Dependencies**: Grouped by type, with context actions.
- **Environments**: List and manage venvs.
- **Cache**: View and clean cache.

### 🧪 Testing

- **Run All Tests**: "UV: Manage Tests" → "Run All Tests"
- **Run Specific Test**: "UV: Manage Tests" → "Run Specific Test"
- **Run Test File/Method**: Context menu or CodeLens play icon.
- **Coverage**: "Run Tests with Coverage" from test manager.

### ⚙️ Configuration

Settings (in `settings.json` or VS Code UI):

```json
{
  "uv.path": "uv",
  "uv.autoSync": true,
  "uv.showNotifications": true,
  "uv.terminal.integrated": true,
  "uv.cache.enabled": true
}
```

---

## ⌨️ Commands & Shortcuts

- `Cmd+Shift+U` (macOS) / `Ctrl+Shift+U` (Windows/Linux) — Sync environment
- `Cmd+Shift+R` (macOS) / `Ctrl+Shift+R` (Windows/Linux) — Run current Python file with UV

**Command Palette**: All UV features are available via the Command Palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows/Linux), including:
- Project init, dependency management, sync, lock, run, venv, python version, pip, build, publish, cache, version, export, tool, self-management, help, test management, HTTP server, and more.

---

## 🗂️ Context Menus

- **Explorer/File/Editor**: Right-click for UV actions (run, test, manage, etc.), adaptive to file type and context.
- **Project Files**: Special actions for `pyproject.toml`, `uv.toml`.
- **Test Files**: Run test file/method directly.

---

## 🛠️ Development

- Clone, `npm install`, `npm run compile`, F5 to launch Extension Development Host in VS Code, Cursor, or other compatible editors.

---

## 🤝 Contributing

- Fork, branch, code, test, PR.

---

## 📄 License

MIT

---

## 🆘 Support

- [GitHub Issues](https://github.com/mourad-ghafiri/uv-vscode-extension/issues)
- [UV Documentation](https://docs.astral.sh/uv/)
- [UV Project](https://github.com/astral-sh/uv)

---

**Made with ❤️ for the Python community**

---

## 🔧 Editor Compatibility

This extension is designed to work seamlessly across multiple editors:

- ✅ **VS Code** - Full compatibility
- ✅ **Cursor** - Full compatibility  
- ✅ **Windsurf** - Full compatibility
- ✅ **Other VS Code-compatible editors** - Should work with any editor that supports VS Code extensions

The extension uses standard VS Code APIs and should work out of the box in any editor that supports the VS Code extension protocol.