# Build stage
FROM node:20-alpine AS build

# Create app directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git python3 make g++

# Copy server package files first for better caching
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# Production stage
FROM node:20-alpine

# Install additional tools
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S simulator -u 1001

# Create app directory
WORKDIR /app

# Copy server dependencies and source
COPY --from=build /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# Copy documentation
COPY *.md ./
COPY frontend-examples/ ./frontend-examples/

# Set ownership
RUN chown -R simulator:nodejs /app

# Switch to non-root user
USER simulator

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Expose port
EXPOSE 3001

# Set working directory to server
WORKDIR /app/server

# Start the application
CMD ["node", "src/index.js"]
