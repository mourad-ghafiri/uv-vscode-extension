import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { UVExecutor } from '../uvExecutor';
import {
    TEMPLATE_CATEGORIES,
    PROJECT_TEMPLATES,
    ProjectTemplate,
    TemplateCategory,
    getTemplatesByCategory,
    getTemplateById,
} from './projectTemplates';

export class TemplateManager {
    private extensionPath: string;

    constructor(private uvExecutor: UVExecutor, extensionPath?: string) {
        this.extensionPath = extensionPath || '';
    }

    /**
     * Set the extension path (called from extension.ts)
     */
    setExtensionPath(extensionPath: string): void {
        this.extensionPath = extensionPath;
    }

    /**
     * Project Wizard Flow:
     * 1. Check UV is installed
     * 2. Select template category
     * 3. Select specific template
     * 4. Enter project name
     * 5. Select Python version
     * 6. Create project from template
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

            // Step 2: Select template category
            const category = await this.selectCategory();
            if (!category) return;

            // Step 3: Select specific template
            const template = await this.selectTemplate(category);
            if (!template) return;

            // Step 4: Get project name
            const projectName = await this.getProjectName();
            if (projectName === undefined) return;

            // Step 5: Select Python version
            const pythonVersion = await this.selectPythonVersion();
            if (!pythonVersion) return;

            // Step 6: Create project from template
            await this.createProjectFromTemplate(template, projectName, pythonVersion);

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create project: ${error}`);
        }
    }

    private async selectCategory(): Promise<TemplateCategory | undefined> {
        const items: vscode.QuickPickItem[] = TEMPLATE_CATEGORIES.map(cat => ({
            label: `${cat.icon} ${cat.name}`,
            description: cat.description,
            detail: cat.id === 'empty' ? 'Recommended for beginners' : undefined,
        }));

        const pick = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select project type',
            title: 'UV: Initialize Project - Step 1/4',
            ignoreFocusOut: true,
        });

        if (!pick) return undefined;

        const catName = pick.label.substring(2).trim(); // Remove emoji
        return TEMPLATE_CATEGORIES.find(c => c.name === catName);
    }

    private async selectTemplate(category: TemplateCategory): Promise<ProjectTemplate | undefined> {
        const templates = getTemplatesByCategory(category.id);

        // If only one template in category (like Empty), return it directly
        if (templates.length === 1) {
            return templates[0];
        }

        const items: vscode.QuickPickItem[] = templates.map(t => ({
            label: `${t.icon} ${t.name}`,
            description: t.description,
            detail: t.id,
        }));

        const pick = await vscode.window.showQuickPick(items, {
            placeHolder: `Select ${category.name} template`,
            title: 'UV: Initialize Project - Step 2/4',
            ignoreFocusOut: true,
        });

        if (!pick || !pick.detail) return undefined;

        return getTemplateById(pick.detail);
    }

    private async getProjectName(): Promise<string | undefined> {
        const input = await vscode.window.showInputBox({
            prompt: 'Enter project name (leave empty to use current directory)',
            placeHolder: 'my-project or leave empty for current directory',
            title: 'UV: Initialize Project - Step 3/4',
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
        const cpythonVersions = allVersions.filter(v => v.id.startsWith('cpython-'));

        const installed = cpythonVersions.filter(v => v.status === 'installed');
        const available = cpythonVersions.filter(v => v.status === 'available');

        const items: vscode.QuickPickItem[] = [];

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

        if (available.length > 0) {
            items.push({ label: 'Available for Download', kind: vscode.QuickPickItemKind.Separator });
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
            title: 'UV: Initialize Project - Step 4/4',
            ignoreFocusOut: true
        });

        if (!pick || !pick.detail) return undefined;

        const selected = allVersions.find(v => v.id === pick.detail);
        if (!selected) return undefined;

        if (selected.status === 'available') {
            const installOk = await this.uvExecutor.installPythonVersion(selected.id);
            if (!installOk) {
                vscode.window.showErrorMessage(`Failed to install Python ${selected.version}`);
                return undefined;
            }
        }

        return { id: selected.id, version: selected.version };
    }

    private async createProjectFromTemplate(
        template: ProjectTemplate,
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
            title: `Creating ${template.name} project...`,
            cancellable: false
        }, async (progress) => {
            try {
                // Step 1: Create project directory
                progress.report({ increment: 5, message: 'Creating project directory...' });
                if (projectPath !== workspaceRoot && !fs.existsSync(projectPath)) {
                    fs.mkdirSync(projectPath, { recursive: true });
                }

                // Step 2: Copy template files
                progress.report({ increment: 20, message: 'Copying template files...' });
                await this.copyTemplateFiles(template, projectPath, displayName, pythonVersion.version);

                // Step 3: Initialize git if not exists
                progress.report({ increment: 10, message: 'Initializing git...' });
                if (!fs.existsSync(path.join(projectPath, '.git'))) {
                    await this.uvExecutor.executeCommand(['run', 'git', 'init'], projectPath);
                }

                // Step 4: Set Python version
                progress.report({ increment: 10, message: 'Setting Python version...' });
                this.setPythonVersion(projectPath, pythonVersion);

                // Step 5: Create virtual environment
                progress.report({ increment: 25, message: 'Creating virtual environment...' });
                const venvResult = await this.uvExecutor.executeCommand(
                    ['venv', '.venv', '--python', pythonVersion.id],
                    projectPath
                );
                if (!venvResult.success) {
                    throw new Error(`Failed to create virtual environment: ${venvResult.error}`);
                }

                // Step 6: Install dependencies
                progress.report({ increment: 25, message: 'Installing dependencies...' });
                await this.uvExecutor.executeCommand(['sync'], projectPath);

                progress.report({ increment: 5, message: 'Done!' });

                // Show success message with post-install instructions
                const message = `Project "${displayName}" created with ${template.name} template!`;
                const actions = ['Open Folder'];
                if (template.postInstallMessage) {
                    actions.push('Show Instructions');
                }

                const selection = await vscode.window.showInformationMessage(message, ...actions);

                if (selection === 'Open Folder' && projectPath !== workspaceRoot) {
                    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath));
                } else if (selection === 'Show Instructions' && template.postInstallMessage) {
                    vscode.window.showInformationMessage(template.postInstallMessage, { modal: true });
                }

            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create project: ${error}`);
            }
        });
    }

    private async copyTemplateFiles(
        template: ProjectTemplate,
        projectPath: string,
        projectName: string,
        pythonVersion: string
    ): Promise<void> {
        const templatePath = path.join(this.extensionPath, 'resources', 'templates', template.resourcePath);

        if (!fs.existsSync(templatePath)) {
            // Fallback: if template folder doesn't exist, use uv init
            const initResult = await this.uvExecutor.executeCommand(['init'], projectPath);
            if (!initResult.success) {
                throw new Error('Template not found and uv init failed');
            }
            return;
        }

        // Copy all files from template folder
        this.copyDirectoryRecursive(templatePath, projectPath, projectName, pythonVersion);

        // Always ensure .gitignore exists
        const gitignorePath = path.join(projectPath, '.gitignore');
        if (!fs.existsSync(gitignorePath)) {
            const emptyGitignore = path.join(this.extensionPath, 'resources', 'templates', 'empty', '.gitignore');
            if (fs.existsSync(emptyGitignore)) {
                fs.copyFileSync(emptyGitignore, gitignorePath);
            }
        }

        // Create pyproject.toml if not copied (for empty template)
        const pyprojectPath = path.join(projectPath, 'pyproject.toml');
        if (!fs.existsSync(pyprojectPath)) {
            const pyprojectContent = `[project]
name = "${projectName}"
version = "0.1.0"
description = ""
readme = "README.md"
requires-python = ">=3.10"
dependencies = []
`;
            fs.writeFileSync(pyprojectPath, pyprojectContent);
        }

        // Create README.md if not exists
        const readmePath = path.join(projectPath, 'README.md');
        if (!fs.existsSync(readmePath)) {
            fs.writeFileSync(readmePath, `# ${projectName}\n\nA Python project created with UV.\n`);
        }
    }

    private copyDirectoryRecursive(source: string, target: string, projectName: string, pythonVersion: string): void {
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
        }

        const entries = fs.readdirSync(source, { withFileTypes: true });

        for (const entry of entries) {
            const sourcePath = path.join(source, entry.name);
            const targetPath = path.join(target, entry.name);

            if (entry.isDirectory()) {
                this.copyDirectoryRecursive(sourcePath, targetPath, projectName, pythonVersion);
            } else {
                // Read file and replace placeholders
                let content = fs.readFileSync(sourcePath, 'utf8');
                content = content.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
                // Extract major.minor version (e.g. "3.12.1" -> "3.12")
                const majorMinor = pythonVersion.split('.').slice(0, 2).join('.');
                content = content.replace(/\{\{PYTHON_VERSION\}\}/g, majorMinor);
                fs.writeFileSync(targetPath, content);
            }
        }
    }

    private setPythonVersion(projectPath: string, pythonVersion: { id: string; version: string }): void {
        const pythonVersionPath = path.join(projectPath, '.python-version');
        fs.writeFileSync(pythonVersionPath, pythonVersion.id + '\n');
    }
}