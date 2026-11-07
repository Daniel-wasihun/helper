# Implementation Plan: AI-Powered Ticket Management System

This document outlines the phased roadmap and step-by-step task breakdown for
building the AI-Powered Ticket Management System based on `project-scope.md` and
`tech-stack.md`.

---

## Architecture & Workflow Diagram

```mermaid
flowchart TD
    subgraph Frontend (React + TS + React Router)
        AdminUI["Admin UI (User & Agent Management)"] <-->|REST API + Session Cookie| Backend
        AgentUI["Agent Workspace (Dashboard, Ticket List & Detail)"] <-->|REST API + Session Cookie| Backend
    end

    subgraph Backend API (Node + Express + Prisma)
        SessionMiddleware[Session Auth & RBAC] --> DB[(PostgreSQL Database)]
        UserController[User Management Service] <--> DB
        TicketController[Ticket & Conversation Service] <--> DB

        GeminiPipeline[Gemini AI Engine]
        GeminiPipeline -->|Classification & Summary| GeminiPro[Google Gemini Pro]
        GeminiPipeline -->|Knowledge Base / RAG Context| GeminiPro
        GeminiPro -->|Suggestions & Summaries| TicketController
    end

    subgraph Email Channel
        Customer[Customer Email] -->|SendGrid / Mailgun Webhook| InboundHook["POST /api/webhooks/email"]
        InboundHook --> TicketParser[Email Ingestion & Matcher]
        TicketParser --> TicketController
        TicketController --> OutboundService["Email Dispatch Service"]
        OutboundService -->|SendGrid / Mailgun API| Customer
    end
```

---

## Phase 1: Project Scaffolding & Infrastructure

- [ ] **Task 1.1: Repository Structure & Shared Configs**
    - Set up a clean client-server directory layout (`/client`, `/server`).
    - Configure root `.gitignore`, `.env.example`, and shared TypeScript
      configurations.

- [ ] **Task 1.2: Docker & Database Environment**
    - Create `docker-compose.yml` defining PostgreSQL with `pgvector` enabled
      (`ankane/pgvector` or standard postgres with build script).
    - Verify container startup, volume persistence, and local port bindings.

- [ ] **Task 1.3: Backend Service Initialization**
    - Initialize Node.js + Express with TypeScript in `/server`.
    - Install dependencies: `express`, `cors`, `helmet`, `dotenv`, `zod`,
      `express-session`, `prisma`, `@prisma/client`.
    - Configure dev server script using `tsx` or `ts-node-dev`.

- [ ] **Task 1.4: Frontend Application Initialization**
    - Initialize React + TypeScript application with Vite in `/client`.

---

## Phase 2: Data Modeling, Database Sessions & Authentication

- [ ] **Task 2.1: Prisma Schema Design**
    - Define enums: `TicketStatus` (`OPEN`, `RESOLVED`, `CLOSED`),
      `TicketCategory` (`GENERAL_QUESTION`, `TECHNICAL_QUESTION`,
      `REFUND_REQUEST`), `UserRole` (`ADMIN`, `AGENT`).
    - Define models:
        - `User`: id, email, passwordHash, name, role, isActive, createdAt,
          updatedAt.
        - `Session`: sid, sess (JSON), expire (for database session storage).
        - `Ticket`: id, ticketNumber, subject, status, category, customerEmail,
          customerName, assignedToId, aiSummary, createdAt, updatedAt.
        - `Message`: id, ticketId, senderType (`CUSTOMER`, `AGENT`, `SYSTEM`),
          senderEmail, bodyText, bodyHtml, aiSuggestedReply, createdAt.
        - `KnowledgeArticle`: id, title, content, category, createdAt,
          updatedAt.
        - `ArticleEmbedding`: id, articleId, embedding (vector), chunkText.

- [ ] **Task 2.2: Migrations & Database Seeding**
    - Run initial Prisma migration (`prisma migrate dev`).
    - Write `prisma/seed.ts` script to bootstrap an initial **Admin** user with
      secure password hashing (`bcryptjs` or `argon2`).

