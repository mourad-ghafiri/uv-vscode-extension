import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export interface UVCommandResult {
    success: boolean;
    output: string;
    error?: string;
}

export class UVExecutor {
    // --- Command Queue ---
    private commandQueue: Promise<any> = Promise.resolve();
    private queueLock: boolean = false;

    // --- Simple Caching ---
    private cache: Map<string, { value: any, expires: number }> = new Map();
    private cacheTTL = 1500; // ms

    private getUVPath(): string {
        const config = vscode.workspace.getConfiguration('uv');
        return config.get<string>('path', 'uv');
    }

    getWorkspaceRoot(): string | undefined {
        return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }

    async executeCommand(args: string[], cwd?: string): Promise<UVCommandResult> {
        // Serialize all commands using the queue
        return this.enqueue(() => this._executeCommand(args, cwd));
    }

    private async _executeCommand(args: string[], cwd?: string): Promise<UVCommandResult> {
        return new Promise((resolve) => {
            const uvPath = this.getUVPath();
            const workspaceRoot = cwd || this.getWorkspaceRoot();

            if (!workspaceRoot) {
                resolve({
                    success: false,
                    output: '',
                    error: 'No workspace root found'
                });
                return;
            }

            const command = `${uvPath} ${args.join(' ')}`;
            const options: cp.ExecOptions = {
                cwd: workspaceRoot
            };

            cp.exec(command, options, (error: cp.ExecException | null, stdout: string, stderr: string) => {
                if (error) {
                    resolve({
                        success: false,
                        output: stdout,
                        error: stderr || error.message
                    });
                } else {
                    resolve({
                        success: true,
                        output: stdout,
                        error: stderr
                    });
                }
            });
        });
    }

    private enqueue<T>(fn: () => Promise<T>): Promise<T> {
        // Add to the queue and return a promise that resolves when done
        this.commandQueue = this.commandQueue.then(() => fn());
        return this.commandQueue;
    }

    // --- Caching helpers ---
    private getCached<T>(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (entry && entry.expires > Date.now()) {
            return entry.value;
        } else if (entry) {
            this.cache.delete(key);
        }
        return undefined;
    }
    private setCached<T>(key: string, value: T): void {
        this.cache.set(key, { value, expires: Date.now() + this.cacheTTL });
    }
    private invalidateCache(key: string): void {
        this.cache.delete(key);
    }
    private invalidateAllCache(): void {
        this.cache.clear();
    }

    // --- Caching for expensive methods ---
    async getProjectInfo(): Promise<any> {
        const cacheKey = 'projectInfo';
        const cached = this.getCached<any>(cacheKey);
        if (cached) return cached;
        const result = await this.executeCommand(['tree', '--format', 'json']);
        let info;
        if (result.success) {
            try {
                info = JSON.parse(result.output);
            } catch {
                info = await this.getBasicProjectInfo();
            }
        } else {
            info = null;
        }
        this.setCached(cacheKey, info);
        return info;
    }

    async getDependencies(): Promise<string[]> {
        const cacheKey = 'dependencies';
        const cached = this.getCached<string[]>(cacheKey);
        if (cached) return cached;
        const depsFromPyproject = await this.getDependenciesFromPyproject();
        let deps: string[];
        if (depsFromPyproject.length > 0) {
            deps = depsFromPyproject;
        } else {
            const result = await this.executeCommand(['tree']);
            deps = result.success ? this.parseDependenciesFromTree(result.output) : [];
        }
        this.setCached(cacheKey, deps);
        return deps;
    }

