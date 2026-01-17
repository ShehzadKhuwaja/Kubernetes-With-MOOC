# TodoApp - Application Code

This repository contains the application source code for the TodoApp project. 

## Structure

```
1.2/
├── broadcaster/          # Message broadcaster service
├── frontend/            # React frontend application
├── backend/             # Backend image API service
├── backend-todos/       # Backend todos service
├── jobs/                # CronJob for Wikipedia todo generation
└── postgres_backup/     # Database backup scripts
```

## Configuration Repository

Kubernetes manifests and configurations are maintained in a separate repository: 
[Kubernetes-With-MOOC-config](https://github.com/ShehzadKhuwaja/Kubernetes-With-MOOC-config)

## CI/CD Pipeline

### Continuous Deployment to Staging

When you push to the `main` branch:

1. GitHub Actions builds Docker images for changed components
2. Images are tagged with the commit SHA
3. The configuration repository is automatically updated
4. ArgoCD syncs the changes to the staging namespace

### Tagged Releases to Production

To deploy to production:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers: 
1. All images are tagged with the release commit SHA
2. Production overlay in config repository is updated
3. ArgoCD syncs to production namespace

## Development Workflow

### 1. Make Changes

Edit your application code in the respective component directory.

### 2. Test Locally

Build and test Docker images locally:

```bash
cd 1.2/broadcaster
docker build -t broadcaster:test .
docker run broadcaster:test
```

### 3.  Commit and Push

```bash
git add .
git commit -m "Add new feature"
git push origin main
```

GitHub Actions will automatically: 
- Build the Docker image
- Push to Docker Hub
- Update staging configuration
- Trigger ArgoCD deployment

### 4. Verify in Staging

```bash
kubectl get pods -n staging
kubectl logs -n staging deployment/broadcaster
```

### 5. Promote to Production

When ready: 

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Component Details

### Broadcaster
- **Path**: `1.2/broadcaster/`
- **Image**: `shehzadkhuwaja/broadcaster`
- **Purpose**: Broadcasts messages to Discord or logs them

### Frontend
- **Path**:  `1.2/frontend/`
- **Image**: `shehzadkhuwaja/frontend`
- **Purpose**: React-based user interface

### Backend ImageAPI
- **Path**: `1.2/backend/`
- **Image**: `shehzadkhuwaja/backend-imageapi`
- **Purpose**: Handles image operations

### Backend Todos
- **Path**: `1.2/backend-todos/`
- **Image**: `shehzadkhuwaja/backend-todos`
- **Purpose**: Manages todo items

### Wikipedia Todo Generator
- **Path**:  `1.2/jobs/`
- **Image**: `shehzadkhuwaja/wikipedia-todo-generator`
- **Purpose**: CronJob that generates todos from Wikipedia

## Required Secrets

### GitHub Repository Secrets

Set these in your GitHub repository settings:

- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password or access token
- `CONFIG_REPO_TOKEN` - GitHub Personal Access Token with `repo` and `workflow` permissions

## Monitoring

View builds in GitHub Actions:
- Go to the "Actions" tab in this repository
- Monitor individual workflow runs
- Check for failures or errors

## Troubleshooting

### Build Failures

Check the GitHub Actions logs: 
1. Go to Actions tab
2. Click on the failed workflow
3. Review the logs for errors

### Image Not Updating

Verify: 
1. Workflow completed successfully
2. Image was pushed to Docker Hub
3. Config repository was updated
4. ArgoCD synced the changes

```bash
# Check config repo
cd ../Kubernetes-With-MOOC-config
git pull
cat overlays/staging/kustomization.yaml

# Check ArgoCD
kubectl get applications -n argocd
```

## Links

- [Configuration Repository](https://github.com/ShehzadKhuwaja/Kubernetes-With-MOOC-config)
- [Docker Hub Organization](https://hub.docker.com/u/shehzadkhuwaja)