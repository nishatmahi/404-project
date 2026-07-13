#!/bin/bash
# Production build script for Render
# This script runs during the Render build phase and handles:
# 1. Installing dependencies (redundant but safe)
# 2. Collecting static files
# 3. Running migrations
# 4. Seeding the demo user

set -e  # Exit on any error

echo "=== 404 Backend Build Script ==="

# Install dependencies (usually already done by Render, but ensure)
echo "Installing dependencies..."
pip install -r requirements.txt

# Collect static files for whitenoise
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Run database migrations
echo "Running migrations..."
python manage.py migrate

# Create demo user
echo "Seeding demo user..."
python manage.py seed_demo

echo "=== Build complete ==="
