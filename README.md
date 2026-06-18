# KIS-TRELLO

A Trello-style Kanban application with workspaces, real-time board sync, email notifications, and AWS deployment.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, @dnd-kit, TanStack Query |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Alembic, Poetry |
| Database | PostgreSQL 16 |
| Cache / pub-sub | Redis 7 |
| Cloud | AWS (RDS, ECS Fargate, S3, CloudFront, ElastiCache, SES) |

## Features

- Email/password authentication with JWT access + refresh tokens
- Workspaces with team members and invite links
- Kanban boards with lists, cards, drag-and-drop
- Card details: description, assignee, due date, comments
- File attachments via S3 presigned URLs
- Board visibility: private, team, public
- Real-time board updates via WebSockets + Redis pub/sub
- Configurable email notification preferences

## Quick start (local)

### Prerequisites

- Docker & Docker Compose
- Poetry 2.x
- Node.js 20+

### 1. Start infrastructure

```bash
cd infra
docker compose up -d postgres redis
```

### 2. Backend

```bash
cd backend
cp .env.example .env
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

### Full stack with Docker

```bash
cd infra
docker compose up --build
```

## Project structure

```
KIS-TRELLO/
├── backend/          # FastAPI API (Poetry)
├── frontend/         # React SPA (Vite)
├── infra/            # docker-compose + Terraform
└── .github/workflows # CI/CD
```

## API overview

| Area | Prefix |
|------|--------|
| Auth | `/api/v1/auth` |
| Workspaces | `/api/v1/workspaces` |
| Boards | `/api/v1/boards` |
| WebSocket | `/ws/boards/{board_id}?token=...` |

## AWS deployment

Terraform modules live in `infra/terraform/`. Configure variables and apply:

```bash
cd infra/terraform
terraform init
terraform plan -var="database_password=..." -var="jwt_secret=..."
terraform apply
```

GitHub Actions (`.github/workflows/ci.yml`) runs tests on PRs and deploys to ECS + S3/CloudFront on push to `main`.

Required secrets: `AWS_DEPLOY_ROLE_ARN`, `FRONTEND_S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`

## Testing

```bash
# Backend
cd backend && poetry run pytest

# Frontend
cd frontend && npm run build
```
