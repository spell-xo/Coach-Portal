# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Build arguments for React environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_ENV=development
ARG REACT_APP_ENVIRONMENT=dev2
ARG REACT_APP_ENABLE_ANALYTICS=false
ARG REACT_APP_ENABLE_GROUPS=true
ARG REACT_APP_ENABLE_CHALLENGES=true
ARG REACT_APP_AI_API_URL
ARG REACT_APP_BUILD_TIME
ARG REACT_APP_GIT_SHA

# Export as environment variables for the build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_AI_API_URL=$REACT_APP_AI_API_URL
ENV REACT_APP_ENV=$REACT_APP_ENV
ENV REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT
ENV REACT_APP_ENABLE_ANALYTICS=$REACT_APP_ENABLE_ANALYTICS
ENV REACT_APP_ENABLE_GROUPS=$REACT_APP_ENABLE_GROUPS
ENV REACT_APP_ENABLE_CHALLENGES=$REACT_APP_ENABLE_CHALLENGES
ENV REACT_APP_BUILD_TIME=$REACT_APP_BUILD_TIME
ENV REACT_APP_GIT_SHA=$REACT_APP_GIT_SHA

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Build the application with Craco
RUN npm run build

# Stage 2: Runner with nginx
FROM nginx:alpine AS runner

# Copy custom nginx configuration (replaces main config)
COPY deployment/nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY deployment/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy built files from builder stage with proper ownership
COPY --from=builder --chown=nginx:nginx /app/build /usr/share/nginx/html

# Create directories and set permissions for non-root nginx
# Note: We don't chown /var/run directly as it may contain system files
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 755 /var/cache/nginx && \
    chmod -R 755 /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Switch to non-root nginx user (already exists in nginx:alpine)
USER nginx

# Expose Cloud Run port
EXPOSE 8080

# Use startup script for better debugging and error visibility
CMD ["/docker-entrypoint.sh"]
