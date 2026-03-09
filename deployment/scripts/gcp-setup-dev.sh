#!/bin/bash

# GCP Cloud Run Dev Environment Setup Script
# This script sets up the GCP infrastructure for AIM Coach Portal development environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - UPDATE THESE VALUES
read -p "Enter your GCP Project ID: " PROJECT_ID
SERVICE_NAME="aim-coach-portal-dev"
REGION="us-central1"
GITHUB_REPO="bigpicture-football-aim/aim-coach-portal-ui"

echo -e "${GREEN}🚀 Setting up GCP for AIM Coach Portal (Dev Environment)${NC}"
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
      --description="Docker repository for AIM Coach Portal Dev Environment"
    echo -e "${GREEN}✅ Artifact Registry repository created${NC}"
fi

# Create Service Account
echo -e "${GREEN}👤 Creating Service Account...${NC}"
SA_EMAIL="github-actions@$PROJECT_ID.iam.gserviceaccount.com"
if gcloud iam service-accounts describe $SA_EMAIL &> /dev/null; then
    echo -e "${YELLOW}⚠️  Service account already exists, skipping...${NC}"
else
    gcloud iam service-accounts create github-actions \
      --display-name="GitHub Actions Service Account" \
      --description="Service account for GitHub Actions CI/CD"
    echo -e "${GREEN}✅ Service account created${NC}"
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
if gcloud iam workload-identity-pools describe "github-pool" --location="global" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Workload Identity Pool already exists, skipping...${NC}"
else
    gcloud iam workload-identity-pools create "github-pool" \
      --location="global" \
      --display-name="GitHub Actions Pool"
    echo -e "${GREEN}✅ Workload Identity Pool created${NC}"
fi

# Create OIDC Provider
if gcloud iam workload-identity-pools providers describe "github-provider" \
    --workload-identity-pool="github-pool" --location="global" &> /dev/null; then
    echo -e "${YELLOW}⚠️  OIDC Provider already exists, skipping...${NC}"
else
    gcloud iam workload-identity-pools providers create-oidc "github-provider" \
      --location="global" \
      --workload-identity-pool="github-pool" \
      --display-name="GitHub Provider" \
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
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/$GITHUB_REPO"

echo -e "${GREEN}✅ Workload Identity binding complete${NC}"

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          GCP Setup Complete! ✅                                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo -e "${YELLOW}1. Add these secrets to your GitHub repository:${NC}"
echo "   Go to: https://github.com/$GITHUB_REPO/settings/secrets/actions"
echo ""
echo -e "${GREEN}   Secret Name: ${NC}GCP_PROJECT_ID"
echo -e "${GREEN}   Secret Value: ${NC}$PROJECT_ID"
echo ""
echo -e "${GREEN}   Secret Name: ${NC}WIF_PROVIDER"
echo -e "${GREEN}   Secret Value: ${NC}projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
echo ""
echo -e "${GREEN}   Secret Name: ${NC}WIF_SERVICE_ACCOUNT"
echo -e "${GREEN}   Secret Value: ${NC}$SA_EMAIL"
echo ""
echo -e "${YELLOW}2. Update GITHUB_REPO in deployment/scripts/gcp-setup-dev.sh${NC}"
echo ""
echo -e "${YELLOW}3. Add any required environment variables as GitHub secrets${NC}"
echo "   (e.g., REACT_APP_API_URL, etc.)"
echo ""
echo -e "${YELLOW}4. Commit and push the deployment files to GitHub${NC}"
echo ""
echo -e "${YELLOW}5. Go to GitHub Actions and trigger 'Deploy to Cloud Run (Dev)'${NC}"
echo ""
echo -e "${GREEN}🎉 Happy deploying!${NC}"
