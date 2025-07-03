export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    category: 'web' | 'api' | 'gui' | 'cli' | 'data' | 'ai' | 'microservice' | 'fullstack' | 'empty';
    icon: string;
    frameworks: FrameworkOption[];
    databases: DatabaseOption[];
    aiIntegrations: AIOption[];
    testFrameworks: TestFrameworkOption[];
    cacheSystems: CacheSystemOption[];
    features: FeatureOption[];
    dependencies: {
        production: string[];
        development: string[];
        optional: string[];
    };
    files: TemplateFile[];
    postSetup?: string[];
}

export interface FrameworkOption {
    id: string;
    name: string;
    description: string;
    icon: string;
    dependencies: string[];
    configFiles: TemplateFile[];
    features: string[];
}

export interface DatabaseOption {
    id: string;
    name: string;
    description: string;
    icon: string;
    dependencies: string[];
    configFiles: TemplateFile[];
    features: string[];
}

export interface AIOption {
    id: string;
    name: string;
    description: string;
    icon: string;
    dependencies: string[];
    configFiles: TemplateFile[];
    features: string[];
}

export interface TestFrameworkOption {
    id: string;
    name: string;
    description: string;
    icon: string;
    dependencies: string[];
    configFiles: TemplateFile[];
    features: string[];
}

export interface CacheSystemOption {
    id: string;
    name: string;
    description: string;
    icon: string;
    dependencies: string[];
    configFiles: TemplateFile[];
    features: string[];
}

export interface FeatureOption {
    id: string;
    name: string;
    description: string;
    icon: string;
    dependencies: string[];
    configFiles: TemplateFile[];
}

export interface TemplateFile {
    path: string;
    content: string;
    description: string;
}

// Common test frameworks and cache systems for all templates
const COMMON_TEST_FRAMEWORKS: TestFrameworkOption[] = [
    {
        id: 'pytest',
        name: 'pytest',
        description: 'Most popular Python testing framework',
        icon: '$(beaker)',
        dependencies: ['pytest', 'pytest-asyncio', 'pytest-cov', 'pytest-mock'],
        configFiles: [
            {
                path: 'pytest.ini',
                content: `[pytest]
testpaths = tests
python_files = test_*.py *_test.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --cov=src --cov-report=html --cov-report=term-missing
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests
    unit: marks tests as unit tests`,
                description: 'pytest configuration file'
            }
        ],
        features: ['Fixtures', 'Parametrized tests', 'Coverage reporting', 'Async support']
    },
    {
        id: 'unittest',
        name: 'unittest',
        description: 'Python built-in testing framework',
        icon: '$(beaker)',
        dependencies: ['coverage'],
        configFiles: [
            {
                path: '.coveragerc',
                content: `[run]
source = src
omit = 
    */tests/*
    */test_*

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError`,
                description: 'Coverage configuration file'
            }
        ],
        features: ['Built-in', 'Simple setup', 'Standard library']
    },
    {
        id: 'nose2',
        name: 'nose2',
        description: 'Next generation of nose testing framework',
        icon: '$(beaker)',
        dependencies: ['nose2', 'coverage'],
        configFiles: [
            {
                path: 'nose2.cfg',
                content: `[unittest]
start-dir = tests
pattern = test_*.py
verbosity = 2

[coverage]
source = src
omit = 
    */tests/*
    */test_*`,
                description: 'nose2 configuration file'
            }
        ],
        features: ['Plugin system', 'Test discovery', 'Coverage integration']
    }
];

