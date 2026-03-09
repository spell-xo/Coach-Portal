# Production Deployment Guide

This guide covers deploying the AIM Coach Portal UI to production using Google Cloud Run.

## 📋 Prerequisites

- [ ] GCP account with billing enabled
- [ ] GCP project for production (separate from dev)
- [ ] `gcloud` CLI installed and authenticated
- [ ] GitHub repository access
- [ ] Production API backend URL

## 🚀 Step-by-Step Deployment

### Step 1: Run GCP Setup Script

This script sets up all required GCP infrastructure:

```bash
cd deployment/scripts
./gcp-setup-prod.sh
```

The script will:
- Enable required GCP APIs (Cloud Run, Artifact Registry, etc.)
- Create Artifact Registry repository
- Create service account with necessary permissions
- Set up Workload Identity Federation (keyless GitHub auth)
- Display configuration values for GitHub secrets

**Take note of the output values - you'll need them in Step 2!**

### Step 2: Configure GitHub Secrets

Go to your GitHub repository settings:
`https://github.com/bigpicture-football-aim/aim-coach-portal-ui/settings/secrets/actions`

Add these secrets (values provided by setup script):

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `WIF_PROVIDER_PROD` | Workload Identity Provider | `projects/123456/locations/global/workloadIdentityPools/github-pool-prod/providers/github-provider-prod` |
| `WIF_SERVICE_ACCOUNT_PROD` | Service Account Email | `github-actions-prod@your-project.iam.gserviceaccount.com` |

### Step 3: Update Workflow Configuration

Edit `.github/workflows/deploy-prod.yml` and update these environment variables:

```yaml
env:
  PROJECT_ID: YOUR_PRODUCTION_PROJECT_ID  # Update this
  SERVICE_NAME: aim-coach-portal-prod
  REGION: us-central1
  REGISTRY: us-central1-docker.pkg.dev
  API_URL: https://your-production-api-url.run.app/api/v1  # Update this
```

**Required changes:**
- `PROJECT_ID`: Your GCP production project ID
- `API_URL`: Your production backend API URL (must end with `/api/v1`)

### Step 4: Verify Configuration

Before deploying, double-check:

- [ ] GitHub secrets are set correctly
- [ ] Production API URL is correct in deploy-prod.yml
- [ ] Project ID matches your production GCP project
- [ ] All code changes are committed and pushed to master branch

### Step 5: Deploy to Production

#### Option A: Deploy via GitHub Actions UI (Recommended)

1. Go to GitHub Actions: `https://github.com/bigpicture-football-aim/aim-coach-portal-ui/actions`
2. Select **"Deploy to Cloud Run (Production)"**
3. Click **"Run workflow"**
4. Select branch: `master`
5. Click **"Run workflow"** button

#### Option B: Deploy via CLI

```bash
npm run deploy:prod
```

Or directly with GitHub CLI:

```bash
gh workflow run deploy-prod.yml --ref master
```

### Step 6: Monitor Deployment

1. Watch the GitHub Actions logs for deployment progress
2. Deployment typically takes 5-10 minutes
3. On success, you'll see the Cloud Run service URL in the logs

### Step 7: Verify Production Deployment

Once deployed, verify:

```bash
# Get service URL
gcloud run services describe aim-coach-portal-prod \
  --region us-central1 \
  --format 'value(status.url)'

# Check service status
gcloud run services list --filter="aim-coach-portal-prod"

# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=aim-coach-portal-prod" \
  --limit 50 \
  --format json
```

**Test the production URL in your browser:**
- Health check: `https://your-service-url.run.app/health`
- Main app: `https://your-service-url.run.app`

## 🔧 Production Configuration

### Environment Variables (Build-time)

These are set in `.github/workflows/deploy-prod.yml`:

```yaml
REACT_APP_API_URL="https://your-production-api-url.run.app/api/v1"
REACT_APP_ENV="production"
REACT_APP_ENABLE_ANALYTICS="true"      # Analytics enabled in production
REACT_APP_ENABLE_GROUPS="true"
REACT_APP_ENABLE_CHALLENGES="true"
REACT_APP_BUILD_TIME="[auto-generated]"
REACT_APP_GIT_SHA="[auto-generated]"
```

