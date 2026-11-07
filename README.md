# AI-Powered Ticket Management System (Helper)

Full-stack support ticket triage and response automation system built with **Bun**, **Express**, **React**, **TypeScript**, **Prisma ORM**, and **Google Gemini Pro**.

---

## Tech Stack Overview

- **Runtime & Package Manager**: [Bun](https://bun.sh)
- **Backend**: Express.js with TypeScript (`server/`)
- **Database & ORM**: PostgreSQL with `pgvector` managed by Prisma ORM
- **Authentication**: Database session management (`express-session` + `connect-pg-simple`) with HTTP-only cookies
- **Frontend**: React 18 with TypeScript, Vite, React Router v6, Tailwind CSS v4, TanStack Query (`client/`)
- **AI Engine**: Google Gemini Pro (`@google/genai`) with semantic search via `text-embedding-004`
- **Email Ingestion**: SendGrid / Mailgun Inbound Parse webhook + Outbound email dispatch
- **Containerization**: Docker & Docker Compose

---

## Directory Structure

```text
Helper/
├── package.json             # Root workspace orchestration
├── docker-compose.yml       # PostgreSQL with pgvector container
├── .env.example             # Environment configuration template
├── tech-stack.md            # Technical specifications
├── implementation-plan.md   # Phased step-by-step roadmap
├── server/                  # Express + TypeScript + Prisma backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma    # Data models (Users, Tickets, Messages, KnowledgeBase)
│   └── src/
│       └── index.ts         # Server entrypoint with database sessions & CORS
└── client/                  # React + TypeScript + Vite frontend
    ├── package.json
    ├── vite.config.ts       # Vite configuration with API proxy
    ├── tailwind.config.js
    └── src/
        ├── App.tsx          # Router layout & dashboard views
        └── main.tsx         # Root provider setup
```

---

## Getting Started

### 1. Database Setup
Start the PostgreSQL container with `pgvector` enabled:
```bash
docker compose up -d
```

### 2. Environment Variables
Copy `.env.example` to `.env` in the root (or in `/server`):
```bash
cp .env.example server/.env
```

### 3. Install Dependencies with Bun
```bash
# In server
cd server
bun install
bun prisma:generate

# In client
cd ../client
bun install
```

### 4. Run Development Servers
```bash
# Run server
cd server
bun dev

# Run client
cd client
bun dev
```
The frontend is available at `http://localhost:5173` and the backend at `http://localhost:4000`.
