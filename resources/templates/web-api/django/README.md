# {{PROJECT_NAME}}

A Django REST API application.

## Getting Started

```bash
# Install dependencies
uv sync

# Run the development server
uv run python main.py
```

Open http://localhost:8000 to access the API.

## Endpoints

- `GET /` - API root
- `GET /health/` - Health check
- `GET /api/items/` - List items
- `POST /api/items/` - Create item
