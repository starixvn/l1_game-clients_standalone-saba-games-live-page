# Build stage 1: Install dependencies
FROM hub.lumigame.com/base/node:18-16-alpine-24h1.1 AS deps

# Set working directory
WORKDIR /app

# Set Node.js memory limit and optimization flags
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NPM_CONFIG_CACHE=/tmp/npm-cache
ENV NPM_CONFIG_PREFER_OFFLINE=true

# Copy package files
COPY seal-monorepo/package*.json ./

# Install dependencies with comprehensive registry configuration and memory optimization
RUN npm config set registry http://npm.lumigame.com && \
    npm config set @sg:registry http://npm.lumigame.com && \
    npm config set @lumigame:registry http://npm.lumigame.com && \
    npm config set strict-ssl false && \
    npm config set maxsockets 1 && \
    npm config set fetch-retries 3 && \
    npm config set fetch-retry-mintimeout 5000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm ci --no-audit --no-fund --verbose --production=false && \
    npm install -g cross-env nx

# Build stage 2: Build application
FROM hub.lumigame.com/base/node:18-16-alpine-24h1.1 AS builder

# Set working directory
WORKDIR /app

# Set Node.js memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Add build arguments
ARG DEPLOY_ENV
ENV DEPLOY_ENV=$DEPLOY_ENV

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /usr/local/bin/nx /usr/local/bin/nx
COPY --from=deps /usr/local/bin/cross-env /usr/local/bin/cross-env

# Copy source code
COPY . .

# Build the application based on DEPLOY_ENV
WORKDIR /app/seal-monorepo
RUN npm ci --no-audit --no-fund --verbose --production=false && \
    nx reset && \
    if echo "$DEPLOY_ENV" | grep -q "^LOCAL_"; then \
        cross-env NODE_ENV=development NODE_OPTIONS="--max-old-space-size=4096" nx build saba-games && \
        echo "Build completed successfully for development (${DEPLOY_ENV})"; \
    else \
        cross-env NODE_ENV=$DEPLOY_ENV NODE_OPTIONS="--max-old-space-size=4096" nx build:$DEPLOY_ENV saba-games && \
        echo "Build completed successfully for $DEPLOY_ENV"; \
    fi

# Production stage
FROM hub.lumigame.com/base/nginx:stable-alpine-slim

# Add build argument for port
ARG PORT=5000
ENV PORT=$PORT

# Copy the build output to the Nginx directory
COPY --from=builder /app/seal-monorepo/dist/libs/saba-games /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create necessary directories and set permissions
RUN mkdir -p /usr/share/nginx/html/assets && \
    chown -R nginx:nginx /usr/share/nginx/html

# Expose the port Nginx is running on
EXPOSE $PORT

# Configure healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
