import * as vscode from 'vscode';
import { UVExecutor } from '../uvExecutor';

export interface DependencyInfo {
    name: string;
    version?: string;
    type: 'production' | 'development' | 'optional';
    description?: string;
    latestVersion?: string;
    outdated?: boolean;
}

export class DependenciesProvider implements vscode.TreeDataProvider<DependencyItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DependencyItem | undefined | null | void> = new vscode.EventEmitter<DependencyItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DependencyItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private uvExecutor: UVExecutor) { }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DependencyItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: DependencyItem): Thenable<DependencyItem[]> {
        if (element) {
            // Return children for category headers
            return this.getChildrenForCategory(element);
        }

        return this.getDependencies();
    }

    private async getChildrenForCategory(element: DependencyItem): Promise<DependencyItem[]> {
        const dependencies = await this.uvExecutor.getDependencies();
        const dependencyInfos = await this.getDetailedDependencies(dependencies);

        if (element.category === 'production') {
            const productionDeps = dependencyInfos.filter(d => d.type === 'production');
            return productionDeps.map(dep => new DependencyItem(
                dep.name,
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'uv.showDependencyDetails',
                    title: 'Show Details',
                    arguments: [dep]
                },
                'package',
                dep.description || `Version: ${dep.version || 'latest'}`,
                dep.outdated ? 'outdated' : undefined
            ));
        } else if (element.category === 'development') {
            const devDeps = dependencyInfos.filter(d => d.type === 'development');
            return devDeps.map(dep => new DependencyItem(
                dep.name,
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'uv.showDependencyDetails',
                    title: 'Show Details',
                    arguments: [dep]
                },
                'tools',
                dep.description || `Version: ${dep.version || 'latest'}`,
                dep.outdated ? 'outdated' : undefined
            ));
        } else if (element.category === 'optional') {
            const optionalDeps = dependencyInfos.filter(d => d.type === 'optional');
            return optionalDeps.map(dep => new DependencyItem(
                dep.name,
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'uv.showDependencyDetails',
                    title: 'Show Details',
                    arguments: [dep]
                },
                'star',
                dep.description || `Version: ${dep.version || 'latest'}`,
                dep.outdated ? 'outdated' : undefined
            ));
        }

        return [];
    }

    private async getDependencies(): Promise<DependencyItem[]> {
        try {
            const dependencies = await this.uvExecutor.getDependencies();
            const dependencyInfos = await this.getDetailedDependencies(dependencies);

            if (dependencyInfos.length === 0) {
                return [
                    new DependencyItem(
                        'No dependencies found',
                        vscode.TreeItemCollapsibleState.None,
                        undefined,
                        'info',
                        'Click "Add Dependencies" to get started'
                    )
                ];
            }

            // Group dependencies by type
            const productionDeps = dependencyInfos.filter(d => d.type === 'production');
            const devDeps = dependencyInfos.filter(d => d.type === 'development');
            const optionalDeps = dependencyInfos.filter(d => d.type === 'optional');

            const items: DependencyItem[] = [];

            // Add production dependencies section
            if (productionDeps.length > 0) {
                items.push(new DependencyItem(
                    `Production Dependencies (${productionDeps.length})`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    undefined,
                    'package',
                    'Production dependencies required for runtime',
                    undefined,
                    'production'
                ));
            }

            // Add development dependencies section
            if (devDeps.length > 0) {
                items.push(new DependencyItem(
                    `Development Dependencies (${devDeps.length})`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    undefined,
                    'tools',
                    'Development dependencies for testing and building',
                    undefined,
                    'development'
                ));
            }

            // Add optional dependencies section
            if (optionalDeps.length > 0) {
                items.push(new DependencyItem(
                    `Optional Dependencies (${optionalDeps.length})`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    undefined,
                    'star',
                    'Optional dependencies for additional features',
                    undefined,
                    'optional'
                ));
            }

            return items;
        } catch (error) {
            console.error('Error getting dependencies:', error);
            return [
                new DependencyItem(
                    'Failed to load dependencies',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    'error',
                    'Click to retry'
                )
            ];
        }
    }

    private async getDetailedDependencies(dependencies: string[]): Promise<DependencyInfo[]> {
        const dependencyInfos: DependencyInfo[] = [];

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
                    version: 'unknown'
                });
            }
        }

        return dependencyInfos;
    }

    private async getDependencyInfo(depName: string): Promise<DependencyInfo> {
        // This is a simplified implementation
        // In a real implementation, you'd query PyPI or use UV's API
        return {
            name: depName,
            type: 'production', // Default to production
            version: 'latest',
            description: `Python package: ${depName}`
        };
    }
}

export class DependencyItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        public readonly iconType: string = 'package',
        public readonly description?: string,
        public readonly status?: string,
        public readonly category?: string
    ) {
        super(label, collapsibleState);

        this.tooltip = description || label;
        this.description = description;

        // Set context value for context menu
        if (this.status === 'outdated') {
            this.contextValue = 'dependency.outdated';
        } else if (this.label.includes('Dependencies (')) {
            this.contextValue = 'dependency.group';
        } else {
            this.contextValue = 'dependency';
        }

        // Set icon based on type
        switch (iconType) {
            case 'package':
                this.iconPath = new vscode.ThemeIcon('package');
                break;
            case 'tools':
                this.iconPath = new vscode.ThemeIcon('tools');
                break;
            case 'star':
                this.iconPath = new vscode.ThemeIcon('star');
                break;
            case 'error':
                this.iconPath = new vscode.ThemeIcon('error');
                break;
            case 'info':
                this.iconPath = new vscode.ThemeIcon('info');
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('package');
        }

        // Add status decoration for outdated packages
        if (this.status === 'outdated') {
            this.description = `${this.description} (outdated)`;
        }
    }
} 