# Deployment Guide for Multi-Environment TodoApp

## Quick Start

### Prerequisites
- ArgoCD installed in your Kubernetes cluster
- Repository access configured in ArgoCD
- Secrets pre-applied to namespaces (see Secrets section)

### Initial Setup

1. **Deploy ArgoCD Applications**
   ```bash
   kubectl apply -f argocd/
   ```

2. **Verify Applications**
   ```bash
   kubectl get applications -n argocd
   ```

## Deployment Workflows

### Deploying to Staging

**Automatic deployment on every push to `main` branch:**

```bash
# Make your changes
git add .
git commit -m "Your changes"
git push origin main
```

**What happens:**
1. GitHub Actions builds Docker images tagged with commit SHA
2. Workflow updates `1.2/overlays/staging/kustomization.yaml`
3. ArgoCD detects change and syncs to staging namespace
4. New version is live in staging

### Deploying to Production

**Manual tag-based deployment:**

```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0
```

**What happens:**
1. Production deployment workflow triggers
2. All images in `1.2/overlays/production/kustomization.yaml` are updated to commit SHA
3. ArgoCD detects change and syncs to production namespace
4. New version is live in production

## Environment Differences

### Staging Environment
- **Namespace**: `staging`
- **Broadcaster**: Logs messages to console (LOG_ONLY=true)
- **Database Backups**: Disabled
- **Purpose**: Testing and validation before production

### Production Environment
- **Namespace**: `production`
- **Broadcaster**: Sends messages to Discord webhook
- **Database Backups**: Enabled (every 5 minutes)
- **Purpose**: Live application serving users

## Secrets Management

### Required Secrets

#### Staging Namespace
```bash
kubectl create namespace staging

# Database secret
kubectl create secret generic todo-secret \
  --from-literal=PGPASSWORD=your-password \
  -n staging
```

#### Production Namespace
```bash
kubectl create namespace production

# Database secret
kubectl create secret generic todo-secret \
  --from-literal=PGPASSWORD=your-password \
  -n production

# Discord webhook secret
kubectl create secret generic discord-webhook \
  --from-literal=url=https://discord.com/api/webhooks/... \
  -n production

# GCS backup secret (if using GCS backups)
kubectl create secret generic gcs-backup-secret \
  --from-file=service-account.json=path/to/key.json \
  -n production
```

## Monitoring and Troubleshooting

### Check Deployment Status

```bash
# Staging
kubectl get all -n staging
kubectl get pods -n staging

# Production
kubectl get all -n production
kubectl get pods -n production
```

### View Broadcaster Logs

```bash
# Staging (should show log messages)
kubectl logs -n staging -l app=broadcaster --tail=50

# Production (should show Discord webhook activity)
kubectl logs -n production -l app=broadcaster --tail=50
```

### ArgoCD Sync Issues

```bash
# Check application status
kubectl describe application todoapp-staging -n argocd
kubectl describe application todoapp-production -n argocd

# Force sync if needed
argocd app sync todoapp-staging
argocd app sync todoapp-production
```

### Rollback

To rollback a production deployment:

1. Find the previous working tag
2. Update production overlay to use the previous image tags
3. Commit and push the change

Or use ArgoCD history:
```bash
argocd app rollback todoapp-production
```

## Testing Locally

Build and validate overlays before committing:

```bash
# Test staging
kustomize build 1.2/overlays/staging | kubectl apply --dry-run=client -f -

# Test production
kustomize build 1.2/overlays/production | kubectl apply --dry-run=client -f -
```

## Component Updates

Each component has its own build workflow:

- **broadcaster**: `.github/workflows/broadcaster-build.yaml`
- **frontend**: `.github/workflows/frontend-build.yaml`
- **backend**: `.github/workflows/backend-imageapi-build.yaml`
- **backend-todos**: `.github/workflows/backend-todos-build.yaml`
- **cronjob**: `.github/workflows/cronjob-build.yaml`

When you modify a component, the workflow:
1. Builds the Docker image
2. Tags it with commit SHA
3. Updates staging overlay
4. Commits the change back to the repository

## Best Practices

1. **Always test in staging first**
   - Push to main branch
   - Validate in staging namespace
   - Only tag for production when staging is stable

2. **Use semantic versioning for tags**
   - Format: `v<major>.<minor>.<patch>`
   - Example: `v1.0.0`, `v1.0.1`, `v2.0.0`

3. **Monitor logs after deployment**
   - Check pod status
   - Review broadcaster logs
   - Verify application functionality

4. **Keep secrets separate**
   - Never commit secrets to Git
   - Manage secrets outside of ArgoCD
   - Rotate secrets regularly

## Troubleshooting Common Issues

### "Image pull failed"
- Ensure Docker images were built successfully
- Check image tags in kustomization.yaml
- Verify DockerHub credentials

### "ArgoCD not syncing"
- Check ArgoCD has repository access
- Verify network policies allow ArgoCD to pull
- Check ArgoCD sync policy settings

### "Broadcaster not working in staging"
- Verify LOG_ONLY environment variable is set
- Check NATS connection in logs
- Ensure broadcaster pod is running

### "Backups not running in production"
- Verify gcs-backup-secret exists
- Check CronJob schedule
- Review backup pod logs

## Architecture Diagram

```
GitHub Repository (main branch)
    │
    ├─→ Commit to main
    │   └─→ Build Workflows (staging)
    │       └─→ Update 1.2/overlays/staging/kustomization.yaml
    │           └─→ ArgoCD syncs to staging namespace
    │
    └─→ Push tag (v*.*.*)
        └─→ Production Deploy Workflow
            └─→ Update 1.2/overlays/production/kustomization.yaml
                └─→ ArgoCD syncs to production namespace
```
