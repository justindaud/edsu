# Edsu House

Monorepo for the public site + admin UI + backend API.

## Structure

- `frontend/` — Next.js app for public + admin (`/app/(public)` and `/app/admin`)
- `backend/` — Node/Express API
- `docker-compose.yml` — local/dev stack (frontend + backend)

## Local dev (without Docker)

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Docker (local)

```bash
docker compose up -d --build
```

## Environment

Environment files live in:

- `backend/.env.local`
  Required keys (example):
  ```
  MINIO_ENDPOINT=
  MINIO_PORT=
  MINIO_USE_SSL=
  MINIO_ACCESS_KEY=
  MINIO_SECRET_KEY=
  MINIO_BUCKET=
  MINIO_PUBLIC_URL=
  IMGPROXY_URL=

  DB_HOST=
  DB_PORT=
  DB_USER=
  DB_PASSWORD=
  DB_NAME=
  DATABASE_URL=
  ```

- `frontend/.env.local`
  Required keys (example):
  ```
  NEXTAUTH_SECRET=
  JWT_SECRET=
  NEXTAUTH_URL=
  NEXT_PUBLIC_API_URL=
  ```

## Notes

- CORS config lives in `backend/src/index.ts`.
- MinIO client + bucket settings live in `backend/src/lib/minio.ts`.
- Image host allowlist is `remotePatterns` in `frontend/next.config.ts`.
