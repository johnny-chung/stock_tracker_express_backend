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

## CI/CD (Docker Hub)

GitHub Action workflow `express_backend/.github/workflows/docker-publish.yml` builds and pushes the image when you push to `main`.

Required repository secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_PASSWORD`

The image will be tagged under `${DOCKERHUB_USERNAME}/stock-tracker-express-backend`.
