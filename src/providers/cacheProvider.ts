import * as vscode from 'vscode';
import { UVExecutor } from '../uvExecutor';

export class CacheProvider implements vscode.TreeDataProvider<CacheItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CacheItem | undefined | null | void> = new vscode.EventEmitter<CacheItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CacheItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private uvExecutor: UVExecutor) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: CacheItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: CacheItem): Thenable<CacheItem[]> {
        if (element) {
            return Promise.resolve([]);
        }

        return this.getCacheInfo();
    }

    private async getCacheInfo(): Promise<CacheItem[]> {
        try {
            const cacheInfo = await this.uvExecutor.getCacheInfo();
            if (cacheInfo) {
                return [
                    new CacheItem('Cache Directory', cacheInfo.cacheDir, vscode.TreeItemCollapsibleState.None),
                    new CacheItem('Cache Size', cacheInfo.size, vscode.TreeItemCollapsibleState.None)
                ];
            } else {
                return [new CacheItem('No cache information available', '', vscode.TreeItemCollapsibleState.None)];
            }
        } catch (error) {
            return [new CacheItem('Failed to load cache information', '', vscode.TreeItemCollapsibleState.None)];
        }
    }
}

export class CacheItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);

        this.tooltip = `${this.label}: ${this.description}`;
        this.description = this.description;
        this.contextValue = 'cache';
    }

    iconPath = new vscode.ThemeIcon('database');
} 