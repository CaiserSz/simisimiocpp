#!/bin/sh
set -e

# Wait for MongoDB to be ready
./wait-for-mongo.sh mongo 27017

# Initialize database if needed
if [ "$1" = "node" ] && [ "$2" = "server/src/index.js" ]; then
  # Check if we need to bootstrap the application
  if [ "$INIT_DB" = "true" ]; then
    echo "Initializing database..."
    mongo --host mongo --username ${MONGO_USER:-admin} --password ${MONGO_PASSWORD:-password} --authenticationDatabase admin ${MONGO_DATABASE:-charging_simulator} /app/mongo-init.js
  fi
  
  # Run database migrations if needed
  if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    # Add your migration commands here
    # Example: node server/src/migrate.js
  fi
  
  # Generate self-signed SSL certificate if not exists
  if [ ! -f "/app/nginx/ssl/cert.pem" ] || [ ! -f "/app/nginx/ssl/key.pem" ]; then
    echo "Generating self-signed SSL certificate..."
    mkdir -p /app/nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /app/nginx/ssl/key.pem \
      -out /app/nginx/ssl/cert.pem \
      -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
  fi
fi

exec "$@"
