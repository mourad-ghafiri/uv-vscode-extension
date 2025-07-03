import * as vscode from 'vscode';
import { UVExecutor } from './uvExecutor';
import { HTTPServerManager } from './httpServerManager';
import * as cp from 'child_process';

export class UVStatusBar {
    private statusBarItem: vscode.StatusBarItem;
    private uvExecutor: UVExecutor;
    private projectInfoBar: vscode.StatusBarItem;
    private pythonVersionBar: vscode.StatusBarItem;
    private dependenciesBar: vscode.StatusBarItem;
    private venvBar: vscode.StatusBarItem;
    private httpServerBar: vscode.StatusBarItem;
    private httpServerManager: HTTPServerManager;

    private debounceTimer: NodeJS.Timeout | undefined;
    private debounceDelay = 300;
    private httpServerBarClickDisposable: vscode.Disposable | undefined;

    constructor() {
        this.uvExecutor = new UVExecutor();

        // Main UV status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

        // Project info bar
        this.projectInfoBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);

        // Python version bar
        this.pythonVersionBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);

        // Dependencies count bar
        this.dependenciesBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);

        // Virtual environment bar
        this.venvBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 96);

        // HTTP server bar
        this.httpServerBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 95);

        this.httpServerManager = new HTTPServerManager();
        this.httpServerBar.command = undefined;
        this.httpServerBar.show();
        this.httpServerBar.tooltip = 'Start a Python HTTP server (Click to start)';
        this.httpServerBar.show();
        this.updateHttpServerBar();
        this.httpServerManager.onStatusChanged(() => this.updateHttpServerBar());
        this.httpServerBarClickHandler();

        // Initialize with a default state and then update
        this.statusBarItem.text = '$(plus) UV';
        this.statusBarItem.tooltip = 'Initialize UV project - Click to create new project';
        this.statusBarItem.command = 'uv.init';
        this.statusBarItem.show();

        // Update status asynchronously
        this.debouncedUpdateStatus();
    }

    public debouncedUpdateStatus(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.updateStatus();
        }, this.debounceDelay);
    }

    public async forceRefresh(): Promise<void> {
        this.uvExecutor.invalidateAllCaches();
        await this.updateStatus();
    }

    async updateStatus(): Promise<void> {
        try {
            const hasProject = await this.uvExecutor.hasProjectFiles();
            const isUVInstalled = await this.uvExecutor.checkUVInstalled();

            // Main status bar - always show when UV is installed
            if (!isUVInstalled) {
                this.statusBarItem.text = '$(error) UV not found';
                this.statusBarItem.tooltip = 'UV is not installed or not in PATH';
                this.statusBarItem.command = 'uv.help';
                this.statusBarItem.show();
                this.hideProjectBars();
                return;
            }

            // Always show the main status bar item
            if (hasProject) {
                this.statusBarItem.text = '$(check) UV Project';
                this.statusBarItem.tooltip = 'UV project detected - Click for quick actions';
                this.statusBarItem.command = 'uv.showQuickActions';
            } else {
                this.statusBarItem.text = '$(plus) UV';
                this.statusBarItem.tooltip = 'Initialize UV project - Click to create new project';
                this.statusBarItem.command = 'uv.init';
            }

            this.statusBarItem.show();

            // Update project-specific bars
            if (hasProject) {
                await this.updateProjectBars();
            } else {
                this.hideProjectBars();
            }
        } catch (error) {
            console.error('Error in updateStatus:', error);
            // Fallback to default "UV" state
            this.statusBarItem.text = '$(plus) UV';
            this.statusBarItem.tooltip = 'Initialize UV project - Click to create new project';
            this.statusBarItem.command = 'uv.init';
            this.statusBarItem.show();
            this.hideProjectBars();
        }
    }

    private async updateProjectBars(): Promise<void> {
        try {
            // Get project information
            const projectInfo = await this.uvExecutor.getProjectInfo();
            const dependencies = await this.uvExecutor.getDependencies();
            const environments = await this.uvExecutor.getEnvironments();

            // Project info bar
            if (projectInfo && projectInfo.name) {
                this.projectInfoBar.text = `$(folder) ${projectInfo.name}`;
                this.projectInfoBar.tooltip = `UV Project: ${projectInfo.name}`;
                this.projectInfoBar.command = 'uv.tree';
                this.projectInfoBar.show();
            }

            // Python version bar - show current toolchain info
            const pythonVersion = await this.getPythonVersion();
            const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();
            if (pythonVersion) {
                if (currentToolchain) {
                    this.pythonVersionBar.text = `$(python) ${pythonVersion}`;
                    this.pythonVersionBar.tooltip = `Python ${pythonVersion} (${currentToolchain}) - Click to manage versions`;
                } else {
                    this.pythonVersionBar.text = `$(python) ${pythonVersion}`;
                    this.pythonVersionBar.tooltip = `Python ${pythonVersion} - Click to manage versions`;
                }
                this.pythonVersionBar.command = 'uv.python';
                this.pythonVersionBar.show();
            }

            // Dependencies count bar
            const depsCount = dependencies.length;
            this.dependenciesBar.text = `$(package) ${depsCount} deps`;
            this.dependenciesBar.tooltip = `${depsCount} dependencies - Click to manage`;
            this.dependenciesBar.command = 'uv.add';
            this.dependenciesBar.show();

            // Virtual environment bar - enhanced with more details
            const venvStatus = await this.getVenvStatus(environments);
            this.venvBar.text = venvStatus.text;
            this.venvBar.tooltip = venvStatus.tooltip;
            this.venvBar.command = venvStatus.command;
            this.venvBar.show();

        } catch (error) {
            console.error('Error updating project bars:', error);
            this.hideProjectBars();
        }
    }

    private async getPythonVersion(): Promise<string | null> {
        try {
            // First, check project configuration files
            const projectVersion = await this.uvExecutor.getPythonVersionFromFiles();
            if (projectVersion) {
                return projectVersion;
            }

            // Then try to get Python version from UV's managed Python
            const result = await this.uvExecutor.executeCommand(['run', 'python', '--version']);
            if (result.success) {
                // Extract version from output like "Python 3.11.0"
                const match = result.output.match(/Python (\d+\.\d+\.\d+)/);
                return match ? match[1] : null;
            }
        } catch (error) {
            console.error('Error getting Python version:', error);
        }

        // Fallback: try system Python
        try {
            const result = await this.uvExecutor.executeCommand(['python', '--version']);
            if (result.success) {
                const match = result.output.match(/Python (\d+\.\d+\.\d+)/);
                return match ? match[1] : null;
            }
        } catch (error) {
            console.error('Error getting system Python version:', error);
        }

        return null;
    }

    private async getVenvStatus(environments: string[]): Promise<{ text: string; tooltip: string; command: string }> {
        const isVenvActive = await this.isVenvActive();
        const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();
        const pythonVersion = await this.getPythonVersion();

        if (isVenvActive) {
            const toolchainInfo = currentToolchain ? ` (${currentToolchain})` : '';
            const versionInfo = pythonVersion ? ` Python ${pythonVersion}` : '';
            return {
                text: '$(server-environment) venv active',
                tooltip: `Virtual environment is active${versionInfo}${toolchainInfo} - Click to deactivate`,
                command: 'uv.deactivateVenv'
            };
        } else if (environments.length > 0) {
            // Show the first available venv with version info
            const venvName = environments[0];
            const versionInfo = pythonVersion ? ` Python ${pythonVersion}` : '';
            const toolchainInfo = currentToolchain ? ` (${currentToolchain})` : '';
            return {
                text: `$(server-environment) ${venvName}`,
                tooltip: `Virtual environment ${venvName} exists${versionInfo}${toolchainInfo} but not active - Click to activate`,
                command: 'uv.activateVenv'
            };
        } else {
            return {
                text: '$(server-environment) no venv',
                tooltip: 'No virtual environment - Click to create one',
                command: 'uv.venv'
            };
        }
    }

    private async isVenvActive(): Promise<boolean> {
        try {
            // Check if we're in a UV managed environment by checking if UV can run Python
            const result = await this.uvExecutor.executeCommand(['run', 'python', '-c', 'import sys; print(sys.prefix)']);
            if (result.success) {
                const workspaceRoot = this.uvExecutor.getWorkspaceRoot();
                const pythonPrefix = result.output.trim();

                // Check if the Python prefix is within the workspace (indicating a project venv)
                if (workspaceRoot && pythonPrefix.includes(workspaceRoot)) {
                    return true;
                }

                // Also check if VIRTUAL_ENV is set
                const venvResult = await this.uvExecutor.executeCommand(['run', 'python', '-c', 'import os; print(os.environ.get("VIRTUAL_ENV", ""))']);
                return venvResult.success && venvResult.output.trim() !== '';
            }
        } catch (error) {
            console.error('Error checking venv status:', error);
        }
        return false;
    }

    private hideProjectBars(): void {
        this.projectInfoBar.hide();
        this.pythonVersionBar.hide();
        this.dependenciesBar.hide();
        this.venvBar.hide();
        // Do NOT hide the HTTP server bar; it should always be visible
    }

    private updateHttpServerBar(): void {
        if (this.httpServerManager.isRunning()) {
            this.httpServerBar.text = `$(globe) HTTP ${this.httpServerManager.getPort()}`;
            this.httpServerBar.tooltip = `HTTP server running on http://localhost:${this.httpServerManager.getPort()}/ (Click to stop)`;
        } else {
            this.httpServerBar.text = '$(globe) Start HTTP Server';
            this.httpServerBar.tooltip = 'Start a Python HTTP server (Click to start)';
        }
        this.httpServerBar.show();
    }

    public getHttpServerManager(): HTTPServerManager {
        return this.httpServerManager;
    }

    private httpServerBarClickHandler(): void {
        this.httpServerBar.command = undefined;
        this.httpServerBar.show();
        this.httpServerBar.tooltip = this.httpServerBar.tooltip;
        this.httpServerBarClickDisposable?.dispose();
        this.httpServerBarClickDisposable = vscode.commands.registerCommand('uv._internalHttpServerBarClick', async () => {
            if (this.httpServerManager.isRunning()) {
                // Show browser QuickPick
                const browsers = await detectAvailableBrowsers();
                const items: vscode.QuickPickItem[] = browsers.map(b => ({ label: b.name, description: b.cmd }));
                items.push({ label: '$(circle-slash) Stop HTTP Server', description: 'Stop the running HTTP server' });
                const picked = await vscode.window.showQuickPick(items, { placeHolder: 'Open server in browser or stop server' });
                if (!picked) return;
                if (picked.label.includes('Stop HTTP Server')) {
                    this.httpServerManager.stopServer();
                    return;
                }
                // Find the browser object
                const browser = browsers.find(b => b.name === picked.label && b.cmd === picked.description);
                if (!browser) return;
                const url = `http://localhost:${this.httpServerManager.getPort()}/`;
                openInBrowser(browser, url);
            } else {
                vscode.commands.executeCommand('uv.toggleHttpServer');
            }
        });
        this.httpServerBar.command = 'uv._internalHttpServerBarClick';
    }

    dispose(): void {
        this.statusBarItem.dispose();
        this.projectInfoBar.dispose();
        this.pythonVersionBar.dispose();
        this.dependenciesBar.dispose();
        this.venvBar.dispose();
        this.httpServerBar.dispose();
    }
}

