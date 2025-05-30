# Use Node.js 18 Alpine image as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for React Native
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001 \
    && chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 19006

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:19006 || exit 1

# Start the application
CMD ["npm", "start"]