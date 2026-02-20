# oc_enex_Dashboard Monorepo

Production-ready `oc_enex_Dashboard` app for `admin.hse-oilchem.com`.

- `backend/`: FastAPI API
  - Read-only attendance queries from SQL Server 2000 (`AXData`, `TEvent`)
  - Application auth/settings/audit data in separate SQLite DB (no AXData writes)
- `frontend/`: Next.js + Tailwind portal UI
- `docker-compose.yml`: Local two-service stack (frontend + backend)

## Core Constraints

- AXData SQL Server schema is not modified.
- Attendance data is read-only from AXData.
- Portal auth/settings/notifications are stored in SQLite (`APP_DB_PATH`).
- PDF timestamps remain 12-hour format (AM/PM).

## Features

### Attendance Reports

- Daily / Monthly / Yearly report APIs
- Cross-midnight support for `last_out`
- Duration fields:
  - `duration_minutes` (numeric)
  - `duration_hhmm` for table rows
  - `total_duration_readable` for totals (`H Hrs MM Mins`)

### Auth & Roles

- Roles: `admin`, `hr`
- JWT in `httpOnly` cookie
- Login accepts username or email
- Passwords hashed with `bcrypt`
- Reset tokens with 60-minute default expiry

### Admin

- SMTP settings management
- HR user management:
  - create users
  - enable/disable
  - set temporary password
  - generate reset link

### HR

- Employee settings (email, shift schedule, grace minutes, notification toggles)
- Notification runner:
  - selected employee + date
  - batch all configured employees for date
- Late/Early/Missing Punch evaluation with cross-midnight shift handling
- Notification audit logs in SQLite

### Branding

- Frontend logo: `frontend/public/branding/logo.png`
- Backend PDF logo: `backend/app/assets/logo.png`

### PDF Exports

- A4 minimal layout + KPI tiles + table + footer pagination
- Header includes logo
- Filenames:
  - `OC_Att_D_<EmployeeName>_<CardNo>_<YYYY-MM-DD>.pdf`
  - `OC_Att_M_<EmployeeName>_<CardNo>_<YYYY-MM>.pdf`
  - `OC_Att_Y_<EmployeeName>_<CardNo>_<YYYY>.pdf`

## API Endpoints

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/reset-password`

### Reports/Exports

- `GET /api/employees?search=`
- `GET /api/reports/daily?card_no=&date=YYYY-MM-DD`
- `GET /api/reports/monthly?card_no=&month=YYYY-MM`
- `GET /api/reports/yearly?card_no=&year=YYYY`
- `GET /api/export/daily.pdf?card_no=&date=YYYY-MM-DD`
- `GET /api/export/monthly.pdf?card_no=&month=YYYY-MM`
- `GET /api/export/yearly.pdf?card_no=&year=YYYY`

### Admin (admin-only)

- `GET /api/admin/smtp-settings`
- `PUT /api/admin/smtp-settings`
- `GET /api/admin/hr-users`
- `POST /api/admin/hr-users`
- `PATCH /api/admin/hr-users/{user_id}/active`
- `POST /api/admin/hr-users/{user_id}/set-password`
- `POST /api/admin/hr-users/{user_id}/reset-link`

### HR/Admin

- `GET /api/employee-settings?search=`
- `PUT /api/employee-settings/{card_no}`
- `POST /api/notifications/run?date=YYYY-MM-DD[&card_no=...]`
- `GET /api/notifications/logs?limit=100`

## Backend Setup (Mac, non-Docker)

```bash
cd backend
cp .env.example .env
# edit .env

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python -m uvicorn app.main:app --reload
```

Backend default: `http://localhost:8000`

## Frontend Setup (Mac, non-Docker)

```bash
cd frontend
cp .env.example .env
# BACKEND_API_URL=http://localhost:8000

npm install
npm run dev
```

Frontend default: `http://localhost:3000`

## Docker Compose

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# edit backend/.env

docker compose up --build
```

## Environment Variables

### backend `.env`

- SQL Server: `DB_SERVER`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
- Bootstrap admin: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`
- App DB: `APP_DB_PATH`
- Encryption: `APP_ENCRYPTION_KEY` (optional but recommended)
- JWT: `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRES_MINUTES`
- Password reset: `PASSWORD_RESET_EXPIRY_MINUTES`
- Attendance: `SHIFT_OUT_CUTOFF_HOURS`
- CORS/rate-limit: `ALLOW_ORIGIN`, `RATE_LIMIT_WINDOW_SEC`, `RATE_LIMIT_MAX_REQUESTS`
- Cookies: `COOKIE_DOMAIN`, `COOKIE_SECURE`
- Reset links: `FRONTEND_BASE_URL`
- SMTP runtime: `SMTP_TIMEOUT_SECONDS`

### frontend `.env`

- `BACKEND_API_URL`
- `NEXT_PUBLIC_APP_NAME` (optional)

## Deployment Notes (Cloudflare + DB Tunnel)

1. Keep SQL Server private; do not expose AXData publicly.
2. Deploy frontend/backend behind Cloudflare.
3. Use private tunnel/VPN/private route from backend host to SQL Server LAN.
4. Set `ALLOW_ORIGIN=https://admin.hse-oilchem.com`.
5. Production cookies:
   - `COOKIE_SECURE=true`
   - `COOKIE_DOMAIN=admin.hse-oilchem.com`
6. Store secrets (`JWT_SECRET`, `APP_ENCRYPTION_KEY`, SMTP credentials) in secret manager.
