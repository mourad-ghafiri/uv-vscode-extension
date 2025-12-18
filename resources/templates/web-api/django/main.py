"""
{{PROJECT_NAME}} - Django REST API Application
"""
import os
import sys

# Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

import django
from django.conf import settings as django_settings
from django.http import JsonResponse
from django.urls import path
from django.core.management import execute_from_command_line

# Configure Django settings
SETTINGS = {
    'DEBUG': True,
    'SECRET_KEY': 'dev-secret-key-change-in-production',
    'ROOT_URLCONF': '__main__',
    'ALLOWED_HOSTS': ['*'],
    'INSTALLED_APPS': [
        'django.contrib.contenttypes',
        'django.contrib.auth',
        'rest_framework',
        'corsheaders',
    ],
    'MIDDLEWARE': [
        'corsheaders.middleware.CorsMiddleware',
        'django.middleware.common.CommonMiddleware',
    ],
    'REST_FRAMEWORK': {
        'DEFAULT_PERMISSION_CLASSES': [
            'rest_framework.permissions.AllowAny',
        ],
    },
    'CORS_ALLOW_ALL_ORIGINS': True,
}

if not django_settings.configured:
    django_settings.configure(**SETTINGS)
    django.setup()

from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def api_root(request):
    """Root API endpoint."""
    return Response({
        'message': 'Welcome to {{PROJECT_NAME}} API',
        'endpoints': {
            'health': '/health/',
            'api': '/api/',
        }
    })


@api_view(['GET'])
def health_check(request):
    """Health check endpoint."""
    return Response({'status': 'healthy'})


@api_view(['GET', 'POST'])
def items_list(request):
    """Example items endpoint."""
    if request.method == 'GET':
        return Response({
            'items': [
                {'id': 1, 'name': 'Item 1'},
                {'id': 2, 'name': 'Item 2'},
            ]
        })
    elif request.method == 'POST':
        return Response({'created': request.data}, status=201)


# URL patterns
urlpatterns = [
    path('', api_root, name='api-root'),
    path('health/', health_check, name='health'),
    path('api/items/', items_list, name='items'),
]


if __name__ == '__main__':
    print("Starting Django server...")
    print("Open http://localhost:8000 in your browser")
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])
