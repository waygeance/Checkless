# Setup Guide

This guide explains how to get the Checkless development environment running locally.

## Prerequisites

- **Node.js** (v18+)
- **npm** (v9+)
- A **Neon PostgreSQL** database connection string (or a local PostgreSQL instance).
- A **Clerk development application**.

## 1. Clone & Install

Clone the repository, then install dependencies for both the frontend and backend.

```bash
git clone <repository-url>
cd simultaneous-chess

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

## 2. Environment Variables

You need to configure the environment variables. A `.env.example` file is provided in the root directory.

1. Copy `.env.example` to `.env` in the root directory.
2. Edit the `.env` file and add your `DATABASE_URL`.

```env
# /simultaneous-chess/.env

# ── Backend ──────────────────────────────────────────
PORT=8081
HOST=0.0.0.0
CORS_ORIGIN="http://localhost:5173"
MOVE_BATCH_SIZE=10
MOVE_FLUSH_INTERVAL_MS=5000

# Frontend Configuration
VITE_SOCKET_URL="http://localhost:8081"

# Clerk authentication
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Neon PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
```

Get the Clerk keys from the API Keys page of the Clerk Dashboard. The
publishable key is used by the Vite frontend. `CLERK_SECRET_KEY` is backend-only
and must never use a `VITE_` prefix or be committed.

Enable usernames for the Clerk development instance so newly created accounts
can use the same searchable username in Checkless. If a test user does not yet
have a Clerk username, the backend assigns a stable `player-xxxxxxxx` fallback
until the Clerk profile is updated.

_Note: The frontend Vite config automatically pulls environment variables starting with `VITE_` from the root `.env` directory._

## 3. Database Setup (Prisma)

Ensure your database schema is synced.

```bash
cd backend
npx prisma generate
npx prisma db push
```

`MOVE_BATCH_SIZE` defaults to `10`, and `MOVE_FLUSH_INTERVAL_MS` defaults to
`5000`. A live game flushes as soon as either threshold is reached and always
flushes before terminal settlement.

For a database that already has the V1 tables but predates CMN, review and
apply the prepared delta before starting this backend version:

```bash
cd backend
npx prisma db execute \
  --file prisma/sql/20260906_add_cmn_notation.sql \
  --schema prisma/schema
npx prisma generate
```

Do not execute that delta twice; the checked-in SQL intentionally fails if the
column already exists so deployment mistakes remain visible.

## 4. Running the Application

You can run both servers independently in two terminal tabs:

**Terminal 1 (Backend):**

```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`.
The backend socket server runs on `http://localhost:8081`.

Open `/sign-up` to create the first test profile. `/play` is protected and
redirects signed-out visitors to Clerk sign-in. After sign-in, the Socket.IO
handshake sends a short-lived Clerk session token; the backend verifies it and
creates or updates the local Prisma `User` before accepting the connection.
During profile synchronization, self-service deletion is disabled on the Clerk
user so the account can be logged out or suspended without breaking game
history.

When matchmaking succeeds, the backend now creates the durable game and both
participant snapshots before emitting `game_start`. Accepted moves remain
authoritative in memory and are batch-written to PostgreSQL every 10 moves or 5
seconds. Graceful shutdown flushes pending moves and marks unfinished games as
server-interrupted.

## Code Style

This project uses Prettier for formatting. The user prefers Allman style (curly braces on new lines) and minimal punctuation.

- Run `npm run format` in the frontend or backend directory to format the respective code.
