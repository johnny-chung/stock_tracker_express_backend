# Express Backend

Simple Node.js + Express service that exposes stock tracker data from MongoDB Atlas.

## Endpoints

- `GET /health` — Health check.
- `GET /api/bars` — Latest 10 documents from `bars` collection.
- `GET /api/signals` — Latest 10 documents from `signals` collection.
- `GET /api/events` — Latest 10 documents from `events` collection.

Sorting uses `_id` descending to approximate newest inserts. If you prefer time-based sorting, ensure your docs include a `timestamp` and adjust the query.

## Local setup

1. Create `.env` in `express_backend` based on `.env.example`:

```
MONGO_URI=your-mongodb-connection-string
MONGO_DB=your-db-name
PORT=3001
```

2. Install and run:

```bash
cd express_backend
npm install
npm start
```

Visit `http://localhost:3001/health`.

## Docker

Build and run locally:

```bash
cd express_backend
docker build -t stock-tracker-express-backend:local .
docker run -p 3001:3001 --env-file .env stock-tracker-express-backend:local
```

## Kubernetes

Kustomize base is under `infra/k8s`.

- Namespace: `stock-tracker`
- Deployment + Service: `expo_api_backend_depl.yaml`
- Secrets expected: `express-backend-secrets` with keys `MONGO_URI` and `MONGO_DB`.

Apply:

```bash
kubectl apply -k express_backend/infra/k8s
```

## Argo CD + k3s quick scripts

If you're running k3s on your server and using Argo CD for GitOps, these helper scripts and manifests are available in `deploy/infra`.

### Get Argo CD admin password

- Script: `deploy/infra/scripts/get-argocd-password.sh`

```bash
# Prints username and password for first login
bash deploy/infra/scripts/get-argocd-password.sh
```

Notes:

- Requires `kubectl` context pointing at your k3s cluster.
- Argo CD must be installed in the `argocd` namespace.
- If the initial secret no longer exists, reset the password via the Argo CD CLI.

### Expose Argo CD web UI locally

Option A — Port-forward (quickest):

```bash
# Forwards https (443) on the argocd-server svc to localhost:8080
bash deploy/infra/scripts/argocd-port-forward.sh
# Open https://localhost:8080 (browser will warn due to self-signed cert)
```

Option B — Ingress (permanent, via Traefik in k3s):

```bash
# Apply Ingress resource (default host: argocd.local)
kubectl apply -f deploy/infra/argocd/ingress.yaml

# Add DNS entry on your machine (Windows hosts file) mapping argocd.local to your server IP
# Then open: https://argocd.local
```

If you want TLS, configure cert-manager or Traefik ACME and uncomment TLS parts in `deploy/infra/argocd/ingress.yaml`.

### Use a locally built Docker image with k3s and Argo CD

Argo CD pulls images from registries that your k3s nodes can reach. Choose one of the paths below.

Option 1 — Push to a reachable registry (recommended):

```bash
# Build and push to your registry (Docker Hub, GHCR, or a local registry)
IMAGE_NAME=registry.local:5000/express-backend \
IMAGE_TAG=latest \
CONTEXT_DIR=./express_backend \
bash deploy/infra/scripts/build-and-push-to-k3s-registry.sh

# Update your k8s deployment to use image "registry.local:5000/express-backend:latest"
kubectl apply -k express_backend/infra/k8s
```

To use a private/local registry with k3s, configure containerd mirrors on the server:

```bash
# On the k3s server:
sudo mkdir -p /etc/rancher/k3s
sudo cp deploy/infra/k3s/registries-example.yaml /etc/rancher/k3s/registries.yaml
sudo systemctl restart k3s
```

Option 2 — Load image directly into k3s containerd (no registry):

```bash
# On your dev machine
docker build -t express-backend:latest ./express_backend
docker save express-backend:latest -o express-backend.tar
scp express-backend.tar user@<k3s-server>:/tmp/

# On the k3s server
IMAGE_TAR=/tmp/express-backend.tar bash /path/to/repo/deploy/infra/scripts/load-image-into-k3s.sh

# Update your deployment to reference image "express-backend:latest"
kubectl apply -k express_backend/infra/k8s
```

Tips:

- Set `imagePullPolicy: IfNotPresent` on your deployment when loading images directly into node containerd.
- Argo CD only reconciles Kubernetes manifests; it won't "load" images itself.
- Prefer a registry for multi-node clusters or CI workflows.

## CI/CD (Docker Hub)

GitHub Action workflow `express_backend/.github/workflows/docker-publish.yml` builds and pushes the image when you push to `main`.

Required repository secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_PASSWORD`

The image will be tagged under `${DOCKERHUB_USERNAME}/stock-tracker-express-backend`.
