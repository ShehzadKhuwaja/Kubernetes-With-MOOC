# TodoApp Multi-Environment Architecture

## Overview

This document provides a high-level overview of the multi-environment Kubernetes setup for the TodoApp project.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                             │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    1.2/                                         │ │
│  │                                                                 │ │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐│ │
│  │  │   base/      │  │ overlays/staging │  │overlays/production││ │
│  │  │              │◄─│                  │  │                   ││ │
│  │  │ - manifests/ │  │ + LOG_ONLY=true  │  │ + Discord webhook││ │
│  │  │ - Persistent/│  │ - backup cronjob │  │ + backup cronjob ││ │
│  │  └──────────────┘  └──────────────────┘  └──────────────────┘│ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    argocd/                                      │ │
│  │                                                                 │ │
│  │  ┌──────────────────────┐  ┌───────────────────────────────┐ │ │
│  │  │ todoapp-staging.yaml │  │ todoapp-production.yaml       │ │ │
│  │  │ - target: main       │  │ - target: HEAD (tags)         │ │ │
│  │  │ - namespace: staging │  │ - namespace: production       │ │ │
│  │  └──────────────────────┘  └───────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌──────────────┐          ┌──────────────┐        ┌──────────────┐
│GitHub Actions│          │GitHub Actions│        │GitHub Actions│
│              │          │              │        │              │
│Commit to main│          │  Component   │        │ Push Tag     │
│              │          │   Builds     │        │  v*.*.*      │
└──────┬───────┘          └──────┬───────┘        └──────┬───────┘
       │                         │                       │
       │ Triggers                │ Build & Tag           │ Triggers
       │                         │                       │
       ▼                         ▼                       ▼
┌──────────────┐          ┌──────────────┐        ┌──────────────┐
│Build Images  │          │Docker Images │        │Update Images │
│Update Staging│          │To DockerHub  │        │In Production │
│Kustomization │          │              │        │Kustomization │
└──────┬───────┘          └──────┬───────┘        └──────┬───────┘
       │                         │                       │
       │                         │                       │
       └─────────────────────────┼───────────────────────┘
                                 │
                                 │ ArgoCD Monitors Repository
                                 │
                    ┌────────────▼────────────┐
                    │                         │
                    │   ArgoCD Controller     │
                    │                         │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
                ▼                                 ▼
    ┌─────────────────────┐         ┌─────────────────────┐
    │ Staging Namespace   │         │Production Namespace │
    │                     │         │                     │
    │ ┌─────────────────┐ │         │ ┌─────────────────┐ │
    │ │ Broadcaster     │ │         │ │ Broadcaster     │ │
    │ │ LOG_ONLY=true   │ │         │ │ Discord Webhook │ │
    │ └─────────────────┘ │         │ └─────────────────┘ │
    │ ┌─────────────────┐ │         │ ┌─────────────────┐ │
    │ │ Frontend        │ │         │ │ Frontend        │ │
    │ └─────────────────┘ │         │ └─────────────────┘ │
    │ ┌─────────────────┐ │         │ ┌─────────────────┐ │
    │ │ Backend         │ │         │ │ Backend         │ │
    │ └─────────────────┘ │         │ └─────────────────┘ │
    │ ┌─────────────────┐ │         │ ┌─────────────────┐ │
    │ │ Backend-Todos   │ │         │ │ Backend-Todos   │ │
    │ └─────────────────┘ │         │ └─────────────────┘ │
    │ ┌─────────────────┐ │         │ ┌─────────────────┐ │
    │ │ PostgreSQL      │ │         │ │ PostgreSQL      │ │
    │ └─────────────────┘ │         │ └─────────────────┘ │
    │ ┌─────────────────┐ │         │ ┌─────────────────┐ │
    │ │ Todo CronJob    │ │         │ │ Todo CronJob    │ │
    │ └─────────────────┘ │         │ └─────────────────┘ │
    │                     │         │ ┌─────────────────┐ │
    │                     │         │ │ Backup CronJob  │ │
    │ ❌ No Backups       │         │ └─────────────────┘ │
    └─────────────────────┘         └─────────────────────┘
```

## Deployment Flow

### Staging Deployment (Continuous)

1. Developer commits code to `main` branch
2. GitHub Actions triggers component build workflows
3. Docker images are built and tagged with commit SHA
4. Workflows update `1.2/overlays/staging/kustomization.yaml`
5. ArgoCD detects the change in the repository
6. ArgoCD syncs the new configuration to staging namespace
7. Staging environment is updated automatically

### Production Deployment (Tag-based)

1. Developer creates a Git tag (e.g., `v1.0.0`)
2. GitHub Actions triggers production deployment workflow
3. Workflow updates all images in `1.2/overlays/production/kustomization.yaml`
4. ArgoCD detects the change in the repository
5. ArgoCD syncs the new configuration to production namespace
6. Production environment is updated automatically

## Component Structure

### Base Layer
- Contains all common Kubernetes manifests
- Shared by both staging and production
- Includes: deployments, services, configmaps, statefulsets, cronjobs

### Overlay Layers
- **Staging**: Patches for development/testing environment
  - Broadcaster in LOG_ONLY mode
  - No backup cronjob
  
- **Production**: Configuration for live environment
  - Broadcaster with Discord integration
  - Backup cronjob enabled

## Key Features

### GitOps Workflow
- All configuration stored in Git
- ArgoCD ensures cluster state matches Git state
- Automatic drift detection and correction
- Complete audit trail of changes

### Environment Isolation
- Separate Kubernetes namespaces
- Independent secrets management
- Different configuration per environment
- No cross-environment dependencies

### Automated Deployments
- Continuous delivery to staging
- Controlled releases to production
- Image versioning via Git SHA
- Tag-based production releases

## Security Considerations

1. **Secrets**: Managed outside of ArgoCD
2. **RBAC**: Namespace-level isolation
3. **Image Security**: All images from trusted registry
4. **Network Policies**: Can be added per environment

## Monitoring Points

- **ArgoCD**: Application sync status
- **GitHub Actions**: Build and deployment logs
- **Kubernetes**: Pod status and logs
- **Broadcaster**: Staging logs vs Production Discord messages
- **CronJobs**: Backup execution in production

## Rollback Strategy

1. **Staging**: Revert commit on main branch
2. **Production**: 
   - Option 1: Push previous tag
   - Option 2: Use ArgoCD rollback feature
   - Option 3: Update production overlay to previous SHA

## Future Enhancements

- Add resource quotas per namespace
- Implement network policies
- Add monitoring and alerting (Prometheus/Grafana)
- Implement canary deployments for production
- Add automated testing in staging
- Implement branch-based preview environments
