import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PROJECT_TEMPLATES, ProjectTemplate, FrameworkOption, DatabaseOption, AIOption, TestFrameworkOption, CacheSystemOption, FeatureOption } from './projectTemplates';
import { UVExecutor } from '../uvExecutor';

export class TemplateManager {
    constructor(private uvExecutor: UVExecutor) { }

    async createProjectWithTemplate(): Promise<void> {
        try {
            // Step 1: Get project name
            const projectName = await this.getProjectName();
            if (projectName === undefined) return; // User cancelled

            // Step 2: Select project type
            const template = await this.selectProjectType();
            if (!template) return;

            // Step 3: Select framework (skip for empty project)
            let framework: FrameworkOption | undefined;
            if (template.frameworks.length > 0) {
                framework = await this.selectFramework(template);
                if (framework === undefined) return; // User cancelled
            }

            // Step 4: Select database (skip for empty project)
            let database: DatabaseOption | undefined;
            if (template.databases.length > 0) {
                database = await this.selectDatabase(template);
                if (database === undefined) return; // User cancelled
            }

            // Step 5: Select AI integration (skip for empty project)
            let aiIntegration: AIOption | undefined;
            if (template.aiIntegrations.length > 0) {
                aiIntegration = await this.selectAIIntegration(template);
                if (aiIntegration === undefined) return; // User cancelled
            }

            // Step 6: Select test framework (skip for empty project)
            let testFramework: TestFrameworkOption | undefined;
            if (template.testFrameworks.length > 0) {
                testFramework = await this.selectTestFramework(template);
                if (testFramework === undefined) return; // User cancelled
            }

            // Step 7: Select cache system (skip for empty project)
            let cacheSystem: CacheSystemOption | undefined;
            if (template.cacheSystems.length > 0) {
                cacheSystem = await this.selectCacheSystem(template);
                if (cacheSystem === undefined) return; // User cancelled
            }

            // Step 8: Select additional features (skip for empty project)
            let features: FeatureOption[] = [];
            if (template.features.length > 0) {
                features = await this.selectFeatures(template);
                if (features === undefined) return; // User cancelled
            }

            // Step 9: Create the project
            await this.createProject(projectName, template, framework, database, aiIntegration, testFramework, cacheSystem, features);

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create project: ${error}`);
        }
    }

    private async getProjectName(): Promise<string | undefined> {
        const input = await vscode.window.showInputBox({
            prompt: 'Enter project name (leave empty to use current directory name)',
            placeHolder: 'my-awesome-project or leave empty for current directory',
            validateInput: (value) => {
                if (value && value.trim() !== '' && !/^[a-zA-Z0-9_-]+$/.test(value)) {
                    return 'Project name can only contain letters, numbers, hyphens, and underscores';
                }
                return null;
            }
        });

        // Return undefined if user cancelled, empty string if they want to use current directory
        return input;
    }

    private async selectProjectType(): Promise<ProjectTemplate | undefined> {
        // Create all template options including empty project
        const allTemplates = [this.getEmptyProjectTemplate(), ...PROJECT_TEMPLATES];

        const templateItems = allTemplates.map(template => ({
            label: template.icon + ' ' + template.name,
            description: template.description,
            template: template
        }));

        const selectedTemplate = await vscode.window.showQuickPick(templateItems, {
            placeHolder: 'Select project template'
        });

        return selectedTemplate?.template;
    }

    private getEmptyProjectTemplate(): ProjectTemplate {
        return {
            id: 'empty',
            name: 'Empty Project',
            description: 'Basic UV project with minimal structure',
            category: 'empty',
            icon: '$(new-folder)',
            frameworks: [],
            databases: [],
            aiIntegrations: [],
            testFrameworks: [],
            cacheSystems: [],
            features: [],
            dependencies: {
                production: [],
                development: ['pytest'],
                optional: []
            },
            files: [
                {
                    path: 'src/main.py',
                    content: `def hello_world():
    """A simple function that returns a greeting message."""
    return "Hello, World!"

def add_numbers(a: int, b: int) -> int:
    """Add two numbers together."""
    return a + b

if __name__ == "__main__":
    print(hello_world())
    print(f"2 + 3 = {add_numbers(2, 3)}")`,
                    description: 'Main application file with sample functions'
                },
                {
                    path: 'tests/test_main.py',
                    content: `import pytest
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import hello_world, add_numbers

def test_hello_world():
    """Test the hello_world function."""
    result = hello_world()
    assert result == "Hello, World!"

def test_add_numbers():
    """Test the add_numbers function."""
    result = add_numbers(2, 3)
    assert result == 5
    
    result = add_numbers(-1, 1)
    assert result == 0
    
    result = add_numbers(0, 0)
    assert result == 0

def test_add_numbers_with_negative():
    """Test add_numbers with negative values."""
    result = add_numbers(-5, -3)
    assert result == -8`,
                    description: 'Test file for main functions'
                },
                {
                    path: 'README.md',
                    content: `# {{PROJECT_NAME}}

A Python project created with UV.

## Setup

1. Install dependencies:
   \`\`\`bash
   uv sync
   \`\`\`

2. Run the application:
   \`\`\`bash
   uv run python src/main.py
   \`\`\`

3. Run tests:
   \`\`\`bash
   uv run pytest
   \`\`\`

## Project Structure

- \`src/main.py\` - Main application code
- \`tests/test_main.py\` - Test files
- \`pyproject.toml\` - Project configuration
- \`.python-version\` - Python version specification

## Development

- Add new functions to \`src/main.py\`
- Add corresponding tests to \`tests/test_main.py\`
- Run \`uv run pytest\` to test your changes`,
                    description: 'Project README with setup instructions'
                }
            ]
        };
    }

    private async selectFramework(template: ProjectTemplate): Promise<FrameworkOption | undefined> {
        if (template.frameworks.length === 0) return undefined;

        const frameworkItems = template.frameworks.map(framework => ({
            label: framework.icon + ' ' + framework.name,
            description: framework.description,
            detail: framework.features.join(', '),
            framework: framework
        }));

        const selectedFramework = await vscode.window.showQuickPick(frameworkItems, {
            placeHolder: 'Select framework'
        });

        return selectedFramework?.framework;
    }

    private async selectDatabase(template: ProjectTemplate): Promise<DatabaseOption | undefined> {
        if (template.databases.length === 0) return undefined;

        const databaseItems = template.databases.map(database => ({
            label: database.icon + ' ' + database.name,
            description: database.description,
            detail: database.features.join(', '),
            database: database
        }));

        // Add "No database" option
        databaseItems.unshift({
            label: '$(circle-slash) No Database',
            description: 'Skip database setup',
            detail: 'API-only or file-based storage',
            database: { id: 'none', name: 'None', description: 'No database', icon: '$(circle-slash)', dependencies: [], configFiles: [], features: [] }
        });

        const selectedDatabase = await vscode.window.showQuickPick(databaseItems, {
            placeHolder: 'Select database (optional)'
        });

        return selectedDatabase?.database;
    }

    private async selectAIIntegration(template: ProjectTemplate): Promise<AIOption | undefined> {
        if (template.aiIntegrations.length === 0) return undefined;

        const aiItems = template.aiIntegrations.map(ai => ({
            label: ai.icon + ' ' + ai.name,
            description: ai.description,
            detail: ai.features.join(', '),
            ai: ai
        }));

        // Add "No AI" option
        aiItems.unshift({
            label: '$(circle-slash) No AI Integration',
            description: 'Skip AI setup',
            detail: 'Add AI features later',
            ai: { id: 'none', name: 'None', description: 'No AI', icon: '$(circle-slash)', dependencies: [], configFiles: [], features: [] }
        });

        const selectedAI = await vscode.window.showQuickPick(aiItems, {
            placeHolder: 'Select AI integration (optional)'
        });

        return selectedAI?.ai;
    }

    private async selectTestFramework(template: ProjectTemplate): Promise<TestFrameworkOption | undefined> {
        if (template.testFrameworks.length === 0) return undefined;

        const testItems = template.testFrameworks.map(test => ({
            label: test.icon + ' ' + test.name,
            description: test.description,
            detail: test.features.join(', '),
            test: test
        }));

        // Add "No Test Framework" option
        testItems.unshift({
            label: '$(circle-slash) No Test Framework',
            description: 'Skip test framework setup',
            detail: 'Add testing later',
            test: { id: 'none', name: 'None', description: 'No test framework', icon: '$(circle-slash)', dependencies: [], configFiles: [], features: [] }
        });

        const selectedTest = await vscode.window.showQuickPick(testItems, {
            placeHolder: 'Select test framework (optional)'
        });

        return selectedTest?.test;
    }

    private async selectCacheSystem(template: ProjectTemplate): Promise<CacheSystemOption | undefined> {
        if (template.cacheSystems.length === 0) return undefined;

        const cacheItems = template.cacheSystems.map(cache => ({
            label: cache.icon + ' ' + cache.name,
            description: cache.description,
            detail: cache.features.join(', '),
            cache: cache
        }));

        // Add "No Cache" option
        cacheItems.unshift({
            label: '$(circle-slash) No Cache System',
            description: 'Skip cache setup',
            detail: 'Add caching later',
            cache: { id: 'none', name: 'None', description: 'No cache system', icon: '$(circle-slash)', dependencies: [], configFiles: [], features: [] }
        });

        const selectedCache = await vscode.window.showQuickPick(cacheItems, {
            placeHolder: 'Select cache system (optional)'
        });

        return selectedCache?.cache;
    }

    private async selectFeatures(template: ProjectTemplate): Promise<FeatureOption[]> {
        if (template.features.length === 0) return [];

        const featureItems = template.features.map(feature => ({
            label: feature.icon + ' ' + feature.name,
            description: feature.description,
            feature: feature
        }));

        const selectedFeatures = await vscode.window.showQuickPick(featureItems, {
            placeHolder: 'Select additional features (optional)',
            canPickMany: true
        });

        return selectedFeatures?.map(item => item.feature) || [];
    }

    private async createProject(
        projectName: string | undefined,
        template: ProjectTemplate,
        framework: FrameworkOption | undefined,
        database: DatabaseOption | undefined,
        aiIntegration: AIOption | undefined,
        testFramework: TestFrameworkOption | undefined,
        cacheSystem: CacheSystemOption | undefined,
        features: FeatureOption[]
    ): Promise<void> {
        const workspaceRoot = this.uvExecutor.getWorkspaceRoot();
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace root found');
            return;
        }

        // Use current directory name if no project name provided
        const currentDirName = path.basename(workspaceRoot);
        const projectPath = projectName && projectName.trim() !== '' ? path.join(workspaceRoot, projectName) : workspaceRoot;
        const displayName = projectName && projectName.trim() !== '' ? projectName : currentDirName;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Creating ${template.name} project...`,
            cancellable: false
        }, async (progress) => {
            try {
                // Step 1: Create project directory and initialize UV
                progress.report({ increment: 10, message: 'Initializing project...' });
                await this.initializeUVProject(projectPath);

                // Step 2: Initialize Git repository and .gitignore
                progress.report({ increment: 15, message: 'Initializing Git repository...' });
                await this.initializeGitRepository(projectPath);

                // Step 3: Collect all dependencies
                progress.report({ increment: 20, message: 'Collecting dependencies...' });
                const allDependencies = this.collectDependencies(template, framework, database, aiIntegration, testFramework, cacheSystem, features);

                // Step 4: Add dependencies
                progress.report({ increment: 30, message: 'Adding dependencies...' });
                await this.addDependencies(projectPath, allDependencies);

                // Step 5: Create template files
                progress.report({ increment: 40, message: 'Creating project files...' });
                await this.createTemplateFiles(projectPath, template, framework, database, aiIntegration, testFramework, cacheSystem, features);

                // Step 6: Sync environment
                progress.report({ increment: 20, message: 'Setting up environment...' });
                await this.syncEnvironment(projectPath);

                progress.report({ increment: 100, message: 'Project created successfully!' });

                // Show success message with next steps
                await this.showSuccessMessage(displayName, template, framework, database, aiIntegration, testFramework, cacheSystem, features);

            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create project: ${error}`);
            }
        });
    }

    private async initializeUVProject(projectPath: string): Promise<void> {
        // Create project directory if it doesn't exist and it's not the current directory
        const workspaceRoot = this.uvExecutor.getWorkspaceRoot();
        if (projectPath !== workspaceRoot && !fs.existsSync(projectPath)) {
            fs.mkdirSync(projectPath, { recursive: true });
        }

        // Initialize UV project
        const result = await this.uvExecutor.executeCommand(['init', '.'], projectPath);
        if (!result.success) {
            throw new Error(`Failed to initialize UV project: ${result.error}`);
        }
    }

    private collectDependencies(
        template: ProjectTemplate,
        framework: FrameworkOption | undefined,
        database: DatabaseOption | undefined,
        aiIntegration: AIOption | undefined,
        testFramework: TestFrameworkOption | undefined,
        cacheSystem: CacheSystemOption | undefined,
        features: FeatureOption[]
    ): { production: string[], development: string[], optional: string[] } {
        const production: string[] = [...template.dependencies.production];
        const development: string[] = [...template.dependencies.development];
        const optional: string[] = [...template.dependencies.optional];

        // Add framework dependencies
        if (framework) {
            production.push(...framework.dependencies);
        }

        // Add database dependencies
        if (database && database.id !== 'none') {
            production.push(...database.dependencies);
        }

        // Add AI integration dependencies
        if (aiIntegration && aiIntegration.id !== 'none') {
            production.push(...aiIntegration.dependencies);
        }

        // Add test framework dependencies
        if (testFramework && testFramework.id !== 'none') {
            development.push(...testFramework.dependencies);
        }

        // Add cache system dependencies
        if (cacheSystem && cacheSystem.id !== 'none') {
            production.push(...cacheSystem.dependencies);
        }

        // Add feature dependencies
        features.forEach(feature => {
            production.push(...feature.dependencies);
        });

        return { production, development, optional };
    }

    private async addDependencies(projectPath: string, dependencies: { production: string[], development: string[], optional: string[] }): Promise<void> {
        // Add production dependencies
        for (const dep of dependencies.production) {
            await this.uvExecutor.executeCommand(['add', dep], projectPath);
        }

        // Add development dependencies
        for (const dep of dependencies.development) {
            await this.uvExecutor.executeCommand(['add', '--dev', dep], projectPath);
        }

        // Add optional dependencies
        for (const dep of dependencies.optional) {
            await this.uvExecutor.executeCommand(['add', '--optional', dep], projectPath);
        }
    }

    private async createTemplateFiles(
        projectPath: string,
        template: ProjectTemplate,
        framework: FrameworkOption | undefined,
        database: DatabaseOption | undefined,
        aiIntegration: AIOption | undefined,
        testFramework: TestFrameworkOption | undefined,
        cacheSystem: CacheSystemOption | undefined,
        features: FeatureOption[]
    ): Promise<void> {
        // Get project name for template variable replacement
        const projectName = path.basename(projectPath);

        // Create template files
        for (const file of template.files) {
            const filePath = path.join(projectPath, file.path);
            const dir = path.dirname(filePath);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Replace template variables
            let content = file.content;
            content = content.replace(/\{\{PROJECT_NAME\}\}/g, projectName);

            // Also replace in framework, database, AI, and feature files
            if (framework) {
                for (const file of framework.configFiles) {
                    const filePath = path.join(projectPath, file.path);
                    const dir = path.dirname(filePath);

                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    let content = file.content;
                    content = content.replace(/\{\{PROJECT_NAME\}\}/g, projectName);

                    fs.writeFileSync(filePath, content);
                }
            }

            // Create database-specific files
            if (database && database.id !== 'none') {
                for (const file of database.configFiles) {
                    const filePath = path.join(projectPath, file.path);
                    const dir = path.dirname(filePath);

                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    let content = file.content;
                    content = content.replace(/\{\{PROJECT_NAME\}\}/g, projectName);

                    fs.writeFileSync(filePath, content);
                }
            }

            // Create AI integration files
            if (aiIntegration && aiIntegration.id !== 'none') {
                for (const file of aiIntegration.configFiles) {
                    const filePath = path.join(projectPath, file.path);
                    const dir = path.dirname(filePath);

                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    let content = file.content;
                    content = content.replace(/\{\{PROJECT_NAME\}\}/g, projectName);

                    fs.writeFileSync(filePath, content);
                }
            }

            // Create test framework-specific files
            if (testFramework && testFramework.id !== 'none') {
                for (const file of testFramework.configFiles) {
                    const filePath = path.join(projectPath, file.path);
                    const dir = path.dirname(filePath);

                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    let content = file.content;
                    content = content.replace(/\{\{PROJECT_NAME\}\}/g, projectName);

                    fs.writeFileSync(filePath, content);
                }
            }

            // Create cache system-specific files
            if (cacheSystem && cacheSystem.id !== 'none') {
                for (const file of cacheSystem.configFiles) {
                    const filePath = path.join(projectPath, file.path);
                    const dir = path.dirname(filePath);

                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    let content = file.content;
                    content = content.replace(/\{\{PROJECT_NAME\}\}/g, projectName);

                    fs.writeFileSync(filePath, content);
                }
            }

            // Create feature-specific files
            for (const feature of features) {
                for (const file of feature.configFiles) {
                    const filePath = path.join(projectPath, file.path);
                    const dir = path.dirname(filePath);

                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    let content = file.content;
                    content = content.replace(/\{\{PROJECT_NAME\}\}/g, projectName);

                    fs.writeFileSync(filePath, content);
                }
            }

            fs.writeFileSync(filePath, content);
        }
    }

    private async syncEnvironment(projectPath: string): Promise<void> {
        const result = await this.uvExecutor.executeCommand(['sync'], projectPath);
        if (!result.success) {
            throw new Error(`Failed to sync environment: ${result.error}`);
        }
    }

    private async initializeGitRepository(projectPath: string): Promise<void> {
        try {
            // Initialize Git repository
            const gitInitResult = await this.uvExecutor.executeCommand(['git', 'init'], projectPath);
            if (!gitInitResult.success) {
                console.warn('Failed to initialize Git repository:', gitInitResult.error);
                return;
            }

            // Create .gitignore file
            const gitignoreContent = `# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
#  Usually these files are written by a python script from a template
#  before PyInstaller builds the exe, so as to inject date/other infos into it.
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/
.pytest_cache/
cover/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
.pybuilder/
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
#   For a library or package, you might want to ignore these files since the code is
#   intended to run in multiple environments; otherwise, check them in:
# .python-version

# pipenv
#   According to pypa/pipenv#598, it is recommended to include Pipfile.lock in version control.
#   However, in case of collaboration, if having platform-specific dependencies or dependencies
#   having no cross-platform support, pipenv may install dependencies that don't work, or not
#   install all needed dependencies.
#Pipfile.lock

# poetry
#   Similar to Pipfile.lock, it is generally recommended to include poetry.lock in version control.
#   This is especially recommended for binary packages to ensure reproducibility, and is more
#   commonly ignored for libraries.
#   https://python-poetry.org/docs/basic-usage/#commit-your-poetrylock-file-to-version-control
#poetry.lock

# pdm
#   Similar to Pipfile.lock, it is generally recommended to include pdm.lock in version control.
#pdm.lock
#   pdm stores project-wide configurations in .pdm.toml, but it is recommended to not include it
#   in version control.
#   https://pdm.fming.dev/#use-with-ide
.pdm.toml

# PEP 582; used by e.g. github.com/David-OConnor/pyflow and github.com/pdm-project/pdm
__pypackages__/

# Celery stuff
celerybeat-schedule
celerybeat.pid

# SageMath parsed files
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/

# pytype static type analyzer
.pytype/

# Cython debug symbols
cython_debug/

# PyCharm
#  JetBrains specific template is maintained in a separate JetBrains.gitignore that can
#  be added to the global gitignore or merged into this project gitignore.  For a PyCharm
#  project, uncomment the following line:
#.idea/

# VS Code
.vscode/

# UV specific
.uv/
uv.lock

# Project specific
*.db
*.sqlite
*.sqlite3
cache.db
.env.local
.env.production
.env.staging

# OS specific
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE specific
*.swp
*.swo
*~

# Logs
*.log
logs/

# Temporary files
*.tmp
*.temp
temp/
tmp/`;

            const gitignorePath = path.join(projectPath, '.gitignore');
            fs.writeFileSync(gitignorePath, gitignoreContent);

            // Add all files to Git
            const gitAddResult = await this.uvExecutor.executeCommand(['git', 'add', '.'], projectPath);
            if (!gitAddResult.success) {
                console.warn('Failed to add files to Git:', gitAddResult.error);
                return;
            }

            // Create initial commit
            const gitCommitResult = await this.uvExecutor.executeCommand(['git', 'commit', '-m', 'Initial commit: Project created with UV'], projectPath);
            if (!gitCommitResult.success) {
                console.warn('Failed to create initial commit:', gitCommitResult.error);
                return;
            }

        } catch (error) {
            console.warn('Git initialization failed:', error);
            // Don't throw error as Git is optional
        }
    }

    private async showSuccessMessage(
        projectName: string,
        template: ProjectTemplate,
        framework: FrameworkOption | undefined,
        database: DatabaseOption | undefined,
        aiIntegration: AIOption | undefined,
        testFramework: TestFrameworkOption | undefined,
        cacheSystem: CacheSystemOption | undefined,
        features: FeatureOption[]
    ): Promise<void> {
        const message = `🎉 Project "${projectName}" created successfully!

📁 Project: ${template.name}
${framework ? `⚡ Framework: ${framework.name}` : ''}
${database && database.id !== 'none' ? `💾 Database: ${database.name}` : ''}
${aiIntegration && aiIntegration.id !== 'none' ? `🤖 AI: ${aiIntegration.name}` : ''}
${features.length > 0 ? `✨ Features: ${features.map(f => f.name).join(', ')}` : ''}

🚀 Next steps:
1. Run the application using UV commands
2. Check the README for setup instructions`;

        vscode.window.showInformationMessage(message);

        // Only open folder if it's a new project (not current directory)
        if (projectName && projectName.trim() !== '') {
            const projectPath = path.join(this.uvExecutor.getWorkspaceRoot()!, projectName);
            // Check if the project directory exists before trying to open it
            if (fs.existsSync(projectPath)) {
                const uri = vscode.Uri.file(projectPath);
                await vscode.commands.executeCommand('vscode.openFolder', uri);
            }
        }
    }

    private getCategoryIcon(category: string): string {
        const icons: { [key: string]: string } = {
            'web': '$(globe)',
            'api': '$(server)',
            'gui': '$(window)',
            'cli': '$(terminal)',
            'data': '$(graph)',
            'ai': '$(lightbulb)',
            'microservice': '$(package)',
            'fullstack': '$(layers)'
        };
        return icons[category] || '$(folder)';
    }

    private getCategoryName(category: string): string {
        const names: { [key: string]: string } = {
            'web': 'Web Applications',
            'api': 'API Services',
            'gui': 'GUI Applications',
            'cli': 'CLI Tools',
            'data': 'Data Science',
            'ai': 'AI Applications',
            'microservice': 'Microservices',
            'fullstack': 'Full-Stack'
        };
        return names[category] || category;
    }

    private getCategoryDescription(category: string): string {
        const descriptions: { [key: string]: string } = {
            'web': 'Web applications with modern frameworks',
            'api': 'REST APIs, GraphQL, and microservices',
            'gui': 'Desktop applications with GUI frameworks',
            'cli': 'Command-line tools and utilities',
            'data': 'Data analysis and machine learning',
            'ai': 'AI-powered applications and integrations',
            'microservice': 'Distributed systems and services',
            'fullstack': 'Complete applications with frontend/backend'
        };
        return descriptions[category] || '';
    }
} 