async function detectAvailableBrowsers(): Promise<{ name: string, cmd: string }[]> {
    const platform = process.platform;
    const browsers: { name: string, cmd: string }[] = [];
    if (platform === 'darwin') {
        browsers.push({ name: 'Safari', cmd: 'Safari' });
        browsers.push({ name: 'Google Chrome', cmd: 'Google Chrome' });
        browsers.push({ name: 'Firefox', cmd: 'Firefox' });
        browsers.push({ name: 'Microsoft Edge', cmd: 'Microsoft Edge' });
        browsers.push({ name: 'Brave', cmd: 'Brave Browser' });
    } else if (platform === 'win32') {
        browsers.push({ name: 'Edge', cmd: 'msedge' });
        browsers.push({ name: 'Chrome', cmd: 'chrome' });
        browsers.push({ name: 'Firefox', cmd: 'firefox' });
        browsers.push({ name: 'Brave', cmd: 'brave' });
    } else {
        // Linux: check for common browsers in PATH
        const candidates = [
            { name: 'Google Chrome', cmd: 'google-chrome' },
            { name: 'Chromium', cmd: 'chromium' },
            { name: 'Firefox', cmd: 'firefox' },
            { name: 'Brave', cmd: 'brave-browser' }
        ];
        for (const b of candidates) {
            try {
                cp.execSync(`which ${b.cmd}`);
                browsers.push(b);
            } catch { }
        }
    }
    return browsers;
}

function openInBrowser(browser: { name: string, cmd: string }, url: string) {
    const platform = process.platform;
    if (platform === 'darwin') {
        cp.spawn('open', ['-a', browser.cmd, url], { detached: true });
    } else if (platform === 'win32') {
        cp.spawn('cmd', ['/c', 'start', browser.cmd, url], { detached: true });
    } else {
        cp.spawn(browser.cmd, [url], { detached: true });
    }
} 