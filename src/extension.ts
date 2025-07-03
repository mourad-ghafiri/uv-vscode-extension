import * as vscode from 'vscode';
import { UVExecutor } from './uvExecutor';
import { DependenciesProvider } from './providers/dependenciesProvider';
import { EnvironmentsProvider } from './providers/environmentsProvider';
import { CacheProvider } from './providers/cacheProvider';
import { TestCodeLensProvider } from './providers/testCodeLensProvider';
import { UVCommands } from './commands/uvCommands';
import { UVStatusBar } from './statusBar';
import { UVContextProvider } from './contextProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('UV extension is now active!');

    const uvExecutor = new UVExecutor();
    const statusBar = new UVStatusBar();
    const uvCommands = new UVCommands(uvExecutor, statusBar);
    const contextProvider = new UVContextProvider();

    // Register tree view providers
    const dependenciesProvider = new DependenciesProvider(uvExecutor);
    const environmentsProvider = new EnvironmentsProvider(uvExecutor);
    const cacheProvider = new CacheProvider(uvExecutor);

    vscode.window.registerTreeDataProvider('uv.dependencies', dependenciesProvider);
    vscode.window.registerTreeDataProvider('uv.environments', environmentsProvider);
    vscode.window.registerTreeDataProvider('uv.cache', cacheProvider);

    // Register CodeLens provider for test files
    const testCodeLensProvider = new TestCodeLensProvider();
    vscode.languages.registerCodeLensProvider(
        { pattern: '**/*test*.py', scheme: 'file' },
        testCodeLensProvider
    );

    // Register commands
    const commands = [
        vscode.commands.registerCommand('uv.init', () => uvCommands.init()),

        vscode.commands.registerCommand('uv.add', () => uvCommands.add()),
        vscode.commands.registerCommand('uv.remove', (item) => uvCommands.remove(item)),
        vscode.commands.registerCommand('uv.sync', () => uvCommands.sync()),
        vscode.commands.registerCommand('uv.lock', () => uvCommands.lock()),
        vscode.commands.registerCommand('uv.run', () => uvCommands.run()),
        vscode.commands.registerCommand('uv.runFile', () => uvCommands.runFile()),
        vscode.commands.registerCommand('uv.tree', () => uvCommands.tree()),
        vscode.commands.registerCommand('uv.venv', () => uvCommands.venv()),
        vscode.commands.registerCommand('uv.python', () => uvCommands.python()),
        vscode.commands.registerCommand('uv.pip', () => uvCommands.pip()),
        vscode.commands.registerCommand('uv.build', () => uvCommands.build()),
        vscode.commands.registerCommand('uv.publish', () => uvCommands.publish()),
        vscode.commands.registerCommand('uv.cache', () => uvCommands.cache()),
        vscode.commands.registerCommand('uv.version', () => uvCommands.version()),
        vscode.commands.registerCommand('uv.export', () => uvCommands.export()),
        vscode.commands.registerCommand('uv.tool', () => uvCommands.tool()),
        vscode.commands.registerCommand('uv.self', () => uvCommands.self()),
        vscode.commands.registerCommand('uv.help', () => uvCommands.help()),
        vscode.commands.registerCommand('uv.showQuickActions', () => uvCommands.showQuickActions()),
        vscode.commands.registerCommand('uv.activateVenv', () => uvCommands.activateVenv()),
        vscode.commands.registerCommand('uv.deactivateVenv', () => uvCommands.deactivateVenv()),
        vscode.commands.registerCommand('uv.refreshDependencies', () => dependenciesProvider.refresh()),
        vscode.commands.registerCommand('uv.refreshEnvironments', () => environmentsProvider.refresh()),
        vscode.commands.registerCommand('uv.refreshCache', () => cacheProvider.refresh()),
        vscode.commands.registerCommand('uv.showDependencyDetails', (dependency) => uvCommands.showDependencyDetails(dependency)),
        vscode.commands.registerCommand('uv.updateDependency', (packageName) => uvCommands.updateDependency(packageName)),
        vscode.commands.registerCommand('uv.bulkAdd', () => uvCommands.bulkAdd()),
        vscode.commands.registerCommand('uv.manageTests', () => uvCommands.manageTests()),
        vscode.commands.registerCommand('uv.runTest', () => uvCommands.runTest()),
        vscode.commands.registerCommand('uv.runTestMethod', () => uvCommands.runTestMethod()),
        vscode.commands.registerCommand('uv.installSpecificPythonVersion', () => uvCommands.installSpecificPythonVersion()),
        vscode.commands.registerCommand('uv.showToolchainInfo', () => uvCommands.showToolchainInfo()),
        vscode.commands.registerCommand('uv.forceRefreshStatusBar', () => statusBar.forceRefresh()),
        vscode.commands.registerCommand('uv.toggleHttpServer', async () => {
            const httpServerManager = statusBar.getHttpServerManager();
            if (httpServerManager.isRunning()) {
                httpServerManager.stopServer();
                return;
            }
            // Folder selection
            const workspaceFolders = vscode.workspace.workspaceFolders || [];
            const rootFolder = workspaceFolders[0]?.uri.fsPath || process.cwd();
            // List top-level folders in the workspace
            let folderItems: vscode.QuickPickItem[] = [
                { label: 'Current Project', description: rootFolder }
            ];
            try {
                const fs = require('fs');
                const path = require('path');
                const entries = fs.readdirSync(rootFolder, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.isDirectory() && entry.name !== '.git' && entry.name !== '.venv' && entry.name !== 'venv' && entry.name !== 'env' && entry.name !== '.env') {
                        folderItems.push({ label: entry.name, description: path.join(rootFolder, entry.name) });
                    }
                }
            } catch (e) {
                // ignore errors, just show root
            }
            const picked = await vscode.window.showQuickPick(folderItems, {
                placeHolder: 'Select folder to serve',
                ignoreFocusOut: true
            });
            if (!picked) return; // ESC/cancel
            let folder = picked.description || rootFolder;
            // Port selection
            const portPick = await vscode.window.showInputBox({
                prompt: 'Enter port (default: 8000)',
                value: '8000',
                validateInput: (val) => val === '' || (/^\d+$/.test(val) && +val > 0 && +val < 65536) ? null : 'Enter a valid port number',
                ignoreFocusOut: true
            });
            if (typeof portPick === 'undefined') return; // ESC/cancel
            let port = 8000;
            if (portPick && portPick.trim() !== '') {
                port = parseInt(portPick.trim(), 10);
            }
            await httpServerManager.startServer(folder, port);
        }),
    ];

    commands.forEach(command => context.subscriptions.push(command));

    // Add status bar and CodeLens provider to subscriptions to prevent disposal
    context.subscriptions.push(statusBar, testCodeLensProvider);

    // Use debounced status bar update for most file changes
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/{pyproject.toml,uv.lock,uv.toml}');
    fileWatcher.onDidChange(() => {
        dependenciesProvider.refresh();
        environmentsProvider.refresh();
        cacheProvider.refresh();
        statusBar.debouncedUpdateStatus();
    });
    fileWatcher.onDidCreate(() => {
        dependenciesProvider.refresh();
        environmentsProvider.refresh();
        cacheProvider.refresh();
        statusBar.debouncedUpdateStatus();
    });
    fileWatcher.onDidDelete(() => {
        dependenciesProvider.refresh();
        environmentsProvider.refresh();
        cacheProvider.refresh();
        statusBar.debouncedUpdateStatus();
    });

    // Watch for test file changes to refresh CodeLens
    const testFileWatcher = vscode.workspace.createFileSystemWatcher('**/*test*.py');
    testFileWatcher.onDidChange(() => {
        testCodeLensProvider.refresh();
    });
    testFileWatcher.onDidCreate(() => {
        testCodeLensProvider.refresh();
    });
    testFileWatcher.onDidDelete(() => {
        testCodeLensProvider.refresh();
    });

    // Watch for virtual environment changes
    const venvWatcher = vscode.workspace.createFileSystemWatcher('**/{.venv,venv,env,.env}/**');
    venvWatcher.onDidChange(() => {
        environmentsProvider.refresh();
        statusBar.debouncedUpdateStatus();
    });
    venvWatcher.onDidCreate(() => {
        environmentsProvider.refresh();
        statusBar.debouncedUpdateStatus();
    });
    venvWatcher.onDidDelete(() => {
        environmentsProvider.refresh();
        statusBar.debouncedUpdateStatus();
    });

    context.subscriptions.push(fileWatcher, venvWatcher, testFileWatcher);
}

export function deactivate() {
    console.log('UV extension is now deactivated!');
} 