import * as vscode from 'vscode';
import { UVExecutor } from './uvExecutor';

export class UVContextProvider {
    private uvExecutor: UVExecutor;
    private contextKey = 'workspaceHasPythonProject';

    constructor() {
        this.uvExecutor = new UVExecutor();
        this.updateContext();

        // Watch for workspace changes
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            this.updateContext();
        });

        // Watch for file changes that might affect project status
        const fileWatcher = vscode.workspace.createFileSystemWatcher('**/{pyproject.toml,uv.toml}');
        fileWatcher.onDidChange(() => this.updateContext());
        fileWatcher.onDidCreate(() => this.updateContext());
        fileWatcher.onDidDelete(() => this.updateContext());
    }

    private async updateContext(): Promise<void> {
        const hasProject = await this.uvExecutor.hasProjectFiles();
        vscode.commands.executeCommand('setContext', this.contextKey, hasProject);
    }
} 