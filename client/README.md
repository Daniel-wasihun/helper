# Helper AI — Frontend Client

The web client for the **Helper AI** ticket management and autonomous triage system.

Built with **React 18**, **TypeScript**, **Vite 6**, **Tailwind CSS v4**, and **TanStack Query**.

---

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Bundler & Dev Server**: [Vite 6](https://vite.dev)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite` (CSS-first `@import "tailwindcss";`, no legacy `tailwind.config.js`)
- **Routing**: React Router v6
- **Server State & Caching**: TanStack Query (React Query v5)
- **Icons**: Lucide React
- **HTTP Client**: Axios & Fetch with credentials enabled (`withCredentials: true`)

---

## Networking & Port Rules

- **Development Port**: `3000` (strictly configured in `vite.config.ts`)
- **API Proxy**: Automatically proxies `/api/*` requests to the Express backend at `http://localhost:3001`

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
The application will be live at:
[http://localhost:3000](http://localhost:3000)

### 3. Production Build & Preview
```bash
# Typecheck and build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Directory Structure

```text
client/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts        # Vite configuration with strict port 3000 & /api proxy
└── src/
    ├── App.tsx           # Main application router and root layout
    ├── index.css         # Tailwind CSS v4 entry point
    └── main.tsx          # Application bootstrapper with QueryClientProvider
```
