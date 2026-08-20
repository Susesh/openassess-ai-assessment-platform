#!/bin/bash
echo "Starting OpenAssess in production mode..."

# Ensure environment variables are set
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "Warning: GOOGLE_API_KEY is not set."
fi

# Build and start the containers detached
docker-compose up -d --build

echo "OpenAssess is running at http://localhost:8000"
echo "Check health status: curl http://localhost:8000/health"
