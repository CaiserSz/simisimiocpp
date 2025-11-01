# Build stage
FROM node:20-alpine as build

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install -g concurrently

# Install server dependencies
WORKDIR /app/server
RUN npm install --production

# Install client dependencies and build
WORKDIR /app/client
RUN npm install --production
RUN npm run build

# Production stage
FROM node:18-alpine

# Install MongoDB client tools for backup/restore
RUN apk add --no-cache mongodb-tools

# Create app directory
WORKDIR /app

# Copy built files from build stage
COPY --from=build /app/server /app/server
COPY --from=build /app/client/build /app/client/build

# Copy necessary files
COPY .env /app/
COPY docker-entrypoint.sh /app/
COPY wait-for-mongo.sh /app/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Make scripts executable
RUN chmod +x /app/docker-entrypoint.sh /app/wait-for-mongo.sh

# Expose ports
EXPOSE 3000 9220

# Set the entry point
ENTRYPOINT ["/app/docker-entrypoint.sh"]
