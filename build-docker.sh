#!/bin/bash

# Docker build script with memory optimization
# This script helps avoid SIGBUS errors during npm install

set -e

# Default values
DEPLOY_ENV=${DEPLOY_ENV:-"UAT"}
PORT=${PORT:-5000}
DOCKERFILE=${DOCKERFILE:-"Seal.Dockerfile"}
IMAGE_NAME=${IMAGE_NAME:-"seal-live-page"}
TAG=${TAG:-"latest"}

echo "Building Docker image with following parameters:"
echo "  DEPLOY_ENV: $DEPLOY_ENV"
echo "  PORT: $PORT"
echo "  DOCKERFILE: $DOCKERFILE"
echo "  IMAGE_NAME: $IMAGE_NAME"
echo "  TAG: $TAG"

# Build the Docker image with memory optimization
docker build \
    --build-arg DEPLOY_ENV=$DEPLOY_ENV \
    --build-arg PORT=$PORT \
    --memory=4g \
    --memory-swap=4g \
    --shm-size=1g \
    -f $DOCKERFILE \
    -t $IMAGE_NAME:$TAG \
    .

echo "Docker build completed successfully!"
echo "Image: $IMAGE_NAME:$TAG"
