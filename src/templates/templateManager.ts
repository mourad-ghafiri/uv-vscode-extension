import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { UVExecutor } from '../uvExecutor';

export class TemplateManager {
    constructor(private uvExecutor: UVExecutor) { }

    /**
     * Simplified project initialization flow:
     * 1. Check UV is installed
     * 2. Get project name (optional, use current directory)
     * 3. Select Python version
     * 4. Run uv init (creates standard project structure)
     * 5. Create .venv with selected Python
     */
    async createProjectWithTemplate(): Promise<void> {
        try {
            // Step 1: Check if UV is installed
            const uvInstalled = await this.uvExecutor.checkUVInstalled();
            if (!uvInstalled) {
                const install = await vscode.window.showErrorMessage(
                    'UV is not installed. Would you like to install it?',
                    'Install UV',
                    'Cancel'
                );
                if (install === 'Install UV') {
                    await this.uvExecutor.installUV();
                }
                return;
            }

            // Step 2: Get project name (optional)
            const projectName = await this.getProjectName();
            if (projectName === undefined) return; // User cancelled

            // Step 3: Select Python version
            const pythonVersion = await this.selectPythonVersion();
            if (!pythonVersion) return; // User cancelled

            // Step 4: Create the project
            await this.createSimpleProject(projectName, pythonVersion);

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create project: ${error}`);
        }
    }

    private async getProjectName(): Promise<string | undefined> {
        const input = await vscode.window.showInputBox({
            prompt: 'Enter project name (leave empty to use current directory)',
            placeHolder: 'my-project or leave empty for current directory',
            validateInput: (value) => {
                if (value && value.trim() !== '' && !/^[a-zA-Z0-9_-]+$/.test(value)) {
                    return 'Project name can only contain letters, numbers, hyphens, and underscores';
                }
                return null;
            }
        });

        return input;
    }

    private async selectPythonVersion(): Promise<{ id: string; version: string } | undefined> {
        const allVersions = await this.uvExecutor.listAllPythonArches();

        // Filter to only show CPython versions for simplicity
        const cpythonVersions = allVersions.filter(v => v.id.startsWith('cpython-'));

        // Separate installed and available
        const installed = cpythonVersions.filter(v => v.status === 'installed');
        const available = cpythonVersions.filter(v => v.status === 'available');

        const items: vscode.QuickPickItem[] = [];

        // Installed versions first
        if (installed.length > 0) {
            items.push({ label: 'Installed Python Versions', kind: vscode.QuickPickItemKind.Separator });
            for (const v of installed) {
                items.push({
                    label: `$(check) Python ${v.version}`,
                    description: 'Ready to use',
                    detail: v.id
                });
            }
        }

        // Available versions
        if (available.length > 0) {
            items.push({ label: 'Available for Download', kind: vscode.QuickPickItemKind.Separator });
            // Show only major versions to avoid clutter (e.g., 3.12, 3.11, 3.10)
            const majorVersions = new Map<string, typeof available[0]>();
            for (const v of available) {
                const majorMinor = v.version.split('.').slice(0, 2).join('.');
                if (!majorVersions.has(majorMinor)) {
                    majorVersions.set(majorMinor, v);
                }
            }
            for (const [, v] of majorVersions) {
                items.push({
                    label: `$(cloud-download) Python ${v.version}`,
                    description: 'Will be downloaded',
                    detail: v.id
                });
            }
        }

        const pick = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select Python version for this project',
            ignoreFocusOut: true
        });

        if (!pick || !pick.detail) return undefined;

        const selected = allVersions.find(v => v.id === pick.detail);
        if (!selected) return undefined;

        // If version is not installed, install it first
        if (selected.status === 'available') {
            const installOk = await this.uvExecutor.installPythonVersion(selected.id);
            if (!installOk) {
                vscode.window.showErrorMessage(`Failed to install Python ${selected.version}`);
                return undefined;
            }
        }

        return { id: selected.id, version: selected.version };
    }

    private async createSimpleProject(
        projectName: string | undefined,
        pythonVersion: { id: string; version: string }
    ): Promise<void> {
        const workspaceRoot = this.uvExecutor.getWorkspaceRoot();
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace root found');
            return;
        }

        const currentDirName = path.basename(workspaceRoot);
        const projectPath = projectName && projectName.trim() !== ''
            ? path.join(workspaceRoot, projectName)
            : workspaceRoot;
        const displayName = projectName && projectName.trim() !== '' ? projectName : currentDirName;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Creating Python project...`,
            cancellable: false
        }, async (progress) => {
            try {
                // Step 1: Create project directory if needed
                progress.report({ increment: 10, message: 'Creating project directory...' });
                if (projectPath !== workspaceRoot && !fs.existsSync(projectPath)) {
                    fs.mkdirSync(projectPath, { recursive: true });
                }

                // Step 2: Run standard uv init (creates .git, .gitignore, .python-version, README.md, main.py, pyproject.toml)
                progress.report({ increment: 30, message: 'Initializing UV project...' });
                const initResult = await this.uvExecutor.executeCommand(['init'], projectPath);
                if (!initResult.success) {
                    throw new Error(`Failed to initialize UV project: ${initResult.error}`);
                }

                // Step 3: Update .python-version with selected Python version
                progress.report({ increment: 10, message: 'Setting Python version...' });
                await this.setPythonVersion(projectPath, pythonVersion);

                // Step 4: Create virtual environment with selected Python
                progress.report({ increment: 30, message: 'Creating virtual environment...' });
                const venvResult = await this.uvExecutor.executeCommand(
                    ['venv', '.venv', '--python', pythonVersion.id],
                    projectPath
                );
                if (!venvResult.success) {
                    throw new Error(`Failed to create virtual environment: ${venvResult.error}`);
                }

                // Step 5: Sync dependencies
                progress.report({ increment: 20, message: 'Syncing dependencies...' });
                await this.uvExecutor.executeCommand(['sync'], projectPath);

                progress.report({ increment: 100, message: 'Project created!' });

                // Show success message
                vscode.window.showInformationMessage(
                    `Project "${displayName}" created successfully with Python ${pythonVersion.version}!`,
                    'Open Folder'
                ).then(selection => {
                    if (selection === 'Open Folder' && projectPath !== workspaceRoot) {
                        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath));
                    }
                });

            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create project: ${error}`);
            }
        });
    }

    private async setPythonVersion(projectPath: string, pythonVersion: { id: string; version: string }): Promise<void> {
        // Write .python-version file with the toolchain ID
        const pythonVersionPath = path.join(projectPath, '.python-version');
        fs.writeFileSync(pythonVersionPath, pythonVersion.id + '\n');
    }
}