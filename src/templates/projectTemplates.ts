/**
 * Simplified project templates - only minimal interfaces needed for backward compatibility
 */

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
}

export interface FrameworkOption {
    id: string;
    name: string;
}

export interface DatabaseOption {
    id: string;
    name: string;
}

export interface AIOption {
    id: string;
    name: string;
}

export interface TestFrameworkOption {
    id: string;
    name: string;
}

export interface CacheSystemOption {
    id: string;
    name: string;
}

export interface FeatureOption {
    id: string;
    name: string;
}

export interface TemplateFile {
    path: string;
    content: string;
}

// Empty array - templates removed in favor of simplified project creation
export const PROJECT_TEMPLATES: ProjectTemplate[] = [];