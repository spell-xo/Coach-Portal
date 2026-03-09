# Production Deployment Instructions

## 🚀 Quick Start Guide

### Required GitHub Secrets (3 total)

Go to: https://github.com/bigpicture-football-aim/aim-coach-portal-ui/settings/secrets/actions

Add these secrets:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `WIF_PROVIDER_PROD` | Workload Identity Provider | Run `./deployment/scripts/gcp-setup-prod.sh` |
| `WIF_SERVICE_ACCOUNT_PROD` | Service Account Email | Run `./deployment/scripts/gcp-setup-prod.sh` |
| `REACT_APP_API_URL_PROD` | Production Backend API URL | Your backend API URL (must end with `/api/v1`) |

---

## 📋 Deployment Steps

### Step 1: Run GCP Setup (one-time)
```bash
cd deployment/scripts
./gcp-setup-prod.sh
```

This will output the values for `WIF_PROVIDER_PROD` and `WIF_SERVICE_ACCOUNT_PROD`.

### Step 2: Add All GitHub Secrets

Add the 3 secrets listed above to your GitHub repository.

**Important:** `REACT_APP_API_URL_PROD` must be your production backend API URL in this format:
```
https://your-backend-api.run.app/api/v1
```

### Step 3: Deploy

**Via GitHub Actions UI:**
1. Go to: https://github.com/bigpicture-football-aim/aim-coach-portal-ui/actions
2. Select "Deploy to Cloud Run (Production)"
3. Click "Run workflow"
4. Select branch: `master`
5. Click "Run workflow"

**Via Command Line:**
```bash
npm run deploy:prod
```

---

## 🎯 Production Configuration

- **Project**: `bp-prod-313218`
- **Region**: `europe-west2` (London)
- **Service**: `aim-coach-portal-prod`
- **Resources**: 1Gi RAM, 2 CPUs
- **Scaling**: Min 1, Max 20 instances
- **Backend API**: Configured via `REACT_APP_API_URL_PROD` secret

---

## ✅ Pre-Deployment Checklist

- [ ] GCP setup script completed
- [ ] All 3 GitHub secrets added
- [ ] Backend API URL verified and accessible
- [ ] Code committed to master branch
- [ ] Tested in dev environment first

---

## 🔍 Verify Deployment

After deployment completes:

```bash
# Get service URL
gcloud run services describe aim-coach-portal-prod \
  --region europe-west2 \
  --project bp-prod-313218 \
  --format 'value(status.url)'

# Test health endpoint
curl https://aim-coach-portal-prod-751091042333.europe-west2.run.app/health
```

---

## 📚 More Information

- **Detailed Guide**: [PRODUCTION-DEPLOYMENT-READY.md](PRODUCTION-DEPLOYMENT-READY.md)
- **Full Documentation**: [deployment/PRODUCTION-DEPLOYMENT-GUIDE.md](deployment/PRODUCTION-DEPLOYMENT-GUIDE.md)
- **Troubleshooting**: [deployment/TROUBLESHOOTING.md](deployment/TROUBLESHOOTING.md)

---

**Last Updated**: 2025-01-17
