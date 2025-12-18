/**
 * Project Template Definitions
 * 
 * This file defines all available project templates and their metadata.
 * Template files are stored in resources/templates/ folder.
 */

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    icon: string;
    resourcePath: string;  // Path relative to resources/templates/
    postInstallMessage?: string;
}

export interface TemplateCategory {
    id: string;
    name: string;
    icon: string;
    description: string;
}

// Template Categories
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
    {
        id: 'empty',
        name: 'Empty Project',
        icon: '📁',
        description: 'Minimal Python project with UV',
    },
    {
        id: 'web-api',
        name: 'Web API',
        icon: '🌐',
        description: 'REST API and web services',
    },
    {
        id: 'cli',
        name: 'CLI Application',
        icon: '💻',
        description: 'Command-line interface applications',
    },
    {
        id: 'data-science',
        name: 'Data Science',
        icon: '📊',
        description: 'Data analysis and visualization',
    },
    {
        id: 'ai-ml',
        name: 'AI / Machine Learning',
        icon: '🤖',
        description: 'AI and machine learning projects',
    },
    {
        id: 'automation',
        name: 'Automation',
        icon: '🔧',
        description: 'Web scraping and browser automation',
    },
    {
        id: 'desktop',
        name: 'Desktop GUI',
        icon: '🖥️',
        description: 'Desktop applications with GUI',
    },
];

// Project Templates
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
    // Empty Project
    {
        id: 'empty',
        name: 'Empty Project',
        description: 'Minimal Python project with main.py and .gitignore',
        category: TEMPLATE_CATEGORIES[0],
        icon: '📁',
        resourcePath: 'empty',
    },

    // Web API Templates
    {
        id: 'fastapi',
        name: 'FastAPI',
        description: 'Modern async API with auto-docs (FastAPI + Uvicorn)',
        category: TEMPLATE_CATEGORIES[1],
        icon: '⚡',
        resourcePath: 'web-api/fastapi',
        postInstallMessage: 'Run: uv run python main.py\nOpen: http://localhost:8000/docs',
    },
    {
        id: 'flask',
        name: 'Flask',
        description: 'Lightweight web framework (Flask + Gunicorn)',
        category: TEMPLATE_CATEGORIES[1],
        icon: '🍶',
        resourcePath: 'web-api/flask',
        postInstallMessage: 'Run: uv run python main.py\nOpen: http://localhost:5000',
    },
    {
        id: 'django',
        name: 'Django REST',
        description: 'Full-featured REST API (Django + DRF)',
        category: TEMPLATE_CATEGORIES[1],
        icon: '🎸',
        resourcePath: 'web-api/django',
        postInstallMessage: 'Run: uv run python main.py\nOpen: http://localhost:8000',
    },

    // CLI Templates
    {
        id: 'typer',
        name: 'Typer CLI',
        description: 'Modern CLI with auto-completion (Typer + Rich)',
        category: TEMPLATE_CATEGORIES[2],
        icon: '⌨️',
        resourcePath: 'cli/typer',
        postInstallMessage: 'Run: uv run python main.py --help',
    },
    {
        id: 'click',
        name: 'Click CLI',
        description: 'Composable CLI interface (Click)',
        category: TEMPLATE_CATEGORIES[2],
        icon: '🖱️',
        resourcePath: 'cli/click',
        postInstallMessage: 'Run: uv run python main.py --help',
    },

    // Data Science Templates
    {
        id: 'jupyter',
        name: 'Jupyter Notebook',
        description: 'Interactive notebooks (JupyterLab + Pandas)',
        category: TEMPLATE_CATEGORIES[3],
        icon: '📓',
        resourcePath: 'data-science/jupyter',
        postInstallMessage: 'Run: uv run jupyter lab',
    },
    {
        id: 'analysis',
        name: 'Data Analysis',
        description: 'Data analysis project (Pandas + Matplotlib + Seaborn)',
        category: TEMPLATE_CATEGORIES[3],
        icon: '📈',
        resourcePath: 'data-science/analysis',
        postInstallMessage: 'Run: uv run python main.py',
    },

    // AI/ML Templates
    {
        id: 'langchain',
        name: 'LangChain',
        description: 'LLM-powered applications (LangChain + OpenAI)',
        category: TEMPLATE_CATEGORIES[4],
        icon: '🦜',
        resourcePath: 'ai-ml/langchain',
        postInstallMessage: 'Set OPENAI_API_KEY environment variable\nRun: uv run python main.py',
    },
    {
        id: 'pytorch',
        name: 'PyTorch',
        description: 'Deep learning models (PyTorch + TorchVision)',
        category: TEMPLATE_CATEGORIES[4],
        icon: '🔥',
        resourcePath: 'ai-ml/pytorch',
        postInstallMessage: 'Run: uv run python main.py',
    },
    {
        id: 'sklearn',
        name: 'Scikit-Learn',
        description: 'Traditional ML models (Scikit-learn + XGBoost)',
        category: TEMPLATE_CATEGORIES[4],
        icon: '🎯',
        resourcePath: 'ai-ml/sklearn',
        postInstallMessage: 'Run: uv run python main.py',
    },

    // Automation Templates
    {
        id: 'scraper',
        name: 'Web Scraper',
        description: 'Web scraping project (Scrapy + BeautifulSoup)',
        category: TEMPLATE_CATEGORIES[5],
        icon: '🕷️',
        resourcePath: 'automation/scraper',
        postInstallMessage: 'Run: uv run python main.py',
    },
    {
        id: 'browser',
        name: 'Browser Automation',
        description: 'Browser automation (Playwright)',
        category: TEMPLATE_CATEGORIES[5],
        icon: '🌍',
        resourcePath: 'automation/browser',
        postInstallMessage: 'Run: uv run playwright install\nThen: uv run python main.py',
    },

    // Desktop GUI Templates
    {
        id: 'tkinter',
        name: 'Tkinter',
        description: 'Native desktop app (Tkinter + ttkbootstrap)',
        category: TEMPLATE_CATEGORIES[6],
        icon: '🪟',
        resourcePath: 'desktop/tkinter',
        postInstallMessage: 'Run: uv run python main.py',
    },
    {
        id: 'pyqt',
        name: 'PyQt6',
        description: 'Cross-platform GUI (PyQt6)',
        category: TEMPLATE_CATEGORIES[6],
        icon: '🖼️',
        resourcePath: 'desktop/pyqt',
        postInstallMessage: 'Run: uv run python main.py',
    },
];

/**
 * Get templates by category ID
 */
export function getTemplatesByCategory(categoryId: string): ProjectTemplate[] {
    return PROJECT_TEMPLATES.filter(t => t.category.id === categoryId);
}

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): ProjectTemplate | undefined {
    return PROJECT_TEMPLATES.find(t => t.id === templateId);
}

/**
 * Get all categories with their templates
 */
export function getCategoriesWithTemplates(): Array<{ category: TemplateCategory; templates: ProjectTemplate[] }> {
    return TEMPLATE_CATEGORIES.map(category => ({
        category,
        templates: getTemplatesByCategory(category.id),
    }));
}
