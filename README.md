# ERP Platform

![Build Status](https://img.shields.io/badge/build-GitHub%20Actions-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Table of Contents
- [TL;DR](#tldr)
- [Quick Start](#quick-start)
  - [Docker Compose](#docker-compose)
  - [Local Development](#local-development)
- [Frontend Quick Start](#frontend-quick-start)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
  - [Component Diagram](#component-diagram)
  - [Entity Relationship Diagram](#entity-relationship-diagram)
  - [Tooling Batch Flow](#tooling-batch-flow)
- [Backend](#backend)
  - [Application Layers](#application-layers)
  - [API Specification](#api-specification)
  - [Authentication & Authorization](#authentication--authorization)
  - [Users & RBAC](#users--rbac)
- [Frontend](#frontend)
- [Modules](#modules)
  - [Warehouse](#warehouse)
  - [Maintenance](#maintenance)
  - [Tooling](#tooling)
- [Users & RBAC Operations](#users--rbac-operations)
  - [Seed Users](#seed-users)
  - [Managing Accounts via API](#managing-accounts-via-api)
  - [CLI Utilities](#cli-utilities)
  - [Token Lifecycle & Security](#token-lifecycle--security)
- [Import & Export (Warehouse)](#import--export-warehouse)
- [Search & Filtering](#search--filtering)
- [File Storage](#file-storage)
- [CI/CD](#cicd)
  - [Workflow Stages](#workflow-stages)
  - [Running Checks Locally](#running-checks-locally)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [PR Guidelines & Conventional Commits](#pr-guidelines--conventional-commits)
- [Security & Compliance](#security--compliance)
- [Roadmap & Known Gaps](#roadmap--known-gaps)
- [License](#license)
- [Contact](#contact)

## TL;DR
- Monorepo ERP covering Warehouse, Maintenance, and Tooling with independent RESTful frontends/backends per module (EN UI, RU comments where critical).
- Flask 2.x backend (Blueprints + SQLAlchemy + Alembic + JWT) and React/Vite frontend (Tailwind + shadcn/ui + lucide-react) with shared RBAC (user, admin, root).
- Postgres with trigram search, local file storage adapter (dev) + S3 adapter (prod), import/export add-only for Warehouse, AuditLog everywhere.
- Tooling batches support inspection/cleaning/grinding with dimensional history; Maintenance covers work orders lifecycle with calendar/Kanban views.
- GitHub Actions CI for lint (ruff), type-check (mypy), tests (pytest), and build. Use Conventional Commits and PR checklist.

## Quick Start

> Full bilingual instructions live in [docs/RUN_GUIDE.md](docs/RUN_GUIDE.md).

### Docker Compose
```bash
cp .env.example .env
cd dev/docker
docker compose up --build
```
- Backend API: http://localhost:8000/api/v1/
- Frontend UI: http://localhost:5173/
- Swagger UI (OpenAPI): http://localhost:8000/api/docs

> **RU:** Для быстрого демо достаточно Docker; сид-данные загружаются автоматически при первом запуске.

### Local Development

#### Prerequisites
- Python 3.10+
- Node.js 20+
- PostgreSQL 14+
- Redis (опционально для rate limiting)

#### Backend
```bash
cd erp/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=$(pwd)/..
export DATABASE_URL=postgresql+psycopg://erp:erp@127.0.0.1:5432/erp
alembic -c alembic.ini upgrade head
uvicorn erp.backend.app:app --host 0.0.0.0 --port 8000 --reload
```
Run backend tests:
```bash
pytest
```

#### Frontend
```bash
cd erp/frontend
npm install
npm run dev
```
Build production bundle:
```bash
npm run build
```

## Docs & Guides
- Local Run Guide / Руководство по запуску → [docs/RUN_GUIDE.md](docs/RUN_GUIDE.md)
- User Management (Accounts & Roles) / Управление аккаунтами и ролями → [docs/USER_MANAGEMENT.md](docs/USER_MANAGEMENT.md)

## Frontend Quick Start

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Configure environment variables (copy `.env.example` to `.env` and adjust `VITE_API_BASE_URL` if backend is remote).
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   UI will be available at http://localhost:5173/ and proxies API calls to the backend defined by `VITE_API_BASE_URL`.
4. Build production bundle:
   ```bash
   npm run build
   ```
5. Preview the build locally:
   ```bash
   npm run preview
   ```
6. Docker workflow:
   ```bash
   cd dev/docker
   docker compose up --build frontend
   ```
   The compose stack also wires backend (`localhost:8000`) and PostgreSQL for an end-to-end demo.

> **RU:** При работе с фронтендом достаточно запустить `npm run dev`; Docker-режим нужен только для комплексного стенда.

## Environment Configuration
| Variable | Description | Default (.env.example) |
| --- | --- | --- |
| `FLASK_ENV` | Environment (`development`/`production`) | `development` |
| `DATABASE_URL` | SQLAlchemy DSN | `postgresql+psycopg://erp:erp@localhost:5432/erp` |
| `SQLALCHEMY_ECHO` | Enable SQL echo (debug) | `false` |
| `SECRET_KEY` | JWT signing secret (rotate regularly) | `change-me` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `15` |
| `REFRESH_TOKEN_EXPIRE_MINUTES` | Refresh token TTL | `10080` |
| `S3_BUCKET` | Target S3 bucket (prod) | `` |
| `S3_REGION` | Region for S3 adapter | `us-east-1` |
| `LOCAL_STORAGE_PATH` | Dev file storage path | `var/storage` |
| `LOG_LEVEL` | Python logging level | `INFO` |
| `FRONTEND_URL` | CORS origin | `http://localhost:5173` |

> **RU:** Никогда не коммитьте реальные секреты, используйте `.env` и GitHub Secrets.

## Project Structure

<!-- STRUCTURE:START -->

<!-- STRUCTURE:END -->
<!-- STRUCTURE:END -->
```
<!-- STRUCTURE:END -->
<!-- STRUCTURE:END -->
```
```
<!-- STRUCTURE:END -->
<!-- STRUCTURE:END -->
```
<!-- STRUCTURE:END -->
<!-- STRUCTURE:END -->
```
```
```
<!-- STRUCTURE:END -->
<!-- STRUCTURE:END -->
```
<!-- STRUCTURE:END -->
<!-- STRUCTURE:END -->
```
```
<!-- STRUCTURE:END -->
<!-- STRUCTURE:END -->
```
<!-- STRUCTURE:END -->
<!-- STRUCTURE:END -->

## Architecture Overview

### Component Diagram
```mermaid
graph TD
  subgraph Client
    UI[React + Vite + Tailwind]
  end
  subgraph Backend
    API[Flask API Gateway]
    Auth[Auth Blueprint]
    WH[Warehouse Blueprint]
    MT[Maintenance Blueprint]
    TL[Tooling Blueprint]
    SVC[Service Layer]
    Repo[Repository Layer]
  end
  subgraph Data
    PG[(PostgreSQL)]
    S3[(S3 / Local Storage)]
  end
  UI -->|REST /api/v1| API
  API --> Auth
  API --> WH
  API --> MT
  API --> TL
  Auth --> SVC
  WH --> SVC
  MT --> SVC
  TL --> SVC
  SVC --> Repo
  Repo --> PG
  SVC --> S3
  subgraph Ops
    CI[GitHub Actions]
  end
  CI -->|build/test/deploy| Backend
  CI --> Frontend
```

### Entity Relationship Diagram
```mermaid
erDiagram
  USER ||--o{ USER_ROLE : assigns
  USER ||--o{ SESSION : issues
  USER_ROLE ||--|{ ROLE : catalog
  USER ||--o{ AUDIT_LOG : performs
  WAREHOUSE_PART ||--o{ PART_STOCK : has
  WAREHOUSE_PART ||--o{ PART_ATTACHMENT : files
  MAINT_EQUIPMENT ||--o{ WORK_ORDER : requires
  WORK_ORDER ||--o{ WORK_ORDER_TASK : contains
  WORK_ORDER ||--o{ WORK_ORDER_LOG : tracks
  TOOL ||--o{ TOOL_DIM : currentDims
  TOOL ||--o{ TOOL_DIM_CHANGE : history
  TOOL ||--o{ BATCH_TOOL : joins
  TOOLING_BATCH ||--o{ BATCH_TOOL : aggregates
  TOOLING_BATCH ||--o{ BATCH_OPERATION : lifecycle
```

### Tooling Batch Flow
```mermaid
flowchart LR
  Start([Batch Created]) --> Inspect{Inspection}
  Inspect -->|Pass| Clean{Cleaning}
  Inspect -->|Fail| Scrap[Flag for Scrap]
  Clean --> Grind{Grinding}
  Grind --> ApplyAll[Apply to All Tools]
  ApplyAll --> DimUpdate[Record ToolDimChange]
  DimUpdate --> Report[Generate HTML/PDF Report]
  Report --> Complete([Batch Complete])
```

## Backend

### Application Layers
1. **Blueprints (`erp/backend/api`)** – Register module routes under `/api/v1/*`.
2. **Services (`erp/backend/services`)** – Business logic, validation, RBAC checks, transactional orchestration.
3. **Repositories (`erp/backend/repositories`)** – SQLAlchemy ORM access, search helpers, pagination.
4. **Models (`erp/backend/models`)** – Declarative models with constraints, triggers, hybrid properties.
5. **Schemas (`erp/backend/schemas`)** – Marshmallow schemas for requests/responses, import/export serialization.
6. **Core (`erp/backend/core`)** – JWT management, error handlers, pagination, auditing, i18n fallback (EN default).

### API Specification
- Full contract: [`erp/backend/openapi.yaml`](erp/backend/openapi.yaml)
- Swagger UI available at `/api/docs`.
- All endpoints versioned under `/api/v1`.

### Authentication & Authorization
- JWT access (15 min) + refresh (7 days) issued on `/auth/login`.
- Refresh via `/auth/refresh`; logout invalidates refresh token and active sessions.
- RBAC roles:
  - `user` – read-only across modules.
  - `admin` – create/update (no deletions).
  - `root` – full CRUD including hard deletes & user management.
- AuditLog persisted for all mutating requests (user id, payload hash, diff snapshot).
- Rate limiting (Flask-Limiter/Redis) for auth endpoints.

## Users & RBAC

This section explains how to manage users and roles in the ERP: creating users with a **temporary password**, forcing a **password change at first login**, changing roles, deactivating/activating, and **resetting passwords** (root-only).
> RU: Ниже — простые пошаговые инструкции: UI, API (curl), CLI.

### Roles & permissions

| Capability                                  | user | admin | root |
|---------------------------------------------|:----:|:-----:|:----:|
| Read lists & details                        |  ✔︎  |  ✔︎   |  ✔︎  |
| Create / Update business entities           |  ✖︎  |  ✔︎   |  ✔︎  |
| Delete business entities                    |  ✖︎  |  ✖︎   |  ✔︎  |
| Manage users (create/role/reset/deactivate) |  ✖︎  |  ✖︎   |  ✔︎  |

### Seed accounts & env

Upon first run, three accounts are seeded (if the `users` table is empty). Passwords come from `.env`:

```env
SEED_ROOT_PASSWORD=ChangeMeRoot123!
SEED_ADMIN_PASSWORD=ChangeMeAdmin123!
SEED_USER_PASSWORD=ChangeMeUser123!
PASSWORD_HASH_SCHEME=bcrypt



```
root / root@example.com — role root


admin / admin@example.com — role admin


user / user@example.com — role user


Quick start — UI (simplest)


Sign in as root.


Go to Admin → Users → New User.


Fill username, email, pick Role (user|admin|root), set Temporary password.


Tick Must change password at next login and click Create.


First login flow (for the new user): they sign in with the temporary password, are redirected to Change Password, and must set a new password before accessing business pages.
Forgotten password: sign in as root → Admin → Users → Reset Password → set a new temporary password + tick Must change password → share the temp password securely.
API (curl) — root-only for user management
1) Login as root
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"root","password":"ChangeMeRoot123!"}'
# copy access_token into $ACCESS_TOKEN

2) Create user with temporary password + forced change
curl -s -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "qa_manager",
    "email": "qa_manager@example.com",
    "role": "admin",
    "password": "TempPass!2025",
    "must_change_password": true
  }'

3) First login → user must change password
# user logs in with temp password
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"qa_manager","password":"TempPass!2025"}'
# response includes: "password_change_required": true

# change password (with the user's own token)
curl -s -X POST http://localhost:8000/api/v1/auth/change-password \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"old_password":"TempPass!2025","new_password":"StrongPass!2025"}'

4) Reset password (root) — sets a new temp password & forces change
curl -s -X POST http://localhost:8000/api/v1/users/42/reset-password \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"temporary_password":"TempAgain!2025","must_change_password":true}'

5) Change role (root)
curl -s -X PUT http://localhost:8000/api/v1/users/42 \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"user"}'

6) Deactivate / Activate (root)
# deactivate
curl -s -X PUT http://localhost:8000/api/v1/users/42 \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active":false}'

# activate
curl -s -X PUT http://localhost:8000/api/v1/users/42 \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active":true}'

7) List & search users (root)
curl -s -X GET "http://localhost:8000/api/v1/users?role=admin&is_active=true&q=qa" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

CLI — handy for admins
# create user with temp password + must-change
python scripts/manage.py users create \
  --username qa_manager \
  --email qa_manager@example.com \
  --role admin \
  --password "TempPass!2025" \
  --must-change

# reset password (root)
python scripts/manage.py users reset-password \
  --username qa_manager \
  --password "TempAgain!2025" \
  --must-change

# change role
python scripts/manage.py users set-role --username qa_manager --role user

# deactivate / list
python scripts/manage.py users deactivate --username qa_manager
python scripts/manage.py users list --role admin --active true

Security notes


Passwords are stored hashed (bcrypt/argon2id).


Enforce password policy (length ≥ 10, upper/lower/digit/special).


Rate-limit login (e.g., 5 attempts/min/IP).


On reset/change password, invalidate all refresh tokens.


is_active=false → login/refresh are blocked.


All user mutations go to AuditLog.


Troubleshooting


401/403 on /api/v1/users — not root or missing Authorization: Bearer ....


409 Conflict — username/email already exists.


Password change required keeps appearing — user didn’t successfully call /auth/change-password.


Seeds not created — users table isn’t empty or SEED_* not set in .env.

## Frontend
- React 18 + Vite bundler, TailwindCSS + shadcn/ui components, lucide-react icons.
- Feature folders per module: `src/features/warehouse`, `src/features/maintenance`, `src/features/tooling`, plus shared guards/layout.
- Global state via React Query and an AuthContext; access/refresh tokens stored in memory + localStorage with automatic refresh on 401.
- i18next handles EN default, RU translation toggles (JSON resources under `src/i18n`).
- Layout provides sidebar navigation, role-aware menu, back/logout buttons (RU примечание: "Выход" обязателен).

## Modules

### Warehouse
**Purpose:** Manage spare parts catalog, stock levels, and import/export operations.

**Core Entities**
| Entity | Key Fields |
| --- | --- |
| `WarehousePart` | `id`, `sku`, `name`, `description`, `unit`, `min_qty`, `location_id`, `is_active` |
| `PartStock` | `id`, `part_id`, `quantity_on_hand`, `quantity_reserved`, `bin_code` |
| `PartAttachment` | `id`, `part_id`, `file_key`, `file_name`, `uploaded_by` |

**Key Logic**
- Admin/root can create/update parts; deletes restricted to root (soft-delete via `is_active=false`).
- Stock adjustments tracked via `PartStockLedger` entries (import-only adds, no negative adjustments via import).
- Import pipeline validates duplicates, ensures add-only semantics.

**API Endpoints**
| Method | Path | Auth | Role | Body | Notes |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | Public | – | `{email,password}` | Returns access+refresh tokens |
| GET | `/api/v1/warehouse/parts` | JWT | user+ | Query params `q`, filters, pagination |
| POST | `/api/v1/warehouse/parts` | JWT | admin+ | Part payload | Creates part (no delete) |
| GET | `/api/v1/warehouse/parts/{id}` | JWT | user+ | – | Details + attachments |
| PUT | `/api/v1/warehouse/parts/{id}` | JWT | admin+ | Part payload | Update non-delete fields |
| DELETE | `/api/v1/warehouse/parts/{id}` | JWT | root | – | Hard delete + audit |
| POST | `/api/v1/warehouse/parts/import` | JWT | admin+ | multipart CSV/XLSX | Add-only import |
| GET | `/api/v1/warehouse/parts/export` | JWT | user+ | Query filters | CSV/XLSX export |

**Sample Create Part**
```bash
curl -X POST http://localhost:8000/api/v1/warehouse/parts \
  -H "Authorization: Bearer <ACCESS>" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "BRG-6204",
    "name": "Bearing 6204",
    "unit": "pcs",
    "min_qty": 10,
    "location_id": "A1-01",
    "description": "Deep groove bearing"
  }'
```
**Sample Response**
```json
{
  "id": "9c3b7f1e-5f0c-4f1f-b6b1-4d4a67195cd5",
  "sku": "BRG-6204",
  "name": "Bearing 6204",
  "unit": "pcs",
  "min_qty": 10,
  "location_id": "A1-01",
  "description": "Deep groove bearing",
  "created_at": "2024-03-22T09:10:00Z"
}
```

### Maintenance
**Purpose:** Plan and execute equipment maintenance, track work orders, preventive maintenance (PM) schedules, and history.

**Core Entities**
| Entity | Key Fields |
| --- | --- |
| `MaintEquipment` | `id`, `asset_tag`, `name`, `category`, `location`, `status` |
| `WorkOrder` | `id`, `equipment_id`, `title`, `priority`, `status`, `scheduled_start`, `due_date` |
| `WorkOrderTask` | `id`, `work_order_id`, `description`, `assignee`, `completed_at` |
| `PMTemplate` | `id`, `name`, `frequency_days`, `instructions`, `checklist` |
| `PMPlan` | `id`, `equipment_id`, `template_id`, `last_completed_at`, `next_due_at` |
| `WorkOrderLog` | `id`, `work_order_id`, `action`, `notes`, `performed_by` |

**Lifecycle**
1. Work order created (`Open`).
2. Assignment triggers status `InProgress`.
3. Completion sets status `Done`, logs tasks and attachments.
4. Cancelation allowed before completion (`Canceled`).
5. `pm/generate-due` scans `PMPlan` and creates due work orders (cron or manual trigger).
6. History aggregated via `/maintenance/history` with filters (equipment, date range).

**API Endpoints**
| Method | Path | Auth | Role | Body | Notes |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/maintenance/equipment` | JWT | user+ | Filters | List equipment |
| POST | `/api/v1/maintenance/equipment` | JWT | admin+ | Equipment payload | Create equipment |
| PUT | `/api/v1/maintenance/equipment/{id}` | JWT | admin+ | Payload | Update equipment |
| GET | `/api/v1/maintenance/work-orders` | JWT | user+ | Query | Supports Kanban (status) & calendar (dates) views |
| POST | `/api/v1/maintenance/work-orders` | JWT | admin+ | Work order payload | Create (status defaults Open) |
| PATCH | `/api/v1/maintenance/work-orders/{id}/status` | JWT | admin+ | `{status}` | Transition to `InProgress`, `Done`, `Canceled` |
| POST | `/api/v1/maintenance/pm/templates` | JWT | admin+ | Template payload | Create PM template |
| POST | `/api/v1/maintenance/pm/plans` | JWT | admin+ | Plan payload | Bind template to equipment |
| POST | `/api/v1/maintenance/pm/generate-due` | JWT | admin+ | `{cutoff_date}` | Generates due WOs |
| GET | `/api/v1/maintenance/history` | JWT | user+ | Filters | Historical log |

**Sample Generate Due**
```bash
curl -X POST http://localhost:8000/api/v1/maintenance/pm/generate-due \
  -H "Authorization: Bearer <ACCESS>" \
  -H "Content-Type: application/json" \
  -d '{"cutoff_date": "2024-03-31"}'
```
**Sample Response**
```json
{
  "generated": 3,
  "work_orders": [
    {
      "id": "8f3f5ac4-b0ff-4a22-86da-d4f8d25138d2",
      "equipment_id": "EQ-1001",
      "status": "Open",
      "due_date": "2024-03-25"
    }
  ]
}
```

### Tooling
**Purpose:** Manage tooling batches, dimensional controls, and operational history.

**Core Entities**
| Entity | Key Fields |
| --- | --- |
| `Tool` | `id`, `code`, `description`, `tool_type`, `status` |
| `ToolDim` | `id`, `tool_id`, `dimension_name`, `value`, `unit`, `measured_at` |
| `ToolDimChange` | `id`, `tool_id`, `dimension_name`, `old_value`, `new_value`, `operation_id`, `recorded_at` |
| `ToolingBatch` | `id`, `batch_no`, `status`, `scheduled_at`, `completed_at` |
| `BatchTool` | `batch_id`, `tool_id`, `position`, `result` |
| `BatchOperation` | `id`, `batch_id`, `operation_type`, `performed_by`, `performed_at`, `notes` |

**Operations**
- `inspection`: record results per tool, attach measurements.
- `cleaning`: mark cleaned tools, log notes.
- `grinding`: update `ToolDim` and append `ToolDimChange` (old→new) entries.
- `apply-to-all`: propagate operation outcome or dimensional change to every tool in batch.
- Reports: `/reports/batch/{id}` returns HTML/PDF summary (tools, operations, final dims, sign-offs).

**API Endpoints**
| Method | Path | Auth | Role | Body | Notes |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/tooling/tools` | JWT | user+ | Query | Search tools |
| POST | `/api/v1/tooling/tools` | JWT | admin+ | Tool payload | Create tool |
| GET | `/api/v1/tooling/batches` | JWT | user+ | Filters | List batches |
| POST | `/api/v1/tooling/batches` | JWT | admin+ | Batch payload | Schedule batch |
| GET | `/api/v1/tooling/batches/{id}` | JWT | user+ | – | Batch details |
| POST | `/api/v1/tooling/batches/{id}/operation` | JWT | admin+ | `{operation_type, payload}` | inspection/cleaning/grinding |
| POST | `/api/v1/tooling/batches/{id}/operation/apply-all` | JWT | admin+ | `{operation_id}` | Clone result to all tools |
| GET | `/api/v1/tooling/tools/{id}/dims` | JWT | user+ | – | Current dimensions |
| GET | `/api/v1/tooling/reports/batch/{id}` | JWT | user+ | `format` query | HTML or PDF report |

**Batch Operation Example**
```bash
curl -X POST http://localhost:8000/api/v1/tooling/batches/42/operation \
  -H "Authorization: Bearer <ACCESS>" \
  -H "Content-Type: application/json" \
  -d '{
    "operation_type": "grinding",
    "payload": {
      "tool_id": "TL-1001",
      "dimension_name": "OD",
      "old_value": 25.05,
      "new_value": 25.00,
      "unit": "mm",
      "notes": "Restored to nominal"
    }
  }'
```
**Sample Response**
```json
{
  "operation_id": 314,
  "status": "completed",
  "applied_to_all": false,
  "tool_dim_change": {
    "tool_id": "TL-1001",
    "dimension_name": "OD",
    "old_value": 25.05,
    "new_value": 25.0,
    "unit": "mm"
  }
}
```

## Users & RBAC Operations

### UI (Frontend)
- Root users see an **Admin → Users** navigation entry; admins/users do not.
- User list supports search, role/status filters, pagination, and inline actions (change role, activate/deactivate, reset password).
- Creating a user requires a temporary password and optional must-change flag; the new account receives `must_change_password=true` by default.
- Forced password change: when the API returns `password_change_required=true`, the UI redirects to `/change-password` and blocks module access until a new password is saved.
- RBAC guards:
  - `user` → read-only access to Warehouse/Maintenance/Tooling.
  - `admin` → create/update in modules, no delete.
  - `root` → full access plus user management.

### API Operations
| Action | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| Get current user | `GET /api/v1/users/me` | user+ | Returns role, must_change flag. |
| List users | `GET /api/v1/users` | root | Query params `role`, `is_active`, `q`, `page`. |
| Create user | `POST /api/v1/users` | root | `{username,email?,role,password,must_change_password}` |
| Update user | `PUT /api/v1/users/{id}` | root | Change role, activation, password flags. |
| Reset password | `POST /api/v1/users/{id}/reset-password` | root | Issues temporary password + must-change toggle. |
| Delete user | `DELETE /api/v1/users/{id}` | root | Soft delete in service layer. |

### CLI Utilities
```bash
python scripts/manage.py seed-users
python scripts/manage.py create-user --username qa --role user --password Temp123!
python scripts/manage.py deactivate-user --username admin
python scripts/manage.py reset-password --username planner --password Tmp456!
```
- CLI commands mirror API validations and write `user_audit_logs`.

### Security & Troubleshooting
- Temporary passwords should be random (recommend 12+ chars); enforce `must_change_password=true` for contractors.
- Logout (`POST /api/v1/auth/logout`) revokes refresh tokens; UI clears tokens and returns to `/login`.
- Stuck on password change screen → ensure `/auth/change-password` succeeds and user is active.
- 403 on Users page → only `root` role can access; verify token role via `/users/me`.
- Audit trail for user management actions is available via `user_audit_logs` table (API TODO).

## Import & Export (Warehouse)
- **Formats:** CSV or XLSX with headers `sku,name,unit,min_qty,location_id,description`.
- **Add-only Rule:** Existing `sku` rows are skipped with warning (no updates/deletes). RU: Импорт не уменьшает остатки, только добавляет новые детали.
- **Mapping Wizard:** Frontend allows column mapping, preview 20 rows, choose delimiter, detect duplicates.
- **Validation:** Required fields, unique SKU, numeric min qty, recognized unit.
- **Sample CSV**
```csv
sku,name,unit,min_qty,location_id,description
BRG-6204,Bearing 6204,pcs,10,A1-01,Deep groove bearing
OIL-ISO68,Hydraulic Oil ISO 68,l,200,B2-04,"Use for press line"
```
- **Import Report JSON**
```json
{
  "status": "completed",
  "processed": 200,
  "inserted": 198,
  "skipped": ["BRG-6204", "OIL-ISO68"],
  "errors": []
}
```
- **Export:** Accepts same filters as list endpoint; supports timezone-aware timestamps.

## Search & Filtering
- Query param `q` performs fuzzy search using Postgres trigram (`pg_trgm`) + `ILIKE` fallback.
- Filter params: `status`, `category`, `priority`, `tool_type`, `date_from`, `date_to`.
- Pagination: `page`, `page_size` (max 100).
- Sorting: `sort` (e.g., `name`, `-updated_at`).
- Indexing: B-tree on foreign keys, GIN trigram index on text fields (`sku`, `name`, `tool_code`, `work_order.title`).
- Performance tips: analyze table after large import (`VACUUM ANALYZE`), prefer prefix filters for large data sets.

## File Storage
- Dev: Local storage at `var/storage` (auto-created). Files referenced via `PartAttachment.file_key`.
- Prod: S3 adapter using `boto3`, path pattern `module/entity/<uuid>/<filename>`.
- Signed URLs for downloads (5 min expiry).
- Max upload size 50 MB; enforce MIME checks.

## CI/CD

### Workflow Stages
`/.github/workflows/ci.yml`
1. **lint:** `ruff check` for Python, `eslint` for frontend.
2. **type-check:** `mypy` (backend), `tsc --noEmit` (frontend).
3. **test:** `pytest` with coverage >=80%, `npm run test` for frontend.
4. **build:** `npm run build` and Docker image build using `docker buildx`.
5. **deploy (manual)**: triggered via workflow dispatch, pushes to registry.

### Running Checks Locally
```bash
# Backend
cd erp/backend
ruff check .
ruff format --check .
mypy .
pytest --cov=.

# Frontend
cd erp/frontend
npm run lint
npm run test
npm run build
```

## Troubleshooting & FAQ
| Issue | Symptom | Resolution |
| --- | --- | --- |
| Flask cannot connect to DB | `OperationalError` | Ensure Postgres running, check `DATABASE_URL`, run `alembic upgrade head`. |
| JWT invalid | 401 | Verify system clock, ensure refresh token not expired, re-login. |
| Import fails on encoding | Non-UTF8 CSV | Re-export in UTF-8 or specify encoding in frontend wizard. |
| Frontend CORS error | `CORS policy` | Update `FRONTEND_URL` env and restart backend. |
| Search slow | >2s queries | Rebuild trigram indexes, limit `page_size`, check `EXPLAIN ANALYZE`. |
| CI lint fail | Ruff errors | Run `ruff check --fix` locally, commit formatting. |

## PR Guidelines & Conventional Commits
- Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`...).
- Keep PRs focused per module if possible.
- Update `README.md` and `CHANGELOG.md` with significant changes.
- Open PR template checklist (copy into description):
  - [ ] Tests added/updated
  - [ ] Lint/type-check locally
  - [ ] Updated docs/OpenAPI if API changed
  - [ ] Added screenshots (if UI change)
  - [ ] Verified RBAC rules
- Sample commit message:
```text
feat(warehouse): add bulk import report download
```
- Sample PR title: `feat(maintenance): support PM plan cloning`

## Security & Compliance
- Passwords hashed with bcrypt (`flask-bcrypt`), rotate secrets quarterly.
- Enforce strong password policy (min length 12, complexity checks).
- JWT tokens include `jti` for revocation; stored refresh tokens hashed in DB.
- Rate limits: `/auth/*` (5/min/IP), `/users/*` (10/min/IP for root).
- CORS: allowlist `FRONTEND_URL`, enable `OPTIONS` preflight.
- Sensitive envs managed via GitHub Secrets + Doppler (prod). Never log secrets.
- Audit trail stored 3 years; exportable for audits.

## Roadmap & Known Gaps
- ✅ Warehouse import/export (add-only) – done.
- 🚧 Implement background workers for PM generation scheduling (Celery/RQ).
- 🚧 Enhance Tooling reports with digital signatures.
- 🚧 Multi-site support (company, plant context) pending.
- ❗ Data retention policy for file storage under review.

## License
MIT (placeholder) – see `LICENSE` when available.

## Contact
- Lead Engineer: engineering@erp.example
- Security Contact: security@erp.example
- RU: Обратная связь по локализации – localization@erp.example
