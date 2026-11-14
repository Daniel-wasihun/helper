# Antigravity Agent Guidelines & Project Memory: Helper AI

This document (`AGENTS.md`) serves as the persistent project memory and rulebook for the **Helper AI** ticket management system in Google Antigravity. These instructions must be actively referenced and strictly applied to every prompt, turn, and code change.

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

- **Development Frontend Port**: `3000` (Strictly configured in Vite).
- **Development Backend Port**: `3001` (Default Express listen port on `0.0.0.0`; CORS origin allowed from `http://localhost:3000`).
- **REST Proxy**: Frontend Vite server proxies `/api` requests explicitly to `http://127.0.0.1:3001` (avoids IPv6 `::1` resolution conflicts) dynamically configured via `loadEnv`.
- **FORBIDDEN PORTS**: **NEVER** bind or suggest ports `5173`, `5473`, `73`, `8000`, or `8080`, as they conflict with other running user services.

---

## 3. Core Project Architecture

- **Project Purpose**: AI-powered support ticket management and autonomous triage system.
- **Frontend (`/client`)**:
  - React 18 with TypeScript and Vite 6.
  - React Router v7.
  - Tailwind CSS v4 using `@tailwindcss/vite` (CSS-first `@import "tailwindcss";`, no legacy `tailwind.config.js`).
  - shadcn/ui (`radix-nova` style with `neutral` base color, `@` path aliases configured in `tsconfig.json` without deprecated `baseUrl`).
  - TanStack Query (React Query) for server state caching.
  - Lucide React for UI iconography.
- **Backend (`/server`)**:
  - Node.js (v24 LTS) / Bun runtime with Express 4 and TypeScript.
  - Prisma ORM managing PostgreSQL with `pgvector` extension.
  - Authentication via **Better Auth** with `@prisma/client` PostgreSQL adapter.
  - **ESM & Env Hygiene**: `server/src/lib/prisma.ts` explicitly imports `dotenv/config` at the top of the file to prevent `DATABASE_URL` being undefined during ESM module graph resolution.
