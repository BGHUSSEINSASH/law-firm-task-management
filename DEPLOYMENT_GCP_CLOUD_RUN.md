# Google Cloud Run Deployment Guide

## Architecture Overview

```
Cloud DNS (Domain)
    ↓
Cloud Load Balancer (HTTPS)
    ├─→ Cloud Run (Backend)
    │    └─→ Cloud SQL (PostgreSQL)
    │    └─→ Memorystore (Redis)
    │
    └─→ Cloud CDN
         └─→ Cloud Storage (Frontend Static)
```

## Prerequisites

- Google Cloud Account with billing enabled
- gcloud CLI installed and configured
- Docker installed
- Service Account with necessary IAM roles

## Step 1: Setup Google Cloud Project

```bash
# Create new project
gcloud projects create law-firm-2026 --name="Law Firm Task Management"

# Set active project
gcloud config set project law-firm-2026

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  sql-component.googleapis.com \
  redis.googleapis.com \
  storage.googleapis.com \
  compute.googleapis.com \
  cloudresourcemanager.googleapis.com \
  containerregistry.googleapis.com \
  artifactregistry.googleapis.com

# Set default region
gcloud config set run/region us-central1
```

## Step 2: Create Artifact Registry Repositories

```bash
# Create Docker repository
gcloud artifacts repositories create law-firm \
  --repository-format=docker \
  --location=us-central1 \
  --description="Law Firm Task Management Docker Images"

# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## Step 3: Build and Push Docker Images

```bash
# Backend
docker build -t us-central1-docker.pkg.dev/law-firm-2026/law-firm/backend:latest ./backend
docker push us-central1-docker.pkg.dev/law-firm-2026/law-firm/backend:latest

# Frontend
docker build -t us-central1-docker.pkg.dev/law-firm-2026/law-firm/frontend:latest ./frontend
docker push us-central1-docker.pkg.dev/law-firm-2026/law-firm/frontend:latest
```

## Step 4: Create Cloud SQL PostgreSQL Instance

```bash
# Create PostgreSQL instance
gcloud sql instances create law-firm-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --network=default \
  --availability-type=REGIONAL \
  --enable-bin-log \
  --backup-start-time=03:00 \
  --retained-backups-count=30 \
  --transaction-log-retention-days=7

# Set root password
gcloud sql users set-password postgres \
  --instance=law-firm-db \
  --password='<STRONG_PASSWORD>'

# Create application database
gcloud sql databases create law_firm_db \
  --instance=law-firm-db

# Create application user
gcloud sql users create app_user \
  --instance=law-firm-db \
  --password='<APP_PASSWORD>'

# Get instance connection name (needed later)
gcloud sql instances describe law-firm-db \
  --format='value(connectionName)'
```

## Step 5: Create Memorystore Redis Instance

```bash
# Create Redis instance
gcloud redis instances create law-firm-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=7.0 \
  --tier=basic \
  --auth-enabled

# Get connection details
gcloud redis instances describe law-firm-redis \
  --region=us-central1 \
  --format='value(host,port)'

# Set Redis password (store securely)
gcloud redis instances update law-firm-redis \
  --region=us-central1 \
  --enable-auth-string
```

## Step 6: Create Cloud Storage Buckets

```bash
# Frontend static content bucket
gsutil mb -l us-central1 gs://law-firm-frontend-2026

# Application data bucket
gsutil mb -l us-central1 gs://law-firm-data-2026

# Backup bucket
gsutil mb -l us-central1 gs://law-firm-backups-2026

# Set public access for frontend
gsutil iam ch serviceAccount:cloud-cdn-sa@gcp-sa-cloud-cdn.iam.gserviceaccount.com:objectViewer \
  gs://law-firm-frontend-2026

