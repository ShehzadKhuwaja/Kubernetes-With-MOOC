# DummySite Controller

A Kubernetes controller that creates HTML copies of websites using Custom Resource Definitions (CRDs).

## Architecture

The controller watches for `DummySite` custom resources and automatically creates:
- **ConfigMap**: Stores the fetched HTML content
- **Deployment**: Runs nginx to serve the content
- **Service**: Exposes the deployment
- **Ingress**: Makes the site accessible

## Prerequisites

- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl configured
- Docker (for building the controller image)

## Setup Instructions

### 1. Build and Push Controller Image

```bash
# Build the Docker image
docker build -t shehzadkhuwaja/dummysite-controller:latest .

# Push to Docker Hub (or your registry)
docker push shehzadkhuwaja/dummysite-controller:latest
```

### 2. Apply Kubernetes Resources

```bash
# Apply in this order:
kubectl apply -f dummysite-crd.yaml
kubectl apply -f rbac.yaml
kubectl apply -f controller-deployment.yaml
```

### 3. Verify Controller is Running

```bash
kubectl get pods -l app=dummysite-controller
kubectl logs -f deployment/dummysite-controller
```

### 4. Create a DummySite

```bash
# Create example.com site
kubectl apply -f example-dummysite.yaml

# Or create Wikipedia Kubernetes page
kubectl apply -f wikipedia-dummysite.yaml
```

### 5. Check Status

```bash
# List all DummySites
kubectl get dummysites

# Get detailed information
kubectl describe dummysite example-site

# Check created resources
kubectl get deployments,services,ingress,configmaps -l managed-by=dummysite-controller
```

### 6. Access the Site

```bash
# If using minikube
minikube service example-site

# Or port-forward
kubectl port-forward service/example-site 8080:80

# Then open: http://localhost:8080
```

## Testing Workflow

The controller should work with this workflow:

1. **Apply RBAC**:
   ```bash
   kubectl apply -f rbac.yaml
   ```

2. **Apply Deployment**:
   ```bash
   kubectl apply -f controller-deployment.yaml
   ```

3. **Apply DummySite**:
   ```bash
   kubectl apply -f example-dummysite.yaml
   ```

4. **Verify**:
   ```bash
   # Check if resources are created
   kubectl get all -l app=example-site
   
   # Access the site
   kubectl port-forward service/example-site 8080:80
   # Open http://localhost:8080 in browser
   ```

## Troubleshooting

### Controller not starting
```bash
kubectl logs deployment/dummysite-controller
kubectl describe pod -l app=dummysite-controller
```

### DummySite not processing
```bash
kubectl describe dummysite example-site
kubectl logs deployment/dummysite-controller
```

### Can't access the site
```bash
kubectl get service example-site
kubectl get endpoints example-site
kubectl port-forward service/example-site 8080:80
```

## Cleanup

```bash
# Delete DummySites
kubectl delete dummysite --all

# Delete controller
kubectl delete -f controller-deployment.yaml

# Delete RBAC
kubectl delete -f rbac.yaml

# Delete CRD (this removes all DummySite resources)
kubectl delete -f dummysite-crd.yaml
```

## Example DummySites

```yaml
# Simple example
apiVersion: stable.example.com/v1
kind: DummySite
metadata:
  name: google
spec:
  website_url: "https://www.google.com"
```

```yaml
# GitHub
apiVersion: stable.example.com/v1
kind: DummySite
metadata:
  name: github
spec:
  website_url: "https://github.com"
```

## Implementation Notes

- The controller uses the official Kubernetes JavaScript client library
- Fetched content is stored in a ConfigMap
- CSS and external resources might not work perfectly (as expected)
- The controller handles basic error cases
- Status updates show the processing phase

## Future Improvements

- Add resource cleanup when DummySite is deleted
- Support for updating existing sites when URL changes
- Better handling of large websites
- Resource limits and quotas
- Multi-namespace support