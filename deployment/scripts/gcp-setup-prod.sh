#!/bin/bash

# GCP Cloud Run Production Environment Setup Script
# This script sets up the GCP infrastructure for AIM Coach Portal production environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - UPDATE THESE VALUES
PROJECT_ID="bp-prod-313218"
SERVICE_NAME="aim-coach-portal-prod"
REGION="europe-west2"
GITHUB_REPO="bigpicture-football-aim/aim-coach-portal-ui"

echo -e "${GREEN}🚀 Setting up GCP for AIM Coach Portal (Production Environment)${NC}"
echo -e "${YELLOW}Project ID: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}Service Name: ${SERVICE_NAME}${NC}"
echo -e "${YELLOW}Region: ${REGION}${NC}"
echo ""

# Verify gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it from:${NC}"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo -e "${GREEN}📋 Setting active project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${GREEN}📦 Enabling required GCP APIs (this may take a few minutes)...${NC}"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iamcredentials.googleapis.com

echo -e "${GREEN}✅ APIs enabled successfully${NC}"

# Create Artifact Registry repository
echo -e "${GREEN}🗄️  Creating Artifact Registry repository...${NC}"
if gcloud artifacts repositories describe $SERVICE_NAME --location=$REGION &> /dev/null; then
    echo -e "${YELLOW}⚠️  Repository already exists, skipping...${NC}"
else
    gcloud artifacts repositories create $SERVICE_NAME \
      --repository-format=docker \
      --location=$REGION \
      --description="Docker repository for AIM Coach Portal Production Environment"
    echo -e "${GREEN}✅ Artifact Registry repository created${NC}"
fi

# Create Service Account
echo -e "${GREEN}👤 Creating Service Account...${NC}"
SA_EMAIL="github-actions-prod@$PROJECT_ID.iam.gserviceaccount.com"
if gcloud iam service-accounts describe $SA_EMAIL &> /dev/null; then
    echo -e "${YELLOW}⚠️  Service account already exists, skipping...${NC}"
else
    gcloud iam service-accounts create github-actions-prod \
      --display-name="GitHub Actions Production Service Account" \
      --description="Service account for GitHub Actions CI/CD (Production)"
    echo -e "${GREEN}✅ Service account created${NC}"

    # Wait for service account to propagate
    echo -e "${YELLOW}⏳ Waiting for service account to propagate (30 seconds)...${NC}"
    sleep 30
fi

# Grant necessary IAM permissions
echo -e "${GREEN}🔐 Setting up IAM permissions...${NC}"

# Cloud Run Developer role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.developer" \
  --condition=None

# Artifact Registry Writer role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/artifactregistry.writer" \
  --condition=None

# Service Account User role (needed to deploy Cloud Run)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser" \
  --condition=None

echo -e "${GREEN}✅ IAM permissions configured${NC}"

# Set up Workload Identity Federation
echo -e "${GREEN}🔗 Setting up Workload Identity Federation...${NC}"

# Create Workload Identity Pool
if gcloud iam workload-identity-pools describe "github-pool-prod" --location="global" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Workload Identity Pool already exists, skipping...${NC}"
else
    gcloud iam workload-identity-pools create "github-pool-prod" \
      --location="global" \
      --display-name="GitHub Actions Pool (Production)"
    echo -e "${GREEN}✅ Workload Identity Pool created${NC}"
fi

# Create OIDC Provider
if gcloud iam workload-identity-pools providers describe "github-provider-prod" \
    --workload-identity-pool="github-pool-prod" --location="global" &> /dev/null; then
    echo -e "${YELLOW}⚠️  OIDC Provider already exists, skipping...${NC}"
else
    gcloud iam workload-identity-pools providers create-oidc "github-provider-prod" \
      --location="global" \
      --workload-identity-pool="github-pool-prod" \
      --display-name="GitHub Provider (Production)" \
      --issuer-uri="https://token.actions.githubusercontent.com" \
      --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
      --attribute-condition="assertion.repository=='$GITHUB_REPO'"
    echo -e "${GREEN}✅ OIDC Provider created${NC}"
fi

# Get project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Grant Workload Identity User role to Service Account
echo -e "${GREEN}🔑 Binding Workload Identity to Service Account...${NC}"
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project=$PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool-prod/attribute.repository/$GITHUB_REPO"

echo -e "${GREEN}✅ Workload Identity binding complete${NC}"

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          GCP Production Setup Complete! ✅                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo -e "${YELLOW}1. Add these secrets to your GitHub repository:${NC}"
echo "   Go to: https://github.com/$GITHUB_REPO/settings/secrets/actions"
echo ""
echo -e "${GREEN}   Secret Name: ${NC}WIF_PROVIDER_PROD"
echo -e "${GREEN}   Secret Value: ${NC}projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool-prod/providers/github-provider-prod"
echo ""
echo -e "${GREEN}   Secret Name: ${NC}WIF_SERVICE_ACCOUNT_PROD"
echo -e "${GREEN}   Secret Value: ${NC}$SA_EMAIL"
echo ""
echo -e "${YELLOW}2. Update .github/workflows/deploy-prod.yml with:${NC}"
echo "   - PROJECT_ID: $PROJECT_ID"
echo "   - API_URL: Your production API URL"
echo ""
echo -e "${YELLOW}3. Update GITHUB_REPO in deployment/scripts/gcp-setup-prod.sh if needed${NC}"
echo ""
echo -e "${YELLOW}4. Commit and push the deployment files to GitHub${NC}"
echo ""
echo -e "${YELLOW}5. Go to GitHub Actions and trigger 'Deploy to Cloud Run (Production)'${NC}"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Production deployment requires careful review!${NC}"
echo -e "${RED}   - Verify all environment variables${NC}"
echo -e "${RED}   - Test in dev environment first${NC}"
echo -e "${RED}   - Have a rollback plan ready${NC}"
echo ""
echo -e "${GREEN}🎉 Happy deploying!${NC}"
