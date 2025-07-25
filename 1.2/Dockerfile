# Stage 1: Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Copy only package files first (leverages Docker layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the rest of the source code
COPY . .

# Stage 2: Final lightweight image
FROM node:18-slim

WORKDIR /app

# Copy only the node_modules and source code from the builder
COPY --from=builder /app /app

# Expose the default port (can be overridden at runtime)
EXPOSE 3000

# Use non-root user (optional, improves security)
RUN useradd -m appuser
USER appuser

# Start the app
CMD ["node", "server.js"]