- [ ] **Task 2.3: Express Session with Database Store**
    - Configure `express-session` with a PostgreSQL session store (e.g.
      `connect-pg-simple` or `@quixo3/prisma-session-store`).
    - Configure secure HTTP-only cookies and CORS with credentials support.

- [ ] **Task 2.4: Auth Endpoints & RBAC Middleware**
    - Implement `POST /api/auth/login`, `POST /api/auth/logout`,
      `GET /api/auth/me`.
    - Implement middleware: `requireAuth` (verifies active session) and
      `requireRole(UserRole.ADMIN)`.

- [ ] **Task 2.5: Frontend Auth Context & Route Protection**
    - Build `AuthContext` to persist current user state and session validation.
    - Create protected route wrappers: `<ProtectedRoute>` and `<AdminRoute>`.
    - Build `/login` view with form validation and error handling.

---

## Phase 3: User Management & Role-Based Access Control (Admin CRUD for Agents)

- [ ] **Task 3.1: Admin User Management API Endpoints**
    - `GET /api/admin/users`: List all agents and admins with pagination and
      status filters.
    - `POST /api/admin/users`: Create a new agent account (name, email,
      password, role).
    - `GET /api/admin/users/:id`: Get agent details and assigned ticket stats.
    - `PATCH /api/admin/users/:id`: Update agent profile, role, or toggle
      active/inactive status.
    - `DELETE /api/admin/users/:id`: Deactivate or remove an agent account.

- [ ] **Task 3.2: Role & Permission Verification**
    - Enforce strict server-side RBAC: Only authenticated users with
      `role: ADMIN` can access user management endpoints.
    - Prevent admins from accidentally deleting or deactivating their own
      account.

- [ ] **Task 3.3: Admin User Management UI**
    - Build `/admin/users` view in React:
        - User list table showing name, email, role badge (`Admin`/`Agent`),
          status badge (`Active`/`Inactive`), and creation date.
        - "Add New Agent" modal with form validation (name, email, temporary
          password).
        - Edit Agent modal to change role or toggle active status.
        - Search and filter bar for finding agents quickly.

---

## Phase 4: Ticket Management Core & Agent Workspace (Frontend & API)

- [ ] **Task 4.1: Ticket REST APIs**
    - `GET /api/tickets`: Supports pagination, search, status filter (`OPEN`,
      `RESOLVED`, `CLOSED`), category filter, and sorting.
    - `POST /api/tickets`: Manual ticket creation endpoint (for internal testing
      & support intake).
    - `GET /api/tickets/:id`: Fetch complete ticket metadata, customer info, and
      message thread history.
    - `PATCH /api/tickets/:id`: Update ticket status, category, or assigned
      agent.

- [ ] **Task 4.2: Ticket Messaging API**
    - `POST /api/tickets/:id/messages`: Record agent replies or internal notes,
      update ticket timestamp, and transition status.

- [ ] **Task 4.3: Agent Dashboard Overview UI**
    - Build `/dashboard` view:
        - Metric summary cards: Total Open, Resolved, Closed tickets, and
          unassigned ticket count.
        - Breakdown charts/tables by category and status.
        - Quick-filter links to jump directly into filtered ticket views.

- [ ] **Task 4.4: Ticket List View with Filtering & Sorting UI**
    - Build `/tickets` view:
        - Data table/cards displaying ticket number, subject, customer
          name/email, category badge, status pill, assigned agent, and last
          activity time.
        - Status tabs (`All`, `Open`, `Resolved`, `Closed`).
        - Category filter dropdown and search input.
        - Sorting by creation date or last update.

- [ ] **Task 4.5: Ticket Detail & Conversation Workspace UI**
    - Build `/tickets/:id` view:
        - Header with ticket number, status badge, category dropdown, and agent
          assignment selector.
        - Full chronologically ordered conversation thread distinguishing
          customer emails and agent responses.
        - Reply editor box with draft composition, formatting, and "Send
          Response" action.
        - Status toggle buttons (e.g. "Resolve Ticket", "Reopen Ticket").

---

## Phase 5: AI Engine (Classification, Summarization & Suggested Replies)