### Cloud Run Configuration

Production uses enhanced resources:

- **Memory**: 1Gi (vs 512Mi in dev)
- **CPU**: 2 (vs 1 in dev)
- **Min Instances**: 1 (always warm)
- **Max Instances**: 20 (auto-scale for traffic)
- **Port**: 8080
- **Timeout**: 300 seconds

### Image Retention

The deployment automatically cleans up old container images, keeping the 10 most recent (vs 5 in dev).

## 🔄 Rollback Procedure

If you need to rollback to a previous version:

```bash
# List recent revisions
gcloud run revisions list \
  --service aim-coach-portal-prod \
  --region us-central1

# Rollback to specific revision
gcloud run services update-traffic aim-coach-portal-prod \
  --region us-central1 \
  --to-revisions REVISION_NAME=100

# Example:
gcloud run services update-traffic aim-coach-portal-prod \
  --region us-central1 \
  --to-revisions aim-coach-portal-prod-00042-abc=100
```

## 🔒 Security Considerations

1. **Secrets Management**
   - Never commit `.env` files
   - Use GitHub secrets for sensitive values
   - Workload Identity Federation (no service account keys)

2. **IAM Permissions**
   - Production service account has minimal required permissions
   - Separate service accounts for dev and prod

3. **Network Security**
   - Cloud Run service allows unauthenticated access (public app)
   - Add Cloud Armor for DDoS protection if needed
   - Consider Cloud CDN for static assets

4. **Monitoring**
   - Set up Cloud Monitoring alerts
   - Monitor error rates and latency
   - Review Cloud Run logs regularly

## 📊 Monitoring & Logging

### View Logs

```bash
# Tail logs in real-time
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=aim-coach-portal-prod"

# View error logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=aim-coach-portal-prod AND severity>=ERROR" \
  --limit 50
```

### Metrics Dashboard

Access Cloud Run metrics:
```bash
gcloud run services describe aim-coach-portal-prod \
  --region us-central1 \
  --format yaml
```

Or view in console:
`https://console.cloud.google.com/run/detail/us-central1/aim-coach-portal-prod/metrics`

## 🐛 Troubleshooting

### Deployment Fails

1. **Check GitHub Actions logs** for specific error
2. **Verify secrets** are set correctly
3. **Check IAM permissions** for service account
4. **Verify API URL** is accessible

### Service Returns 403 Forbidden

```bash
# Check IAM policy
gcloud run services get-iam-policy aim-coach-portal-prod --region us-central1

# Make service public
gcloud run services add-iam-policy-binding aim-coach-portal-prod \
  --region us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### API Connection Issues

1. Verify `REACT_APP_API_URL` in workflow file
2. Check CORS configuration on backend API
3. Verify backend API is accessible from Cloud Run
4. Check browser console for CORS errors

### Build Failures

```bash
# Test build locally
npm run docker:build

# Run locally to debug
npm run docker:run
# Access at http://localhost:8080
```

## 📝 Additional Commands

### Update Production Service

```bash
# Update environment without full redeploy
gcloud run services update aim-coach-portal-prod \
  --region us-central1 \
  --update-env-vars KEY=VALUE

# Scale instances
gcloud run services update aim-coach-portal-prod \
  --region us-central1 \
  --min-instances 2 \
  --max-instances 50
```

### Delete Production Service

```bash
# ⚠️ USE WITH CAUTION - This deletes the production service
gcloud run services delete aim-coach-portal-prod \
  --region us-central1
```

## 🔗 Useful Links

- **Cloud Run Console**: https://console.cloud.google.com/run
- **Artifact Registry**: https://console.cloud.google.com/artifacts
- **IAM & Admin**: https://console.cloud.google.com/iam-admin
- **Logs Explorer**: https://console.cloud.google.com/logs
- **GitHub Actions**: https://github.com/bigpicture-football-aim/aim-coach-portal-ui/actions

## 📞 Support

For deployment issues:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review GitHub Actions logs
3. Check Cloud Run logs
4. Contact DevOps team

---

**Last Updated**: 2025-01-17
