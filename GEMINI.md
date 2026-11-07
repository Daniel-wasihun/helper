# Antigravity Agent Guidelines & Project Memory: Helper AI

This document (`AGENTS.md` / `GEMINI.md`) serves as the persistent project memory and rulebook for the **Helper AI** ticket management system in Google Antigravity. These instructions must be actively referenced and strictly applied to every prompt, turn, and code change.

---

## 1. Documentation & Research Rule (Context7 MCP)

> **MANDATORY**: For every user request or coding task involving external libraries, APIs, SDKs, or tools (including React, Tailwind CSS, Express, Vite, Prisma, Google GenAI SDK, SendGrid, Mailgun, Docker, etc.), you **MUST ALWAYS** use the `context7` MCP server to fetch current, up-to-date documentation and code examples before writing or refactoring code.

### Protocol for Querying Context7:
1. **Resolve Library ID**:
   Call `call_mcp_tool` with `ServerName: "context7"` and `ToolName: "resolve-library-id"`:
   ```json
   {
     "libraryName": "<Exact Library Name, e.g., 'Tailwind CSS', 'Vite', 'Prisma'>",
     "query": "<Specific concept or topic to look up>"
   }
   ```
2. **Query Documentation**:
   Call `call_mcp_tool` with `ServerName: "context7"` and `ToolName: "query-docs"` using the resolved ID (e.g., `/tailwindlabs/tailwindcss.com`):
   ```json
   {
     "libraryId": "<Resolved Library ID>",
     "query": "<Focused question or implementation details>",
     "language": "TypeScript"
   }
   ```
3. Never guess API signatures or use deprecated configurations when Context7 is available.

---

## 2. Strict Port & Networking Rules

- **Frontend Port**: `3000` (Strictly configured in Vite).
- **Backend Port**: `3001` (Default Express listen port; CORS origin allowed from `http://localhost:3000`).
- **REST Proxy**: Frontend Vite server proxies `/api` requests to `http://localhost:3001`.
- **FORBIDDEN PORTS**: **NEVER** bind or suggest ports `5173`, `5473`, `73`, `8000`, or `8080`, as they conflict with other running user services.

---

## 3. Core Project Architecture

- **Project Purpose**: AI-powered support ticket management and autonomous triage system.
- **Frontend (`/client`)**:
  - React 18 with TypeScript and Vite 6.
  - React Router v6.
  - Tailwind CSS v4 using `@tailwindcss/vite` (CSS-first `@import "tailwindcss";`, no legacy `tailwind.config.js`).
  - TanStack Query (React Query) for server state caching.
  - Lucide React for UI iconography.
- **Backend (`/server`)**:
  - Node.js (v24 LTS) / Bun runtime with Express 4 and TypeScript.
  - Prisma ORM managing PostgreSQL with `pgvector` extension.
  - Database sessions (`express-session` + `connect-pg-simple`) with secure HTTP-only cookies.
- **AI & RAG Engine**:
  - Google Gemini Pro (`@google/genai`) for ticket classification, conversation summarization, and suggested replies.
  - Google `text-embedding-004` for vectorizing knowledge base articles.
- **Email Ingestion & Dispatch**:
  - SendGrid or Mailgun inbound parse webhook (`POST /api/webhooks/email`) + transactional outbound delivery.
- **Containerization**:
  - Multi-container Docker & Docker Compose (`postgres` with `pgvector`, backend API, and frontend).

---

## 4. Coding Standards & Style

1. **Simplicity First**: Keep files lean, readable, and standard. Avoid unnecessary boilerplate, deep wrappers, or over-engineered abstractions.
2. **Strict TypeScript & Explicit Types**:
   - Explicit types for Express route handlers (`Request`, `Response`).
   - Use `import type` for type-only imports to preserve runtime cleanliness.
3. **No Unused Variables/Imports**: Do not leave unused imports or variables (enforced by `noUnusedLocals`).
4. **Tailwind v4 Conventions**: Configure styling directly in CSS using `@theme` or utility classes; avoid obsolete PostCSS plugins.
5. **Clean Git Hygiene**: Maintain clean working trees with descriptive commit messages following Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`).
