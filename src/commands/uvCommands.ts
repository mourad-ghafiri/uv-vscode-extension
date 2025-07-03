import * as vscode from 'vscode';
import { UVExecutor } from '../uvExecutor';
import { UVStatusBar } from '../statusBar';
import { TemplateManager } from '../templates/templateManager';
import * as path from 'path';

export class UVCommands {
    public templateManager: TemplateManager;

    constructor(private uvExecutor: UVExecutor, private statusBar?: UVStatusBar) {
        this.templateManager = new TemplateManager(uvExecutor);
    }

    async init(): Promise<void> {
        await this.templateManager.createProjectWithTemplate();
    }

    async selectPythonVersionForProject(): Promise<void> {
        const allVersions = await this.uvExecutor.listAllPythonArches();
        const installed = allVersions.filter(v => v.status === 'installed');
        const available = allVersions.filter(v => v.status === 'available');

        const items: vscode.QuickPickItem[] = [];

        // Installed versions
        if (installed.length > 0) {
            items.push({ label: 'Installed Python Versions', kind: vscode.QuickPickItemKind.Separator });
            for (const v of installed) {
                items.push({
                    label: `Python ${v.version}`,
                    description: 'Installed and ready to use',
                });
            }
        }

        // Available versions
        if (available.length > 0) {
            items.push({ label: 'Available for Download', kind: vscode.QuickPickItemKind.Separator });
            for (const v of available) {
                items.push({
                    label: `Python ${v.version}`,
                    description: 'Available for download',
                });
            }
        }

        // Skip option
        items.push({ label: 'Skip for now', description: 'Use default Python version' });

        const pick = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a Python version for this project (optional)',
        });

        if (!pick || pick.label === 'Skip for now') {
            return;
        }

        // Parse version
        const versionMatch = pick.label.match(/Python ([\d.abrc]+)/);
        const version = versionMatch ? versionMatch[1] : undefined;
        if (!version) return;

        const selected = allVersions.find(v => v.version === version);
        if (!selected) return;

        // If available, install first
        if (selected.status === 'available') {
            const installOk = await this.uvExecutor.installPythonVersion(selected.id);
            if (!installOk) {
                vscode.window.showErrorMessage(`Failed to install Python ${version}`);
                return;
            }
        }

        // Set the Python version for the project
        const ok = await this.uvExecutor.switchProjectPythonVersion(version);
        if (ok) {
            vscode.window.showInformationMessage(`Project configured to use Python ${version}`);
            // Update status bar
            if (this.statusBar) {
                await this.statusBar.updateStatus();
            }
        } else {
            vscode.window.showErrorMessage(`Failed to configure Python ${version} for the project`);
        }
    }

    async add(): Promise<void> {
        // This method will be replaced by the new dependencies management interface
        await this.manageDependencies();
    }

    async remove(item?: any): Promise<void> {
        // This method will be replaced by the new dependencies management interface
        await this.manageDependencies();
    }

    async manageDependencies(): Promise<void> {
        const dependencies = await this.uvExecutor.getDependencies();
        const dependencyInfos = await this.getDetailedDependenciesList(dependencies);

        // Group dependencies by type
        const productionDeps = dependencyInfos.filter(d => d.type === 'production');
        const devDeps = dependencyInfos.filter(d => d.type === 'development');
        const optionalDeps = dependencyInfos.filter(d => d.type === 'optional');

        const items: vscode.QuickPickItem[] = [];

        // Production Dependencies
        if (productionDeps.length > 0) {
            items.push({ label: 'Production Dependencies', kind: vscode.QuickPickItemKind.Separator });
            for (const dep of productionDeps) {
                items.push({
                    label: `$(package) ${dep.name}`,
                    description: `Version: ${dep.version || 'latest'}${dep.outdated ? ' (outdated)' : ''}`,
                    detail: dep.description || 'Production dependency'
                });
            }
        }

        // Development Dependencies
        if (devDeps.length > 0) {
            items.push({ label: 'Development Dependencies', kind: vscode.QuickPickItemKind.Separator });
            for (const dep of devDeps) {
                items.push({
                    label: `$(tools) ${dep.name}`,
                    description: `Version: ${dep.version || 'latest'}${dep.outdated ? ' (outdated)' : ''}`,
                    detail: dep.description || 'Development dependency'
                });
            }
        }

        // Optional Dependencies
        if (optionalDeps.length > 0) {
            items.push({ label: 'Optional Dependencies', kind: vscode.QuickPickItemKind.Separator });
            for (const dep of optionalDeps) {
                items.push({
                    label: `$(star) ${dep.name}`,
                    description: `Version: ${dep.version || 'latest'}${dep.outdated ? ' (outdated)' : ''}`,
                    detail: dep.description || 'Optional dependency'
                });
            }
        }

        // Actions
        items.push({ label: '$(add) Add New Dependency', description: 'Add a new package to the project' });
        items.push({ label: '$(refresh) Refresh List', description: 'Refresh dependencies list' });
        items.push({ label: '$(sync) Sync Environment', description: 'Sync the project environment' });

        const pick = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a dependency to manage or choose an action',
        });
        if (!pick) return;

        // Handle actions
        if (pick.label.includes('Add New Dependency')) {
            await this.addNewDependency();
            return;
        }

        if (pick.label.includes('Refresh List')) {
            await this.manageDependencies();
            return;
        }

        if (pick.label.includes('Sync Environment')) {
            await this.sync();
            return;
        }

        // Handle dependency selection
        const depName = this.extractDependencyName(pick.label);
        if (!depName) return;

        const selectedDep = dependencyInfos.find(d => d.name === depName);
        if (!selectedDep) return;

        // Show actions for the selected dependency
        await this.showDependencyActions(selectedDep);
    }

    private async getDetailedDependenciesList(dependencies: string[]): Promise<any[]> {
        const dependencyInfos: any[] = [];

        for (const dep of dependencies) {
            try {
                // Try to get detailed information about each dependency
                const depInfo = await this.getDependencyInfo(dep);
                dependencyInfos.push(depInfo);
            } catch (error) {
                // Fallback to basic info
                dependencyInfos.push({
                    name: dep,
                    type: 'production',
                    version: 'unknown',
                    description: `Python package: ${dep}`,
                    outdated: false
                });
            }
        }

        return dependencyInfos;
    }

    private async getDependencyInfo(depName: string): Promise<any> {
        // This is a simplified implementation
        // In a real implementation, you'd query PyPI or use UV's API
        return {
            name: depName,
            type: 'production', // Default to production
            version: 'latest',
            description: `Python package: ${depName}`,
            outdated: false
        };
    }

    private extractDependencyName(label: string): string | null {
        // Extract package name from label like "$(package) requests" or "$(tools) pytest"
        const match = label.match(/\$\([^)]+\)\s+(.+)/);
        return match ? match[1] : null;
    }

    private async showDependencyActions(dependency: any): Promise<void> {
        const actions = [
            { label: '$(refresh) Update Package', description: `Update ${dependency.name} to latest version` },
            { label: '$(remove) Remove Package', description: `Remove ${dependency.name} from project` },
            { label: '$(info) Show Details', description: `View detailed information about ${dependency.name}` },
            { label: '$(link-external) View on PyPI', description: `Open ${dependency.name} page on PyPI` },
            { label: '$(cancel) Cancel', description: 'Go back to dependencies list' }
        ];

        const action = await vscode.window.showQuickPick(actions, {
            placeHolder: `What do you want to do with ${dependency.name}?`
        });

        if (!action) return;

        switch (action.label) {
            case '$(refresh) Update Package':
                await this.updateDependency(dependency.name);
                break;
            case '$(remove) Remove Package':
                await this.removeDependency(dependency.name);
                break;
            case '$(info) Show Details':
                await this.showDependencyDetails(dependency);
                break;
            case '$(link-external) View on PyPI':
                vscode.env.openExternal(vscode.Uri.parse(`https://pypi.org/project/${dependency.name}/`));
                break;
            case '$(cancel) Cancel':
                await this.manageDependencies();
                break;
        }
    }

    private async addNewDependency(): Promise<void> {
        // Show dependency type selection first
        const depType = await vscode.window.showQuickPick([
            { label: '$(package) Production Dependency', description: 'Required for runtime', value: 'production' },
            { label: '$(tools) Development Dependency', description: 'For testing and building', value: 'development' },
            { label: '$(star) Optional Dependency', description: 'For additional features', value: 'optional' }
        ], {
            placeHolder: 'Select dependency type'
        });

        if (!depType) {
            await this.manageDependencies();
            return;
        }

        // Get package name with search suggestions
        const packageName = await vscode.window.showInputBox({
            prompt: `Enter package name to add as ${depType.label}`,
            placeHolder: 'requests, numpy, pandas...',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Package name is required';
                }
                if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                    return 'Package name can only contain letters, numbers, hyphens, and underscores';
                }
                return null;
            }
        });

        if (!packageName) {
            await this.manageDependencies();
            return;
        }

        // Get version specification
        const versionSpec = await vscode.window.showQuickPick([
            { label: 'Latest version', description: 'Use the latest available version', value: '' },
            { label: 'Specific version', description: 'e.g., 2.28.0', value: 'specific' },
            { label: 'Version range', description: 'e.g., >=2.0,<3.0', value: 'range' },
            { label: 'Git repository', description: 'Install from git', value: 'git' }
        ], {
            placeHolder: 'Select version specification'
        });

        let version = '';
        if (versionSpec && versionSpec.value !== '') {
            if (versionSpec.value === 'specific') {
                version = await vscode.window.showInputBox({
                    prompt: 'Enter specific version (e.g., 2.28.0)',
                    placeHolder: '2.28.0'
                }) || '';
            } else if (versionSpec.value === 'range') {
                version = await vscode.window.showInputBox({
                    prompt: 'Enter version range (e.g., >=2.0,<3.0)',
                    placeHolder: '>=2.0,<3.0'
                }) || '';
            } else if (versionSpec.value === 'git') {
                version = await vscode.window.showInputBox({
                    prompt: 'Enter git repository URL',
                    placeHolder: 'https://github.com/user/repo.git'
                }) || '';
            }
        }

        // Build the package specification
        let packageSpec = packageName;
        if (version) {
            if (versionSpec?.value === 'git') {
                packageSpec = `${packageName} @ git+${version}`;
            } else {
                packageSpec = `${packageName}${version}`;
            }
        }

        // Build command arguments
        const args = ['add', packageSpec];
        if (depType.value === 'development') {
            args.push('--dev');
        } else if (depType.value === 'optional') {
            args.push('--optional');
        }

        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Adding ${packageName}...`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0 });

            const result = await this.uvExecutor.executeCommand(args);

            if (result.success) {
                const message = `Added ${packageName} successfully as ${depType.label}`;
                vscode.window.showInformationMessage(message);

                // Auto-sync if enabled
                const config = vscode.workspace.getConfiguration('uv');
                if (config.get<boolean>('autoSync', true)) {
                    progress.report({ increment: 50, message: 'Syncing environment...' });
                    await this.sync();
                } else {
                    // Update status bar even if auto-sync is disabled
                    if (this.statusBar) {
                        await this.statusBar.updateStatus();
                    }
                }
            } else {
                vscode.window.showErrorMessage(`Failed to add ${packageName}: ${result.error}`);
            }
        });

        // Return to dependencies management
        await this.manageDependencies();
    }

    private async removeDependency(packageName: string): Promise<void> {
        // Confirm removal
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to remove ${packageName}?`,
            { modal: true },
            'Remove',
            'Cancel'
        );

        if (confirm !== 'Remove') {
            await this.manageDependencies();
            return;
        }

        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Removing ${packageName}...`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0 });

            const result = await this.uvExecutor.executeCommand(['remove', packageName]);

            if (result.success) {
                vscode.window.showInformationMessage(`Removed ${packageName} successfully`);

                // Auto-sync if enabled
                const config = vscode.workspace.getConfiguration('uv');
                if (config.get<boolean>('autoSync', true)) {
                    progress.report({ increment: 50, message: 'Syncing environment...' });
                    await this.sync();
                } else {
                    // Update status bar even if auto-sync is disabled
                    if (this.statusBar) {
                        await this.statusBar.updateStatus();
                    }
                }
            } else {
                vscode.window.showErrorMessage(`Failed to remove ${packageName}: ${result.error}`);
            }
        });

        // Return to dependencies management
        await this.manageDependencies();
    }

    async sync(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Syncing UV environment...',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Installing dependencies...' });

            const result = await this.uvExecutor.executeCommand(['sync']);

            if (result.success) {
                progress.report({ increment: 100, message: 'Environment synced successfully' });
                vscode.window.showInformationMessage('Environment synced successfully');

                // Update status bar
                if (this.statusBar) {
                    await this.statusBar.updateStatus();
                }
            } else {
                vscode.window.showErrorMessage(`Failed to sync environment: ${result.error}`);
            }
        });
    }

    async lock(): Promise<void> {
        const result = await this.uvExecutor.executeCommand(['lock']);

        if (result.success) {
            vscode.window.showInformationMessage('Lockfile updated successfully');
        } else {
            vscode.window.showErrorMessage(`Failed to update lockfile: ${result.error}`);
        }
    }

    async run(): Promise<void> {
        // First check if we have a project and virtual environment
        const hasProject = await this.uvExecutor.hasProjectFiles();
        if (!hasProject) {
            vscode.window.showErrorMessage('No UV project found. Please initialize a project first.');
            return;
        }

        // Get current environment info for feedback
        const pythonVersion = await this.uvExecutor.getCurrentVenvPythonVersion();
        const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();
        const envInfo = pythonVersion ?
            `Python ${pythonVersion}${currentToolchain ? ` (${currentToolchain})` : ''}` :
            'UV managed environment';

        // Show run options
        const runOptions = [
            { label: '$(file) Run Python File', description: 'Run a specific Python file', value: 'file' },
            { label: '$(terminal) Run Custom Command', description: 'Run any command in UV environment', value: 'custom' },
            { label: '$(list) Show Available Commands', description: 'View all available UV commands', value: 'help' },
            { label: '$(play) Common Commands', description: 'Quick access to common commands', value: 'common' }
        ];

        const option = await vscode.window.showQuickPick(runOptions, {
            placeHolder: `Select run option (using ${envInfo})`
        });

        if (!option) return;

        switch (option.value) {
            case 'file':
                await this.runPythonFile();
                break;
            case 'custom':
                await this.runCustomCommand(envInfo);
                break;
            case 'help':
                await this.showUVHelp();
                break;
            case 'common':
                await this.runCommonCommand(envInfo);
                break;
        }
    }

    private async runPythonFile(): Promise<void> {
        // Get Python files from the workspace
        const pythonFiles = await vscode.workspace.findFiles('**/*.py', '**/node_modules/**');

        if (pythonFiles.length === 0) {
            vscode.window.showInformationMessage('No Python files found in the workspace');
            return;
        }

        const fileOptions = pythonFiles.map(file => ({
            label: `$(file) ${path.basename(file.fsPath)}`,
            description: vscode.workspace.asRelativePath(file.fsPath),
            detail: `Run ${path.basename(file.fsPath)}`,
            file: file
        }));

        const selectedFile = await vscode.window.showQuickPick(fileOptions, {
            placeHolder: 'Select a Python file to run'
        });

        if (!selectedFile) return;

        const relativePath = vscode.workspace.asRelativePath(selectedFile.file);

        // Show environment info before running
        const pythonVersion = await this.uvExecutor.getCurrentVenvPythonVersion();
        const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();
        const envInfo = pythonVersion ?
            `Python ${pythonVersion}${currentToolchain ? ` (${currentToolchain})` : ''}` :
            'UV managed environment';

        vscode.window.showInformationMessage(`Running ${relativePath} with ${envInfo}...`);

        await this.uvExecutor.executeInTerminal(['run', 'python', relativePath]);

        // Update status bar after running
        if (this.statusBar) {
            await this.statusBar.updateStatus();
        }
    }

    private async runCustomCommand(envInfo: string): Promise<void> {
        const command = await vscode.window.showInputBox({
            prompt: 'Enter command to run in UV environment',
            placeHolder: 'python main.py, pytest, black .',
            value: `# Using ${envInfo}`
        });

        if (!command) return;

        // Remove the comment line if present
        const cleanCommand = command.replace(/^#.*$/gm, '').trim();
        if (!cleanCommand) return;

        vscode.window.showInformationMessage(`Running command in ${envInfo}...`);

        await this.uvExecutor.executeInTerminal(['run', ...cleanCommand.split(' ')]);

        // Update status bar after running
        if (this.statusBar) {
            await this.statusBar.updateStatus();
        }
    }

    private async showUVHelp(): Promise<void> {
        const result = await this.uvExecutor.executeCommand(['help']);

        if (result.success) {
            const document = await vscode.workspace.openTextDocument({
                content: result.output,
                language: 'plaintext'
            });
            await vscode.window.showTextDocument(document);
        } else {
            vscode.window.showErrorMessage(`Failed to show UV help: ${result.error}`);
        }
    }

    private async runCommonCommand(envInfo: string): Promise<void> {
        const commonCommands = [
            { label: '$(play) Run Tests', description: 'Run all tests with pytest', command: 'pytest' },
            { label: '$(refresh) Run Tests (verbose)', description: 'Run tests with verbose output', command: 'pytest -v' },
            { label: '$(search) Run Tests (coverage)', description: 'Run tests with coverage', command: 'pytest --cov' },
            { label: '$(check) Lint Code', description: 'Run black formatter', command: 'black .' },
            { label: '$(check) Check Code', description: 'Run flake8 linter', command: 'flake8' },
            { label: '$(sync) Install Dependencies', description: 'Install all dependencies', command: 'pip install -r requirements.txt' },
            { label: '$(list) List Packages', description: 'List installed packages', command: 'pip list' },
            { label: '$(info) Show Python Version', description: 'Show current Python version', command: 'python --version' },
            { label: '$(terminal) Custom Command', description: 'Enter a custom command', command: 'custom' }
        ];

        const selected = await vscode.window.showQuickPick(commonCommands, {
            placeHolder: `Select common command (using ${envInfo})`
        });

        if (!selected) return;

        if (selected.command === 'custom') {
            await this.runCustomCommand(envInfo);
            return;
        }

        vscode.window.showInformationMessage(`Running ${selected.description} in ${envInfo}...`);

        await this.uvExecutor.executeInTerminal(['run', ...selected.command.split(' ')]);

        // Update status bar after running
        if (this.statusBar) {
            await this.statusBar.updateStatus();
        }
    }

    async runFile(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;

        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const filePath = activeEditor.document.uri.fsPath;
        const fileName = activeEditor.document.fileName;

        // Check if it's a Python file
        if (!fileName.endsWith('.py')) {
            vscode.window.showErrorMessage('Active file is not a Python file');
            return;
        }

        // Check if we have a project
        const hasProject = await this.uvExecutor.hasProjectFiles();
        if (!hasProject) {
            vscode.window.showErrorMessage('No UV project found. Please initialize a project first.');
            return;
        }

        // Get the relative path from workspace root
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace root found');
            return;
        }

        const relativePath = vscode.workspace.asRelativePath(filePath);

        // Get current environment info for feedback
        const pythonVersion = await this.uvExecutor.getCurrentVenvPythonVersion();
        const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();

        const envInfo = pythonVersion ?
            `Python ${pythonVersion}${currentToolchain ? ` (${currentToolchain})` : ''}` :
            'UV managed environment';

        // Run the file with UV
        await this.uvExecutor.executeInTerminal(['run', 'python', relativePath]);

        vscode.window.showInformationMessage(`Running ${relativePath} with ${envInfo}`);

        // Update status bar after running
        if (this.statusBar) {
            await this.statusBar.updateStatus();
        }
    }

    async tree(): Promise<void> {
        const result = await this.uvExecutor.executeCommand(['tree']);

        if (result.success) {
            const document = await vscode.workspace.openTextDocument({
                content: result.output,
                language: 'plaintext'
            });
            await vscode.window.showTextDocument(document);
        } else {
            vscode.window.showErrorMessage(`Failed to show dependency tree: ${result.error}`);
        }
    }

    async venv(): Promise<void> {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter virtual environment name',
            placeHolder: '.venv'
        });

        if (!name) {
            return;
        }

        const result = await this.uvExecutor.executeCommand(['venv', name]);

        if (result.success) {
            vscode.window.showInformationMessage(`Virtual environment ${name} created successfully`);

            // Update status bar after creating venv
            if (this.statusBar) {
                await this.statusBar.updateStatus();
            }
        } else {
            vscode.window.showErrorMessage(`Failed to create virtual environment: ${result.error}`);
        }
    }

    async python(): Promise<void> {
        const allVersions = await this.uvExecutor.listAllPythonArches();
        const currentVersion = await this.uvExecutor.getCurrentVenvPythonVersion();
        const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();
        const projectVersion = await this.uvExecutor.getPythonVersionFromFiles();

        // Group versions
        const active = allVersions.filter(v => v.status === 'installed' && v.version === currentVersion);
        const installed = allVersions.filter(v => v.status === 'installed' && v.version !== currentVersion);
        const available = allVersions.filter(v => v.status === 'available');

        const items: vscode.QuickPickItem[] = [];

        // Current Active Toolchain
        if (currentToolchain) {
            items.push({ label: 'Current Active Toolchain', kind: vscode.QuickPickItemKind.Separator });
            items.push({
                label: `$(check) ${currentToolchain}`,
                description: `Active in project (Python ${currentVersion || 'unknown'})`,
            });
        }

        // Active
        if (active.length > 0) {
            items.push({ label: 'Active Version', kind: vscode.QuickPickItemKind.Separator });
            for (const v of active) {
                items.push({
                    label: `$(check) Python ${v.version}`,
                    description: `Active in venv (${v.id})`,
                });
            }
        }

        // Installed
        if (installed.length > 0) {
            items.push({ label: 'Installed Versions', kind: vscode.QuickPickItemKind.Separator });
            for (const v of installed) {
                items.push({
                    label: `Python ${v.version}`,
                    description: `Installed (${v.id})`,
                });
            }
        }

        // Available
        if (available.length > 0) {
            items.push({ label: 'Available for Download', kind: vscode.QuickPickItemKind.Separator });
            for (const v of available) {
                items.push({
                    label: `Python ${v.version}`,
                    description: `Available for download (${v.id})`,
                });
            }
        }

        // Project Configuration
        if (projectVersion) {
            items.push({ label: 'Project Configuration', kind: vscode.QuickPickItemKind.Separator });
            items.push({
                label: `$(gear) Project requires Python ${projectVersion}`,
                description: 'Configured in project files',
            });
        }

        // Actions
        items.push({ label: '$(refresh) Refresh List', description: 'Refresh Python versions list' });
        items.push({ label: '$(add) Install Specific Version', description: 'Install a specific Python version' });
        items.push({ label: '$(info) Show Toolchain Info', description: 'Show detailed toolchain information' });

        const pick = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a Python version to use, install, or uninstall',
        });
        if (!pick) return;

        // Handle refresh
        if (pick.label.includes('Refresh')) {
            await this.python();
            return;
        }

        // Handle install specific version
        if (pick.label.includes('Install Specific Version')) {
            await this.installSpecificPythonVersion();
            return;
        }

        // Handle show toolchain info
        if (pick.label.includes('Show Toolchain Info')) {
            await this.showToolchainInfo();
            return;
        }

        // Parse version or toolchain ID
        const versionMatch = pick.label.match(/Python ([\d.abrc]+)/);
        const toolchainMatch = pick.label.match(/\$\(check\) (.+)/);

        let version: string | undefined;
        let selected: any = undefined;

        if (versionMatch) {
            version = versionMatch[1];
            selected = allVersions.find(v => v.version === version);
        } else if (toolchainMatch) {
            // This is a toolchain ID
            const toolchainId = toolchainMatch[1];
            selected = allVersions.find(v => v.id === toolchainId);
            if (selected) {
                version = selected.version;
            }
        }

        if (!version || !selected) return;

        // If available, install
        if (selected.status === 'available') {
            const ok = await this.uvExecutor.installPythonVersion(selected.id);
            if (ok) {
                vscode.window.showInformationMessage(`Installed Python ${version}`);
                await this.python();
            } else {
                vscode.window.showErrorMessage(`Failed to install Python ${version}`);
            }
            return;
        }

        // If installed, offer to use or uninstall
        if (selected.status === 'installed') {
            const action = await vscode.window.showQuickPick([
                { label: 'Use this version in project', description: `Switch project to Python ${version} (${selected.id})` },
                { label: 'Uninstall this version', description: `Remove Python ${version} from system` },
                { label: 'Cancel', description: '' }
            ], { placeHolder: `What do you want to do with Python ${version}?` });
            if (!action || action.label === 'Cancel') return;

            if (action.label.startsWith('Use')) {
                const ok = await this.uvExecutor.switchProjectPythonVersion(version);
                if (ok) {
                    // Update status bar and refresh
                    if (this.statusBar) {
                        await this.statusBar.updateStatus();
                    }
                    // Refresh the Python versions list
                    await this.python();
                } else {
                    vscode.window.showErrorMessage(`Failed to switch to Python ${version}`);
                }
            } else if (action.label.startsWith('Uninstall')) {
                const confirm = await vscode.window.showWarningMessage(
                    `Are you sure you want to uninstall Python ${version}?`,
                    { modal: true },
                    'Uninstall',
                    'Cancel'
                );

                if (confirm === 'Uninstall') {
                    const ok = await this.uvExecutor.uninstallPythonVersion(selected.id);
                    if (ok) {
                        vscode.window.showInformationMessage(`Uninstalled Python ${version}`);
                        await this.python();
                    } else {
                        vscode.window.showErrorMessage(`Failed to uninstall Python ${version}`);
                    }
                }
            }
        }

        // If version is not found in any list, offer to install it
        if (!selected) {
            const action = await vscode.window.showQuickPick([
                { label: 'Try to install this version', description: `Attempt to install Python ${version}` },
                { label: 'Cancel', description: '' }
            ], { placeHolder: `Python ${version} not found. What would you like to do?` });

            if (action && action.label.startsWith('Try to install')) {
                // Try to install using the version string directly
                const ok = await this.uvExecutor.installPythonVersion(version);
                if (ok) {
                    vscode.window.showInformationMessage(`Installed Python ${version}`);
                    await this.python();
                } else {
                    vscode.window.showErrorMessage(`Failed to install Python ${version}. It may not be available.`);
                }
            }
        }
    }

    async pip(): Promise<void> {
        // Check if we have a project
        const hasProject = await this.uvExecutor.hasProjectFiles();
        if (!hasProject) {
            vscode.window.showErrorMessage('No UV project found. Please initialize a project first.');
            return;
        }

        // Get current environment info for feedback
        const pythonVersion = await this.uvExecutor.getCurrentVenvPythonVersion();
        const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();
        const envInfo = pythonVersion ?
            `Python ${pythonVersion}${currentToolchain ? ` (${currentToolchain})` : ''}` :
            'UV managed environment';

        const command = await vscode.window.showInputBox({
            prompt: 'Enter pip command',
            placeHolder: 'install requests',
            value: `# Using ${envInfo}`
        });

        if (!command) {
            return;
        }

        // Show environment info before running
        vscode.window.showInformationMessage(`Running pip command in ${envInfo}...`);

        await this.uvExecutor.executeInTerminal(['pip', ...command.split(' ')]);

        // Update status bar after running pip command
        if (this.statusBar) {
            await this.statusBar.updateStatus();
        }
    }

    async build(): Promise<void> {
        const result = await this.uvExecutor.executeCommand(['build']);

        if (result.success) {
            vscode.window.showInformationMessage('Package built successfully');
        } else {
            vscode.window.showErrorMessage(`Failed to build package: ${result.error}`);
        }
    }

    async publish(): Promise<void> {
        const result = await this.uvExecutor.executeCommand(['publish']);

        if (result.success) {
            vscode.window.showInformationMessage('Package published successfully');
        } else {
            vscode.window.showErrorMessage(`Failed to publish package: ${result.error}`);
        }
    }

    async cache(): Promise<void> {
        const action = await vscode.window.showQuickPick(['dir', 'clean'], {
            placeHolder: 'Select cache action'
        });

        if (!action) {
            return;
        }

        if (action === 'dir') {
            const result = await this.uvExecutor.executeCommand(['cache', 'dir']);
            if (result.success) {
                vscode.window.showInformationMessage(`Cache directory: ${result.output.trim()}`);
            }
        } else if (action === 'clean') {
            const result = await this.uvExecutor.executeCommand(['cache', 'clean']);
            if (result.success) {
                vscode.window.showInformationMessage('Cache cleaned successfully');
            } else {
                vscode.window.showErrorMessage(`Failed to clean cache: ${result.error}`);
            }
        }
    }

    async version(): Promise<void> {
        const action = await vscode.window.showQuickPick(['read', 'update'], {
            placeHolder: 'Select version action'
        });

        if (!action) {
            return;
        }

        if (action === 'read') {
            const result = await this.uvExecutor.executeCommand(['version']);
            if (result.success) {
                vscode.window.showInformationMessage(`Current version: ${result.output.trim()}`);
            }
        } else if (action === 'update') {
            const newVersion = await vscode.window.showInputBox({
                prompt: 'Enter new version',
                placeHolder: '1.0.0'
            });
            if (newVersion) {
                const result = await this.uvExecutor.executeCommand(['version', newVersion]);
                if (result.success) {
                    vscode.window.showInformationMessage(`Version updated to ${newVersion}`);
                } else {
                    vscode.window.showErrorMessage(`Failed to update version: ${result.error}`);
                }
            }
        }
    }

    async export(): Promise<void> {
        const format = await vscode.window.showQuickPick(['requirements.txt', 'poetry.lock'], {
            placeHolder: 'Select export format'
        });

        if (!format) {
            return;
        }

        const args = ['export'];
        if (format === 'requirements.txt') {
            args.push('--format', 'requirements');
        } else if (format === 'poetry.lock') {
            args.push('--format', 'poetry');
        }

        const result = await this.uvExecutor.executeCommand(args);

        if (result.success) {
            const document = await vscode.workspace.openTextDocument({
                content: result.output,
                language: 'plaintext'
            });
            await vscode.window.showTextDocument(document);
        } else {
            vscode.window.showErrorMessage(`Failed to export: ${result.error}`);
        }
    }

    async tool(): Promise<void> {
        // Check if we have a project
        const hasProject = await this.uvExecutor.hasProjectFiles();
        if (!hasProject) {
            vscode.window.showErrorMessage('No UV project found. Please initialize a project first.');
            return;
        }

        // Get current environment info for feedback
        const pythonVersion = await this.uvExecutor.getCurrentVenvPythonVersion();
        const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();
        const envInfo = pythonVersion ?
            `Python ${pythonVersion}${currentToolchain ? ` (${currentToolchain})` : ''}` :
            'UV managed environment';

        const toolName = await vscode.window.showInputBox({
            prompt: 'Enter tool name',
            placeHolder: 'black',
            value: `# Using ${envInfo}`
        });

        if (!toolName) {
            return;
        }

        // Show environment info before running
        vscode.window.showInformationMessage(`Running tool ${toolName} in ${envInfo}...`);

        await this.uvExecutor.executeInTerminal(['tool', 'run', toolName]);

        // Update status bar after running tool
        if (this.statusBar) {
            await this.statusBar.updateStatus();
        }
    }

    async self(): Promise<void> {
        const action = await vscode.window.showQuickPick(['update', 'uninstall'], {
            placeHolder: 'Select self action'
        });

        if (!action) {
            return;
        }

        await this.uvExecutor.executeInTerminal(['self', action]);
    }

    async help(): Promise<void> {
        const result = await this.uvExecutor.executeCommand(['help']);

        if (result.success) {
            const document = await vscode.workspace.openTextDocument({
                content: result.output,
                language: 'plaintext'
            });
            await vscode.window.showTextDocument(document);
        } else {
            vscode.window.showErrorMessage(`Failed to show help: ${result.error}`);
        }
    }

    async showQuickActions(): Promise<void> {
        const actions = [

            { label: '$(sync) Sync Environment', command: 'uv.sync' },
            { label: '$(add) Add Dependencies', command: 'uv.add' },
            { label: '$(add) Bulk Add Dependencies', command: 'uv.bulkAdd' },
            { label: '$(list-tree) Show Dependency Tree', command: 'uv.tree' },
            { label: '$(server-environment) Create Virtual Environment', command: 'uv.venv' },
            { label: '$(play) Run Command', command: 'uv.run' },
            { label: '$(lock) Update Lockfile', command: 'uv.lock' },
            { label: '$(python) Manage Python Versions', command: 'uv.python' },
            { label: '$(beaker) Manage Tests', command: 'uv.manageTests' },
            { label: '$(package) Build Package', command: 'uv.build' },
            { label: '$(database) Manage Cache', command: 'uv.cache' }
        ];

        const selected = await vscode.window.showQuickPick(actions, {
            placeHolder: 'Select a UV action to perform'
        });

        if (selected) {
            vscode.commands.executeCommand(selected.command);
        }
    }

    async activateVenv(): Promise<void> {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace root found');
            return;
        }

        // Get environments using UVExecutor's method
        const environments = await this.uvExecutor.getAvailableEnvironments(workspaceRoot);

        if (environments.length === 0) {
            vscode.window.showErrorMessage('No virtual environments found. Create one first.');
            return;
        }

        let selectedEnv = environments[0];
        if (environments.length > 1) {
            const picked = await vscode.window.showQuickPick(
                environments.map(e => ({ label: e.name, description: e.activateScript, env: e })),
                { placeHolder: 'Select virtual environment to activate' }
            );
            if (!picked) return;
            selectedEnv = picked.env;
        }

        // Get environment info for feedback
        const pythonVersion = await this.uvExecutor.getCurrentVenvPythonVersion();
        const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();
        const envInfo = pythonVersion ?
            `Python ${pythonVersion}${currentToolchain ? ` (${currentToolchain})` : ''}` :
            'UV managed environment';

        // Activate virtual environment in terminal
        const terminal = vscode.window.createTerminal({
            name: `UV Virtual Environment (${selectedEnv.name})`,
            cwd: workspaceRoot
        });

        terminal.show();

        // Use the full path to the activation script
        if (process.platform === 'win32') {
            terminal.sendText(`"${selectedEnv.activateScript}"`);
        } else {
            terminal.sendText(`source "${selectedEnv.activateScript}"`);
        }

        vscode.window.showInformationMessage(`Activated virtual environment: ${selectedEnv.name} (${envInfo})`);

        // Update status bar after activation
        if (this.statusBar) {
            await this.statusBar.updateStatus();
        }
    }

    async deactivateVenv(): Promise<void> {
        const terminal = vscode.window.activeTerminal;
        if (terminal) {
            terminal.sendText('deactivate');
            vscode.window.showInformationMessage('Deactivated virtual environment');

            // Update status bar after deactivation
            if (this.statusBar) {
                await this.statusBar.updateStatus();
            }
        } else {
            vscode.window.showErrorMessage('No active terminal found');
        }
    }

    async showDependencyDetails(dependency: any): Promise<void> {
        if (!dependency || !dependency.name) {
            vscode.window.showErrorMessage('Invalid dependency information');
            return;
        }

        // Create a webview to show dependency details
        const panel = vscode.window.createWebviewPanel(
            'dependencyDetails',
            `Dependency: ${dependency.name}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Get detailed information about the dependency
        const depInfo = await this.getDetailedDependencyInfo(dependency.name);

        panel.webview.html = this.getDependencyDetailsHtml(depInfo);

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'update':
                        await this.updateDependency(dependency.name);
                        break;
                    case 'remove':
                        await this.remove(dependency);
                        break;
                    case 'openPyPI':
                        vscode.env.openExternal(vscode.Uri.parse(`https://pypi.org/project/${dependency.name}/`));
                        break;
                }
            }
        );
    }

    private async getDetailedDependencyInfo(packageName: string): Promise<any> {
        // This would typically query PyPI API or use UV's internal data
        // For now, return mock data
        return {
            name: packageName,
            version: '1.0.0',
            description: `Detailed information about ${packageName}`,
            homepage: `https://pypi.org/project/${packageName}/`,
            author: 'Unknown',
            license: 'MIT',
            requires: ['python>=3.7'],
            classifiers: ['Development Status :: 5 - Production/Stable'],
            lastUpdated: new Date().toISOString()
        };
    }

    private getDependencyDetailsHtml(depInfo: any): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${depInfo.name}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
                    .header { border-bottom: 1px solid #e1e4e8; padding-bottom: 10px; margin-bottom: 20px; }
                    .title { font-size: 24px; font-weight: bold; margin: 0; }
                    .version { color: #586069; font-size: 14px; }
                    .description { margin: 20px 0; line-height: 1.6; }
                    .actions { margin: 20px 0; }
                    .btn { padding: 8px 16px; margin-right: 10px; border: none; border-radius: 6px; cursor: pointer; }
                    .btn-primary { background: #0366d6; color: white; }
                    .btn-danger { background: #d73a49; color: white; }
                    .btn-secondary { background: #f1f3f4; color: #24292e; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
                    .info-item { padding: 10px; background: #f6f8fa; border-radius: 6px; }
                    .info-label { font-weight: bold; color: #24292e; }
                    .info-value { color: #586069; margin-top: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="title">${depInfo.name}</h1>
                    <div class="version">Version: ${depInfo.version}</div>
                </div>
                
                <div class="description">
                    ${depInfo.description}
                </div>
                
                <div class="actions">
                    <button class="btn btn-primary" onclick="updateDependency()">Update Package</button>
                    <button class="btn btn-secondary" onclick="openPyPI()">View on PyPI</button>
                    <button class="btn btn-danger" onclick="removeDependency()">Remove Package</button>
                </div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Author</div>
                        <div class="info-value">${depInfo.author}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">License</div>
                        <div class="info-value">${depInfo.license}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Python Version</div>
                        <div class="info-value">${depInfo.requires.join(', ')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Last Updated</div>
                        <div class="info-value">${new Date(depInfo.lastUpdated).toLocaleDateString()}</div>
                    </div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function updateDependency() {
                        vscode.postMessage({ command: 'update' });
                    }
                    
                    function removeDependency() {
                        if (confirm('Are you sure you want to remove this dependency?')) {
                            vscode.postMessage({ command: 'remove' });
                        }
                    }
                    
                    function openPyPI() {
                        vscode.postMessage({ command: 'openPyPI' });
                    }
                </script>
            </body>
            </html>
        `;
    }

    async updateDependency(packageName?: string): Promise<void> {
        if (!packageName) {
            // Get current dependencies for selection
            const dependencies = await this.uvExecutor.getDependencies();

            if (dependencies.length === 0) {
                vscode.window.showInformationMessage('No dependencies to update');
                return;
            }

            const selected = await vscode.window.showQuickPick(
                dependencies.map(dep => ({ label: dep, description: 'Click to update' })),
                {
                    placeHolder: 'Select package to update'
                }
            );

            if (!selected) {
                return;
            }

            packageName = selected.label;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Updating ${packageName}...`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Checking for updates...' });

            // Use UV's update command
            const result = await this.uvExecutor.executeCommand(['update', packageName]);

            if (result.success) {
                progress.report({ increment: 100, message: 'Package updated successfully' });
                vscode.window.showInformationMessage(`Updated ${packageName} successfully`);

                // Auto-sync if enabled
                const config = vscode.workspace.getConfiguration('uv');
                if (config.get<boolean>('autoSync', true)) {
                    await this.sync();
                } else {
                    // Update status bar even if auto-sync is disabled
                    if (this.statusBar) {
                        await this.statusBar.updateStatus();
                    }
                }
            } else {
                vscode.window.showErrorMessage(`Failed to update ${packageName}: ${result.error}`);
            }
        });
    }

    async bulkAdd(): Promise<void> {
        const packages = await vscode.window.showInputBox({
            prompt: 'Enter package names separated by commas',
            placeHolder: 'requests, numpy, pandas, matplotlib',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'At least one package name is required';
                }
                const packages = value.split(',').map(p => p.trim());
                for (const pkg of packages) {
                    if (!/^[a-zA-Z0-9_-]+$/.test(pkg)) {
                        return `Invalid package name: ${pkg}`;
                    }
                }
                return null;
            }
        });

        if (!packages) {
            return;
        }

        const packageList = packages.split(',').map(p => p.trim());

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Adding ${packageList.length} packages...`,
            cancellable: false
        }, async (progress) => {
            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < packageList.length; i++) {
                const pkg = packageList[i];
                progress.report({
                    increment: (100 / packageList.length),
                    message: `Adding ${pkg}... (${i + 1}/${packageList.length})`
                });

                const result = await this.uvExecutor.executeCommand(['add', pkg]);
                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            if (successCount > 0) {
                vscode.window.showInformationMessage(
                    `Added ${successCount} packages successfully${failCount > 0 ? `, ${failCount} failed` : ''}`
                );

                // Auto-sync if enabled
                const config = vscode.workspace.getConfiguration('uv');
                if (config.get<boolean>('autoSync', true)) {
                    await this.sync();
                } else {
                    // Update status bar even if auto-sync is disabled
                    if (this.statusBar) {
                        await this.statusBar.updateStatus();
                    }
                }
            } else {
                vscode.window.showErrorMessage('Failed to add any packages');
            }
        });
    }

    async manageTests(): Promise<void> {
        const testActions = [
            { label: '$(play) Run All Tests', description: 'Run all tests in the project', value: 'run-all' },
            { label: '$(search) Run Specific Test', description: 'Run a specific test file or function', value: 'run-specific' },
            { label: '$(refresh) Run Tests with Coverage', description: 'Run tests with coverage report', value: 'run-coverage' },
            { label: '$(list-tree) Discover Tests', description: 'Discover and list all tests in project', value: 'discover' },
            { label: '$(gear) Configure Test Framework', description: 'Configure pytest or other test frameworks', value: 'configure' },
            { label: '$(sync) Install Test Dependencies', description: 'Install testing dependencies', value: 'install-deps' },
            { label: '$(cancel) Cancel', description: 'Go back', value: 'cancel' }
        ];

        const action = await vscode.window.showQuickPick(testActions, {
            placeHolder: 'Select a test action to perform'
        });

        if (!action || action.value === 'cancel') return;

        switch (action.value) {
            case 'run-all':
                await this.runAllTests();
                break;
            case 'run-specific':
                await this.runSpecificTest();
                break;
            case 'run-coverage':
                await this.runTestsWithCoverage();
                break;
            case 'discover':
                await this.discoverTests();
                break;
            case 'configure':
                await this.configureTestFramework();
                break;
            case 'install-deps':
                await this.installTestDependencies();
                break;
        }
    }

    async runAllTests(): Promise<void> {
        // Check if we have a project
        const hasProject = await this.uvExecutor.hasProjectFiles();
        if (!hasProject) {
            vscode.window.showErrorMessage('No UV project found. Please initialize a project first.');
            return;
        }

        // Get current environment info for feedback
        const pythonVersion = await this.uvExecutor.getCurrentVenvPythonVersion();
        const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();
        const envInfo = pythonVersion ?
            `Python ${pythonVersion}${currentToolchain ? ` (${currentToolchain})` : ''}` :
            'UV managed environment';

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Running all tests in ${envInfo}...`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Discovering tests...' });

            // Try to run tests with pytest first, then fallback to unittest
            let result = await this.uvExecutor.executeCommand(['run', 'pytest', '-v']);

            if (!result.success) {
                progress.report({ increment: 50, message: 'Trying unittest...' });
                result = await this.uvExecutor.executeCommand(['run', 'python', '-m', 'unittest', 'discover', '-v']);
            }

            if (result.success) {
                progress.report({ increment: 100, message: 'Tests completed' });

                // Show results in output channel
                const outputChannel = vscode.window.createOutputChannel('UV Tests');
                outputChannel.show();
                outputChannel.appendLine('=== Test Results ===');
                outputChannel.appendLine(result.output);

                vscode.window.showInformationMessage('Tests completed successfully');
            } else {
                vscode.window.showErrorMessage(`Failed to run tests: ${result.error}`);
            }
        });

        // Update status bar after running tests
        if (this.statusBar) {
            await this.statusBar.updateStatus();
        }
    }

    async runSpecificTest(): Promise<void> {
        // Check if we have a project
        const hasProject = await this.uvExecutor.hasProjectFiles();
        if (!hasProject) {
            vscode.window.showErrorMessage('No UV project found. Please initialize a project first.');
            return;
        }

        // Get test files from the project
        const testFiles = await this.discoverTestFiles();

        if (testFiles.length === 0) {
            vscode.window.showInformationMessage('No test files found in the project');
            return;
        }

        const selectedFile = await vscode.window.showQuickPick(
            testFiles.map(file => ({
                label: file.name,
                description: file.path,
                detail: file.type
            })),
            { placeHolder: 'Select a test file to run' }
        );

        if (!selectedFile) return;

        // Get current environment info for feedback
        const pythonVersion = await this.uvExecutor.getCurrentVenvPythonVersion();
        const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();
        const envInfo = pythonVersion ?
            `Python ${pythonVersion}${currentToolchain ? ` (${currentToolchain})` : ''}` :
            'UV managed environment';

        // Ask for specific test function if it's a pytest file
        let testFunction = '';
        if (selectedFile.detail === 'pytest') {
            const input = await vscode.window.showInputBox({
                prompt: 'Enter specific test function (optional)',
                placeHolder: 'test_example_function',
                value: ''
            });
            testFunction = input || '';
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Running tests in ${selectedFile.label} (${envInfo})...`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Running specific test...' });

            let command: string[];
            if (testFunction) {
                command = ['run', 'pytest', selectedFile.description, '-k', testFunction, '-v'];
            } else {
                command = ['run', 'pytest', selectedFile.description, '-v'];
            }

            const result = await this.uvExecutor.executeCommand(command);

            if (result.success) {
                progress.report({ increment: 100, message: 'Test completed' });

                const outputChannel = vscode.window.createOutputChannel('UV Tests');
                outputChannel.show();
                outputChannel.appendLine(`=== Test Results for ${selectedFile.label} ===`);
                outputChannel.appendLine(result.output);

                vscode.window.showInformationMessage('Test completed successfully');
            } else {
                vscode.window.showErrorMessage(`Failed to run test: ${result.error}`);
            }
        });

        // Update status bar after running tests
        if (this.statusBar) {
            await this.statusBar.updateStatus();
        }
    }

    async runTestsWithCoverage(): Promise<void> {
        // Check if we have a project
        const hasProject = await this.uvExecutor.hasProjectFiles();
        if (!hasProject) {
            vscode.window.showErrorMessage('No UV project found. Please initialize a project first.');
            return;
        }

        const coverageOptions = [
            { label: 'HTML Report', description: 'Generate HTML coverage report', value: 'html' },
            { label: 'XML Report', description: 'Generate XML coverage report', value: 'xml' },
            { label: 'Terminal Report', description: 'Show coverage in terminal only', value: 'term' }
        ];

        const option = await vscode.window.showQuickPick(coverageOptions, {
            placeHolder: 'Select coverage report type'
        });

        if (!option) return;

        // Get current environment info for feedback
        const pythonVersion = await this.uvExecutor.getCurrentVenvPythonVersion();
        const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();
        const envInfo = pythonVersion ?
            `Python ${pythonVersion}${currentToolchain ? ` (${currentToolchain})` : ''}` :
            'UV managed environment';

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Running tests with coverage in ${envInfo}...`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Installing coverage...' });

            // Ensure coverage is installed
            await this.uvExecutor.executeCommand(['add', 'coverage', '--dev']);

            progress.report({ increment: 30, message: 'Running tests with coverage...' });

            let command: string[];
            if (option.value === 'html') {
                command = ['run', 'coverage', 'run', '-m', 'pytest'];
            } else if (option.value === 'xml') {
                command = ['run', 'coverage', 'run', '-m', 'pytest'];
            } else {
                command = ['run', 'coverage', 'run', '-m', 'pytest'];
            }

            const result = await this.uvExecutor.executeCommand(command);

            if (result.success) {
                progress.report({ increment: 70, message: 'Generating coverage report...' });

                let reportCommand: string[];
                if (option.value === 'html') {
                    reportCommand = ['run', 'coverage', 'html'];
                } else if (option.value === 'xml') {
                    reportCommand = ['run', 'coverage', 'xml'];
                } else {
                    reportCommand = ['run', 'coverage', 'report'];
                }

                const reportResult = await this.uvExecutor.executeCommand(reportCommand);

                if (reportResult.success) {
                    progress.report({ increment: 100, message: 'Coverage report generated' });

                    const outputChannel = vscode.window.createOutputChannel('UV Tests');
                    outputChannel.show();
                    outputChannel.appendLine('=== Coverage Report ===');
                    outputChannel.appendLine(reportResult.output);

                    if (option.value === 'html') {
                        vscode.window.showInformationMessage('HTML coverage report generated. Check htmlcov/index.html');
                    } else {
                        vscode.window.showInformationMessage('Coverage report generated successfully');
                    }
                } else {
                    vscode.window.showErrorMessage(`Failed to generate coverage report: ${reportResult.error}`);
                }
            } else {
                vscode.window.showErrorMessage(`Failed to run tests with coverage: ${result.error}`);
            }
        });

        // Update status bar after running tests
        if (this.statusBar) {
            await this.statusBar.updateStatus();
        }
    }

    async discoverTests(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Discovering tests...',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Scanning for test files...' });

            const testFiles = await this.discoverTestFiles();

            if (testFiles.length === 0) {
                progress.report({ increment: 100, message: 'No tests found' });
                vscode.window.showInformationMessage('No test files found in the project');
                return;
            }

            progress.report({ increment: 100, message: 'Tests discovered' });

            // Show test discovery results
            const document = await vscode.workspace.openTextDocument({
                content: this.formatTestDiscoveryResults(testFiles),
                language: 'markdown'
            });
            await vscode.window.showTextDocument(document);

            vscode.window.showInformationMessage(`Found ${testFiles.length} test files`);
        });
    }

    async configureTestFramework(): Promise<void> {
        const frameworks = [
            { label: '$(check) pytest', description: 'Most popular Python testing framework', value: 'pytest' },
            { label: '$(check) unittest', description: 'Python built-in testing framework', value: 'unittest' },
            { label: '$(check) nose2', description: 'Next generation of nose', value: 'nose2' }
        ];

        const framework = await vscode.window.showQuickPick(frameworks, {
            placeHolder: 'Select test framework to configure'
        });

        if (!framework) return;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Configuring ${framework.label}...`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Installing test framework...' });

            // Install the selected framework
            const result = await this.uvExecutor.executeCommand(['add', framework.value, '--dev']);

            if (result.success) {
                progress.report({ increment: 50, message: 'Creating configuration...' });

                // Create basic configuration
                await this.createTestConfiguration(framework.value);

                progress.report({ increment: 100, message: 'Configuration complete' });
                vscode.window.showInformationMessage(`${framework.label} configured successfully`);
            } else {
                vscode.window.showErrorMessage(`Failed to configure ${framework.label}: ${result.error}`);
            }
        });
    }

    async installTestDependencies(): Promise<void> {
        const commonTestDeps = [
            { label: 'pytest', description: 'Testing framework', value: 'pytest' },
            { label: 'pytest-cov', description: 'Coverage plugin for pytest', value: 'pytest-cov' },
            { label: 'pytest-mock', description: 'Mocking plugin for pytest', value: 'pytest-mock' },
            { label: 'pytest-asyncio', description: 'Async support for pytest', value: 'pytest-asyncio' },
            { label: 'coverage', description: 'Code coverage tool', value: 'coverage' },
            { label: 'factory-boy', description: 'Test data generation', value: 'factory-boy' },
            { label: 'faker', description: 'Fake data generator', value: 'faker' }
        ];

        const selected = await vscode.window.showQuickPick(commonTestDeps, {
            placeHolder: 'Select test dependencies to install',
            canPickMany: true
        });

        if (!selected || selected.length === 0) return;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Installing test dependencies...',
            cancellable: false
        }, async (progress) => {
            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < selected.length; i++) {
                const dep = selected[i];
                progress.report({
                    increment: (100 / selected.length),
                    message: `Installing ${dep.label}... (${i + 1}/${selected.length})`
                });

                const result = await this.uvExecutor.executeCommand(['add', dep.value, '--dev']);
                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            if (successCount > 0) {
                vscode.window.showInformationMessage(
                    `Installed ${successCount} test dependencies successfully${failCount > 0 ? `, ${failCount} failed` : ''}`
                );
            } else {
                vscode.window.showErrorMessage('Failed to install any test dependencies');
            }
        });
    }

    private async discoverTestFiles(): Promise<Array<{ name: string, path: string, type: string }>> {
        const workspaceRoot = this.uvExecutor.getWorkspaceRoot();
        if (!workspaceRoot) return [];

        const testFiles: Array<{ name: string, path: string, type: string }> = [];

        try {
            // Look for common test file patterns
            const patterns = [
                '**/test_*.py',
                '**/*_test.py',
                '**/tests/**/*.py'
            ];

            for (const pattern of patterns) {
                const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
                for (const file of files) {
                    const relativePath = vscode.workspace.asRelativePath(file);
                    const fileName = file.path.split('/').pop() || '';

                    // Determine test type
                    let type = 'pytest';
                    if (fileName && (fileName.startsWith('test_') || fileName.endsWith('_test.py'))) {
                        type = 'pytest';
                    } else if (relativePath.includes('tests/')) {
                        type = 'pytest';
                    }

                    testFiles.push({
                        name: fileName || 'unknown',
                        path: relativePath,
                        type: type
                    });
                }
            }
        } catch (error) {
            console.error('Error discovering test files:', error);
        }

        return testFiles;
    }

    private formatTestDiscoveryResults(testFiles: Array<{ name: string, path: string, type: string }>): string {
        let content = '# Test Discovery Results\n\n';
        content += `Found ${testFiles.length} test files in the project.\n\n`;

        // Group by type
        const grouped = testFiles.reduce((acc, file) => {
            if (!acc[file.type]) acc[file.type] = [];
            acc[file.type].push(file);
            return acc;
        }, {} as Record<string, typeof testFiles>);

        for (const [type, files] of Object.entries(grouped)) {
            content += `## ${type.toUpperCase()} Tests (${files.length})\n\n`;
            for (const file of files) {
                content += `- **${file.name}** - \`${file.path}\`\n`;
            }
            content += '\n';
        }

        return content;
    }

    private async createTestConfiguration(framework: string): Promise<void> {
        const workspaceRoot = this.uvExecutor.getWorkspaceRoot();
        if (!workspaceRoot) return;

        if (framework === 'pytest') {
            // Create pytest.ini
            const pytestConfig = `[pytest]
testpaths = tests
python_files = test_*.py *_test.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
`;
            const pytestPath = vscode.Uri.file(path.join(workspaceRoot, 'pytest.ini'));
            await vscode.workspace.fs.writeFile(pytestPath, Buffer.from(pytestConfig));
        }
    }

    async installSpecificPythonVersion(): Promise<void> {
        const version = await vscode.window.showInputBox({
            prompt: 'Enter Python version to install',
            placeHolder: '3.11.4',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Python version is required';
                }
                // Validate Python version format
                const versionRegex = /^\d+\.\d+(\.\d+)?([ab]\d+)?(rc\d+)?$/;
                if (!versionRegex.test(value.trim())) {
                    return 'Invalid Python version format. Expected: X.Y.Z or X.Y (e.g., 3.11.4)';
                }
                return null;
            }
        });

        if (!version) {
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Installing Python ${version}...`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Installing Python...' });

            const success = await this.uvExecutor.installPythonVersion(version);

            if (success) {
                progress.report({ increment: 100, message: 'Python installed successfully' });
                vscode.window.showInformationMessage(`Python ${version} installed successfully`);
                // Refresh the Python versions list
                await this.python();
            } else {
                progress.report({ increment: 100, message: 'Installation failed' });
                vscode.window.showErrorMessage(`Failed to install Python ${version}`);
            }
        });
    }

    async showToolchainInfo(): Promise<void> {
        const toolchainInfo = await this.uvExecutor.getToolchainInfo();
        const panel = vscode.window.createWebviewPanel(
            'toolchainInfo',
            'Toolchain Information',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        panel.webview.html = this.getToolchainInfoHtml(toolchainInfo);
    }

    async runTest(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;

        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const filePath = activeEditor.document.uri.fsPath;
        const fileName = activeEditor.document.fileName;

        // Check if it's a test file
        if (!this.isTestFile(fileName)) {
            vscode.window.showErrorMessage('Active file is not a test file');
            return;
        }

        // Check if we have a project
        const hasProject = await this.uvExecutor.hasProjectFiles();
        if (!hasProject) {
            vscode.window.showErrorMessage('No UV project found. Please initialize a project first.');
            return;
        }

        // Get the relative path from workspace root
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace root found');
            return;
        }

        const relativePath = vscode.workspace.asRelativePath(filePath);

        // Get current environment info for feedback
        const pythonVersion = await this.uvExecutor.getCurrentVenvPythonVersion();
        const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();
        const envInfo = pythonVersion ?
            `Python ${pythonVersion}${currentToolchain ? ` (${currentToolchain})` : ''}` :
            'UV managed environment';

        // Run the test file with UV
        await this.uvExecutor.executeInTerminal(['run', 'pytest', relativePath, '-v']);

        vscode.window.showInformationMessage(`Running test file ${relativePath} with ${envInfo}`);

        // Update status bar after running
        if (this.statusBar) {
            await this.statusBar.updateStatus();
        }
    }

    async runTestMethod(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;

        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const filePath = activeEditor.document.uri.fsPath;
        const fileName = activeEditor.document.fileName;
        const position = activeEditor.selection.active;

        // Check if it's a test file
        if (!this.isTestFile(fileName)) {
            vscode.window.showErrorMessage('Active file is not a test file');
            return;
        }

        // Check if we have a project
        const hasProject = await this.uvExecutor.hasProjectFiles();
        if (!hasProject) {
            vscode.window.showErrorMessage('No UV project found. Please initialize a project first.');
            return;
        }

        // Get the test method name at cursor position
        const testMethodName = this.getTestMethodAtPosition(activeEditor.document, position);
        if (!testMethodName) {
            vscode.window.showErrorMessage('No test method found at cursor position');
            return;
        }

        // Get the relative path from workspace root
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace root found');
            return;
        }

        const relativePath = vscode.workspace.asRelativePath(filePath);

        // Get current environment info for feedback
        const pythonVersion = await this.uvExecutor.getCurrentVenvPythonVersion();
        const currentToolchain = await this.uvExecutor.getCurrentPythonToolchain();
        const envInfo = pythonVersion ?
            `Python ${pythonVersion}${currentToolchain ? ` (${currentToolchain})` : ''}` :
            'UV managed environment';

        // Run the specific test method with UV
        await this.uvExecutor.executeInTerminal(['run', 'pytest', relativePath, '-k', testMethodName, '-v']);

        vscode.window.showInformationMessage(`Running test method ${testMethodName} in ${relativePath} with ${envInfo}`);

        // Update status bar after running
        if (this.statusBar) {
            await this.statusBar.updateStatus();
        }
    }

    private isTestFile(fileName: string): boolean {
        const testPatterns = [
            /test_.*\.py$/,
            /.*_test\.py$/,
            /.*test.*\.py$/
        ];
        return testPatterns.some(pattern => pattern.test(fileName));
    }

    private getTestMethodAtPosition(document: vscode.TextDocument, position: vscode.Position): string | null {
        const line = document.lineAt(position.line);
        const text = line.text.trim();

        // Look for test function definitions
        const testFunctionMatch = text.match(/^def\s+(test_\w+)\s*\(/);
        if (testFunctionMatch) {
            return testFunctionMatch[1];
        }

        // Look for test class methods
        const testMethodMatch = text.match(/^def\s+(test_\w+)\s*\(/);
        if (testMethodMatch) {
            return testMethodMatch[1];
        }

        // If no test method found at current line, look for the nearest test method
        for (let i = position.line; i >= 0; i--) {
            const lineText = document.lineAt(i).text.trim();
            const match = lineText.match(/^def\s+(test_\w+)\s*\(/);
            if (match) {
                return match[1];
            }
        }

        return null;
    }

    private getToolchainInfoHtml(toolchainInfo: any): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Toolchain Information</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
                    .header { border-bottom: 1px solid #e1e4e8; padding-bottom: 10px; margin-bottom: 20px; }
                    .title { font-size: 24px; font-weight: bold; margin: 0; }
                    .version { color: #586069; font-size: 14px; }
                    .description { margin: 20px 0; line-height: 1.6; }
                    .actions { margin: 20px 0; }
                    .btn { padding: 8px 16px; margin-right: 10px; border: none; border-radius: 6px; cursor: pointer; }
                    .btn-primary { background: #0366d6; color: white; }
                    .btn-danger { background: #d73a49; color: white; }
                    .btn-secondary { background: #f1f3f4; color: #24292e; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
                    .info-item { padding: 10px; background: #f6f8fa; border-radius: 6px; }
                    .info-label { font-weight: bold; color: #24292e; }
                    .info-value { color: #586069; margin-top: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="title">Toolchain Information</h1>
                </div>
                
                <div class="description">
                    ${toolchainInfo.description}
                </div>
                
                <div class="actions">
                    <button class="btn btn-primary" onclick="openToolchainInfo()">View More Information</button>
                </div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Python Version</div>
                        <div class="info-value">${toolchainInfo.pythonVersion}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Toolchain Version</div>
                        <div class="info-value">${toolchainInfo.toolchainVersion}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Toolchain Type</div>
                        <div class="info-value">${toolchainInfo.toolchainType}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Toolchain Path</div>
                        <div class="info-value">${toolchainInfo.toolchainPath}</div>
                    </div>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function openToolchainInfo() {
                        vscode.postMessage({ command: 'openToolchainInfo' });
                    }
                </script>
            </body>
            </html>
        `;
    }
} 