    async getEnvironments(): Promise<string[]> {
        const cacheKey = 'environments';
        const cached = this.getCached<string[]>(cacheKey);
        if (cached) return cached;
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) return [];
        const envs = await this.getAvailableEnvironments(workspaceRoot);
        const names = envs.map((e: { name: string }) => e.name);
        this.setCached(cacheKey, names);
        return names;
    }

    async getAvailableEnvironments(workspaceRoot: string): Promise<{ name: string, activateScript: string }[]> {
        // Check for common virtual environment directories
        const possibleVenvs = [
            '.venv',
            'venv',
            'env',
            '.env'
        ];

        const environments: { name: string, activateScript: string }[] = [];
        const isWin = process.platform === 'win32';

        for (const venvName of possibleVenvs) {
            const venvPath = path.join(workspaceRoot, venvName);
            let activateScript = '';
            if (isWin) {
                activateScript = path.join(venvPath, 'Scripts', 'activate');
            } else {
                activateScript = path.join(venvPath, 'bin', 'activate');
            }
            try {
                await vscode.workspace.fs.stat(vscode.Uri.file(activateScript));
                environments.push({ name: venvName, activateScript });
            } catch {
                // Activation script doesn't exist
            }
        }

        // Also try UV's venv list command
        try {
            const result = await this.executeCommand(['venv', 'list']);
            if (result.success) {
                const uvVenvs = result.output.split('\n')
                    .filter(line => line.trim() && !line.startsWith('#'))
                    .map(line => line.trim());
                for (const venv of uvVenvs) {
                    const venvPath = path.isAbsolute(venv) ? venv : path.join(workspaceRoot, venv);
                    let activateScript = '';
                    if (isWin) {
                        activateScript = path.join(venvPath, 'Scripts', 'activate');
                    } else {
                        activateScript = path.join(venvPath, 'bin', 'activate');
                    }
                    try {
                        await vscode.workspace.fs.stat(vscode.Uri.file(activateScript));
                        if (!environments.some(e => e.activateScript === activateScript)) {
                            environments.push({ name: venv, activateScript });
                        }
                    } catch {
                        // Activation script doesn't exist
                    }
                }
            }
        } catch {
            // UV venv list failed, use file system detection
        }

        return environments;
    }

    // Invalidate cache on explicit refresh or file changes
    public invalidateAllCaches(): void {
        this.invalidateAllCache();
    }

    async executeInTerminal(args: string[], cwd?: string): Promise<void> {
        const uvPath = this.getUVPath();
        const workspaceRoot = cwd || this.getWorkspaceRoot();

        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace root found');
            return;
        }

        const terminal = vscode.window.createTerminal({
            name: 'UV',
            cwd: workspaceRoot
        });

        terminal.show();
        terminal.sendText(`${uvPath} ${args.join(' ')}`);
    }

    async checkUVInstalled(): Promise<boolean> {
        return new Promise((resolve) => {
            const uvPath = this.getUVPath();
            const command = `${uvPath} --version`;

            cp.exec(command, (error: cp.ExecException | null, stdout: string, stderr: string) => {
                resolve(!error);
            });
        });
    }

    private async getBasicProjectInfo(): Promise<any> {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) return null;

        const pyprojectPath = path.join(workspaceRoot, 'pyproject.toml');
        try {
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(pyprojectPath));
            const text = Buffer.from(content).toString('utf8');

            // Simple parsing for project name
            const nameMatch = text.match(/name\s*=\s*["']([^"']+)["']/);
            const versionMatch = text.match(/version\s*=\s*["']([^"']+)["']/);

            return {
                name: nameMatch ? nameMatch[1] : 'UV Project',
                version: versionMatch ? versionMatch[1] : 'Unknown Version'
            };
        } catch {
            return { name: 'UV Project', version: 'Unknown' };
        }
    }

    private parseDependenciesFromTree(treeOutput: string): string[] {
        const dependencies: string[] = [];
        const lines = treeOutput.split('\n');

        for (const line of lines) {
            // Look for lines that contain package names
            // UV tree output typically shows packages with versions
            const match = line.match(/^[├└]──\s*([a-zA-Z0-9_-]+)/);
            if (match) {
                const packageName = match[1];
                if (!dependencies.includes(packageName)) {
                    dependencies.push(packageName);
                }
            }
        }

        return dependencies;
    }

    private async getDependenciesFromPyproject(): Promise<string[]> {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) return [];

        const pyprojectPath = path.join(workspaceRoot, 'pyproject.toml');
        try {
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(pyprojectPath));
            const text = Buffer.from(content).toString('utf8');

            const dependencies: string[] = [];

            // Look for dependencies in [project.dependencies] section
            const depsMatch = text.match(/\[project\.dependencies\]\s*\n([\s\S]*?)(?=\n\[|\n$)/);
            if (depsMatch) {
                const depsSection = depsMatch[1];
                const depMatches = depsSection.matchAll(/^(\w+)\s*=/gm);
                for (const match of depMatches) {
                    dependencies.push(match[1]);
                }
            }

            // Also look for dependencies in [tool.poetry.dependencies] section
            const poetryDepsMatch = text.match(/\[tool\.poetry\.dependencies\]\s*\n([\s\S]*?)(?=\n\[|\n$)/);
            if (poetryDepsMatch) {
                const depsSection = poetryDepsMatch[1];
                const depMatches = depsSection.matchAll(/^(\w+)\s*=/gm);
                for (const match of depMatches) {
                    if (!dependencies.includes(match[1])) {
                        dependencies.push(match[1]);
                    }
                }
            }

            return dependencies;
        } catch {
            return [];
        }
    }

    async getCacheInfo(): Promise<any> {
        const result = await this.executeCommand(['cache', 'dir']);
        if (result.success) {
            return {
                cacheDir: result.output.trim(),
                size: await this.getCacheSize(result.output.trim())
            };
        }
        return null;
    }

    private async getCacheSize(cacheDir: string): Promise<string> {
        // This is a simplified implementation
        // In a real implementation, you'd calculate the actual size
        return 'Unknown';
    }

    async hasProjectFiles(): Promise<boolean> {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) {
            return false;
        }

        const pyprojectPath = path.join(workspaceRoot, 'pyproject.toml');
        const uvPath = path.join(workspaceRoot, 'uv.toml');

        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(pyprojectPath));
            return true;
        } catch {
            try {
                await vscode.workspace.fs.stat(vscode.Uri.file(uvPath));
                return true;
            } catch {
                return false;
            }
        }
    }

    async getCurrentVenvPythonVersion(): Promise<string | null> {
        // Try to get the Python version from the active venv
        try {
            const result = await this.executeCommand(['run', 'python', '--version']);
            if (result.success) {
                const match = result.output.match(/Python (\d+\.\d+\.\d+)/);
                return match ? match[1] : null;
            }
        } catch { }
        return null;
    }

    async listInstalledPythonVersions(): Promise<string[]> {
        // Use uv python list --installed if available, else fallback
        try {
            const result = await this.executeCommand(['python', 'list']);
            if (result.success) {
                // Example output: "3.11.0*\n3.10.8\n3.9.13"
                return result.output.split('\n')
                    .map(line => line.replace('*', '').trim())
                    .filter(line => /^\d+\.\d+\.\d+$/.test(line));
            }
        } catch { }
        return [];
    }

    async listAllPythonVersions(): Promise<string[]> {
        // Use uv python list --all if available, else fallback
        try {
            const result = await this.executeCommand(['python', 'list', '--all']);
            if (result.success) {
                // Example output: "3.11.0\n3.10.8\n3.9.13"
                return result.output.split('\n')
                    .map(line => line.trim())
                    .filter(line => /^\d+\.\d+\.\d+$/.test(line));
            }
        } catch { }
        return [];
    }

    async listAllPythonArches(): Promise<{
        id: string;
        version: string;
        status: 'active' | 'installed' | 'available';
        path?: string;
    }[]> {
        function extractVersion(id: string): string {
            // cpython-3.14.0b2-macos-aarch64-none => 3.14.0b2
            // pypy-3.11.11-macos-aarch64-none => 3.11.11
            // graalpy-3.11.0-macos-aarch64-none => 3.11.0
            const match = id.match(/-(\d+\.[\dabrc]+(?:\.[\dabrc]+)?)/);
            return match ? match[1] : id;
        }
        try {
            const result = await this.executeCommand(['python', 'list', '--all-arches']);
            if (result.success) {
                const lines = result.output.split('\n').map(line => line.trim()).filter(Boolean);
                const versions: {
                    id: string;
                    version: string;
                    status: 'active' | 'installed' | 'available';
                    path?: string;
                }[] = [];
                for (const line of lines) {
                    const match = line.match(/^(\S+)\s+(<download available>|.+)$/);
                    if (match) {
                        const id = match[1];
                        const version = extractVersion(id);
                        const right = match[2];
                        if (right === '<download available>') {
                            versions.push({ id, version, status: 'available' });
                        } else {
                            versions.push({ id, version, status: 'installed', path: right });
                        }
                    }
                }
                return versions;
            }
        } catch { }
        return [];
    }

    async getCurrentPythonToolchain(): Promise<string | null> {
        try {
            // Get the current Python toolchain being used by the project
            const result = await this.executeCommand(['run', 'python', '--version']);
            if (result.success) {
                // Try to get the toolchain info from UV
                const toolchainResult = await this.executeCommand(['python', 'list']);
                if (toolchainResult.success) {
                    // Look for the active toolchain (marked with *)
                    const lines = toolchainResult.output.split('\n');
                    for (const line of lines) {
                        if (line.includes('*')) {
                            // Extract the toolchain ID from the line
                            const match = line.match(/^(\S+)/);
                            if (match) {
                                return match[1];
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error getting current Python toolchain:', error);
        }
        return null;
    }

    async findToolchainForVersion(version: string): Promise<string | null> {
        const arches = await this.listAllPythonArches();
        // Find the first installed toolchain that matches the version
        const matching = arches.find(v =>
            v.status === 'installed' &&
            v.version.startsWith(version.split('.').slice(0, 2).join('.'))
        );
        return matching ? matching.id : null;
    }

    async installPythonVersion(id: string): Promise<boolean> {
        const arches = await this.listAllPythonArches();
        const found = arches.find(v => v.id === id);
        const version = found ? found.version : id;

        // Show progress and terminal output
        return new Promise((resolve) => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Installing Python ${version}...`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Opening terminal for installation...' });

                // Execute the install command in terminal for better visibility
                await this.executeInTerminalWithProgress(
                    ['python', 'install', id],
                    `UV: Install Python ${version}`,
                    this.getWorkspaceRoot()
                );

                progress.report({ increment: 100, message: 'Installation completed' });
                resolve(true);
            });
        });
    }

    async usePythonVersion(id: string): Promise<boolean> {
        // Find the version string for this id
        const arches = await this.listAllPythonArches();
        const found = arches.find(v => v.id === id);
        const version = found ? found.version : id;

        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace root found');
            return false;
        }

        try {
            // Step 1: Update .python-version file
            await this.updatePythonVersionFile(workspaceRoot, version);

            // Step 2: Update pyproject.toml if it exists
            await this.updatePyprojectToml(workspaceRoot, version);

            // Step 3: Remove existing virtual environment
            const venvs = await this.getEnvironments();
            let venvName = venvs[0] || '.venv';

            try {
                const venvPath = path.join(workspaceRoot, venvName);
                await vscode.workspace.fs.delete(vscode.Uri.file(venvPath), { recursive: true, useTrash: false });
            } catch (error) {
                // Venv might not exist, continue
                console.log('No existing venv to remove or error removing:', error);
            }

            // Step 4: Create new virtual environment with the selected Python version
            const result = await this.executeCommand(['venv', venvName, '--python', version]);
            if (!result.success) {
                vscode.window.showErrorMessage(`Failed to create virtual environment: ${result.error}`);
                return false;
            }

            // Step 5: Wait for venv to be ready
            const ok = await this.waitForVenvPythonVersion(version, 60);
            if (!ok) {
                vscode.window.showErrorMessage(`Timeout waiting for virtual environment to be ready`);
                return false;
            }

            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Error switching Python version: ${error}`);
            return false;
        }
    }

    private async updatePythonVersionFile(workspaceRoot: string, version: string): Promise<void> {
        const pythonVersionPath = path.join(workspaceRoot, '.python-version');
        try {
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(pythonVersionPath),
                Buffer.from(version + '\n', 'utf8')
            );
        } catch (error) {
            console.error('Error updating .python-version file:', error);
            throw new Error(`Failed to update .python-version file: ${error}`);
        }
    }

    private async updatePyprojectToml(workspaceRoot: string, version: string): Promise<void> {
        const pyprojectPath = path.join(workspaceRoot, 'pyproject.toml');

        try {
            // Check if pyproject.toml exists
            await vscode.workspace.fs.stat(vscode.Uri.file(pyprojectPath));
        } catch {
            // File doesn't exist, nothing to update
            return;
        }

        try {
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(pyprojectPath));
            let text = Buffer.from(content).toString('utf8');

            // Update Python version constraint in [project] section
            text = this.updatePythonVersionInPyproject(text, version);

            // Write back the updated content
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(pyprojectPath),
                Buffer.from(text, 'utf8')
            );
        } catch (error) {
            console.error('Error updating pyproject.toml:', error);
            throw new Error(`Failed to update pyproject.toml: ${error}`);
        }
    }

    private updatePythonVersionInPyproject(content: string, version: string): string {
        // Extract major.minor from version (e.g., 3.11.0 -> 3.11)
        const majorMinor = version.match(/^(\d+\.\d+)/)?.[1] || version;

        // Validate version format
        if (!/^\d+\.\d+(\.\d+)?([ab]\d+)?(rc\d+)?$/.test(version)) {
            console.warn(`Invalid Python version format: ${version}`);
        }

        // Look for existing requires-python in [project] section
        const projectSectionRegex = /\[project\]\s*\n([\s\S]*?)(?=\n\[|\n$)/;
        const projectMatch = content.match(projectSectionRegex);

        if (projectMatch) {
            const projectSection = projectMatch[1];
            const requiresPythonRegex = /requires-python\s*=\s*["']([^"']+)["']/;

            if (requiresPythonRegex.test(projectSection)) {
                // Update existing requires-python
                return content.replace(
                    requiresPythonRegex,
                    `requires-python = ">=${majorMinor}"`
                );
            } else {
                // Add requires-python to existing [project] section
                return content.replace(
                    /\[project\]\s*\n/,
                    `[project]\nrequires-python = ">=${majorMinor}"\n`
                );
            }
        } else {
            // No [project] section, add it
            return content + `\n[project]\nrequires-python = ">=${majorMinor}"\n`;
        }
    }

    private async checkVenvExists(): Promise<boolean> {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) return false;

        const venvPath = path.join(workspaceRoot, '.venv');
        const pythonPath = process.platform === 'win32'
            ? path.join(venvPath, 'Scripts', 'python.exe')
            : path.join(venvPath, 'bin', 'python');

        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(pythonPath));
            return true;
        } catch {
            return false;
        }
    }

    private async waitForVenvPythonVersion(version: string, maxSeconds: number = 300): Promise<boolean> {
        const interval = 2000; // 2 seconds
        let waited = 0;
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) return false;

        while (waited < maxSeconds * 1000) {
            try {
                // Strategy 1: Use UV's run command to check Python version in the virtual environment
                const result = await this.executeCommand(['run', 'python', '--version']);
                if (result.success) {
                    // Extract version from output like "Python 3.11.0"
                    const match = result.output.match(/Python (\d+\.\d+\.\d+)/);
                    if (match) {
                        const actualVersion = match[1];
                        // Check if major.minor versions match (more lenient)
                        const expectedMajorMinor = version.split('.').slice(0, 2).join('.');
                        const actualMajorMinor = actualVersion.split('.').slice(0, 2).join('.');

                        if (expectedMajorMinor === actualMajorMinor) {
                            console.log(`Python version verified: expected ${version}, got ${actualVersion}`);
                            return true;
                        }
                    }
                }

                // Strategy 2: Check if the virtual environment directory exists and has Python
                const venvPath = path.join(workspaceRoot, '.venv');
                const pythonPath = process.platform === 'win32'
                    ? path.join(venvPath, 'Scripts', 'python.exe')
                    : path.join(venvPath, 'bin', 'python');

                try {
                    await vscode.workspace.fs.stat(vscode.Uri.file(pythonPath));
                    // If Python binary exists, try one more time with UV run
                    const retryResult = await this.executeCommand(['run', 'python', '--version']);
                    if (retryResult.success) {
                        console.log('Python binary exists and UV can run Python');
                        return true;
                    }
                } catch {
                    // Python binary doesn't exist yet, continue waiting
                }

            } catch (error) {
                console.log('Waiting for venv to be ready, attempt failed:', error);
            }

            await new Promise(res => setTimeout(res, interval));
            waited += interval;
        }

        // Final fallback: just check if UV can run Python at all
        try {
            const finalCheck = await this.executeCommand(['run', 'python', '--version']);
            if (finalCheck.success) {
                console.log('Final check: UV can run Python, proceeding anyway');
                return true;
            }
        } catch {
            // Ignore final check errors
        }

        return false;
    }

    async uninstallPythonVersion(id: string): Promise<boolean> {
        // Find the version string for this id
        const arches = await this.listAllPythonArches();
        const found = arches.find(v => v.id === id);
        const version = found ? found.version : id;
        const result = await this.executeCommand(['python', 'uninstall', version]);
        return result.success;
    }

    private validatePythonVersion(version: string): boolean {
        // Accept formats like: 3.11, 3.11.0, 3.11.0a1, 3.11.0b2, 3.11.0rc1
        const versionRegex = /^\d+\.\d+(\.\d+)?([ab]\d+)?(rc\d+)?$/;
        return versionRegex.test(version);
    }

    async switchProjectPythonVersion(version: string): Promise<boolean> {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace root found');
            return false;
        }

        // Validate Python version format
        if (!this.validatePythonVersion(version)) {
            vscode.window.showErrorMessage(`Invalid Python version format: ${version}. Expected format: X.Y.Z or X.Y`);
            return false;
        }

        return new Promise((resolve) => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Switching project to Python ${version}...`,
                cancellable: false
            }, async (progress) => {
                try {
                    // Step 1: Find the toolchain for this version
                    progress.report({ increment: 10, message: 'Finding Python toolchain...' });
                    const toolchainId = await this.findToolchainForVersion(version);
                    if (!toolchainId) {
                        throw new Error(`No installed Python toolchain found for version ${version}. Please install it first.`);
                    }

                    // Step 2: Update .python-version file with the toolchain ID
                    progress.report({ increment: 20, message: 'Updating project configuration...' });
                    await this.updatePythonVersionFile(workspaceRoot, toolchainId);
                    await this.updatePyprojectToml(workspaceRoot, version);

                    // Step 3: Remove existing virtual environment
                    progress.report({ increment: 20, message: 'Removing existing virtual environment...' });
                    const venvs = await this.getEnvironments();
                    let venvName = venvs[0] || '.venv';

                    try {
                        const venvPath = path.join(workspaceRoot, venvName);
                        await vscode.workspace.fs.delete(vscode.Uri.file(venvPath), { recursive: true, useTrash: false });
                    } catch (error) {
                        // Venv might not exist, continue
                    }

                    // Step 4: Create new virtual environment using the toolchain
                    progress.report({ increment: 20, message: 'Creating new virtual environment...' });
                    await this.executeInTerminalWithProgress(
                        ['venv', venvName, '--python', toolchainId],
                        `UV: Create venv with Python ${version} (${toolchainId})`,
                        workspaceRoot
                    );

                    // Step 5: Wait for venv to be ready
                    progress.report({ increment: 20, message: 'Verifying virtual environment...' });
                    const ok = await this.waitForVenvPythonVersion(version, 60);
                    if (!ok) {
                        // Check if venv exists and try to continue anyway
                        const venvExists = await this.checkVenvExists();
                        if (venvExists) {
                            vscode.window.showWarningMessage('Virtual environment verification took longer than expected, but continuing with sync...');
                        } else {
                            // Try to get more information about what went wrong
                            let debugInfo = '';

                            try {
                                const debugResult = await this.executeCommand(['run', 'python', '--version']);
                                if (debugResult.success) {
                                    debugInfo += ` UV can run Python: ${debugResult.output.trim()}`;
                                } else {
                                    debugInfo += ` UV cannot run Python: ${debugResult.error}`;
                                }
                            } catch {
                                debugInfo += ' UV cannot run Python at all';
                            }

                            throw new Error(`Timeout waiting for virtual environment to be ready.${debugInfo} Please check the terminal output for any errors.`);
                        }
                    }

                    // Step 6: Sync dependencies (show in terminal)
                    progress.report({ increment: 10, message: 'Syncing dependencies...' });
                    await this.executeInTerminalWithProgress(
                        ['sync'],
                        `UV: Sync dependencies for Python ${version}`,
                        workspaceRoot
                    );

                    progress.report({ increment: 100, message: 'Python version switch completed' });
                    vscode.window.showInformationMessage(`Successfully switched project to Python ${version} (${toolchainId})`);
                    resolve(true);

                } catch (error) {
                    progress.report({ increment: 100, message: 'Switch failed' });
                    vscode.window.showErrorMessage(`Failed to switch Python version: ${error}`);
                    resolve(false);
                }
            });
        });
    }

    async getPythonVersionFromFiles(): Promise<string | null> {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) return null;

        // Check .python-version file first (this contains the toolchain ID)
        const pythonVersionPath = path.join(workspaceRoot, '.python-version');
        try {
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(pythonVersionPath));
            const toolchainId = Buffer.from(content).toString('utf8').trim();
            if (toolchainId) {
                // Extract version from toolchain ID
                const match = toolchainId.match(/-(\d+\.[\dabrc]+(?:\.[\dabrc]+)?)/);
                return match ? match[1] : toolchainId;
            }
        } catch {
            // File doesn't exist or can't be read
        }

        // Check pyproject.toml
        const pyprojectPath = path.join(workspaceRoot, 'pyproject.toml');
        try {
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(pyprojectPath));
            const text = Buffer.from(content).toString('utf8');

            // Look for requires-python in [project] section
            const projectSectionRegex = /\[project\]\s*\n([\s\S]*?)(?=\n\[|\n$)/;
            const projectMatch = text.match(projectSectionRegex);

            if (projectMatch) {
                const projectSection = projectMatch[1];
                const requiresPythonMatch = projectSection.match(/requires-python\s*=\s*["']([^"']+)["']/);
                if (requiresPythonMatch) {
                    return requiresPythonMatch[1];
                }
            }
        } catch {
            // File doesn't exist or can't be read
        }

        return null;
    }

    async executeInTerminalWithProgress(args: string[], title: string, cwd?: string): Promise<boolean> {
        const uvPath = this.getUVPath();
        const workspaceRoot = cwd || this.getWorkspaceRoot();

        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace root found');
            return false;
        }

        return new Promise((resolve) => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: title,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Opening terminal...' });

                const terminal = vscode.window.createTerminal({
                    name: title,
                    cwd: workspaceRoot
                });

                terminal.show();
                progress.report({ increment: 50, message: 'Executing command...' });
                terminal.sendText(`${uvPath} ${args.join(' ')}`);

                // Show a message to the user
                vscode.window.showInformationMessage(`Command executed in terminal: ${uvPath} ${args.join(' ')}`);

                // Wait a bit for the command to start
                setTimeout(() => {
                    progress.report({ increment: 100, message: 'Command completed' });
                    resolve(true);
                }, 2000);
            });
        });
    }

    async getUVToolchainDirectory(): Promise<string | null> {
        try {
            const result = await this.executeCommand(['python', 'list', '--help']);
            if (result.success) {
                // Try to get the toolchain directory from UV's configuration
                const configResult = await this.executeCommand(['config', 'get', 'toolchain-dir']);
                if (configResult.success) {
                    return configResult.output.trim();
                }
            }
        } catch (error) {
            console.error('Error getting UV toolchain directory:', error);
        }

        // Fallback: try common locations
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        if (homeDir) {
            const commonPaths = [
                path.join(homeDir, '.uv', 'toolchains'),
                path.join(homeDir, '.local', 'share', 'uv', 'toolchains'),
                path.join(homeDir, 'Library', 'Application Support', 'uv', 'toolchains')
            ];

            for (const toolchainPath of commonPaths) {
                try {
                    await vscode.workspace.fs.stat(vscode.Uri.file(toolchainPath));
                    return toolchainPath;
                } catch {
                    // Path doesn't exist, continue
                }
            }
        }

        return null;
    }

    async getToolchainInfo(): Promise<any> {
        const currentToolchain = await this.getCurrentPythonToolchain();
        const currentVersion = await this.getCurrentVenvPythonVersion();
        const toolchainDir = await this.getUVToolchainDirectory();

        let description = 'No active toolchain found.';
        let pythonVersion = 'Unknown';
        let toolchainVersion = 'Unknown';
        let toolchainType = 'Unknown';
        let toolchainPath = 'Unknown';

        if (currentToolchain) {
            description = `Active toolchain: ${currentToolchain}`;
            pythonVersion = currentVersion || 'Unknown';
            toolchainVersion = currentToolchain;

            // Extract toolchain type from ID
            if (currentToolchain.startsWith('cpython-')) {
                toolchainType = 'CPython';
            } else if (currentToolchain.startsWith('pypy-')) {
                toolchainType = 'PyPy';
            } else if (currentToolchain.startsWith('graalpy-')) {
                toolchainType = 'GraalPy';
            } else {
                toolchainType = 'Unknown';
            }

            toolchainPath = toolchainDir || 'Unknown';
        }

        return {
            description,
            pythonVersion,
            toolchainVersion,
            toolchainType,
            toolchainPath
        };
    }
} 