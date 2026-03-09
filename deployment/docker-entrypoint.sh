#!/bin/sh
set -e

echo "Starting nginx startup script..."
echo "PORT environment variable: ${PORT:-8080}"

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

# Display nginx version and configuration details
echo "Nginx version:"
nginx -v

# Check if build files exist
if [ -d "/usr/share/nginx/html" ]; then
    echo "Build directory exists"
    echo "Files in /usr/share/nginx/html:"
    ls -la /usr/share/nginx/html | head -n 10
else
    echo "ERROR: Build directory /usr/share/nginx/html does not exist!"
    exit 1
fi

# Check if index.html exists
if [ -f "/usr/share/nginx/html/index.html" ]; then
    echo "index.html found"
else
    echo "WARNING: index.html not found in /usr/share/nginx/html"
fi

# Check permissions
echo "Checking permissions..."
echo "Current user: $(whoami)"
echo "User ID: $(id -u)"
echo "Group ID: $(id -g)"

# Verify we can write to necessary directories
echo "Checking writable directories..."
touch /var/run/nginx.pid.test && rm /var/run/nginx.pid.test && echo "/var/run is writable" || echo "WARNING: /var/run is not writable"
touch /var/cache/nginx/test && rm /var/cache/nginx/test && echo "/var/cache/nginx is writable" || echo "WARNING: /var/cache/nginx is not writable"

echo "Starting nginx in foreground..."
exec nginx -g "daemon off;"
