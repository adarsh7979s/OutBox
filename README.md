# 📬 OutBox — Distributed Email Job Scheduler

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![BullMQ](https://img.shields.io/badge/BullMQ-5.8-red.svg)](https://docs.bullmq.io/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg?logo=redis)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg?logo=postgresql)](https://www.postgresql.org/)
[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-8.13-yellow.svg?logo=elasticsearch)](https://www.elastic.co/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live_Demo-out--box--frontend--gamma.vercel.app-000000.svg?logo=vercel)](https://out-box-frontend-gamma.vercel.app/)

**🔗 Live app — [out-box-frontend-gamma.vercel.app](https://out-box-frontend-gamma.vercel.app/)**

A high-performance, fault-tolerant full-stack email scheduling and dispatch platform. Designed with **zero cron dependencies**, OutBox leverages **BullMQ delayed jobs**, **atomic Redis rate limiting**, **PostgreSQL persistence**, and **Elasticsearch full-text indexing** to guarantee accurate, non-duplicate, rate-regulated email distribution at scale.

---

## 🌟 Key Features

- ⏱️ **Cron-Free Scheduling**: Millisecond-accurate future delivery via BullMQ Redis delayed queues rather than polling cron tasks.
- 🛡️ **Atomic Rate Limiting**: Redis-backed sliding-hour rate limiter using atomic `INCR` commands to ensure per-sender and global quota compliance without race conditions.
- 🔁 **Automatic Re-delay & Re-queueing**: Jobs that hit hourly quotas are automatically re-calculated and re-delayed to the next available window, triggering real-time Slack alerts.
- 🔒 **Idempotency Guarantee**: Every email operation generates a unique, indexed `idempotencyKey` preventing duplicate dispatches across retries or distributed workers.
- 🔄 **Crash Recovery**: Startup reconciliation (`recoverMissedJobs()`) that scans for pending jobs that fell due during server downtime and safely re-enqueues them.
- 🔍 **Elasticsearch Search Engine**: Instant full-text search indexing over subjects, bodies, recipients, senders, and batch IDs with graceful degradation when offline.
- 📊 **Real-time Queue Dashboard**: Integrated Bull Board interface (`/admin/queues`) to inspect active, delayed, waiting, completed, and failed jobs.
- 🔔 **Slack Alerts**: Native OAuth and Webhook alerts dispatched whenever a sender account breaches quota thresholds.
- 📧 **Auto-Provisioned Test SMTP**: Instant zero-config sender provisioning with Ethereal Email test accounts offering web preview links for dispatched emails.
- 🎨 **Modern Single Page Application**: React 19, Tailwind CSS v4, TanStack Query, Lucide icons, and responsive desktop compose layouts.

---

## 🏗️ Architecture & Processing Flow

```mermaid
flowchart TD
    A[Client / Frontend] -->|POST /api/emails/schedule| B[Express API Server]
    B -->|Persist Email & Idempotency Key| C[(PostgreSQL)]
    B -->|Calculate Delay & Enqueue Job| D[(Redis - BullMQ Queue)]
    
    subgraph Worker Process
        D -->|Delayed Timer Expires| E[BullMQ Worker]
        E -->|Check Idempotency & Status| C
        E -->|Check Atomic Limit INCR| F[(Redis Rate Limiter)]
        
        F -->|Quota Exceeded| G[Re-delay Job to Next Hour]
        G -->|Slack Webhook Alert| H[Slack Channel]
        G -->|Update Status: RATE_LIMITED| C
        
        F -->|Quota Allowed| I[Nodemailer / Ethereal SMTP]
        I -->|Mark as SENT| C
        I -->|Index / Update Document| J[(Elasticsearch)]
    end
```

---

## 📂 Repository Structure

This repository is structured as an npm workspaces monorepo:

```text
OutBox/
├── backend/                  # Express + TypeScript API & Queue Worker
│   ├── prisma/               # Prisma ORM schema and migrations
│   │   ├── migrations/       # SQL migration history
│   │   └── schema.prisma     # PostgreSQL schema definitions
│   └── src/
│       ├── config/           # DB, Redis, Elasticsearch, and Env configurations
│       ├── middleware/       # JWT Auth, Zod validation, error handler
│       ├── routes/           # REST endpoints (auth, emails, senders, slack, health)
│       ├── services/         # Business logic (queue, worker, rateLimit, search, smtp, slack)
│       ├── types/            # TypeScript interfaces and declarations
│       └── utils/            # Winston structured logger
├── frontend/                 # React 19 + Vite + Tailwind CSS v4 SPA
│   └── src/
│       ├── api/              # Axios HTTP client and TanStack Query functions
│       ├── components/       # Layouts, UI primitives, and email dialogs/lists
│       ├── hooks/            # Custom React hooks
│       ├── pages/            # Dashboard, Compose, Sent, Login, AuthCallback
│       └── preview.tsx       # Standalone component visualizer
├── docker-compose.yml        # Local infrastructure (Postgres, Redis, Elasticsearch)
├── package.json              # Monorepo scripts & root configuration
└── .env.example              # Sample environment variables
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, TanStack React Query v5, Axios, Lucide React, React Router DOM v7 |
| **Backend** | Node.js 20+, Express 4, TypeScript 5.4, Prisma ORM 5.14, Zod, Passport.js, Winston |
| **Queue & Scheduling** | BullMQ 5.8, Bull Board 5.21, ioredis 5.4 |
| **Database & Search** | PostgreSQL 16, Redis 7, Elasticsearch 8.13 |
| **Integrations** | Google OAuth 2.0, Slack Web API, Nodemailer / Ethereal Email |

---

## 🚦 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **Docker & Docker Compose**: For local PostgreSQL, Redis, and Elasticsearch
- **npm**: `v10.x` or higher

---

### 1. Clone & Install

```bash
git clone https://github.com/your-username/outbox.git
cd OutBox

# Install all workspace dependencies from root
npm install
```

---

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example backend/.env
```

Review and adjust `backend/.env` as needed:

```env
# Server
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Database (PostgreSQL)
DATABASE_URL=postgresql://outbox:outbox_pass@localhost:5432/outbox

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# Google OAuth 2.0 (Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# JWT
JWT_SECRET=super-secret-random-key-change-in-production
JWT_EXPIRES_IN=7d

# Slack OAuth 2.0 (Optional)
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:4000/api/slack/callback

# BullMQ Worker Settings
WORKER_CONCURRENCY=5
MIN_SEND_DELAY_MS=2000

# Rate Limiting
MAX_EMAILS_PER_HOUR=200
MAX_EMAILS_PER_HOUR_PER_SENDER=50
```

---

### 3. Start Supporting Infrastructure

Start PostgreSQL, Redis, and Elasticsearch using Docker Compose:

```bash
npm run infra:up
```

Verify the containers are healthy:
```bash
docker compose ps
```

---

### 4. Run Database Migrations

Apply Prisma schema migrations and generate client types:

```bash
npm run db:migrate
npm run db:generate
```

---

### 5. Start Development Servers

Run both backend and frontend concurrently in development mode:

```bash
npm run dev
```

Or run them individually:
```bash
# Terminal 1: Backend (Express API + BullMQ Worker)
npm run dev:backend

# Terminal 2: Frontend (Vite Dev Server)
npm run dev:frontend
```

---

### 6. Access Services

| Service | URL | Notes |
| :--- | :--- | :--- |
| **Frontend Application** | [http://localhost:5173](http://localhost:5173) | Main UI |
| **Backend API** | [http://localhost:4000](http://localhost:4000) | Root API endpoint |
| **Bull Board Dashboard** | [http://localhost:4000/admin/queues](http://localhost:4000/admin/queues) | Visual queue & worker monitor |
| **Health Check** | [http://localhost:4000/api/health](http://localhost:4000/api/health) | Verifies DB, Redis, and Queue status |

---

## 📡 API Reference

All protected endpoints require an `Authorization: Bearer <jwt_token>` header.

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/google` | Initiate Google OAuth 2.0 flow |
| `GET` | `/api/auth/google/callback` | OAuth 2.0 callback URL |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `POST` | `/api/auth/logout` | Invalidate current session |

### Email Scheduling & Querying
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/emails/schedule` | Schedule an email or batch of emails |
| `GET` | `/api/emails/scheduled` | List scheduled / pending / rate-limited emails |
| `GET` | `/api/emails/sent` | List delivered and failed emails |
| `GET` | `/api/emails/counts` | Get status counts for navigation badges |
| `GET` | `/api/emails/search` | Full-text query via Elasticsearch |
| `POST` | `/api/emails/:id/cancel` | Cancel an enqueued/scheduled email |

#### Example: Schedule Request (`POST /api/emails/schedule`)
```json
{
  "senderId": "480459a9-34dc-43c2-a89c-48c90fe7f208",
  "recipients": ["client1@example.com", "client2@example.com"],
  "subject": "Q3 Marketing Review",
  "body": "Hello! Please find the Q3 campaign performance attached.",
  "scheduledAt": "2026-09-05T14:30:00.000Z",
  "delayBetweenEmails": 2,
  "hourlyLimit": 50
}
```

### Senders Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/senders` | Create a sender (auto-provisions test Ethereal SMTP) |
| `GET` | `/api/senders` | List active sender accounts |
| `DELETE` | `/api/senders/:id` | Deactivate/remove a sender |

### Slack Integration
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/slack/install` | Connect Slack workspace for quota alerts |
| `GET` | `/api/slack/callback` | OAuth redirect callback for Slack app |
| `POST` | `/api/slack/disconnect` | Remove Slack connection |

### System Health
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Multi-point check (Postgres, Redis, BullMQ, ES) |

---

## 🛡️ Reliability & Resilience

1. **Sliding-Window Rate Limiting**:
   - OutBox tracks dispatches using Redis keys with a 1-hour TTL: `ratelimit:<senderId>:<YYYY-MM-DD-HH>`.
   - Before executing an email dispatch, the worker atomically increments the counter.
   - If the limit is reached, the job is moved back into BullMQ's delayed state until the start of the next hour window, preserving ordering.
2. **Reconciliation on Crash**:
   - If the worker or host server restarts, `recoverMissedJobs()` runs during bootstrap.
   - It queries all emails in `SCHEDULED` status whose `scheduledAt` timestamp is in the past, and safely re-enqueues them to BullMQ immediately.
3. **Graceful Shutdown**:
   - `SIGTERM` and `SIGINT` triggers close the BullMQ worker safely (allowing ongoing network requests to finish), disconnect Prisma pools, and stop the HTTP listener without dropping jobs.

---

## 🚢 Deployment

### Production Docker Compose (Single Host / VPS)
For a single VPS (DigitalOcean Droplet, Hetzner, or AWS EC2), build the production images:

```bash
# Build & start all containers in detached mode
docker compose -f docker-compose.prod.yml up -d --build
```

### PaaS Services (Railway / Render)
- **Backend Service**: Deploy as a persistent background/web service (Node.js runtime).
  - Build command: `npm install && npx prisma generate && npm run build`
  - Start command: `npx prisma migrate deploy && node dist/index.js`
- **Frontend Service**: Deploy as static SPA on Vercel, Netlify, or Cloudflare Pages.
- **Managed Databases**: Use managed PostgreSQL and Redis (with persistence enabled).

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
