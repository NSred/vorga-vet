# VorgaVet frontend

React and TypeScript frontend for the VorgaVet veterinary clinic application.

## Local development

Copy `.env.example` to `.env`, then install dependencies and start Vite:

```powershell
npm install
npm run dev
```

## Checks

```powershell
npm run build
npm run lint
npm run format:check
```

## Docker

The frontend is included in the repository's root Compose stack. From the repository root:

```powershell
docker compose up --build -d
```

Open http://localhost:5173. The production frontend container serves the Vite build with
Nginx and proxies `/api` requests to the API container.

To build only the frontend image:

```powershell
docker build --build-arg VITE_API_BASE_URL=/api -t vorga-vet-frontend ./frontend
```
