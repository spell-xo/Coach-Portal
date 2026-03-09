# Dockerfile for aim-coach-portal-ui (React Frontend with nginx)
# Multi-stage build for optimized production image

# Stage 1: Build the React app
FROM node:20.9.0-alpine AS builder

# Install git and openssh (needed for private GitHub dependencies)
RUN apk add --no-cache git openssh-client

WORKDIR /app

# Copy SSH key and known_hosts from build context
COPY ssh_key /root/.ssh/id_ed25519
COPY ssh_known_hosts /root/.ssh/known_hosts
RUN chmod 700 /root/.ssh && chmod 600 /root/.ssh/id_ed25519

# Copy package files
COPY package*.json ./

# Install ALL dependencies including dev deps (needed for build)
RUN npm ci --ignore-scripts

# Remove SSH key for security
RUN rm -rf /root/.ssh

# Copy source code
COPY . .

# Build arguments for React environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_ENV=production
ARG REACT_APP_ENVIRONMENT=dev2
ARG REACT_APP_AI_API_URL
ARG REACT_APP_ENABLE_ANALYTICS=true
ARG REACT_APP_ENABLE_GROUPS=true
ARG REACT_APP_ENABLE_CHALLENGES=true
ARG REACT_APP_BUILD_TIME
ARG REACT_APP_GIT_SHA

# Export as environment variables for the build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_ENV=$REACT_APP_ENV
ENV REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT
ENV REACT_APP_AI_API_URL=$REACT_APP_AI_API_URL
ENV REACT_APP_ENABLE_ANALYTICS=$REACT_APP_ENABLE_ANALYTICS
ENV REACT_APP_ENABLE_GROUPS=$REACT_APP_ENABLE_GROUPS
ENV REACT_APP_ENABLE_CHALLENGES=$REACT_APP_ENABLE_CHALLENGES
ENV REACT_APP_BUILD_TIME=$REACT_APP_BUILD_TIME
ENV REACT_APP_GIT_SHA=$REACT_APP_GIT_SHA

# Build the React app
RUN npm run build

# Stage 2: Production server with nginx
FROM node:20.9.0-alpine

# Install nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copy custom nginx configuration
COPY deployment/nginx.conf /etc/nginx/nginx.conf

# Copy built React app from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose Cloud Run port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
