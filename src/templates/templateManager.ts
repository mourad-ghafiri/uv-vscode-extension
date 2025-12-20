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
            detail: cat.id,  // Store category ID for reliable lookup
        }));

        const pick = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select project type',
            title: 'UV: Initialize Project - Step 1/4',
            ignoreFocusOut: true,
        });

        if (!pick || !pick.detail) return undefined;

        // Use the category ID stored in detail for reliable matching
        return TEMPLATE_CATEGORIES.find(c => c.id === pick.detail);
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

    /**
     * Sanitize project name to be PEP 508 compliant.
     * Replaces spaces with hyphens, removes invalid chars, and lowercases.
     */
    private sanitizeProjectName(name: string): string {
        return name
            .toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with hyphens
            .replace(/[^a-z0-9_-]/g, '')    // Remove invalid characters
            .replace(/^[^a-z]+/, '')        // Must start with a letter
            .replace(/-+/g, '-')            // Collapse multiple hyphens
            || 'my-project';                // Fallback if empty
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
        const rawDisplayName = projectName && projectName.trim() !== '' ? projectName : currentDirName;
        // Sanitize the project name for pyproject.toml (handles spaces, special chars)
        const sanitizedName = this.sanitizeProjectName(rawDisplayName);

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Creating ${template.name} project...`,
            cancellable: false
        }, async (progress) => {
            // Step 1: Create project directory
            progress.report({ increment: 10, message: 'Creating project directory...' });
            if (projectPath !== workspaceRoot && !fs.existsSync(projectPath)) {
                fs.mkdirSync(projectPath, { recursive: true });
            }

            // Step 2: Copy all template files with placeholder replacement
            progress.report({ increment: 20, message: 'Copying template files...' });
            await this.copyTemplateFiles(template, projectPath, sanitizedName, pythonVersion.version);

            // Step 3: Set Python version file
            progress.report({ increment: 10, message: 'Setting Python version...' });
            this.setPythonVersion(projectPath, pythonVersion);

            // Step 4: Initialize git if not exists
            progress.report({ increment: 5, message: 'Initializing git...' });
            if (!fs.existsSync(path.join(projectPath, '.git'))) {
                await this.uvExecutor.executeCommand(['run', 'git', 'init'], projectPath);
            }

            // Step 5: Create virtual environment
            progress.report({ increment: 20, message: 'Creating virtual environment...' });
            const venvResult = await this.uvExecutor.executeCommand(
                ['venv', '.venv', '--python', pythonVersion.id],
                projectPath
            );
            if (!venvResult.success) {
                throw new Error(`Failed to create virtual environment: ${venvResult.error}`);
            }

            // Step 6: Install dependencies with uv sync
            progress.report({ increment: 30, message: 'Installing dependencies...' });
            const syncResult = await this.uvExecutor.executeCommand(['sync'], projectPath);
            if (!syncResult.success) {
                throw new Error(`Failed to sync dependencies: ${syncResult.error}`);
            }

            progress.report({ increment: 5, message: 'Complete!' });
        });

        // Show success message AFTER progress completes (not inside withProgress)
        const message = `Project "${sanitizedName}" created with ${template.name} template!`;
        const actions: string[] = ['OK'];
        if (projectPath !== workspaceRoot) {
            actions.unshift('Open Folder');
        }
        if (template.postInstallMessage) {
            actions.splice(actions.length - 1, 0, 'Show Instructions');
        }

        const selection = await vscode.window.showInformationMessage(message, ...actions);
        if (selection === 'Open Folder') {
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath));
        } else if (selection === 'Show Instructions' && template.postInstallMessage) {
            vscode.window.showInformationMessage(template.postInstallMessage, 'OK');
        }
    }

    private async copyTemplateFiles(
        template: ProjectTemplate,
        projectPath: string,
        projectName: string,
        pythonVersion: string
    ): Promise<void> {
        const templatePath = path.join(this.extensionPath, 'resources', 'templates', template.resourcePath);

        // Log for debugging
        const outputChannel = vscode.window.createOutputChannel('UV Templates');
        outputChannel.appendLine(`Template: ${template.name} (${template.resourcePath})`);
        outputChannel.appendLine(`Template path: ${templatePath}`);
        outputChannel.appendLine(`Project name: ${projectName}`);
        outputChannel.appendLine(`Python version: ${pythonVersion}`);
        outputChannel.appendLine(`Template exists: ${fs.existsSync(templatePath)}`);

        if (!fs.existsSync(templatePath)) {
            outputChannel.appendLine('ERROR: Template folder not found!');
            throw new Error(`Template folder not found: ${templatePath}`);
        }

        // List template files for debugging
        const templateFiles = fs.readdirSync(templatePath);
        outputChannel.appendLine(`Template files: ${templateFiles.join(', ')}`);

        // Copy ALL files from template folder (including pyproject.toml)
        // Placeholders {{PROJECT_NAME}} and {{PYTHON_VERSION}} will be replaced
        outputChannel.appendLine('Copying all template files...');
        this.copyDirectoryRecursive(templatePath, projectPath, projectName, pythonVersion, []);
        outputChannel.appendLine('Template files copied.');

        // Always ensure .gitignore exists
        const gitignorePath = path.join(projectPath, '.gitignore');
        if (!fs.existsSync(gitignorePath)) {
            const emptyGitignore = path.join(this.extensionPath, 'resources', 'templates', 'empty', '.gitignore');
            if (fs.existsSync(emptyGitignore)) {
                fs.copyFileSync(emptyGitignore, gitignorePath);
                outputChannel.appendLine('Copied default .gitignore.');
            }
        }

        // Create README.md if not exists
        const readmePath = path.join(projectPath, 'README.md');
        if (!fs.existsSync(readmePath)) {
            fs.writeFileSync(readmePath, `# ${projectName}\n\nA Python project created with UV.\n`);
        }

        outputChannel.appendLine('Template setup complete!');
    }

    /**
     * Extract dependencies from a pyproject.toml content string.
     * Parses the dependencies array from [project] section.
     * Returns package names only (strips version specifiers to avoid shell issues).
     */
    private extractDependencies(pyprojectContent: string): string[] {
        const dependencies: string[] = [];

        // Match the dependencies array in pyproject.toml
        // This handles multi-line arrays like: dependencies = [\n    "pkg>=1.0",\n]
        const depsMatch = pyprojectContent.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
        if (depsMatch) {
            const depsBlock = depsMatch[1];
            // Extract each quoted dependency
            const depMatches = depsBlock.matchAll(/"([^"]+)"/g);
            for (const match of depMatches) {
                // Strip version specifiers to avoid shell redirection issues
                // e.g., "ttkbootstrap>=1.10.0" -> "ttkbootstrap"
                const packageName = match[1].split(/[<>=!~\[\]]/)[0].trim();
                if (packageName && !dependencies.includes(packageName)) {
                    dependencies.push(packageName);
                }
            }
        }

        return dependencies;
    }

    private copyDirectoryRecursive(source: string, target: string, projectName: string, pythonVersion: string, excludeFiles: string[] = []): void {
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
        }

        const entries = fs.readdirSync(source, { withFileTypes: true });

        for (const entry of entries) {
            // Skip excluded files
            if (excludeFiles.includes(entry.name)) {
                continue;
            }

            const sourcePath = path.join(source, entry.name);
            const targetPath = path.join(target, entry.name);

            if (entry.isDirectory()) {
                this.copyDirectoryRecursive(sourcePath, targetPath, projectName, pythonVersion, excludeFiles);
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
        // Write just the version number (e.g., "3.14.2"), not the full id (e.g., "cpython-3.14.2-macos-aarch64-none")
        fs.writeFileSync(pythonVersionPath, pythonVersion.version + '\n');
    }
}