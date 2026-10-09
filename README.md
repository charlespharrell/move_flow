# MoveFlow

MoveFlow is a logistics management dashboard for running day-to-day freight operations. It gives teams a role-aware admin interface for tracking shipments end to end, managing customers and drivers/haulers, recording payments, and administering internal users — backed by a REST API and PostgreSQL.

## Project Overview

MoveFlow models a small logistics control centre. Staff sign in with a role (Administrator, Operations or Finance) and see only the areas relevant to them. Operational data — shipments, customers, drivers, payments, users — is stored in PostgreSQL and served by an Express API; the React frontend is a single-page app that talks to it over JSON with JWT bearer tokens.

## Features

- **Dashboard & analytics** — KPI cards, shipment status distribution, revenue trend, shipment volume over time, recent shipments and a recent activity feed, all aggregated in the database.
- **Shipment management** — list, search, filter and paginate shipments; create and edit; view shipment details, timeline and linked customer/driver.
- **Customer management** — customer directory with per-customer shipment aggregates, plus a detail view with shipment history.
- **Driver / hauler management** — driver directory with status, verification and vehicle filters, plus detail views with relationship summaries.
- **Payment tracking** — payment list and detail views with status and payment-method filtering, linked to their shipment and customer.
- **User management** — internal user administration with roles and account status.
- **JWT authentication** — email/password sign-in, session restore and logout.
- **Role-based permissions** — Administrator, Operations and Finance, enforced by the API and reflected in the navigation.
- **Search, filtering & pagination** — server-side across all list views.
- **Responsive UI** — dark-themed, mobile-friendly layout with loading, empty, error and not-found states.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 8, Tailwind CSS 4, ESLint |
| Backend | Node.js (>= 20), Express 5, Prisma 6, Zod |
| Database | PostgreSQL |
| Auth & security | JSON Web Tokens (`jsonwebtoken`), bcrypt (`bcryptjs`), Helmet, CORS, rate limiting |

## Project Structure

```
moveflow-admin/
├── index.html               # Frontend entry
├── src/                     # React frontend
│   ├── pages/               # Route-level pages (Dashboard, Shipments, ...)
│   ├── components/          # Shared UI components (incl. components/ui/)
│   ├── layouts/             # Dashboard shell (sidebar, top bar)
│   ├── hooks/               # useAuth and other hooks
│   ├── services/            # API client and per-resource services
│   ├── utils/               # Formatting, validation, error helpers
│   └── data/                # Legacy mock data (no longer used at runtime)
└── server/                  # Express API
    ├── src/
    │   ├── routes/          # Express routers
    │   ├── controllers/     # Request handlers
    │   ├── services/        # Business logic + serializers
    │   ├── validators/      # Zod request schemas
    │   ├── middleware/      # Auth, validation, error handling
    │   ├── utils/           # JWT, enums, responses, errors
    │   ├── config/          # Environment configuration
    │   ├── lib/             # Prisma client
    │   ├── app.js           # Express app
    │   └── server.js        # HTTP server entry
    └── prisma/
        ├── schema.prisma    # Data model
        ├── migrations/      # Migration history
        └── seed.js          # Demo data + development accounts
```

The repository contains two apps: the React frontend at the root and the API under `server/`.

## Prerequisites

- **Node.js 20 or newer** and npm
- **PostgreSQL** — a local server or a Docker container
- **Git**

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd moveflow-admin
```

### 2. Install dependencies

Install the frontend and the API separately:

```bash
# Frontend (repository root)
npm install

# Backend
cd server
npm install
```

### 3. Create the PostgreSQL database

Create a database and a role for MoveFlow, for example using `psql`:

```sql
CREATE USER moveflow WITH PASSWORD 'your_local_password';
CREATE DATABASE moveflow OWNER moveflow;
```

Or with the command-line tools:

```bash
createdb moveflow
```

### 4. Configure the backend environment

Copy the example file and edit it:

```bash
# from the server/ directory
cp .env.example .env
```

Set at least `DATABASE_URL` and `JWT_SECRET` in `server/.env`:

```dotenv
# Match the role/password and database you created above
DATABASE_URL="postgresql://moveflow:your_local_password@localhost:5432/moveflow?schema=public"

# Generate a secret with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET="paste-a-long-random-development-secret-here"

JWT_EXPIRES_IN="8h"
PORT=5000
NODE_ENV=development
CLIENT_URL="http://localhost:5173,http://127.0.0.1:5173"
BCRYPT_ROUNDS=10
```

`.env` files are for local development only and must never be committed.

### 5. Run migrations and seed demo data

From the `server/` directory:

```bash
# Generate the Prisma client (also happens during migrate)
npm run prisma:generate

# Create the schema in your database
npm run prisma:migrate

# Load the demo dataset and development accounts (idempotent)
npm run prisma:seed
```

Handy extras: `npm run prisma:studio` opens Prisma Studio, and `npm run prisma:status` shows migration state.

### 6. Start the backend

From `server/`:

```bash
npm run dev
```

The API listens on `http://localhost:5000` (configurable via `PORT`). Confirm it is up:

```bash
curl http://localhost:5000/api/v1/health
```

### 7. Start the frontend

In a second terminal, from the repository root:

```bash
npm run dev
```

Open `http://localhost:5173`. The frontend points at `http://localhost:5000/api/v1` by default; to use a different API URL, copy the root `.env.example` to `.env` and set `VITE_API_URL`.

Production build and preview:

```bash
npm run build
npm run preview
```

## Demo Accounts

The seed creates one account per role. All three share the development password **`MoveFlow#2026`**.

| Role | Email | Name |
| --- | --- | --- |
| Administrator | `admin@moveflow.local` | Ada Lovelace |
| Operations | `operations@moveflow.local` | Chinedu Okeke |
| Finance | `finance@moveflow.local` | Funmilayo Ade |

These credentials are intentionally committed for local demo use only and must never be used in a real deployment.

## API

- **Base path:** `/api/v1`
- **Health (liveness):** `GET /api/v1/health` — confirms the API process is serving.
- **Health (readiness):** `GET /api/v1/health/database` — also verifies the database connection.
- **Authentication:** `POST /api/v1/auth/login` returns a JWT; send it as `Authorization: Bearer <token>` on protected routes. Also available: `POST /api/v1/auth/logout` and `GET /api/v1/auth/me`.

Resource routes under `/api/v1` cover `users`, `customers`, `shipments`, `drivers`, `payments` and `dashboard`.

## Portfolio Note

MoveFlow is a **portfolio / demonstration project**, not a production logistics service. It is built to showcase full-stack architecture, API design, authentication and role-based access, and a responsive admin UI. It has not been hardened for real-world use — treat the seeded data and credentials as examples only.
