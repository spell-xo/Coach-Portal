# Cloud Run Deployment Troubleshooting Guide

This guide documents common issues and solutions when deploying React applications to Google Cloud Run.

## 403 Forbidden Error

### Symptoms
- Accessing the root URL (/) returns `403 Forbidden`
- Error message: "Your client does not have permission to get URL / from this server."

### Root Causes and Solutions

#### 1. Nginx Configuration Issue

**Problem:** The `try_files` directive includes `$uri/` which causes nginx to attempt directory listing on the root path.

**Solution:** Simplify the `try_files` directive in your nginx configuration.

**Before (incorrect):**
```nginx
location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

**After (correct):**
```nginx
location / {
    try_files $uri /index.html;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

**Why this works:** Removing `$uri/` prevents nginx from checking if the path is a directory and attempting to list its contents, which would result in a 403 Forbidden error.

#### 2. Cloud Run IAM Policy Missing

**Problem:** Cloud Run service deployed with `--allow-unauthenticated` flag, but IAM policy binding fails silently during deployment.

**Symptoms:**
- Deployment logs show: `Setting IAM Policy.....warning`
- Message: `Setting IAM policy failed, try "gcloud beta run services add-iam-policy-binding..."`
- Service returns 403 even though deployment was "successful"

**Solution:** Manually add the IAM policy binding after deployment:

```bash
gcloud run services add-iam-policy-binding <SERVICE_NAME> \
  --region=<REGION> \
  --member=allUsers \
  --role=roles/run.invoker
```

**Example:**
```bash
gcloud run services add-iam-policy-binding aim-coach-portal-dev \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker
```

**Why this happens:** The service account used for deployment may not have sufficient permissions to set IAM policies, or there may be organizational policies preventing automatic public access.

## Testing the Fix Locally

Before deploying to Cloud Run, test the nginx configuration locally:

```bash
# Build the Docker image
docker build -t aim-coach-portal:test \
  --build-arg REACT_APP_API_URL=http://localhost:3000 \
  --build-arg REACT_APP_ENV=development \
  -f deployment/Dockerfile .

# Run the container
docker run -d -p 8080:8080 --name aim-coach-portal-test aim-coach-portal:test

# Test the endpoints
curl -I http://localhost:8080              # Should return 200 OK
curl -I http://localhost:8080/health       # Should return 200 OK
curl -I http://localhost:8080/any-route    # Should return 200 OK (React Router)

# Clean up
docker stop aim-coach-portal-test && docker rm aim-coach-portal-test
```

## Verification Checklist

After deployment, verify the following:

- [ ] Root URL (/) returns 200 OK
- [ ] Health endpoint (/health) returns 200 OK
- [ ] Non-existent routes return 200 OK (React Router fallback works)
- [ ] HTML content is served correctly
- [ ] Static assets (JS, CSS) load properly

## Common Commands

### Check Cloud Run Service Status
```bash
gcloud run services describe <SERVICE_NAME> --region=<REGION>
```

### View Cloud Run Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=<SERVICE_NAME>" --limit 50 --format json
```

### Check IAM Policy
```bash
gcloud run services get-iam-policy <SERVICE_NAME> --region=<REGION>
```

### Remove Public Access (if needed)
```bash
gcloud run services remove-iam-policy-binding <SERVICE_NAME> \
  --region=<REGION> \
  --member=allUsers \
  --role=roles/run.invoker
```

## Related Files

- `deployment/nginx.conf` - Nginx configuration for the application
- `deployment/Dockerfile` - Multi-stage Docker build configuration
- `deployment/docker-entrypoint.sh` - Startup script with diagnostics
- `.github/workflows/deploy-dev.yml` - GitHub Actions deployment workflow

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Nginx try_files Directive](http://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
- [Cloud Run IAM Permissions](https://cloud.google.com/run/docs/securing/managing-access)

## Notes

- This issue was resolved on 2025-10-13
- Commit: 4f631dd67552c986ac5200c799feda63bee24f03
- Both the nginx configuration fix AND IAM policy binding are required
- The fix applies to any React SPA (Single Page Application) deployment
