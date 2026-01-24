# Service Observability Platform - Docker Setup Guide

## Docker Compose (Local Development)

### Quick Start
```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** on port 5432
- **Backend (FastAPI)** on port 8000
- **Frontend (React)** on port 3000

### Environment Variables
Create a `.env` file in the root directory:
```
DB_NAME=observability
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
```

### Access the Application
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Database: localhost:5432

### Useful Commands
```bash
# Stop all services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v

# View logs
docker-compose logs -f

# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend
```

---

## Fly.io Deployment

### Prerequisites
1. Install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/
2. Create a Fly account and authenticate: `flyctl auth login`
3. Set up a PostgreSQL database on Fly.io

### Setup PostgreSQL on Fly.io
```bash
flyctl postgres create --name observability-db
flyctl postgres attach observability-db
```

### Deploy
```bash
# Create app (first time)
flyctl launch

# Deploy updates
flyctl deploy
```

### Environment Variables
```bash
flyctl secrets set JWT_SECRET=your-production-secret
flyctl secrets set JWT_ALGORITHM=HS256
flyctl secrets set JWT_EXPIRATION_HOURS=24
```

### Monitor
```bash
# View logs
flyctl logs

# Check app status
flyctl status

# SSH into running instance
flyctl ssh console
```

---

## Production Dockerfile Recommendations

For production, update the backend Dockerfile to:
1. Use multi-stage builds
2. Remove `--reload` flag
3. Use a production ASGI server (Gunicorn + Uvicorn)

Example production Dockerfile:
```dockerfile
FROM python:3.12-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
COPY . .
EXPOSE 8000
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "main:app"]
```

---

## Frontend Production Build

For production React build:
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```