- [ ] **Task 5.1: Gemini Pro Service Setup & Prompt Configuration**
    - Initialize Google GenAI SDK (`@google/genai` or `@google/generative-ai`)
      with Gemini Pro.
    - Create standardized system prompts for structured JSON response outputs.

- [ ] **Task 5.2: Automated Ticket Classification**
    - Implement classification routine: Analyze email subject and content to
      automatically assign categories (`General Question`, `Technical Question`,
      `Refund Request`).
    - Expose API to trigger classification on new or unclassified tickets.

- [ ] **Task 5.3: Thread Summarization Service**
    - Implement thread summarizer: Analyze multi-turn message history to
      generate concise 2-3 bullet point summaries.
    - Store generated summary in `ticket.aiSummary`.

- [ ] **Task 5.4: Knowledge Base Grounding & Suggested Reply Generation**
    - Implement knowledge base articles storage and semantic retrieval (using
      `text-embedding-004` and `pgvector`).
    - Implement suggested reply generator: Retrieve relevant documentation
      chunks, prompt Gemini Pro with thread context + KB chunks, and generate a
      draft response stored in `message.aiSuggestedReply`.

- [ ] **Task 5.5: UI Integration for AI Features**
    - Integrate AI Summary card in the ticket detail view (`/tickets/:id`).
    - Add "AI Suggested Reply" card with "Insert into Reply Editor", "Edit", or
      "Regenerate" actions.
    - Display AI predicted category pill with manual override option for agents.

---

## Phase 6: Email Ingestion & Outbound Integration (SendGrid / Mailgun)

- [ ] **Task 6.1: Inbound Webhook Endpoint**
    - Implement `POST /api/webhooks/email` supporting multipart/form-data
      payloads from SendGrid Inbound Parse or Mailgun Inbound Webhook.
    - Extract sender email, sender name, subject, plain text body, HTML body,
      and headers (`Message-ID`, `In-Reply-To`, `References`).

- [ ] **Task 6.2: Email Threading & Ticket Matcher**
    - Check incoming email headers and subject for existing ticket ID /
      references:
        - If reference exists: Append a new `CUSTOMER` `Message` to the existing
          `Ticket` and reopen if resolved.
        - If no match: Create a new `Ticket` with status `OPEN`.
    - Automatically trigger Phase 5 AI triage pipeline (classification,
      summarization, and suggested draft generation) upon ticket/message
      creation.

- [ ] **Task 6.3: Outbound Email Dispatch Service**
    - Configure SendGrid/Mailgun outbound client.
    - Hook into ticket reply submission to dispatch outbound emails preserving
      threading headers (`In-Reply-To`, `References`, and `[Ticket #XXXX]` in
      subject).

- [ ] **Task 6.4: Webhook Simulation & Testing Harness**
    - Create mock email webhook payloads and testing scripts to simulate
      customer emails locally without needing an external domain.

---

## Phase 7: Containerization, Testing & Hardening

- [ ] **Task 7.1: Multi-Stage Docker Build**
    - Create `server/Dockerfile` (TypeScript compile, production Prisma client,
      pruned node_modules).
    - Create `client/Dockerfile` (Vite production build served via Nginx).
    - Update root `docker-compose.yml` to bundle frontend, backend, and
      PostgreSQL database seamlessly.

- [ ] **Task 7.2: End-to-End Workflow Verification**
    - Test the complete lifecycle:
        1. Admin creates agent account in Phase 3 User Management.
        2. Inbound email arrives via webhook and creates ticket.
        3. Gemini AI classifies ticket and generates suggested response.
        4. Agent logs in, reviews AI summary and suggested reply, edits, and
           sends.
        5. Customer receives reply email; ticket transitions to Resolved.

- [ ] **Task 7.3: Security, Error Handling & Session Expiration**
    - Implement graceful rate-limiting for AI calls.
    - Configure session cookie expiration and cleanup.
    - Sanitize HTML inputs/outputs in email bodies to prevent XSS.

- [ ] **Task 7.4: Project Documentation & Developer Guide**
    - Write setup instructions in `README.md` including environment variables,
      database migration commands, and Docker execution instructions.
