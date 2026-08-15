# Placement Portal — Backend (FastAPI + MySQL)

Backend for the "login-and-dashboard-design" React frontend — a College Placement /
TPO management portal (Students, Internships, Placements, Companies CRM, Drives,
Communication, Dashboard analytics).

## 1. Stack

- **FastAPI** (Python) — REST API
- **MySQL** — database (via SQLAlchemy + PyMySQL)
- **JWT** — authentication (python-jose + passlib/bcrypt for password hashing)

## 2. Setup

### Option A — Docker (recommended, fastest)

This spins up MySQL + the backend together. No local Python/MySQL install needed.

```bash
cd backend
docker compose up --build
```

That's it — the API will be live at http://localhost:8000 (docs at `/docs`),
backed by a MySQL container. Tables are created automatically on startup.

To seed sample data into the running container:

```bash
docker compose exec backend python -m app.seed
```

To customize secrets/ports, copy `.env.example` to `.env` in this folder —
`docker-compose.yml` will pick up `DB_PASSWORD`, `SECRET_KEY`, etc. from it
automatically if present. Otherwise it falls back to the defaults baked into
`docker-compose.yml` (fine for local dev, **not** for production).

> **Note on `main.py`:** the container does **not** run `python main.py`.
> `app/main.py` only defines the FastAPI `app` object — it has no
> `if __name__ == "__main__"` block. The Dockerfile's `CMD` starts it via
> **uvicorn** instead: `uvicorn app.main:app --host 0.0.0.0 --port 8000`,
> which is the ASGI server that actually serves the FastAPI app.

To stop and remove containers:
```bash
docker compose down          # keep the DB volume (data persists)
docker compose down -v       # also wipe the DB volume
```

### Option B — Run locally without Docker

#### 2.1 Create a virtual environment & install dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2.2 Create the MySQL database

```sql
CREATE DATABASE placement_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

You do **not** need to run `schema.sql` manually — the app auto-creates all
tables on startup via SQLAlchemy (`Base.metadata.create_all`). `schema.sql` is
included purely as a readable reference of the DB structure.

### 2.3 Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your real MySQL credentials and a strong `SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 2.4 (Optional) Seed sample data

Populates the DB with sample students, companies, drives, etc. matching the
frontend's mock data, so you can test immediately.

```bash
python -m app.seed
```

Seeded staff logins (password for all: `Password@123`):
- `officer@hustlegrad.com` — Placement Officer
- `coordinator@hustlegrad.com` — Placement Coordinator

### 2.5 Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

API docs (Swagger UI): http://localhost:8000/docs
Alternative docs (ReDoc): http://localhost:8000/redoc

## 3. Connecting the React frontend

In the frontend, point API calls to `http://localhost:8000`. Update
`CORS_ORIGINS` in `.env` to match your frontend's dev server URL
(default is already set for Vite's `http://localhost:5173`).

The frontend's login form validates the email domain against an allow-list
(`iith.ac.in`, `hustlegrad.com`, `miet.ac.in`) — the backend enforces the
same rule server-side (`ALLOWED_EMAIL_DOMAINS` in `.env`).

## 4. API Overview

| Module | Base path | Notes |
|---|---|---|
| Auth | `/api/auth` | `/signup`, `/login`, `/me` |
| Students | `/api/students` | list/filter, detail, create/update/delete, certifications, semester records |
| Companies | `/api/companies` | CRM — list, detail, job history |
| Placement Drives | `/api/drives` | Drive listing/creation/status updates |
| Placements | `/api/placements` | Application pipeline tracking (stage updates) |
| Internships | `/api/internships` | Internship tracking, PPO flags |
| Communication | `/api/communication` | Sent messages, notifications |
| Dashboard | `/api/dashboard` | KPIs, monthly placement chart, upcoming drives |

All endpoints (except `/api/auth/signup` and `/api/auth/login`) require a
Bearer JWT token obtained from login:

```
Authorization: Bearer <access_token>
```

Role-restricted write endpoints (create/update/delete students, companies,
drives, etc.) require one of: `placement_officer`, `placement_coordinator`,
or `department_coordinator`, matching the roles defined in the frontend's
signup form.

## 5. Project structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app + router registration
│   ├── config.py         # Settings loaded from .env
│   ├── database.py       # SQLAlchemy engine/session
│   ├── models.py         # ORM models (all MySQL tables)
│   ├── schemas.py        # Pydantic request/response schemas
│   ├── security.py       # Password hashing + JWT helpers
│   ├── deps.py            # Auth dependencies (get_current_user, require_roles)
│   ├── seed.py             # Sample data loader
│   └── routers/
│       ├── auth.py
│       ├── students.py
│       ├── companies.py
│       ├── drives.py
│       ├── placements.py
│       ├── internships.py
│       ├── communication.py
│       └── dashboard.py
├── requirements.txt
├── .env.example
├── schema.sql             # Reference DDL (auto-applied by the app itself)
└── README.md
```

## 6. Design notes

- The frontend's `Application` interface (embedded in a student's profile)
  and `PlacementApp` interface (used in the admin Placements table) describe
  the same underlying data — they've been normalized into a single
  `applications` table, joined with `students` when the admin view needs
  student details.
- Money fields are stored two ways where relevant: a human-readable string
  (e.g. `"₹42 LPA"`, matching the frontend's display format) and, where
  useful for real aggregation (e.g. company average package), a numeric
  `_lpa` float column so the Dashboard's KPIs can be computed with real SQL
  aggregates instead of hardcoded values.
- `skills` (student & drive) are stored as a MySQL `JSON` column rather than
  a separate join table, since they're simple string lists always read/written
  as a whole rather than queried individually.
