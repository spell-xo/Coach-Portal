# ✅ Production Deployment Configuration - READY TO DEPLOY

All production deployment files have been configured and are ready to use!

## 📋 Production Configuration Summary

| Setting | Value |
|---------|-------|
| **GCP Project** | `bp-prod-313218` |
| **Region** | `europe-west2` (London) |
| **Service Name** | `aim-coach-portal-prod` |
| **API Backend** | Configured via GitHub secret `REACT_APP_API_URL_PROD` |
| **Registry** | `europe-west2-docker.pkg.dev` |
| **Environment** | `production` |

## ✨ What's Already Configured

### ✅ Files Created & Configured

1. **[.github/workflows/deploy-prod.yml](.github/workflows/deploy-prod.yml)**
   - Project ID: `bp-prod-313218`
   - Region: `europe-west2`
   - API URL: From GitHub secret `REACT_APP_API_URL_PROD`
   - Resources: 1Gi RAM, 2 CPUs
   - Min instances: 1 (no cold starts)
   - Max instances: 20

2. **[deployment/scripts/gcp-setup-prod.sh](deployment/scripts/gcp-setup-prod.sh)**
   - Pre-configured with correct project and region
   - Ready to run to set up GCP infrastructure

3. **[.env.example](.env.example)**
   - Updated with production API URL

4. **[package.json](package.json)**
   - Added deployment scripts

## 🚀 Deploy to Production - 3 Steps

### Step 1: Run GCP Setup (One-time only)

```bash
cd deployment/scripts
./gcp-setup-prod.sh
```

This will:
- ✅ Enable required GCP APIs
- ✅ Create Artifact Registry repository
- ✅ Create service account with permissions
- ✅ Set up Workload Identity Federation
- ✅ Display GitHub secrets to add

**Expected Output:**
```
WIF_PROVIDER_PROD = projects/751091042333/locations/global/workloadIdentityPools/github-pool-prod/providers/github-provider-prod
WIF_SERVICE_ACCOUNT_PROD = github-actions-prod@bp-prod-313218.iam.gserviceaccount.com
```

### Step 2: Add GitHub Secrets

Go to: https://github.com/bigpicture-football-aim/aim-coach-portal-ui/settings/secrets/actions

Add these 3 secrets:

| Secret Name | Value |
|-------------|-------|
| `WIF_PROVIDER_PROD` | From Step 1 script output: `projects/751091042333/locations/.../github-provider-prod` |
| `WIF_SERVICE_ACCOUNT_PROD` | From Step 1 script output: `github-actions-prod@bp-prod-313218.iam.gserviceaccount.com` |
| `REACT_APP_API_URL_PROD` | Your production backend API URL (e.g., `https://your-api.run.app/api/v1`) |

### Step 3: Deploy!

#### Option A: GitHub Actions UI (Recommended)
1. Go to: https://github.com/bigpicture-football-aim/aim-coach-portal-ui/actions
2. Click **"Deploy to Cloud Run (Production)"**
3. Click **"Run workflow"**
4. Select branch: `master` (or `prod_deploy`)
5. Click **"Run workflow"** button

#### Option B: Command Line
```bash
npm run deploy:prod
```

Or with GitHub CLI:
```bash
gh workflow run deploy-prod.yml --ref master
```

---

## 🎯 Production vs Development

| Feature | Development | Production |
|---------|-------------|------------|
| **Region** | us-central1 | europe-west2 ✨ |
| **API URL** | Dev API | From GitHub secret ✨ |
| **Memory** | 512Mi | 1Gi ⬆️ |
| **CPU** | 1 | 2 ⬆️ |
| **Min Instances** | 0 | 1 (always warm) ⬆️ |
| **Max Instances** | 10 | 20 ⬆️ |
| **Analytics** | Disabled | Enabled ✅ |
| **Environment** | `development` | `production` ✅ |

---

## 📊 Expected Deployment Outcome

