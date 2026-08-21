# Setup Guide

This guide explains how to get the Checkless development environment running locally.

## Prerequisites
- **Node.js** (v18+)
- **npm** (v9+)
- A **Neon PostgreSQL** database connection string (or a local PostgreSQL instance).

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

# Frontend Configuration
VITE_SOCKET_URL="http://localhost:8081"

# Neon PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
```

*Note: The frontend Vite config automatically pulls environment variables starting with `VITE_` from the root `.env` directory.*

## 3. Database Setup (Prisma)
Ensure your database schema is synced.

```bash
cd backend
npx prisma generate
npx prisma db push
```

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

## Code Style
This project uses Prettier for formatting. The user prefers Allman style (curly braces on new lines) and minimal punctuation.
- Run `npm run format` in the frontend or backend directory to format the respective code.
