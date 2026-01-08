# Multi-Environment TodoApp Setup

This document describes the multi-environment Kubernetes setup for the TodoApp project using Kustomize and ArgoCD.

## Architecture Overview

The project is organized into two separate environments:
- **Staging**: Deployed to the `staging` namespace
- **Production**: Deployed to the `production` namespace

## Directory Structure

```
1.2/
├── base/                          # Base Kubernetes manifests
│   ├── manifests/                 # All resource definitions
│   ├── Persistent/                # PVC definitions
│   └── kustomization.yaml         # Base kustomization
├── overlays/
│   ├── staging/                   # Staging environment overlay
│   │   └── kustomization.yaml
│   └── production/                # Production environment overlay
│       └── kustomization.yaml
```

## Environment-Specific Configurations

### Staging Environment

The staging environment has the following specific configurations:

1. **Broadcaster Logging Mode**
   - The broadcaster component logs all messages instead of forwarding to Discord
   - Achieved via `LOG_ONLY=true` environment variable
   
2. **No Database Backups**
   - The `postgres-gcs-backup` CronJob is excluded from staging
   - Only the `wikipedia-todo-generator` CronJob runs in staging

### Production Environment

The production environment includes:

1. **Broadcaster Discord Integration**
   - Messages are forwarded to Discord webhook
   - Requires `discord-webhook` secret (managed outside ArgoCD)

2. **Database Backups**
   - The `postgres-gcs-backup` CronJob runs every 5 minutes
   - Requires `gcs-backup-secret` (managed outside ArgoCD)

## Deployment Automation

### Continuous Deployment to Staging

- **Trigger**: Every commit to the `main` branch
- **Process**: 
  1. GitHub Actions builds and pushes Docker images tagged with commit SHA
  2. Updates `1.2/overlays/staging/kustomization.yaml` with new image tags
  3. ArgoCD automatically syncs changes to the staging namespace

### Tagged Releases to Production

- **Trigger**: Pushing a Git tag (format: `v*.*.*`, e.g., `v1.0.0`)
- **Process**:
  1. The `production-deploy.yaml` workflow updates all images in production overlay
  2. Updates `1.2/overlays/production/kustomization.yaml` with tagged commit SHA
  3. ArgoCD automatically syncs changes to the production namespace

## ArgoCD Applications

Two ArgoCD Application resources are defined in the `argocd/` directory:

### Staging Application (`todoapp-staging.yaml`)
```yaml
targetRevision: main
path: 1.2/overlays/staging
namespace: staging
syncPolicy:
  automated:
    prune: true
    selfHeal: true
```

### Production Application (`todoapp-production.yaml`)
```yaml
targetRevision: HEAD
path: 1.2/overlays/production
namespace: production
syncPolicy:
  automated:
    prune: true
    selfHeal: true
```

## Secrets Management

Secrets are managed outside of ArgoCD and must be applied manually:

### Staging Namespace
- No secrets required (broadcaster runs in LOG_ONLY mode)
- `todo-secret` (for database credentials)

### Production Namespace
- `discord-webhook` - Discord webhook URL for broadcaster
- `todo-secret` - Database credentials
- `gcs-backup-secret` - Google Cloud Storage credentials for backups

Apply secrets with:
```bash
kubectl apply -f secrets.yaml -n staging
kubectl apply -f secrets.yaml -n production
```

## Usage

### Deploying to Staging

Commit and push to the `main` branch:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

The GitHub Actions workflows will automatically build, tag, and update the staging overlay.

### Deploying to Production

Create and push a tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

The production deployment workflow will update all images in the production overlay.

### Manual Kustomize Build

Test the overlays locally:
```bash
# Staging
kustomize build 1.2/overlays/staging

# Production
kustomize build 1.2/overlays/production
```

### Applying ArgoCD Applications

Deploy the ArgoCD applications:
```bash
kubectl apply -f argocd/todoapp-staging.yaml
kubectl apply -f argocd/todoapp-production.yaml
```

## Component Workflows

The following GitHub Actions workflows handle component builds:

- `broadcaster-build.yaml` - Broadcaster service
- `frontend-build.yaml` - Frontend application
- `backend-imageapi-build.yaml` - Backend image API
- `backend-todos-build.yaml` - Backend todos service
- `cronjob-build.yaml` - Wikipedia todo generator
- `production-deploy.yaml` - Production deployments (tag-triggered)

All workflows update the staging overlay by default. Production updates occur only on tagged releases.

## Monitoring

After deployment, verify the resources:

```bash
# Check staging
kubectl get all -n staging
kubectl logs -n staging deployment/broadcaster

# Check production
kubectl get all -n production
kubectl logs -n production deployment/broadcaster
```

## Troubleshooting

### ArgoCD Sync Issues

Check ArgoCD application status:
```bash
kubectl get applications -n argocd
kubectl describe application todoapp-staging -n argocd
kubectl describe application todoapp-production -n argocd
```

### Broadcaster Logs

Verify broadcaster behavior:
```bash
# Staging (should show log messages)
kubectl logs -n staging -l app=broadcaster

# Production (should show Discord webhook calls)
kubectl logs -n production -l app=broadcaster
```

### Missing Secrets

Ensure secrets are applied:
```bash
kubectl get secrets -n staging
kubectl get secrets -n production
```
