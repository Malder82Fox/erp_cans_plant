# Local Run Guide / Руководство по запуску

## Scope / Область охвата
This guide explains how to run the ERP platform backend (FastAPI) and frontend (Vite/React) locally on Windows (Conda + VS Code) and Ubuntu (venv + terminal). It also documents optional Docker Compose workflow, required environment variables, health checks, and troubleshooting steps.
> **RU:** Это руководство описывает запуск бэкенда (FastAPI) и фронтенда (Vite/React) ERP-платформы на Windows (Conda + VS Code) и Ubuntu (venv + терминал), а также дополнительный сценарий с Docker Compose, необходимые переменные окружения, проверки работоспособности и типовые проблемы.

## Prerequisites / Предварительные требования
- Python 3.10+
- Node.js 20 (see `.nvmrc`)
- Git, PostgreSQL 14+, and VS Code (for Windows workflow)
> **RU:** Требуются Python 3.10+, Node.js 20 (см. `.nvmrc`), Git, PostgreSQL 14+ и VS Code (для сценария Windows).

## First run with empty tables / Первый запуск с пустыми таблицами
1. EN: Copy `.env.example` to `.env` and adjust `DATABASE_URL` as needed (SQLite file works out of the box). / RU: Скопируйте `.env.example` в `.env` и при необходимости укажите `DATABASE_URL` (по умолчанию используется локальный файл SQLite).
2. EN: Initialize tables via `python scripts/manage.py init-db` or set `AUTO_CREATE_DB_SCHEMA=true` before starting the backend. / RU: Создайте таблицы командой `python scripts/manage.py init-db` либо установите `AUTO_CREATE_DB_SCHEMA=true` перед запуском бэкенда.
3. EN: Start the backend and frontend services. / RU: Запустите бэкенд и фронтенд.
4. EN: Create the first user using your usual flow (CLI/API/UI). / RU: Создайте первого пользователя привычным способом (CLI/API/UI).

> **RU:** Если видите ошибки аутентификации при первом запуске — сначала создайте пользователя (CLI/API/UI) и повторите вход.