After successful deployment, you'll get:

**Service URL**: `https://aim-coach-portal-prod-751091042333.europe-west2.run.app`

**Verify deployment:**
```bash
# Check service status
gcloud run services describe aim-coach-portal-prod \
  --region europe-west2 \
  --project bp-prod-313218

# Get service URL
gcloud run services describe aim-coach-portal-prod \
  --region europe-west2 \
  --project bp-prod-313218 \
  --format 'value(status.url)'

# Test health endpoint
curl https://aim-coach-portal-prod-751091042333.europe-west2.run.app/health
```

---

## 🔐 GitHub Secrets Required

These 3 secrets are needed:

1. **`WIF_PROVIDER_PROD`** - Workload Identity Provider path (from GCP setup script)
2. **`WIF_SERVICE_ACCOUNT_PROD`** - Service account email (from GCP setup script)
3. **`REACT_APP_API_URL_PROD`** - Your production backend API URL (e.g., `https://your-api.run.app/api/v1`)

⚠️ **Note:** You may already have similar secrets for dev environment (`WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`). The production secrets have `_PROD` suffix.

---

## 🔄 Rollback Instructions

If something goes wrong, rollback to previous version:

```bash
# List revisions
gcloud run revisions list \
  --service aim-coach-portal-prod \
  --region europe-west2 \
  --project bp-prod-313218

# Rollback to specific revision
gcloud run services update-traffic aim-coach-portal-prod \
  --region europe-west2 \
  --project bp-prod-313218 \
  --to-revisions REVISION_NAME=100
```

---

## 📝 Pre-Deployment Checklist

Before deploying, verify:

- [ ] ✅ GCP setup script has been run
- [ ] ✅ GitHub secrets are added (`WIF_PROVIDER_PROD`, `WIF_SERVICE_ACCOUNT_PROD`, `REACT_APP_API_URL_PROD`)
- [ ] ✅ Production backend API URL is set in `REACT_APP_API_URL_PROD` secret
- [ ] ✅ Production backend API is accessible and verified
- [ ] ✅ Code is committed to master branch
- [ ] ✅ Changes tested in dev environment
- [ ] ✅ Team notified about deployment

---

## 🌐 Production URLs

**Frontend (Coach Portal UI):**
- Will be: `https://aim-coach-portal-prod-751091042333.europe-west2.run.app`
- Health check: `https://aim-coach-portal-prod-751091042333.europe-west2.run.app/health`

**Backend API:**
- Configure your backend API URL in GitHub secret `REACT_APP_API_URL_PROD`
- Format must be: `https://your-api-domain.run.app/api/v1`

---

## 🐛 Troubleshooting

### Deployment fails with authentication error
- Verify GitHub secrets are set correctly
- Check WIF_PROVIDER_PROD and WIF_SERVICE_ACCOUNT_PROD values

### Can't access service (403 error)
```bash
# Make service publicly accessible
gcloud run services add-iam-policy-binding aim-coach-portal-prod \
  --region europe-west2 \
  --project bp-prod-313218 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### API connection issues
- Verify backend API is accessible
- Check CORS configuration on backend
- Review browser console for errors

---

## 📚 Additional Documentation

- **Quick Summary**: [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md)
- **Detailed Guide**: [deployment/PRODUCTION-DEPLOYMENT-GUIDE.md](deployment/PRODUCTION-DEPLOYMENT-GUIDE.md)
- **Troubleshooting**: [deployment/TROUBLESHOOTING.md](deployment/TROUBLESHOOTING.md)

---

## 🎉 Ready to Deploy!

All configuration is complete. You can now deploy to production using Step 3 above.

**Quick Deploy Command:**
```bash
npm run deploy:prod
```

Or use the GitHub Actions UI for visual feedback and approval workflow.

---

**Configuration Date**: 2025-01-17
**Configured By**: Automated setup script
**Status**: ✅ Ready for production deployment
