# Docker build script with memory optimization for Windows
# This script helps avoid SIGBUS errors during npm install

param(
    [string]$DeployEnv = "UAT",
    [string]$Port = "5000",
    [string]$Dockerfile = "Seal.Dockerfile",
    [string]$ImageName = "seal-live-page",
    [string]$Tag = "latest"
)

Write-Host "Building Docker image with following parameters:" -ForegroundColor Green
Write-Host "  DEPLOY_ENV: $DeployEnv" -ForegroundColor Yellow
Write-Host "  PORT: $Port" -ForegroundColor Yellow
Write-Host "  DOCKERFILE: $Dockerfile" -ForegroundColor Yellow
Write-Host "  IMAGE_NAME: $ImageName" -ForegroundColor Yellow
Write-Host "  TAG: $Tag" -ForegroundColor Yellow

# Build the Docker image with memory optimization
docker build `
    --build-arg DEPLOY_ENV=$DeployEnv `
    --build-arg PORT=$Port `
    --memory=4g `
    --memory-swap=4g `
    --shm-size=1g `
    -f $Dockerfile `
    -t $ImageName`:$Tag `
    .

if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker build completed successfully!" -ForegroundColor Green
    Write-Host "Image: $ImageName`:$Tag" -ForegroundColor Cyan
} else {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}
