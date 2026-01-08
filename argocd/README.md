# ArgoCD Application Manifests

This directory contains ArgoCD Application resources for the TodoApp project.

## Applications

### todoapp-staging.yaml
- **Purpose**: Manages the staging environment deployment
- **Target Namespace**: `staging`
- **Source Branch**: `main`
- **Sync Policy**: Automatic with prune and self-heal enabled
- **Updates**: Triggered on every commit to `main` branch

### todoapp-production.yaml
- **Purpose**: Manages the production environment deployment
- **Target Namespace**: `production`
- **Source Branch**: `HEAD` (follows tags)
- **Sync Policy**: Automatic with prune and self-heal enabled
- **Updates**: Triggered when Git tags are pushed

## Installation

To deploy these ArgoCD applications to your cluster:

```bash
# Apply both applications
kubectl apply -f argocd/

# Or apply individually
kubectl apply -f argocd/todoapp-staging.yaml
kubectl apply -f argocd/todoapp-production.yaml
```

## Prerequisites

1. ArgoCD must be installed in your cluster
2. The `argocd` namespace must exist
3. ArgoCD must have access to the GitHub repository

## Verification

Check the status of the applications:

```bash
# List all ArgoCD applications
kubectl get applications -n argocd

# Get detailed status
kubectl describe application todoapp-staging -n argocd
kubectl describe application todoapp-production -n argocd
```

Or use the ArgoCD UI:
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Then navigate to https://localhost:8080

## Configuration Notes

### Automated Sync
Both applications are configured with automated sync policies:
- `prune: true` - Removes resources that are no longer defined in Git
- `selfHeal: true` - Automatically syncs when drift is detected
- `CreateNamespace: true` - Automatically creates the target namespace if it doesn't exist

### Sync Behavior

**Staging**: 
- Monitors the `main` branch
- Syncs immediately when GitHub Actions updates `1.2/overlays/staging/kustomization.yaml`

**Production**:
- Uses `HEAD` as target revision
- For tag-based deployments, you may want to configure webhook notifications or adjust the sync frequency

## Troubleshooting

### Application Not Syncing

Check ArgoCD sync status:
```bash
argocd app get todoapp-staging
argocd app sync todoapp-staging --force
```

### Repository Access Issues

Verify ArgoCD can access the repository:
```bash
argocd repo list
```

If not configured, add the repository:
```bash
argocd repo add https://github.com/ShehzadKhuwaja/Kubernetes-With-MOOC.git
```

### Namespace Issues

Ensure namespaces exist:
```bash
kubectl get namespace staging
kubectl get namespace production
```

If not, create them:
```bash
kubectl create namespace staging
kubectl create namespace production
```
