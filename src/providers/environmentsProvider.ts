import * as vscode from 'vscode';
import { UVExecutor } from '../uvExecutor';

export class EnvironmentsProvider implements vscode.TreeDataProvider<EnvironmentItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<EnvironmentItem | undefined | null | void> = new vscode.EventEmitter<EnvironmentItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<EnvironmentItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private uvExecutor: UVExecutor) { }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: EnvironmentItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: EnvironmentItem): Thenable<EnvironmentItem[]> {
        if (element) {
            return Promise.resolve([]);
        }

        return this.getEnvironments();
    }

    private async getEnvironments(): Promise<EnvironmentItem[]> {
        try {
            const environments = await this.uvExecutor.getEnvironments();

            if (environments.length === 0) {
                return [new EnvironmentItem('No virtual environments found', vscode.TreeItemCollapsibleState.None)];
            }

            return environments.map(env => new EnvironmentItem(env, vscode.TreeItemCollapsibleState.None));
        } catch (error) {
            console.error('Error getting environments:', error);
            return [new EnvironmentItem('Failed to load environments', vscode.TreeItemCollapsibleState.None)];
        }
    }
}

export class EnvironmentItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);

        this.tooltip = `${this.label}`;
        this.description = this.label;
        this.contextValue = 'environment';
    }

    iconPath = new vscode.ThemeIcon('server-environment');
} 