const COMMON_CACHE_SYSTEMS: CacheSystemOption[] = [
    {
        id: 'redis',
        name: 'Redis',
        description: 'In-memory data structure store',
        icon: '$(database)',
        dependencies: ['redis', 'hiredis'],
        configFiles: [
            {
                path: 'config/cache.py',
                content: `import redis
from typing import Optional

class RedisCache:
    def __init__(self, host: str = 'localhost', port: int = 6379, db: int = 0):
        self.redis = redis.Redis(host=host, port=port, db=db, decode_responses=True)
    
    def get(self, key: str) -> Optional[str]:
        return self.redis.get(key)
    
    def set(self, key: str, value: str, expire: int = 3600) -> bool:
        return self.redis.setex(key, expire, value)
    
    def delete(self, key: str) -> bool:
        return bool(self.redis.delete(key))
    
    def exists(self, key: str) -> bool:
        return bool(self.redis.exists(key))`,
                description: 'Redis cache configuration'
            }
        ],
        features: ['In-memory', 'Persistence', 'Pub/Sub', 'Data structures']
    },
    {
        id: 'memcached',
        name: 'Memcached',
        description: 'High-performance distributed memory caching system',
        icon: '$(database)',
        dependencies: ['pymemcache'],
        configFiles: [
            {
                path: 'config/cache.py',
                content: `from pymemcache.client.base import Client
from typing import Optional

class MemcachedCache:
    def __init__(self, host: str = 'localhost', port: int = 11211):
        self.client = Client((host, port))
    
    def get(self, key: str) -> Optional[str]:
        result = self.client.get(key)
        return result.decode('utf-8') if result else None
    
    def set(self, key: str, value: str, expire: int = 3600) -> bool:
        return self.client.set(key, value, expire=expire)
    
    def delete(self, key: str) -> bool:
        return self.client.delete(key)
    
    def exists(self, key: str) -> bool:
        return self.client.get(key) is not None`,
                description: 'Memcached cache configuration'
            }
        ],
        features: ['Distributed', 'High performance', 'Simple key-value']
    },
    {
        id: 'sqlite-cache',
        name: 'SQLite Cache',
        description: 'File-based caching using SQLite',
        icon: '$(database)',
        dependencies: ['sqlite3'],
        configFiles: [
            {
                path: 'config/cache.py',
                content: `import sqlite3
import time
from typing import Optional

class SQLiteCache:
    def __init__(self, db_path: str = 'cache.db'):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    expires_at INTEGER NOT NULL
                )
            ''')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_expires ON cache(expires_at)')
    
    def get(self, key: str) -> Optional[str]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                'SELECT value FROM cache WHERE key = ? AND expires_at > ?',
                (key, int(time.time()))
            )
            result = cursor.fetchone()
            return result[0] if result else None
    
    def set(self, key: str, value: str, expire: int = 3600) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                'INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)',
                (key, value, int(time.time()) + expire)
            )
            return True
    
    def delete(self, key: str) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute('DELETE FROM cache WHERE key = ?', (key,))
            return cursor.rowcount > 0
    
    def cleanup(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('DELETE FROM cache WHERE expires_at <= ?', (int(time.time()),))`,
                description: 'SQLite cache configuration'
            }
        ],
        features: ['File-based', 'ACID compliant', 'No external dependencies']
    }
];

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
    {
        id: 'fastapi-web',
        name: 'FastAPI Web Application',
        description: 'Modern, fast web application with FastAPI framework',
        category: 'web',
        icon: '$(globe)',
        frameworks: [
            {
                id: 'fastapi',
                name: 'FastAPI',
                description: 'Modern, fast web framework for building APIs with Python',
                icon: '$(zap)',
                dependencies: ['fastapi', 'uvicorn[standard]'],
                configFiles: [],
                features: ['Async support', 'Automatic API docs', 'Type validation']
            }
        ],
        databases: [
            {
                id: 'sqlite',
                name: 'SQLite',
                description: 'Lightweight, file-based database',
                icon: '$(database)',
                dependencies: ['sqlalchemy', 'alembic'],
                configFiles: [],
                features: ['No setup required', 'File-based', 'ACID compliant']
            },
            {
                id: 'postgresql',
                name: 'PostgreSQL',
                description: 'Powerful, open-source relational database',
                icon: '$(database)',
                dependencies: ['sqlalchemy', 'alembic', 'psycopg2-binary', 'asyncpg'],
                configFiles: [],
                features: ['ACID compliant', 'JSON support', 'Full-text search']
            },
            {
                id: 'mongodb',
                name: 'MongoDB',
                description: 'NoSQL document database',
                icon: '$(database)',
                dependencies: ['motor', 'pymongo'],
                configFiles: [],
                features: ['Document-based', 'Scalable', 'Flexible schema']
            }
        ],
        aiIntegrations: [
            {
                id: 'openai',
                name: 'OpenAI Integration',
                description: 'Integrate OpenAI models for AI features',
                icon: '$(lightbulb)',
                dependencies: ['openai', 'python-dotenv'],
                configFiles: [],
                features: ['GPT models', 'Embeddings', 'Function calling']
            },
            {
                id: 'langchain',
                name: 'LangChain',
                description: 'Framework for developing LLM applications',
                icon: '$(lightbulb)',
                dependencies: ['langchain', 'langchain-openai', 'python-dotenv'],
                configFiles: [],
                features: ['LLM chains', 'Agents', 'Memory systems']
            },
            {
                id: 'transformers',
                name: 'Hugging Face Transformers',
                description: 'Local AI models with transformers',
                icon: '$(lightbulb)',
                dependencies: ['transformers', 'torch', 'accelerate'],
                configFiles: [],
                features: ['Local models', 'Custom fine-tuning', 'Multiple tasks']
            },
            {
                id: 'anthropic',
                name: 'Anthropic Claude',
                description: 'Integrate Anthropic Claude models',
                icon: '$(lightbulb)',
                dependencies: ['anthropic', 'python-dotenv'],
                configFiles: [],
                features: ['Claude models', 'Constitutional AI', 'Safety features']
            },
            {
                id: 'cohere',
                name: 'Cohere',
                description: 'Integrate Cohere language models',
                icon: '$(lightbulb)',
                dependencies: ['cohere', 'python-dotenv'],
                configFiles: [],
                features: ['Text generation', 'Embeddings', 'Classification']
            },
            {
                id: 'vertex-ai',
                name: 'Google Vertex AI',
                description: 'Google Cloud AI and ML services',
                icon: '$(lightbulb)',
                dependencies: ['google-cloud-aiplatform', 'google-auth'],
                configFiles: [],
                features: ['AutoML', 'Custom models', 'ML pipelines']
            }
        ],
        testFrameworks: [
            {
                id: 'pytest',
                name: 'pytest',
                description: 'Most popular Python testing framework',
                icon: '$(beaker)',
                dependencies: ['pytest', 'pytest-asyncio', 'pytest-cov', 'pytest-mock'],
                configFiles: [
                    {
                        path: 'pytest.ini',
                        content: `[pytest]
testpaths = tests
python_files = test_*.py *_test.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --cov=src --cov-report=html --cov-report=term-missing
markers =
    slow: marks tests as slow (deselect with '-m \"not slow\"')
    integration: marks tests as integration tests
    unit: marks tests as unit tests`,
                        description: 'pytest configuration file'
                    }
                ],
                features: ['Fixtures', 'Parametrized tests', 'Coverage reporting', 'Async support']
            },
            {
                id: 'unittest',
                name: 'unittest',
                description: 'Python built-in testing framework',
                icon: '$(beaker)',
                dependencies: ['coverage'],
                configFiles: [
                    {
                        path: '.coveragerc',
                        content: `[run]
source = src
omit = 
    */tests/*
    */test_*

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError`,
                        description: 'Coverage configuration file'
                    }
                ],
                features: ['Built-in', 'Simple setup', 'Standard library']
            },
            {
                id: 'nose2',
                name: 'nose2',
                description: 'Next generation of nose testing framework',
                icon: '$(beaker)',
                dependencies: ['nose2', 'coverage'],
                configFiles: [
                    {
                        path: 'nose2.cfg',
                        content: `[unittest]
start-dir = tests
pattern = test_*.py
verbosity = 2

[coverage]
source = src
omit = 
    */tests/*
    */test_*`,
                        description: 'nose2 configuration file'
                    }
                ],
                features: ['Plugin system', 'Test discovery', 'Coverage integration']
            }
        ],
        cacheSystems: [
            {
                id: 'redis',
                name: 'Redis',
                description: 'In-memory data structure store',
                icon: '$(database)',
                dependencies: ['redis', 'hiredis'],
                configFiles: [
                    {
                        path: 'config/cache.py',
                        content: `import redis
from typing import Optional

class RedisCache:
    def __init__(self, host: str = 'localhost', port: int = 6379, db: int = 0):
        self.redis = redis.Redis(host=host, port=port, db=db, decode_responses=True)
    
    def get(self, key: str) -> Optional[str]:
        return self.redis.get(key)
    
    def set(self, key: str, value: str, expire: int = 3600) -> bool:
        return self.redis.setex(key, expire, value)
    
    def delete(self, key: str) -> bool:
        return bool(self.redis.delete(key))
    
    def exists(self, key: str) -> bool:
        return bool(self.redis.exists(key))`,
                        description: 'Redis cache configuration'
                    }
                ],
                features: ['In-memory', 'Persistence', 'Pub/Sub', 'Data structures']
            },
            {
                id: 'memcached',
                name: 'Memcached',
                description: 'High-performance distributed memory caching system',
                icon: '$(database)',
                dependencies: ['pymemcache'],
                configFiles: [
                    {
                        path: 'config/cache.py',
                        content: `from pymemcache.client.base import Client
from typing import Optional

class MemcachedCache:
    def __init__(self, host: str = 'localhost', port: int = 11211):
        self.client = Client((host, port))
    
    def get(self, key: str) -> Optional[str]:
        result = self.client.get(key)
        return result.decode('utf-8') if result else None
    
    def set(self, key: str, value: str, expire: int = 3600) -> bool:
        return self.client.set(key, value, expire=expire)
    
    def delete(self, key: str) -> bool:
        return self.client.delete(key)
    
    def exists(self, key: str) -> bool:
        return self.client.get(key) is not None`,
                        description: 'Memcached cache configuration'
                    }
                ],
                features: ['Distributed', 'High performance', 'Simple key-value']
            },
            {
                id: 'sqlite-cache',
                name: 'SQLite Cache',
                description: 'File-based caching using SQLite',
                icon: '$(database)',
                dependencies: ['sqlite3'],
                configFiles: [
                    {
                        path: 'config/cache.py',
                        content: `import sqlite3
import time
from typing import Optional

class SQLiteCache:
    def __init__(self, db_path: str = 'cache.db'):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    expires_at INTEGER NOT NULL
                )
            ''')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_expires ON cache(expires_at)')
    
    def get(self, key: str) -> Optional[str]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                'SELECT value FROM cache WHERE key = ? AND expires_at > ?',
                (key, int(time.time()))
            )
            result = cursor.fetchone()
            return result[0] if result else None
    
    def set(self, key: str, value: str, expire: int = 3600) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                'INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)',
                (key, value, int(time.time()) + expire)
            )
            return True
    
    def delete(self, key: str) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute('DELETE FROM cache WHERE key = ?', (key,))
            return cursor.rowcount > 0
    
    def cleanup(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('DELETE FROM cache WHERE expires_at <= ?', (int(time.time()),))`,
                        description: 'SQLite cache configuration'
                    }
                ],
                features: ['File-based', 'ACID compliant', 'No external dependencies']
            }
        ],
        features: [
            {
                id: 'authentication',
                name: 'Authentication',
                description: 'User authentication and authorization',
                icon: '$(key)',
                dependencies: ['python-jose[cryptography]', 'passlib[bcrypt]', 'python-multipart'],
                configFiles: []
            },
            {
                id: 'cors',
                name: 'CORS Support',
                description: 'Cross-Origin Resource Sharing',
                icon: '$(globe)',
                dependencies: [],
                configFiles: []
            },
            {
                id: 'rate-limiting',
                name: 'Rate Limiting',
                description: 'API rate limiting and throttling',
                icon: '$(clock)',
                dependencies: ['slowapi'],
                configFiles: []
            }
        ],
        dependencies: {
            production: ['fastapi', 'uvicorn[standard]', 'pydantic'],
            development: ['pytest', 'pytest-asyncio', 'httpx', 'black', 'flake8', 'mypy'],
            optional: ['python-dotenv', 'sqlalchemy', 'alembic']
        },
        files: [
            {
                path: 'main.py',
                content: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="FastAPI Web Application",
    description="A modern web application built with FastAPI",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
                description: 'Main FastAPI application file'
            },
            {
                path: 'requirements.txt',
                content: `fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.5.0`,
                description: 'Production dependencies'
            }
        ],
        postSetup: [
            'uv run uvicorn main:app --reload',
            'echo "FastAPI application is running at http://localhost:8000"',
            'echo "API documentation available at http://localhost:8000/docs"'
        ]
    },
    {
        id: 'flask-web',
        name: 'Flask Web Application',
        description: 'Lightweight web application with Flask framework',
        category: 'web',
        icon: '$(globe)',
        frameworks: [
            {
                id: 'flask',
                name: 'Flask',
                description: 'Lightweight and flexible web framework',
                icon: '$(zap)',
                dependencies: ['flask', 'flask-cors'],
                configFiles: [],
                features: ['Simple and flexible', 'Large ecosystem', 'Easy to learn']
            }
        ],
        databases: [
            {
                id: 'sqlite',
                name: 'SQLite',
                description: 'Lightweight, file-based database',
                icon: '$(database)',
                dependencies: ['flask-sqlalchemy', 'flask-migrate'],
                configFiles: [],
                features: ['No setup required', 'File-based', 'ACID compliant']
            },
            {
                id: 'postgresql',
                name: 'PostgreSQL',
                description: 'Powerful, open-source relational database',
                icon: '$(database)',
                dependencies: ['flask-sqlalchemy', 'flask-migrate', 'psycopg2-binary'],
                configFiles: [],
                features: ['ACID compliant', 'JSON support', 'Full-text search']
            }
        ],
        aiIntegrations: [
            {
                id: 'openai',
                name: 'OpenAI Integration',
                description: 'Integrate OpenAI models for AI features',
                icon: '$(lightbulb)',
                dependencies: ['openai', 'python-dotenv'],
                configFiles: [],
                features: ['GPT models', 'Embeddings', 'Function calling']
            }
        ],
        testFrameworks: COMMON_TEST_FRAMEWORKS,
        cacheSystems: COMMON_CACHE_SYSTEMS,
        features: [
            {
                id: 'authentication',
                name: 'Authentication',
                description: 'User authentication and authorization',
                icon: '$(key)',
                dependencies: ['flask-login', 'flask-wtf', 'werkzeug'],
                configFiles: []
            },
            {
                id: 'templates',
                name: 'Template Engine',
                description: 'Jinja2 template engine',
                icon: '$(file)',
                dependencies: ['jinja2'],
                configFiles: []
            }
        ],
        dependencies: {
            production: ['flask', 'flask-cors', 'jinja2'],
            development: ['pytest', 'pytest-flask', 'black', 'flake8'],
            optional: ['python-dotenv', 'flask-sqlalchemy']
        },
        files: [
            {
                path: 'app.py',
                content: `from flask import Flask, render_template, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/health')
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(debug=True)`,
                description: 'Main Flask application file'
            },
            {
                path: 'templates/index.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flask Web Application</title>
</head>
<body>
    <h1>Welcome to Flask Web Application</h1>
    <p>Your Flask application is running successfully!</p>
</body>
</html>`,
                description: 'Basic HTML template'
            }
        ],
        postSetup: [
            'uv run python app.py',
            'echo "Flask application is running at http://localhost:5000"'
        ]
    },
    {
        id: 'cli-tool',
        name: 'CLI Tool',
        description: 'Command-line interface tool with Click or Typer',
        category: 'cli',
        icon: '$(terminal)',
        frameworks: [
            {
                id: 'typer',
                name: 'Typer',
                description: 'Modern CLI framework with type hints',
                icon: '$(zap)',
                dependencies: ['typer[all]'],
                configFiles: [],
                features: ['Type hints', 'Auto-completion', 'Rich output']
            },
            {
                id: 'click',
                name: 'Click',
                description: 'Python package for creating command line interfaces',
                icon: '$(zap)',
                dependencies: ['click'],
                configFiles: [],
                features: ['Decorator-based', 'Nested commands', 'Help generation']
            }
        ],
        databases: [],
        aiIntegrations: [
            {
                id: 'openai',
                name: 'OpenAI Integration',
                description: 'Integrate OpenAI models for AI features',
                icon: '$(lightbulb)',
                dependencies: ['openai', 'python-dotenv'],
                configFiles: [],
                features: ['GPT models', 'Embeddings', 'Function calling']
            }
        ],
        testFrameworks: COMMON_TEST_FRAMEWORKS,
        cacheSystems: COMMON_CACHE_SYSTEMS,
        features: [
            {
                id: 'rich-output',
                name: 'Rich Output',
                description: 'Beautiful terminal output with Rich',
                icon: '$(paintbrush)',
                dependencies: ['rich'],
                configFiles: []
            },
            {
                id: 'config-management',
                name: 'Configuration Management',
                description: 'Manage configuration files',
                icon: '$(gear)',
                dependencies: ['pydantic-settings', 'python-dotenv'],
                configFiles: []
            }
        ],
        dependencies: {
            production: ['typer[all]', 'rich'],
            development: ['pytest', 'black', 'flake8', 'mypy'],
            optional: ['python-dotenv', 'pydantic-settings']
        },
        files: [
            {
                path: 'main.py',
                content: `import typer
from rich.console import Console
from rich.table import Table

app = typer.Typer()
console = Console()

@app.command()
def hello(name: str = "World"):
    """Say hello to someone."""
    console.print(f"Hello {name}!", style="bold green")

@app.command()
def list():
    """List available commands."""
    table = Table(title="Available Commands")
    table.add_column("Command", style="cyan")
    table.add_column("Description", style="magenta")
    
    table.add_row("hello", "Say hello to someone")
    table.add_row("list", "List available commands")
    
    console.print(table)

if __name__ == "__main__":
    app()`,
                description: 'Main CLI application file'
            }
        ],
        postSetup: [
            'uv run python main.py --help',
            'echo "CLI tool is ready! Try: uv run python main.py hello YourName"'
        ]
    },
    {
        id: 'data-science',
        name: 'Data Science Project',
        description: 'Data analysis and machine learning project',
        category: 'data',
        icon: '$(graph)',
        frameworks: [],
        databases: [
            {
                id: 'postgresql',
                name: 'PostgreSQL',
                description: 'Powerful, open-source relational database',
                icon: '$(database)',
                dependencies: ['sqlalchemy', 'psycopg2-binary', 'pandas'],
                configFiles: [],
                features: ['ACID compliant', 'JSON support', 'Full-text search']
            },
            {
                id: 'mongodb',
                name: 'MongoDB',
                description: 'NoSQL document database',
                icon: '$(database)',
                dependencies: ['pymongo', 'pandas'],
                configFiles: [],
                features: ['Document-based', 'Scalable', 'Flexible schema']
            }
        ],
        aiIntegrations: [
            {
                id: 'scikit-learn',
                name: 'Scikit-learn',
                description: 'Machine learning library',
                icon: '$(lightbulb)',
                dependencies: ['scikit-learn', 'numpy', 'pandas'],
                configFiles: [],
                features: ['Classification', 'Regression', 'Clustering']
            },
            {
                id: 'tensorflow',
                name: 'TensorFlow',
                description: 'Deep learning framework',
                icon: '$(lightbulb)',
                dependencies: ['tensorflow', 'numpy', 'pandas'],
                configFiles: [],
                features: ['Neural networks', 'Keras API', 'GPU support']
            },
            {
                id: 'pytorch',
                name: 'PyTorch',
                description: 'Deep learning framework',
                icon: '$(lightbulb)',
                dependencies: ['torch', 'torchvision', 'numpy', 'pandas'],
                configFiles: [],
                features: ['Neural networks', 'Dynamic graphs', 'GPU support']
            }
        ],
        testFrameworks: COMMON_TEST_FRAMEWORKS,
        cacheSystems: COMMON_CACHE_SYSTEMS,
        features: [
            {
                id: 'jupyter',
                name: 'Jupyter Notebooks',
                description: 'Interactive notebooks for data analysis',
                icon: '$(notebook)',
                dependencies: ['jupyter', 'ipykernel'],
                configFiles: []
            },
            {
                id: 'plotting',
                name: 'Data Visualization',
                description: 'Plotting and visualization libraries',
                icon: '$(graph)',
                dependencies: ['matplotlib', 'seaborn', 'plotly'],
                configFiles: []
            }
        ],
        dependencies: {
            production: ['numpy', 'pandas', 'matplotlib', 'seaborn'],
            development: ['jupyter', 'ipykernel', 'pytest', 'black'],
            optional: ['scikit-learn', 'plotly', 'sqlalchemy']
        },
        files: [
            {
                path: 'main.py',
                content: `import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def main():
    """Main data analysis function."""
    print("Data Science Project")
    print("=" * 50)
    
    # Create sample data
    data = pd.DataFrame({
        'x': range(100),
        'y': [i**2 for i in range(100)]
    })
    
    # Create a simple plot
    plt.figure(figsize=(10, 6))
    sns.scatterplot(data=data, x='x', y='y')
    plt.title('Sample Data Visualization')
    plt.xlabel('X values')
    plt.ylabel('Y values')
    plt.savefig('sample_plot.png')
    plt.close()
    
    print("Sample plot saved as 'sample_plot.png'")
    print("Data shape:", data.shape)
    print("Data head:")
    print(data.head())

if __name__ == "__main__":
    main()`,
                description: 'Main data analysis file'
            },
            {
                path: 'notebooks/analysis.ipynb',
                content: `{
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Data Analysis Notebook\\n",
    "\\n",
    "This notebook contains data analysis examples."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "import pandas as pd\\n",
    "import numpy as np\\n",
    "import matplotlib.pyplot as plt\\n",
    "import seaborn as sns\\n",
    "\\n",
    "print('Data analysis environment ready!')"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.8.0"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 4
}`,
                description: 'Jupyter notebook for data analysis'
            }
        ],
        postSetup: [
            'uv run jupyter notebook',
            'echo "Jupyter notebook is running at http://localhost:8888"'
        ]
    },
    {
        id: 'fastapi-api',
        name: 'FastAPI API Service',
        description: 'REST API service with FastAPI framework',
        category: 'api',
        icon: '$(server)',
        frameworks: [
            {
                id: 'fastapi',
                name: 'FastAPI',
                description: 'Modern, fast web framework for building APIs',
                icon: '$(zap)',
                dependencies: ['fastapi', 'uvicorn[standard]'],
                configFiles: [],
                features: ['Async support', 'Automatic API docs', 'Type validation']
            }
        ],
        databases: [
            {
                id: 'sqlite',
                name: 'SQLite',
                description: 'Lightweight, file-based database',
                icon: '$(database)',
                dependencies: ['sqlalchemy', 'alembic'],
                configFiles: [],
                features: ['No setup required', 'File-based', 'ACID compliant']
            },
            {
                id: 'postgresql',
                name: 'PostgreSQL',
                description: 'Powerful, open-source relational database',
                icon: '$(database)',
                dependencies: ['sqlalchemy', 'alembic', 'psycopg2-binary', 'asyncpg'],
                configFiles: [],
                features: ['ACID compliant', 'JSON support', 'Full-text search']
            }
        ],
        aiIntegrations: [],
        testFrameworks: COMMON_TEST_FRAMEWORKS,
        cacheSystems: COMMON_CACHE_SYSTEMS,
        features: [
            {
                id: 'authentication',
                name: 'JWT Authentication',
                description: 'JWT-based authentication system',
                icon: '$(key)',
                dependencies: ['python-jose[cryptography]', 'passlib[bcrypt]'],
                configFiles: []
            },
            {
                id: 'rate-limiting',
                name: 'Rate Limiting',
                description: 'API rate limiting and throttling',
                icon: '$(clock)',
                dependencies: ['slowapi'],
                configFiles: []
            }
        ],
        dependencies: {
            production: ['fastapi', 'uvicorn[standard]', 'pydantic'],
            development: ['pytest', 'pytest-asyncio', 'httpx', 'black', 'flake8'],
            optional: ['sqlalchemy', 'alembic', 'python-jose[cryptography]']
        },
        files: [
            {
                path: 'main.py',
                content: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(
    title="FastAPI API Service",
    description="A REST API service built with FastAPI",
    version="1.0.0"
)

# Sample data model
class Item(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float

# Sample data
items = [
    Item(id=1, name="Item 1", description="First item", price=10.99),
    Item(id=2, name="Item 2", description="Second item", price=20.50),
]

@app.get("/")
async def root():
    return {"message": "FastAPI API Service"}

@app.get("/items", response_model=List[Item])
async def get_items():
    return items

@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    item = next((item for item in items if item.id == item_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "FastAPI API"}`,
                description: 'Main FastAPI API file'
            }
        ],
        postSetup: [
            'uv run uvicorn main:app --reload',
            'echo "API service is running at http://localhost:8000"',
            'echo "API documentation available at http://localhost:8000/docs"'
        ]
    },
    {
        id: 'tkinter-gui',
        name: 'Tkinter GUI Application',
        description: 'Desktop GUI application with Tkinter',
        category: 'gui',
        icon: '$(window)',
        frameworks: [
            {
                id: 'tkinter',
                name: 'Tkinter',
                description: 'Python standard GUI toolkit',
                icon: '$(window)',
                dependencies: [],
                configFiles: [],
                features: ['Built-in', 'Cross-platform', 'Simple to use']
            }
        ],
        databases: [],
        aiIntegrations: [],
        testFrameworks: COMMON_TEST_FRAMEWORKS,
        cacheSystems: COMMON_CACHE_SYSTEMS,
        features: [
            {
                id: 'custom-theme',
                name: 'Custom Theme',
                description: 'Custom styling and themes',
                icon: '$(paintbrush)',
                dependencies: ['ttkthemes'],
                configFiles: []
            }
        ],
        dependencies: {
            production: ['ttkthemes'],
            development: ['pytest', 'black', 'flake8'],
            optional: []
        },
        files: [
            {
                path: 'main.py',
                content: `import tkinter as tk
from tkinter import ttk, messagebox
from ttkthemes import ThemedTk

class Application:
    def __init__(self, root):
        self.root = root
        self.root.title("Tkinter GUI Application")
        self.root.geometry("400x300")
        
        # Create main frame
        main_frame = ttk.Frame(root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Title label
        title_label = ttk.Label(main_frame, text="Welcome to Tkinter GUI", font=("Arial", 16))
        title_label.grid(row=0, column=0, columnspan=2, pady=20)
        
        # Name entry
        ttk.Label(main_frame, text="Name:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.name_var = tk.StringVar()
        name_entry = ttk.Entry(main_frame, textvariable=self.name_var)
        name_entry.grid(row=1, column=1, sticky=(tk.W, tk.E), pady=5)
        
        # Greet button
        greet_button = ttk.Button(main_frame, text="Greet", command=self.greet)
        greet_button.grid(row=2, column=0, columnspan=2, pady=20)
        
        # Status label
        self.status_label = ttk.Label(main_frame, text="Enter your name and click Greet")
        self.status_label.grid(row=3, column=0, columnspan=2, pady=10)
        
        # Configure grid weights
        main_frame.columnconfigure(1, weight=1)
        root.columnconfigure(0, weight=1)
        root.rowconfigure(0, weight=1)
    
    def greet(self):
        name = self.name_var.get().strip()
        if name:
            messagebox.showinfo("Greeting", f"Hello, {name}! Welcome to the application.")
            self.status_label.config(text=f"Greeted: {name}")
        else:
            messagebox.showwarning("Warning", "Please enter a name")

def main():
    root = ThemedTk(theme="arc")  # Modern theme
    app = Application(root)
    root.mainloop()

if __name__ == "__main__":
    main()`,
                description: 'Main Tkinter GUI application'
            }
        ],
        postSetup: [
            'uv run python main.py',
            'echo "Tkinter GUI application launched"'
        ]
    },
    {
        id: 'ai-chatbot',
        name: 'AI Chatbot Application',
        description: 'AI-powered chatbot with OpenAI integration',
        category: 'ai',
        icon: '$(lightbulb)',
        frameworks: [],
        databases: [],
        aiIntegrations: [
            {
                id: 'openai',
                name: 'OpenAI Integration',
                description: 'Integrate OpenAI models for AI features',
                icon: '$(lightbulb)',
                dependencies: ['openai', 'python-dotenv'],
                configFiles: [],
                features: ['GPT models', 'Embeddings', 'Function calling']
            }
        ],
        testFrameworks: COMMON_TEST_FRAMEWORKS,
        cacheSystems: COMMON_CACHE_SYSTEMS,
        features: [
            {
                id: 'streaming',
                name: 'Streaming Responses',
                description: 'Real-time streaming of AI responses',
                icon: '$(radio-tower)',
                dependencies: ['fastapi', 'uvicorn[standard]'],
                configFiles: []
            },
            {
                id: 'memory',
                name: 'Conversation Memory',
                description: 'Remember conversation history',
                icon: '$(database)',
                dependencies: ['redis'],
                configFiles: []
            }
        ],
        dependencies: {
            production: ['openai', 'python-dotenv', 'fastapi', 'uvicorn[standard]'],
            development: ['pytest', 'httpx', 'black', 'flake8'],
            optional: ['redis']
        },
        files: [
            {
                path: 'main.py',
                content: `import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI(
    title="AI Chatbot",
    description="An AI-powered chatbot using OpenAI",
    version="1.0.0"
)

class ChatMessage(BaseModel):
    message: str
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    model: str

@app.get("/")
async def root():
    return {"message": "AI Chatbot API"}

@app.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": chat_message.message}
            ],
            max_tokens=150
        )
        
        return ChatResponse(
            response=response.choices[0].message.content,
            model="gpt-3.5-turbo"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Chatbot"}`,
                description: 'Main AI chatbot application'
            },
            {
                path: '.env.example',
                content: `# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Redis for conversation memory
REDIS_URL=redis://localhost:6379`,
                description: 'Environment variables example'
            }
        ],
        postSetup: [
            'echo "Please set your OPENAI_API_KEY in .env file"',
            'uv run uvicorn main:app --reload',
            'echo "AI Chatbot API is running at http://localhost:8000"'
        ]
    },
    {
        id: 'microservice-api',
        name: 'Microservice API',
        description: 'Lightweight microservice with FastAPI',
        category: 'microservice',
        icon: '$(package)',
        frameworks: [
            {
                id: 'fastapi',
                name: 'FastAPI',
                description: 'Modern, fast web framework for building APIs',
                icon: '$(zap)',
                dependencies: ['fastapi', 'uvicorn[standard]'],
                configFiles: [],
                features: ['Async support', 'Automatic API docs', 'Type validation']
            }
        ],
        databases: [],
        aiIntegrations: [],
        testFrameworks: COMMON_TEST_FRAMEWORKS,
        cacheSystems: COMMON_CACHE_SYSTEMS,
        features: [
            {
                id: 'health-check',
                name: 'Health Check',
                description: 'Health check endpoints',
                icon: '$(heart)',
                dependencies: [],
                configFiles: []
            },
            {
                id: 'metrics',
                name: 'Metrics',
                description: 'Application metrics',
                icon: '$(graph)',
                dependencies: ['prometheus-client'],
                configFiles: []
            }
        ],
        dependencies: {
            production: ['fastapi', 'uvicorn[standard]', 'pydantic'],
            development: ['pytest', 'pytest-asyncio', 'httpx', 'black'],
            optional: ['prometheus-client']
        },
        files: [
            {
                path: 'main.py',
                content: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import time
import os

app = FastAPI(
    title="Microservice API",
    description="A lightweight microservice",
    version="1.0.0"
)

class ServiceInfo(BaseModel):
    name: str
    version: str
    status: str
    timestamp: float

@app.get("/")
async def root():
    return {"message": "Microservice API"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "microservice",
        "timestamp": time.time()
    }

@app.get("/info", response_model=ServiceInfo)
async def service_info():
    return ServiceInfo(
        name="microservice-api",
        version="1.0.0",
        status="running",
        timestamp=time.time()
    )

@app.get("/metrics")
async def metrics():
    return {
        "requests_total": 0,
        "uptime_seconds": time.time(),
        "memory_usage": "0 MB"
    }`,
                description: 'Main microservice application'
            }
        ],
        postSetup: [
            'uv run uvicorn main:app --reload',
            'echo "Microservice is running at http://localhost:8000"'
        ]
    },
    {
        id: 'fullstack-app',
        name: 'Full-Stack Application',
        description: 'Complete application with frontend and backend',
        category: 'fullstack',
        icon: '$(layers)',
        frameworks: [
            {
                id: 'fastapi',
                name: 'FastAPI',
                description: 'Modern, fast web framework for building APIs',
                icon: '$(zap)',
                dependencies: ['fastapi', 'uvicorn[standard]'],
                configFiles: [],
                features: ['Async support', 'Automatic API docs', 'Type validation']
            }
        ],
        databases: [
            {
                id: 'sqlite',
                name: 'SQLite',
                description: 'Lightweight, file-based database',
                icon: '$(database)',
                dependencies: ['sqlalchemy', 'alembic'],
                configFiles: [],
                features: ['No setup required', 'File-based', 'ACID compliant']
            }
        ],
        aiIntegrations: [],
        testFrameworks: COMMON_TEST_FRAMEWORKS,
        cacheSystems: COMMON_CACHE_SYSTEMS,
        features: [
            {
                id: 'static-files',
                name: 'Static Files',
                description: 'Serve static files (HTML, CSS, JS)',
                icon: '$(file)',
                dependencies: ['aiofiles'],
                configFiles: []
            },
            {
                id: 'authentication',
                name: 'Authentication',
                description: 'User authentication system',
                icon: '$(key)',
                dependencies: ['python-jose[cryptography]', 'passlib[bcrypt]'],
                configFiles: []
            }
        ],
        dependencies: {
            production: ['fastapi', 'uvicorn[standard]', 'pydantic', 'sqlalchemy', 'aiofiles'],
            development: ['pytest', 'pytest-asyncio', 'httpx', 'black', 'flake8'],
            optional: ['python-jose[cryptography]', 'passlib[bcrypt]']
        },
        files: [
            {
                path: 'main.py',
                content: `from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os

app = FastAPI(
    title="Full-Stack Application",
    description="A complete application with frontend and backend",
    version="1.0.0"
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

class User(BaseModel):
    id: int
    name: str
    email: str

# Sample data
users = [
    User(id=1, name="John Doe", email="john@example.com"),
    User(id=2, name="Jane Smith", email="jane@example.com"),
]

@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.get("/api/users", response_model=list[User])
async def get_users():
    return users

@app.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    user = next((user for user in users if user.id == user_id), None)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "fullstack-app"}`,
                description: 'Main full-stack application'
            },
            {
                path: 'static/index.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Full-Stack Application</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .user-list {
            margin-top: 20px;
        }
        .user-item {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px 5px;
        }
        button:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Full-Stack Application</h1>
        <p>This is a complete full-stack application with both frontend and backend.</p>
        
        <button onclick="loadUsers()">Load Users</button>
        <button onclick="clearUsers()">Clear</button>
        
        <div id="userList" class="user-list"></div>
    </div>

    <script>
        async function loadUsers() {
            try {
                const response = await fetch('/api/users');
                const users = await response.json();
                
                const userList = document.getElementById('userList');
                userList.innerHTML = '<h3>Users:</h3>';
                
                users.forEach(user => {
                    const userDiv = document.createElement('div');
                    userDiv.className = 'user-item';
                    userDiv.innerHTML = \`
                        <strong>\${user.name}</strong><br>
                        Email: \${user.email}<br>
                        ID: \${user.id}
                    \`;
                    userList.appendChild(userDiv);
                });
            } catch (error) {
                console.error('Error loading users:', error);
                document.getElementById('userList').innerHTML = '<p style="color: red;">Error loading users</p>';
            }
        }
        
        function clearUsers() {
            document.getElementById('userList').innerHTML = '';
        }
    </script>
</body>
</html>`,
                description: 'Frontend HTML file'
            }
        ],
        postSetup: [
            'uv run uvicorn main:app --reload',
            'echo "Full-stack application is running at http://localhost:8000"'
        ]
    }
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
    return PROJECT_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): ProjectTemplate[] {
    return PROJECT_TEMPLATES.filter(template => template.category === category);
}

export function getAllCategories(): string[] {
    return [...new Set(PROJECT_TEMPLATES.map(template => template.category))];
} 