# Upload frontend build
gsutil -m cp -r frontend/build/* gs://law-firm-frontend-2026/
```

## Step 7: Create Service Accounts

```bash
# Create service account for backend
gcloud iam service-accounts create law-firm-backend \
  --display-name="Law Firm Backend Service"

# Create service account for frontend
gcloud iam service-accounts create law-firm-frontend \
  --display-name="Law Firm Frontend Service"

# Grant Cloud SQL Client role
gcloud projects add-iam-policy-binding law-firm-2026 \
  --member=serviceAccount:law-firm-backend@law-firm-2026.iam.gserviceaccount.com \
  --role=roles/cloudsql.client

# Grant Secret Manager access
gcloud projects add-iam-policy-binding law-firm-2026 \
  --member=serviceAccount:law-firm-backend@law-firm-2026.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Grant Artifact Registry Reader
gcloud artifacts repositories add-iam-policy-binding law-firm \
  --location=us-central1 \
  --member=serviceAccount:law-firm-backend@law-firm-2026.iam.gserviceaccount.com \
  --role=roles/artifactregistry.reader

gcloud artifacts repositories add-iam-policy-binding law-firm \
  --location=us-central1 \
  --member=serviceAccount:law-firm-frontend@law-firm-2026.iam.gserviceaccount.com \
  --role=roles/artifactregistry.reader
```

## Step 8: Store Secrets in Secret Manager

```bash
# Database password
echo -n '<DB_PASSWORD>' | \
  gcloud secrets create db-password --data-file=-

# App password
echo -n '<APP_PASSWORD>' | \
  gcloud secrets create app-password --data-file=-

# JWT secrets
gcloud secrets create jwt-secret --data-file=- <<EOF
{"JWT_SECRET": "<JWT_SECRET>", "REFRESH_TOKEN_SECRET": "<REFRESH_TOKEN_SECRET>"}
EOF

# SMTP credentials
gcloud secrets create smtp-credentials --data-file=- <<EOF
{"SMTP_HOST": "smtp.gmail.com", "SMTP_USER": "<EMAIL>", "SMTP_PASS": "<PASSWORD>"}
EOF

# Redis password
echo -n '<REDIS_PASSWORD>' | \
  gcloud secrets create redis-password --data-file=-

# Grant service account access
for secret in db-password app-password jwt-secret smtp-credentials redis-password; do
  gcloud secrets add-iam-policy-binding $secret \
    --member=serviceAccount:law-firm-backend@law-firm-2026.iam.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor
done
```

## Step 9: Deploy Backend to Cloud Run

```bash
# Get secret values for environment
DB_PASSWORD=$(gcloud secrets versions access latest --secret="db-password")
REDIS_PASSWORD=$(gcloud secrets versions access latest --secret="redis-password")
JWT_SECRET=$(gcloud secrets versions access latest --secret="jwt-secret" | jq -r '.JWT_SECRET')

# Deploy backend
gcloud run deploy law-firm-backend \
  --image=us-central1-docker.pkg.dev/law-firm-2026/law-firm/backend:latest \
  --platform=managed \
  --region=us-central1 \
  --service-account=law-firm-backend@law-firm-2026.iam.gserviceaccount.com \
  --memory=512Mi \
  --cpu=1 \
  --timeout=3600 \
  --max-instances=100 \
  --min-instances=1 \
  --no-allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,LOG_LEVEL=info" \
  --set-secrets="DB_PASSWORD=db-password:latest,REDIS_PASSWORD=redis-password:latest,JWT_SECRET=jwt-secret:latest" \
  --add-cloudsql-instances=law-firm-2026:us-central1:law-firm-db \
  --vpc-connector=law-firm-vpc-connector

# Allow ingress from Cloud Load Balancer and Cloud Endpoints
gcloud run services add-iam-policy-binding law-firm-backend \
  --region=us-central1 \
  --member=serviceAccount:cloud-run-sa@law-firm-2026.iam.gserviceaccount.com \
  --role=roles/run.invoker

# Get service URL
gcloud run services describe law-firm-backend \
  --region=us-central1 \
  --format='value(status.address.url)'
```

## Step 10: Deploy Frontend to Cloud Run (or Cloud Storage + CDN)

### Option A: Cloud Storage + Cloud CDN

```bash
# Upload built frontend
gsutil -m cp -r frontend/build/* gs://law-firm-frontend-2026/

# Create backend bucket for Cloud CDN
gcloud compute backend-buckets create law-firm-frontend \
  --gcs-uri-prefix=gs://law-firm-frontend-2026 \
  --enable-cdn

# Configure cache policy
gcloud compute backend-buckets update law-firm-frontend \
  --cache-mode=CACHE_ALL_STATIC \
  --default-ttl=3600 \
  --max-ttl=86400
```

### Option B: Cloud Run Frontend

```bash
gcloud run deploy law-firm-frontend \
  --image=us-central1-docker.pkg.dev/law-firm-2026/law-firm/frontend:latest \
  --platform=managed \
  --region=us-central1 \
  --service-account=law-firm-frontend@law-firm-2026.iam.gserviceaccount.com \
  --memory=256Mi \
  --cpu=0.5 \
  --max-instances=50 \
  --min-instances=1 \
  --no-allow-unauthenticated \
  --set-env-vars="REACT_APP_API_URL=https://api.example.com"
```

## Step 11: Create Cloud Load Balancer

```bash
# Create SSL certificate (use existing or create new)
gcloud compute ssl-certificates create law-firm-ssl \
  --certificate=cert.pem \
  --private-key=key.pem

# Create backend service for Cloud Run
gcloud compute backend-services create law-firm-backend-service \
  --global \
  --protocol=HTTPS \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC \
  --custom-request-headers="X-Client-Region:{client_region}"

# Create network endpoint group (Cloud Run)
gcloud compute network-endpoint-groups create law-firm-neg \
  --region=us-central1 \
  --network-endpoint-type=SERVERLESS \
  --cloud-run-service=law-firm-backend

# Add NEG to backend service
gcloud compute backend-services add-backend law-firm-backend-service \
  --instance-group=law-firm-neg \
  --instance-group-region=us-central1 \
  --global

# Create URL map
gcloud compute url-maps create law-firm-lb \
  --default-service=law-firm-backend-service

# Create frontend for HTTPS
gcloud compute target-https-proxies create law-firm-https-proxy \
  --url-map=law-firm-lb \
  --ssl-certificates=law-firm-ssl

# Create forwarding rule
gcloud compute forwarding-rules create law-firm-https-rule \
  --global \
  --target-https-proxy=law-firm-https-proxy \
  --address=law-firm-ip \
  --ports=443

# Create HTTP to HTTPS redirect
gcloud compute url-maps create law-firm-http-redirect \
  --redirect-https-domain=example.com \
  --redirect-https-code=301

gcloud compute target-http-proxies create law-firm-http-proxy \
  --url-map=law-firm-http-redirect

gcloud compute forwarding-rules create law-firm-http-rule \
  --global \
  --target-http-proxy=law-firm-http-proxy \
  --address=law-firm-ip \
  --ports=80
```

## Step 12: Configure Cloud DNS

```bash
# Create DNS zone
gcloud dns managed-zones create law-firm-zone \
  --dns-name=example.com \
  --description="Law Firm Task Management DNS"

# Get nameservers
gcloud dns managed-zones describe law-firm-zone \
  --format="value(nameServers[*])"

# Create A record pointing to load balancer
gcloud dns record-sets create example.com \
  --rrdatas=<LOAD_BALANCER_IP> \
  --ttl=300 \
  --type=A \
  --zone=law-firm-zone

# Create www subdomain
gcloud dns record-sets create www.example.com \
  --rrdatas=example.com \
  --ttl=300 \
  --type=CNAME \
  --zone=law-firm-zone

# Create API subdomain
gcloud dns record-sets create api.example.com \
  --rrdatas=<LOAD_BALANCER_IP> \
  --ttl=300 \
  --type=A \
  --zone=law-firm-zone
```

## Step 13: Setup Cloud Monitoring and Logging

```bash
# Create alerting policy for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=<CHANNEL_ID> \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=300s

# Create dashboard
gcloud monitoring dashboards create --config-from-file=monitoring-dashboard.json

# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=law-firm-backend" \
  --limit=50 \
  --format=json

# Create log-based metrics
gcloud logging metrics create api_response_time \
  --description="API response time in milliseconds" \
  --log-filter='resource.type="cloud_run_revision" AND jsonPayload.duration=*'
```

## Step 14: Enable Cloud Trace and Profiler

```bash
# Install Cloud Trace agent in backend
npm install @google-cloud/trace-agent

# Install Cloud Profiler
npm install @google-cloud/profiler

# Initialize in server.js
require('@google-cloud/trace-agent').start();
require('@google-cloud/profiler').start();
```

## Step 15: Setup Backup and Disaster Recovery

```bash
# Enable Cloud SQL automated backups (already enabled)
gcloud sql backups describe law-firm-db \
  --instance=law-firm-db

# Create on-demand backup
gcloud sql backups create \
  --instance=law-firm-db

# Export database to Cloud Storage
gcloud sql export sql law-firm-db \
  gs://law-firm-backups-2026/backup-$(date +%Y%m%d-%H%M%S).sql

# Create restore point
gcloud sql backups create \
  --instance=law-firm-db \
  --description="Pre-release backup"
```

## Continuous Deployment Setup

```bash
# Create Cloud Build trigger
gcloud builds triggers create github \
  --name=law-firm-deploy \
  --repo-name=law-firm-task-management \
  --repo-owner=BGHUSSEINSASH \
  --branch-pattern="^master$" \
  --build-config=cloudbuild.yaml
```

**cloudbuild.yaml:**
```yaml
steps:
  # Build backend
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/law-firm/backend:$COMMIT_SHA'
      - './backend'

  # Push backend
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/law-firm/backend:$COMMIT_SHA'

  # Deploy backend
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - 'run'
      - '--filename=k8s/'
      - '--image=us-central1-docker.pkg.dev/$PROJECT_ID/law-firm/backend:$COMMIT_SHA'
      - '--location=us-central1'
      - '--cluster=law-firm-gke'

  # Build frontend
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/law-firm/frontend:$COMMIT_SHA'
      - './frontend'

  # Push frontend to Cloud Storage
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - 'run'
      - '--filename=frontend/'

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/law-firm/backend:$COMMIT_SHA'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/law-firm/frontend:$COMMIT_SHA'
```

## Cost Monitoring

```bash
# Enable Cloud Billing alerts
gcloud billing budgets create law-firm-budget \
  --billing-account=<BILLING_ACCOUNT_ID> \
  --display-name="Law Firm Monthly Budget" \
  --budget-amount=500 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100

# Get current billing
gcloud billing accounts describe <BILLING_ACCOUNT_ID>
```

## Estimated Monthly Costs

| Service | Configuration | Cost |
|---------|---------------|------|
| Cloud Run Backend | 512MB, 1 CPU, 100k requests | $20 |
| Cloud Run Frontend | 256MB, 0.5 CPU, 50k requests | $8 |
| Cloud SQL PostgreSQL | db-f1-micro, 10GB storage | $35 |
| Memorystore Redis | 1GB instance | $12 |
| Cloud CDN | 10GB transfer | $1 |
| Cloud Load Balancer | 1 LB, 100k requests | $20 |
| Cloud Monitoring | 200 custom metrics | $10 |
| Cloud Storage | 50GB storage | $1 |
| **TOTAL** | | **~$107/month** |

Lower than AWS ECS due to Cloud Run's pay-per-request model.

## Troubleshooting

### Cloud Run Service Not Starting
```bash
# View real-time logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50 --format=json --tail

# Check service status
gcloud run services describe law-firm-backend --region=us-central1
```

### Database Connection Issues
```bash
# Check Cloud SQL Auth Proxy
gcloud sql connect law-firm-db --user=postgres

# Test from Cloud Run
gcloud run services describe law-firm-backend --region=us-central1 --format='value(status.address.url)'
```

### High Latency
- Check Cloud Trace for slow requests
- Review Cloud Profiler for CPU hotspots
- Check Redis hit rate in Memorystore

