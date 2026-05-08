# Kubernetes Deployment for SecureVote

This directory contains the Kubernetes manifests required to deploy the application on a Kubernetes cluster.

## Deployment Steps

1. **Build the Docker Image:**
   Make sure you are at the root of the project where the `Dockerfile` is located.
   ```bash
   docker build -t securevote-frontend:latest .
   ```

2. **Apply Namespace:**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

3. **Apply ConfigMap:**
   ```bash
   kubectl apply -f k8s/configmap.yaml
   ```

4. **Deploy Application:**
   ```bash
   kubectl apply -f k8s/frontend-deployment.yaml
   ```

5. **Expose Service:**
   ```bash
   kubectl apply -f k8s/frontend-service.yaml
   ```

6. **Verify Deployment:**
   ```bash
   kubectl get pods -n voting-app
   kubectl get services -n voting-app
   ```
