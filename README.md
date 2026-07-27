# Prosisit Table

Multi-tenant SaaS restaurant table reservation platform.

## Project Structure

```
frontend/   React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
backend/    Node.js + Express + TypeScript + Prisma ORM + PostgreSQL
docs/       Project context and planning docs
```

## Getting Started

### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database (serverless Postgres, used for this project)

### Backend

```bash
cd backend
cp .env.example .env   # set DATABASE_URL to your Neon connection string
npm install
npm run prisma:generate
npm run dev             # starts on http://localhost:4000
```

Health check: `GET /api/health` — returns DB connection status (verified against Neon).

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # starts on http://localhost:5173
```

Add shadcn/ui components with:
```bash
cd frontend
npx shadcn@latest add button
```

## Status

This is the **foundation only**: frontend/backend scaffolding, database connection,
and environment configuration. No business features (auth, reservations, tables, etc.)
have been implemented yet — see `docs/project-context.md` for the full module roadmap.
