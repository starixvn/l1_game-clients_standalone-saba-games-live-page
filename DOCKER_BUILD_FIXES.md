# Docker Build Fixes for SIGBUS Error

## Problem
The Docker build was failing with a `SIGBUS` error during the npm install process, specifically when running the Nx post-install script. This is a memory-related issue that commonly occurs in Docker containers with limited resources.

## Root Cause
- **Memory Constraints**: The Docker build process was running out of memory during npm install
- **Nx Post-Install**: The Nx post-install script was consuming too much memory
- **Node.js Memory Limit**: Default Node.js memory limit was insufficient for the build process

## Solutions Implemented

### 1. Updated Dockerfile (`Seal.Dockerfile`)
- **Added Memory Optimization**: Set `NODE_OPTIONS="--max-old-space-size=4096"` to increase Node.js memory limit
- **NPM Configuration**: Added npm config optimizations for better memory management
- **Build Optimization**: Used `npm ci` instead of `npm install` for more reliable builds
- **Retry Logic**: Added npm fetch retry configuration to handle network issues

### 2. Optimized Dockerfile (`Seal.Dockerfile.optimized`)
- **Multi-Stage Build**: Separated dependency installation from application build
- **Better Caching**: Dependencies are cached in a separate stage
- **Memory Isolation**: Each stage has its own memory context

### 3. Build Scripts
- **Linux/Mac**: `build-docker.sh` - Bash script with memory optimization
- **Windows**: `build-docker.ps1` - PowerShell script with memory optimization

### 4. Docker Ignore File (`.dockerignore`)
- **Reduced Build Context**: Excludes unnecessary files from Docker build
- **Memory Optimization**: Smaller build context reduces memory usage
- **Faster Builds**: Excludes test files, documentation, and cache directories

## Usage

### Option 1: Use the Updated Dockerfile
```bash
# Build with default settings
docker build -f Seal.Dockerfile --build-arg DEPLOY_ENV=UAT -t seal-live-page:latest .

# Build with custom settings
docker build \
  --build-arg DEPLOY_ENV=UAT \
  --build-arg PORT=5000 \
  --memory=4g \
  --memory-swap=4g \
  --shm-size=1g \
  -f Seal.Dockerfile \
  -t seal-live-page:latest \
  .
```

### Option 2: Use the Optimized Dockerfile
```bash
# Build with optimized multi-stage approach
docker build -f Seal.Dockerfile.optimized --build-arg DEPLOY_ENV=UAT -t seal-live-page:latest .
```

### Option 3: Use Build Scripts

#### Linux/Mac:
```bash
# Use default settings
./build-docker.sh

# Use custom settings
DEPLOY_ENV=UAT PORT=5000 ./build-docker.sh
```

#### Windows:
```powershell
# Use default settings
.\build-docker.ps1

# Use custom settings
.\build-docker.ps1 -DeployEnv "UAT" -Port "5000"
```

## Key Improvements

### Memory Management
- **Node.js Memory**: Increased to 4GB (`--max-old-space-size=4096`)
- **Docker Memory**: Set build memory limit to 4GB
- **Shared Memory**: Increased shared memory to 1GB

### NPM Configuration
- **Cache Location**: Set to `/tmp/npm-cache`
- **Offline Mode**: Enable offline mode for faster builds
- **Retry Logic**: Added retry configuration for network issues
- **Socket Limits**: Reduced max sockets to prevent memory issues

### Build Process
- **CI Mode**: Use `npm ci` for more reliable dependency installation
- **Production Flag**: Explicitly set `--production=false` for dev dependencies
- **Verbose Logging**: Added verbose logging for better debugging

## Troubleshooting

### If SIGBUS Error Persists
1. **Increase Docker Memory**: Allocate more memory to Docker Desktop
2. **Use Optimized Dockerfile**: Try the multi-stage build approach
3. **Clear Docker Cache**: Run `docker system prune -a`
4. **Use Build Scripts**: Use the provided build scripts with memory optimization

### Memory Allocation
- **Docker Desktop**: Allocate at least 6GB RAM to Docker Desktop
- **Build Process**: Ensure 4GB+ available for the build process
- **System Memory**: Have at least 8GB total system RAM

### Network Issues
- **Registry Configuration**: Ensure npm registry configuration is correct
- **Retry Settings**: The build includes retry logic for network issues
- **Proxy Settings**: Configure proxy if behind corporate firewall

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEPLOY_ENV` | `UAT` | Deployment environment (LOCAL_*, UAT, PROD) |
| `PORT` | `5000` | Port for the application |
| `NODE_OPTIONS` | `--max-old-space-size=4096` | Node.js memory options |
| `NPM_CONFIG_CACHE` | `/tmp/npm-cache` | NPM cache location |
| `NPM_CONFIG_PREFER_OFFLINE` | `true` | Prefer offline packages |

## Success Criteria
- ✅ Docker build completes without SIGBUS error
- ✅ Nx post-install script runs successfully
- ✅ Application builds correctly for all environments
- ✅ Build process is reliable and repeatable
