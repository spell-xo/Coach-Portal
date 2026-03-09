# Production Deployment - Quick Summary

## 📦 Files Created for Production Deployment

### 1. GitHub Actions Workflow
**File**: [.github/workflows/deploy-prod.yml](.github/workflows/deploy-prod.yml)

Production deployment workflow with:
- Higher resources (1Gi memory, 2 CPUs)
- Min instances: 1 (always warm)
- Max instances: 20
- Analytics enabled
- Keeps 10 most recent images

**Action Required**:
- Update `PROJECT_ID` (line 20)
- Update `API_URL` (line 24)

### 2. GCP Setup Script
**File**: [deployment/scripts/gcp-setup-prod.sh](deployment/scripts/gcp-setup-prod.sh)

Automated script to:
- Create GCP infrastructure
- Set up Workload Identity Federation
- Configure IAM permissions
- Output GitHub secrets

**Usage**:
```bash
cd deployment/scripts
./gcp-setup-prod.sh
```

### 3. Environment Configuration
**File**: [.env.example](.env.example)

Updated with production URL placeholder and build metadata fields.

### 4. Package.json Scripts
**File**: [package.json](package.json)

New deployment helper scripts:
- `npm run docker:build` - Build Docker image locally
- `npm run docker:run` - Run Docker container locally
- `npm run deploy:prod` - Trigger production deployment

### 5. Deployment Guide
**File**: [deployment/PRODUCTION-DEPLOYMENT-GUIDE.md](deployment/PRODUCTION-DEPLOYMENT-GUIDE.md)

Complete step-by-step guide including:
- Prerequisites checklist
- Setup instructions
- Configuration details
- Rollback procedures
- Troubleshooting tips

---

## 🚀 Quick Start - Deploy to Production

### Step 1: Run GCP Setup (One-time)
```bash
cd deployment/scripts
./gcp-setup-prod.sh
```

### Step 2: Add GitHub Secrets
Add these to GitHub repository secrets:
- `WIF_PROVIDER_PROD`
- `WIF_SERVICE_ACCOUNT_PROD`

### Step 3: Update Workflow File
Edit [.github/workflows/deploy-prod.yml](.github/workflows/deploy-prod.yml#L20-L24):
- Set your production `PROJECT_ID`
- Set your production `API_URL`

### Step 4: Deploy
Go to GitHub Actions → "Deploy to Cloud Run (Production)" → Run workflow

---

## 🔍 What's Different from Dev?

| Configuration | Development | Production |
|--------------|-------------|------------|
| **Service Name** | `aim-coach-portal-dev` | `aim-coach-portal-prod` |
| **Memory** | 512Mi | 1Gi |
| **CPU** | 1 | 2 |
| **Min Instances** | 0 (cold start) | 1 (always warm) |
| **Max Instances** | 10 | 20 |
| **Analytics** | Disabled | Enabled |
| **Environment** | `development` | `production` |
| **GitHub Secrets** | `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT` | `WIF_PROVIDER_PROD`, `WIF_SERVICE_ACCOUNT_PROD` |
| **Images Kept** | 5 most recent | 10 most recent |

---

## ⚙️ Configuration Changes Needed

### 1. Update deploy-prod.yml
```yaml
env:
  PROJECT_ID: YOUR_PROD_PROJECT_ID  # ← Update this
  SERVICE_NAME: aim-coach-portal-prod
  REGION: us-central1
  REGISTRY: us-central1-docker.pkg.dev
  API_URL: https://your-prod-api.run.app/api/v1  # ← Update this
```

### 2. Set GitHub Secrets
```
WIF_PROVIDER_PROD = projects/123456/locations/global/workloadIdentityPools/github-pool-prod/providers/github-provider-prod
WIF_SERVICE_ACCOUNT_PROD = github-actions-prod@your-project.iam.gserviceaccount.com
```

---

## 📋 Pre-Deployment Checklist

- [ ] GCP production project created
- [ ] `gcloud` CLI installed and authenticated
- [ ] GCP setup script executed: `./deployment/scripts/gcp-setup-prod.sh`
- [ ] GitHub secrets added: `WIF_PROVIDER_PROD`, `WIF_SERVICE_ACCOUNT_PROD`
- [ ] Workflow file updated with production `PROJECT_ID`
- [ ] Workflow file updated with production `API_URL`
- [ ] Production backend API is deployed and accessible
- [ ] Code tested in development environment
- [ ] All changes committed to master branch

---

## 🎯 Deploy Now

### Via GitHub UI (Recommended)
1. Go to: https://github.com/bigpicture-football-aim/aim-coach-portal-ui/actions
2. Click "Deploy to Cloud Run (Production)"
3. Click "Run workflow"
4. Select branch: `master`
5. Click "Run workflow" button

### Via Command Line
```bash
npm run deploy:prod
```

---

## 📚 Documentation

- **Full Guide**: [deployment/PRODUCTION-DEPLOYMENT-GUIDE.md](deployment/PRODUCTION-DEPLOYMENT-GUIDE.md)
- **Troubleshooting**: [deployment/TROUBLESHOOTING.md](deployment/TROUBLESHOOTING.md)
- **Dev Deployment**: [.github/workflows/deploy-dev.yml](.github/workflows/deploy-dev.yml)

---

## 🔗 Quick Links

- **GitHub Actions**: https://github.com/bigpicture-football-aim/aim-coach-portal-ui/actions
- **Cloud Run Console**: https://console.cloud.google.com/run
- **Artifact Registry**: https://console.cloud.google.com/artifacts
- **Logs**: https://console.cloud.google.com/logs

---

**Need Help?** See [deployment/PRODUCTION-DEPLOYMENT-GUIDE.md](deployment/PRODUCTION-DEPLOYMENT-GUIDE.md) for detailed instructions.