### Windows + Conda (VS Code)
1. Install [Miniconda](https://docs.conda.io/en/latest/miniconda.html) and VS Code with the Python extension.
2. From an Anaconda Prompt:
   ```cmd
   git clone <repository-url>
   cd erp_cans_plant
   conda env create -f erp/backend/environment.yml -n erp-backend
   conda activate erp-backend
   copy .env.example .env
   ```
3. Set `DATABASE_URL` in `.env` if you are not using the default SQLite file; adjust other secrets as required.
4. Initialize the empty schema (override `DATABASE_URL` for Postgres if desired):
   ```cmd
   rem Optional Postgres DSN example
   rem set DATABASE_URL=postgresql+psycopg://erp:erp@127.0.0.1:5432/erp
   python scripts/manage.py init-db
   ```
5. Start the backend:
   ```cmd
   set PYTHONPATH=%CD%
   rem Optional: let the backend auto-create tables on startup
   rem set AUTO_CREATE_DB_SCHEMA=true
   uvicorn erp.backend.app:app --host 0.0.0.0 --port 8000 --reload
   ```
6. In a second terminal (PowerShell or cmd), start the frontend:
   ```cmd
   cd frontend
   npm ci
   set VITE_API_BASE_URL=http://localhost:8000/api/v1
   npm run dev
   ```
7. Use VS Code to run both services with the **ERP (backend + frontend)** compound from the Run and Debug sidebar once `.vscode/launch.json` is in place.
> **RU:** Установите Miniconda и VS Code, затем в Anaconda Prompt клонируйте репозиторий, создайте окружение `conda env create ...`, активируйте его, скопируйте `.env`. Укажите параметры подключения к PostgreSQL и пароли для сидов, примените миграции (`alembic -c erp/backend/alembic.ini upgrade head`), запустите бэкенд (`uvicorn ...`). Во втором терминале установите зависимости фронтенда через `npm ci`, задайте `VITE_API_BASE_URL` и выполните `npm run dev`. В VS Code можно стартовать оба сервиса через составной конфиг **ERP (backend + frontend)**.

### Ubuntu + venv (terminal)
1. Install system packages (Ubuntu 22.04+):
   ```bash
   sudo apt update && sudo apt install -y python3.10 python3.10-venv python3-pip nodejs npm postgresql
   ```
2. Clone the repository and prepare environment:
   ```bash
   git clone <repository-url>
   cd erp_cans_plant
   python3 -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -r erp/backend/requirements.txt
   cp .env.example .env
   ```
3. Export environment variables as needed (optional override if you prefer PostgreSQL over SQLite):
   ```bash
   # export DATABASE_URL="postgresql+psycopg://erp:erp@127.0.0.1:5432/erp"
   export PYTHONPATH="$(pwd)"
   ```
4. Initialize the empty schema:
   ```bash
   python ../scripts/manage.py init-db
   ```
5. Start the backend API:
   ```bash
   uvicorn erp.backend.app:app --host 0.0.0.0 --port 8000 --reload
   ```
   (Optional) export `AUTO_CREATE_DB_SCHEMA=true` before running `uvicorn` to auto-create tables on startup.
6. In a new terminal for the frontend:
   ```bash
   cd frontend
   npm ci
   export VITE_API_BASE_URL="http://localhost:8000/api/v1"
   npm run dev
   ```
> **RU:** На Ubuntu установите зависимости через `apt`, создайте виртуальное окружение (`python3 -m venv .venv`), установите зависимости `pip install -r erp/backend/requirements.txt`, скопируйте `.env`. Экспортируйте `DATABASE_URL` и `PYTHONPATH`, выполните миграции Alembic, запустите `uvicorn`. Во втором терминале перейдите в `frontend`, выполните `npm ci`, задайте `VITE_API_BASE_URL` и запустите `npm run dev`.

## Environment variables / Переменные окружения
| Name | Description (EN) | Описание (RU) | Default / Example |
| --- | --- | --- | --- |
| `DATABASE_URL` | SQLAlchemy DSN for PostgreSQL or SQLite. | Строка подключения SQLAlchemy к PostgreSQL или SQLite. | `sqlite:///./erp.db` |
| `AUTO_CREATE_DB_SCHEMA` | Auto-create tables on backend startup (`true`/`false`). | Автосоздание таблиц при старте бэкенда (`true`/`false`). | `` |
| `SECRET_KEY` | Symmetric key for signing JWT tokens. | Симметричный ключ для подписи JWT. | `change-me` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime in minutes. | Время жизни access-токена в минутах. | `30` |
| `REFRESH_TOKEN_EXPIRE_MINUTES` | Refresh token lifetime in minutes. | Время жизни refresh-токена в минутах. | `10080` |
| `VITE_API_BASE_URL` | API base URL consumed by the frontend. | Базовый URL API для фронтенда. | `http://localhost:8000/api/v1` |

`.env.example` at the repository root contains safe defaults—copy it to `.env` before local runs.
> **RU:** Файл `.env.example` в корне репозитория содержит безопасные значения по умолчанию—скопируйте его в `.env` перед запуском.

## Backend workflows / Бэкенд-сценарии

### Common steps / Общие шаги
1. Ensure your target database exists (SQLite file is created automatically; for Postgres run `createdb erp`).
2. Copy `.env.example` to `.env` and adjust secrets/DSN.
3. Initialize tables via `python scripts/manage.py init-db` or set `AUTO_CREATE_DB_SCHEMA=true` before launching the backend.
4. Start the API with `uvicorn erp.backend.app:app --host 0.0.0.0 --port 8000 --reload`.
5. API docs: `http://localhost:8000/docs`.
> **RU:** Убедитесь, что база создана (для SQLite файл создаётся автоматически, для PostgreSQL выполните `createdb erp`), скопируйте `.env`, выполните `python scripts/manage.py init-db` (или задайте `AUTO_CREATE_DB_SCHEMA=true`), затем запустите `uvicorn`. Документация доступна по `http://localhost:8000/docs`.

### Health checks / Проверки работоспособности
- English: `curl http://127.0.0.1:8000/health`
- Русский: `curl http://127.0.0.1:8000/health`

Expected JSON: `{"status": "ok"}`.
> **RU:** Ожидаемый ответ: `{"status": "ok"}`.

### Tests / Тесты
Run unit tests from repository root:
```bash
pytest erp/backend/tests
```
> **RU:** Запустите юнит-тесты командой `pytest erp/backend/tests` из корня репозитория.

### Initial users / Первые пользователи
- Run `python scripts/manage.py init-db` (or enable `AUTO_CREATE_DB_SCHEMA=true`) to create empty tables before the first start.
- Provision the first privileged account manually (CLI/API/UI) using your established workflow.
- **RU:** После инициализации таблиц создайте нужных пользователей вручную (CLI/API/UI); автоматические сиды отключены.

## Frontend workflows / Фронтенд-сценарии
1. `cd frontend`
2. Install dependencies once: `npm ci`
3. Export or set `VITE_API_BASE_URL` (matches backend origin)
4. Run dev server: `npm run dev` (listens on `http://localhost:5173`)
> **RU:** Перейдите в `frontend`, выполните `npm ci`, установите `VITE_API_BASE_URL`, запустите `npm run dev`. Интерфейс доступен на `http://localhost:5173`.

### Build & preview / Сборка и предпросмотр
```bash
npm run build
npm run preview
```
> **RU:** Для сборки и предпросмотра используйте `npm run build`, затем `npm run preview`.

## VS Code launch configurations / Конфигурации VS Code
The repository provides `.vscode/launch.json` with:
- **Backend: FastAPI (uvicorn)** — launches the API with reload.
- **Frontend: Vite dev server** — runs `npm run dev` in `frontend/`.
- **ERP (backend + frontend)** — compound configuration to start both.
> **RU:** В `.vscode/launch.json` доступны конфигурации: **Backend: FastAPI (uvicorn)** для запуска API, **Frontend: Vite dev server** для фронтенда и составной профиль **ERP (backend + frontend)** для одновременного старта.

## Optional Docker Compose / Дополнительный Docker Compose
A ready-to-use stack lives in `dev/docker/docker-compose.yml`.
```bash
cd dev/docker
cp ../.env.example ../.env
docker compose up --build
```
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- PostgreSQL: exposed on port `5432`
To stop: `docker compose down`
> **RU:** Готовый стек расположен в `dev/docker/docker-compose.yml`. Выполните `cd dev/docker`, `cp ../.env.example ../.env`, затем `docker compose up --build`. Бэкенд будет доступен на `http://localhost:8000`, фронтенд — `http://localhost:5173`, PostgreSQL — порт `5432`. Остановка: `docker compose down`.

## Troubleshooting / Устранение неполадок
| Issue | Fix (EN) | Решение (RU) |
| --- | --- | --- |
| Port 8000 or 5173 already in use | Stop conflicting process or change `--port`. | Остановите процесс или измените `--port` в команде запуска. |
| `DATABASE_URL` errors | Confirm the DSN points to an existing DB (SQLite path or Postgres credentials) and matches `.env`. | Проверьте, что строка подключения указывает на существующую БД (путь SQLite или реквизиты Postgres) и соответствует `.env`. |
| Schema init fails | Verify permissions for the target database and rerun `python scripts/manage.py init-db`. | Проверьте права доступа к целевой БД и повторите `python scripts/manage.py init-db`. |
| Cannot reach API from frontend | Verify `VITE_API_BASE_URL` matches backend URL and CORS allows origin. | Проверьте совпадение `VITE_API_BASE_URL` и адреса бэкенда, а также настройки CORS. |
| No users on first login | Create an account manually via CLI/API/UI; automatic seeding is disabled. | Создайте пользователя вручную через CLI/API/UI; автоматические сиды отключены. |
| Windows firewall prompts | Allow inbound connections for Python and Node.js. | Разрешите входящие соединения для Python и Node.js в брандмауэре Windows. |

## Appendix / Приложение
Minimal sanity checks after startup:
```bash
# Health endpoint
curl http://127.0.0.1:8000/health

# Token request using your manually created account
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "<USERNAME>", "password": "<PASSWORD>"}'
```
> **RU:** Минимальные проверки: `curl http://127.0.0.1:8000/health` и запрос токена `curl -X POST ...` с данными созданного вручную пользователя.