- **Authentication & Authorization Architecture**:
  - **Framework**: [Better Auth](https://better-auth.com) (`better-auth` v1.x) with TypeScript.
  - **Server Setup (`/server/src/auth.ts`, `/server/src/index.ts`)**:
    - `prismaAdapter(prisma, { provider: "postgresql" })`.
    - Email/password authentication (`emailAndPassword: { enabled: true, disableSignUp: true }`) to restrict self-registration; users/agents are provisioned administratively.
    - User schema extended with `role` field (`ADMIN` | `AGENT`), defaulting to `AGENT` with `input: false` to prevent self-role-assignment.
    - Reverse proxy trust configured via `app.set("trust proxy", 1)` in production.
    - Cookie security enforced with `advanced.useSecureCookies: true`, `httpOnly: true`, and `sameSite: "lax"`.
    - Handled in Express via `toNodeHandler(auth)` mounted at `/api/auth/*` **before** `express.json()`.
    - **Route Shadowing Rule**: Any custom `/api/auth/*` routes (e.g. `app.get("/api/auth/me")`) must be registered **before** `toNodeHandler(auth)` to prevent Better Auth returning a 404.
    - Role-based authorization middlewares (`requireAuth`, `requireRole`) in `server/src/middleware/auth.ts`.
    - Administrative user provisioning (`POST /api/admin/users`) protected by `requireRole(UserRole.ADMIN)`, validated strictly with Zod (email format, password min 8 / max 128 chars to mitigate CPU exhaustion/Hash DoS), and sanitized error responses.
    - **Production-Only Rate Limiting**: Rate limiting is strictly enforced **only in production** (`process.env.NODE_ENV === "production"`) across Better Auth (`rateLimit: { enabled: isProd, window: 10, max: 100 }`) and Express `/api` routes via `express-rate-limit` (300 requests / 15 min), preventing DoS while allowing rapid local development and unthrottled Playwright E2E test runs.
  - **Client Setup (`/client/src/lib/auth-client.ts`, `/client/src/context/AuthContext.tsx`)**:
    - `createAuthClient` from `better-auth/react`.
    - Global `AuthProvider` providing `user`, `isLoading`, `signIn`, `signOut`, and asynchronous `refetchSession()`.
    - **Race Condition Prevention**: `await refetchSession()` must be awaited before navigating on login to prevent route guard redirect bounce.
    - **Redirect Sanitization**: Post-login navigation targets (`from?.pathname`) must enforce single-leading-slash validation (`path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\")`) to prevent open redirect vulnerabilities.
    - **Environment Hygiene**: Demo/development credentials in UI cards must be strictly guarded behind `{import.meta.env.DEV && ( ... )}` so Vite tree-shakes them in production bundles.
    - Route guards:
      - `ProtectedRoute`: Enforces authenticated session before displaying private pages; redirects guests to `/login`.
      - `AdminRoute`: Enforces `user.role === "ADMIN"`; redirects unauthorized agents to `/`.
    - Admin-only routes (such as `/users`) are protected by `AdminRoute`.
    - Navigation header conditionally renders admin links only when `user.role === "ADMIN"`.
- **Known Seeded / Provisioned Accounts**:
  - **Admin**: `admin@example.com` / `password123` (Role: `ADMIN`)
  - **Agent**: `agent@example.com` / `password123` (Role: `AGENT`)
- **AI & RAG Engine**:
  - Google Gemini Pro (`@google/genai`) for ticket classification, conversation summarization, and suggested replies.
  - Google `text-embedding-004` for vectorizing knowledge base articles.
- **Email Ingestion & Dispatch**:
  - SendGrid or Mailgun inbound parse webhook (`POST /api/webhooks/email`) + transactional outbound delivery.
- **Containerization**:
  - Multi-container Docker & Docker Compose (`postgres` with `pgvector`, backend API, and frontend).
- **Testing & Quality Assurance (Mandatory `e2e-engineer` Delegation)**:
  - **Strict Ownership**: All end-to-end testing, Playwright test authoring, test execution, debugging, fixture creation, and test maintenance are strictly owned by and delegated to the `e2e-engineer` subagent (defined in `.agents/agents/e2e-test-writer/agent.md`).
  - **No Direct Authoring**: The main agent must **NEVER** write, modify, or run files under `./e2e/` directly. Always invoke `e2e-engineer` using `invoke_subagent`.
  - **How to Invoke `e2e-engineer`**:
    - **`TypeName`**: `"e2e-engineer"`
    - **`Role`**: `"E2E Test Engineer"`
    - **Prompt Requirements**: Provide clear, actionable instructions specifying:
      1. Target feature or user journey (e.g. login, ticket creation, triage, role-based access).
      2. Roles and accounts to test (e.g. `ADMIN`, `AGENT`, unauthenticated guest).
      3. Expected behavior and assertions (UI states, API responses, DB modifications).
      4. Any relevant paths or components to inspect.
  - **Subagent Workflow**:
    - The `e2e-engineer` will inspect the implementation, formulate a test plan, verify the isolated test environment (`helper_test_db`, ports `:3002`/`:3003`), write deterministic tests following Playwright best practices, execute them via `npm run test:e2e`, and return evidence-backed results.

---

## 4. Coding Standards & Style

1. **Simplicity First**: Keep files lean, readable, and standard. Avoid unnecessary boilerplate, deep wrappers, or over-engineered abstractions.
2. **Strict TypeScript & Explicit Types**:
   - Explicit types for Express route handlers (`Request`, `Response`).
   - Use `import type` for type-only imports to preserve runtime cleanliness.
3. **No Unused Variables/Imports**: Do not leave unused imports or variables (enforced by `noUnusedLocals`).
4. **Tailwind v4 Conventions**: Configure styling directly in CSS using `@theme` or utility classes; avoid obsolete PostCSS plugins.
5. **UI & Component Guidelines**:
   - Use shadcn/ui components (`@/components/ui/*`) for interface primitives (Card, Button, Input, Label, Alert, etc.).
   - Standardize utility functions in `@/lib/utils.ts` with the `cn(...)` helper.
   - Form inputs (`@/components/ui/input.tsx`) must be wrapped with `React.forwardRef` to ensure proper integration with `react-hook-form`'s `register()` refs. Standard input height is `h-10`.
   - Maintain alias `@/*` pointing to `./src/*` without setting deprecated `baseUrl` in TypeScript.
6. **Clean Git Hygiene**: Maintain clean working trees with descriptive commit messages following Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`).
