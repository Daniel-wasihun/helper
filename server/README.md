# Helper AI — Backend API

The REST API backend for the **Helper AI** ticket management and autonomous triage system.

Built with **Node.js (v24 LTS)**, **Express 4**, **TypeScript**, and **Prisma ORM** connecting to **PostgreSQL**.

---

## Tech Stack

- **Runtime**: Node.js (v24 LTS) / Bun
- **Framework**: Express 4 with TypeScript
- **Database & ORM**: PostgreSQL with [Prisma ORM 6](https://www.prisma.io)
- **Sessions & Auth**: Express sessions (`connect-pg-simple`) with secure HTTP-only cookies
- **AI & RAG Engine**: Google Gemini Pro (`@google/genai`) and `text-embedding-004`
- **Email Ingestion & Dispatch**: SendGrid / Mailgun inbound webhooks and transactional delivery

---

## Networking & Port Rules

- **API Port**: `3001` (default Express listen port)
- **CORS**: Configured to accept requests from `http://localhost:3000` with `credentials: true`

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` points to the PostgreSQL `Helper` database:
```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/Helper?schema=public"
```

### 3. Database Synchronization
Push the Prisma schema to your PostgreSQL database:
```bash
npm run db:push
```

### 4. Run the Development Server
```bash
npm run dev
```
The server will be live at:
[http://localhost:3001](http://localhost:3001)

Health check endpoint:
[http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts server in watch mode using native Node type-stripping |
| `npm run start` | Starts server in production mode |
| `npm run db:push` | Pushes schema changes directly to the database |
| `npm run db:generate` | Generates the latest Prisma Client types |
| `npm run db:studio` | Opens Prisma Studio GUI in the browser |
| `npm run db:migrate` | Generates and applies development migrations |

---

## Directory Structure

```text
server/
├── .env                  # Local environment secrets (ignored by Git)
├── .env.example          # Environment template
├── .gitignore            # Git exclusions
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── prisma/
│   └── schema.prisma     # Prisma models (User, Ticket, Message, KnowledgeArticle, ArticleEmbedding)
└── src/
    ├── index.ts          # Express entrypoint with CORS & health check
    └── lib/
        └── prisma.ts     # Global Prisma Client singleton instance
```
