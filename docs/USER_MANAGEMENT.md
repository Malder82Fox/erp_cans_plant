# User Management Guide / Руководство по управлению пользователями

## Scope / Область охвата
**EN:** This bilingual guide explains how to provision, audit, and maintain ERP user accounts across the full stack: backend API (FastAPI app exposed under `/api/v1`), management CLI, seed/bootstrap logic, and the React frontend that consumes JWT tokens. It covers creating users, assigning roles, authenticating (login/logout/token refresh), password rotation and resets, and first-admin bootstrap flows.

**RU:** Это двуязычное руководство описывает создание и сопровождение учётных записей ERP через все уровни: backend API (приложение FastAPI с базовым путём `/api/v1`), CLI-утилиты, сид/инициализацию и React-фронтенд, использующий JWT. В документе рассмотрены создание пользователей, назначение ролей, аутентификация (логин/логаут/обновление токена), смена и сброс паролей, а также сценарии первичного запуска с админом.

> 🔗 **See also / См. также:** [docs/RUN_GUIDE.md](RUN_GUIDE.md) — step-by-step backend/frontend startup guide for Windows (Conda) and Ubuntu (venv/Docker).

## Prerequisites / Предварительные требования
**EN:** Ensure the services run as described in the run guide: backend listening on `http://localhost:8000` (FastAPI entry point `erp.backend.app:app`) and frontend on `http://localhost:5173`. Copy `.env.example` to `.env`, run `python scripts/manage.py init-db` (or enable `AUTO_CREATE_DB_SCHEMA=true`), and keep your database reachable (SQLite by default).

**RU:** Перед выполнением операций убедитесь, что сервисы запущены как в руководстве по запуску: backend на `http://localhost:8000` (точка входа FastAPI `erp.backend.app:app`), frontend на `http://localhost:5173`. Скопируйте `.env.example` в `.env`, выполните `python scripts/manage.py init-db` (или задайте `AUTO_CREATE_DB_SCHEMA=true`) и убедитесь в доступности базы данных (по умолчанию используется SQLite).

### Auth-related environment variables / Переменные окружения для аутентификации
**EN:** The backend reads these keys (see `.env.example` and `erp/backend/config.py`). Adjust them before starting the app or running CLI scripts.

**RU:** Backend использует следующие ключи (см. `.env.example` и `erp/backend/config.py`). Настройте их до запуска приложения или выполнения CLI-команд.

| Variable | Purpose (EN) | Назначение (RU) | Source |
| --- | --- | --- | --- |
| `DATABASE_URL` | SQLAlchemy DSN for PostgreSQL/SQLite. | Строка подключения SQLAlchemy к PostgreSQL/SQLite. | `.env.example` |
| `SECRET_KEY` | HMAC secret for JWT signing. Rotate on compromise. | Секрет HMAC для подписи JWT. Меняйте при компрометации. | `.env.example`, `config.py` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL (minutes). | Время жизни access-токена (минуты). | `.env.example`, `config.py` |
| `REFRESH_TOKEN_EXPIRE_MINUTES` | Refresh token TTL (minutes). | Время жизни refresh-токена (минуты). | `.env.example`, `config.py` |
| `PASSWORD_HASH_SCHEME` | `bcrypt` (default) or `argon2id`. | `bcrypt` (по умолчанию) или `argon2id`. | `config.py` |
| `PASSWORD_MIN_LENGTH`, `PASSWORD_REQUIRE_*` | Password policy toggles. | Параметры политики паролей. | `config.py` |
| `LOGIN_RATE_LIMIT_PER_MINUTE`, `LOGIN_RATE_LIMIT_WINDOW_MINUTES` | Login rate-limit thresholds. | Порог ограничения попыток логина. | `config.py` |
| `FRONTEND_URL` | Allowed CORS origin for SPA. | Разрешённый CORS-источник для SPA. | README (`Environment Configuration`) |
| `VITE_API_BASE_URL` | Frontend base URL for API calls. | Базовый URL API для фронтенда. | `.env.example`, `RUN_GUIDE.md` |

## Roles & Permissions / Роли и права доступа
**EN:** The ERP enforces three roles (`user`, `admin`, `root`) via `erp.backend.models.user.UserRole` and service-level checks (`require_role`, `require_any`). Capabilities are summarized below; destructive operations and user management remain root-only.

**RU:** В ERP используются три роли (`user`, `admin`, `root`) согласно `erp.backend.models.user.UserRole` и проверкам в сервисах (`require_role`, `require_any`). Возможности сведены ниже; разрушительные операции и управление пользователями доступны только root.

| Capability / Возможность | user | admin | root |
| --- | :---: | :---: | :---: |
| Read business data / Просмотр данных | ✔ | ✔ | ✔ |
| Create & update entities / Создание и обновление сущностей | ✖ | ✔ | ✔ |
| Delete entities / Удаление сущностей | ✖ | ✖ | ✔ |
| Manage users & roles / Управление пользователями и ролями | ✖ | ✖ | ✔ |
| Reset passwords / Сброс паролей | ✖ | ✖ | ✔ |
| Promote/demote roles / Изменение ролей | ✖ | ✖ | ✔ |

> **Note / Примечание:** Backend checks additionally block users flagged with `must_change_password` until they complete `/api/v1/auth/change-password`.

## Creating and Managing Users / Создание и управление пользователями

### A. CLI (Python) / CLI (Python)
**EN:** A ready-to-use management CLI lives at `scripts/manage.py`. It wraps the service layer (`UserService`) and requires actions to be performed by an existing `root` account (`--actor root`). Commands include `users create`, `users set-role`, `users reset-password`, `users activate`, `users deactivate`, `users list`.

**RU:** Готовая CLI-утилита расположена в `scripts/manage.py`. Она использует сервис `UserService` и требует, чтобы операции выполнялись от имени существующего `root` (`--actor root`). Доступны команды `users create`, `users set-role`, `users reset-password`, `users activate`, `users deactivate`, `users list`.

**Command reference / Пример кода:**
```python
# excerpt from scripts/manage.py
create_parser = user_subparsers.add_parser("create", help="Create a user")
create_parser.add_argument("--username", required=True)
create_parser.add_argument("--email", required=False)
create_parser.add_argument("--role", required=True, choices=[r.value for r in UserRole])
create_parser.add_argument("--password", required=True)
create_parser.add_argument("--must-change", action="store_true")
create_parser.set_defaults(func=handle_create)
```

**Windows (Conda) — EN:** Activate the environment, ensure `PYTHONPATH` points to repo root, then run commands.

**Windows (Conda) — RU:** Активируйте окружение, задайте `PYTHONPATH` на корень репозитория и выполните команды.
```cmd
conda activate erp-backend
set PYTHONPATH=%CD%
python scripts\manage.py users create --actor root --username qa_admin --email qa_admin@example.com --role admin --password "TempPass!2025" --must-change
python scripts\manage.py users set-role --actor root --username qa_admin --role root
python scripts\manage.py users reset-password --actor root --username qa_user --password "TempAgain!2025" --must-change
```

**Ubuntu (venv) — EN:** Activate the virtualenv from repository root before invoking the CLI.

**Ubuntu (venv) — RU:** Активируйте виртуальное окружение в корне репозитория перед запуском CLI.
```bash
source .venv/bin/activate
export PYTHONPATH="$(pwd)"
python scripts/manage.py users create --actor root --username qa_admin --email qa_admin@example.com --role admin --password "TempPass!2025" --must-change
python scripts/manage.py users set-role --actor root --username qa_admin --role root
python scripts/manage.py users reset-password --actor root --username qa_user --password "TempAgain!2025" --must-change
```

> **Bootstrap tip / Совет по bootstrap:** For a brand-new database, run the bootstrap script from section C to insert `root` once, then manage users via CLI/API as usual.

### B. HTTP API / HTTP API
**EN:** All endpoints live under `http://localhost:8000/api/v1`. Authentication uses JSON payloads with JWT access/refresh tokens returned by `/auth/login` and `/auth/refresh`. Use `Authorization: Bearer <token>` headers for protected routes.

**RU:** Все конечные точки расположены по адресу `http://localhost:8000/api/v1`. Аутентификация работает через JSON и JWT токены, выдаваемые `/auth/login` и `/auth/refresh`. Для защищённых маршрутов передавайте заголовок `Authorization: Bearer <token>`.

| Action / Действие | Method & Path | Role | Примечание |
| --- | --- | --- | --- |
| Register user (planned) / Регистрация (планируется) | `POST /api/v1/auth/register` | public / root | Endpoint reserved for future self-registration; currently use `/api/v1/users` (root). |
| Login / Вход | `POST /api/v1/auth/login` | Any active user | Returns `access_token`, `refresh_token`, `password_change_required`. |
| Refresh token / Обновление токена | `POST /api/v1/auth/refresh` | Any active user | Exchange refresh token for new pair. |
| Logout / Выход | `POST /api/v1/auth/logout` | Authenticated | Invalidates refresh tokens for current user. |
| Current profile / Профиль | `GET /api/v1/users/me` | user+ | Returns username, email, role, flags. |
| List users / Список пользователей | `GET /api/v1/users` | root | Supports `role`, `is_active`, `q`, pagination. |
| Create user / Создать пользователя | `POST /api/v1/users` | root | Accepts username/email/role/password/must_change. |
| Update user / Обновить пользователя | `PUT /api/v1/users/{id}` | root | Change role, activation, password, flags. |
| Reset password / Сброс пароля | `POST /api/v1/users/{id}/reset-password` | root | Sets temporary password, forces change. |
| Change own password / Смена пароля | `POST /api/v1/auth/change-password` | user+ | Requires old and new password. |

**Login & profile (curl) — EN:**
```bash
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"root","password":"<ROOT_PASSWORD>"}'
```
```bash
ACCESS_TOKEN="<paste access token>"
curl -s -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq
```

**Логин и профиль (curl) — RU:**
```bash
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"root","password":"<ROOT_PASSWORD>"}'
```
```bash
ACCESS_TOKEN="<вставьте access token>"
curl -s -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq
```

**Create user (curl) — EN/RU:** Root role required.
```bash
curl -s -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "qa_manager",
    "email": "qa_manager@example.com",
    "role": "admin",
    "password": "TempPass!2025",
    "must_change_password": true
  }'
```

**Password reset (curl) — EN/RU:**
```bash
USER_ID=42
curl -s -X POST http://localhost:8000/api/v1/users/${USER_ID}/reset-password \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"temporary_password":"TempAgain!2025","must_change_password":true}'
```

### C. Bootstrap without seeds / Первичный запуск без сидов
**EN:** Databases start empty. Run `python scripts/manage.py init-db` (or set `AUTO_CREATE_DB_SCHEMA=true`) before the first backend launch, then create the initial root account via CLI/API/UI.

**RU:** База создаётся пустой. Выполните `python scripts/manage.py init-db` (или задайте `AUTO_CREATE_DB_SCHEMA=true`) перед первым запуском бэкенда, затем создайте root-аккаунт вручную через CLI/API/UI.

**Checklist — EN:**
1. Copy `.env.example` to `.env` and confirm `DATABASE_URL` (SQLite default is ready for local use).
2. Initialize tables (`python scripts/manage.py init-db`).
3. Create a privileged user with your usual workflow and log in.

**Чек-лист — RU:**
1. Скопируйте `.env.example` в `.env` и при необходимости скорректируйте `DATABASE_URL` (по умолчанию готов SQLite).
2. Инициализируйте таблицы (`python scripts/manage.py init-db`).
3. Создайте привилегированного пользователя привычным способом и выполните вход.

## Token Usage in Frontend / Работа токенов на фронтенде
**EN:** The React/Vite frontend stores tokens in `localStorage` under the `erp.auth` key (see `frontend/src/lib/authStorage.ts`) and injects `Authorization: Bearer` headers via Axios interceptors (`frontend/src/lib/api.ts`). Refresh tokens are exchanged automatically on HTTP 401 responses, and logout handlers purge storage and in-memory tokens.

**RU:** Фронтенд (React/Vite) сохраняет токены в `localStorage` под ключом `erp.auth` (`frontend/src/lib/authStorage.ts`) и подставляет заголовок `Authorization: Bearer` через интерцепторы Axios (`frontend/src/lib/api.ts`). При ответе 401 автоматически выполняется обмен refresh-токена, а при выходе хранилище и токены в памяти очищаются.

**Token flow summary / Схема потока токенов:**
1. **Login / Вход:** `/auth/login` → store `access_token` & `refresh_token`.
2. **API call / Вызов API:** Axios attaches `Authorization: Bearer <access>` automatically.
3. **Refresh / Обновление:** On 401, `/auth/refresh` issues a new pair; frontend updates both tokens.
4. **Logout / Выход:** `/auth/logout` clears backend refresh tokens; frontend calls `clearAuthTokens()` and removes `erp.auth`.
5. **Password change required / Требуется смена пароля:** Response flag triggers redirect to `/change-password`; until completion, backend denies protected routes.

**CORS & Vite base / CORS и базовый URL:** Keep `FRONTEND_URL` matching the SPA origin and `VITE_API_BASE_URL` pointing at `http://localhost:8000/api/v1` (or production equivalent) to avoid cross-origin failures.

## Security Best Practices / Рекомендации по безопасности
**EN:**
- Enforce password policy defined in settings (`PASSWORD_MIN_LENGTH`, upper/lower/digit/special checks).
- Store hashed passwords only (`bcrypt` by default; switch to `argon2id` when available).
- Rotate `SECRET_KEY` during incident response; expect to log out all users (`logout` clears refresh tokens).
- Rate-limit login attempts (default 5 per minute) and monitor `Too many login attempts` errors.
- Never commit `.env`; use environment-specific secrets storage.
- Consider enabling breach password checks or MFA in future iterations (not yet implemented).

**RU:**
- Соблюдайте политику паролей из настроек (`PASSWORD_MIN_LENGTH`, проверки регистра/цифр/символов).
- Храните только хэши паролей (`bcrypt` по умолчанию; при возможности переходите на `argon2id`).
- Регулярно ротируйте `SECRET_KEY`; при инцидентах все пользователи будут разлогинены (logout очищает refresh-токены).
- Ограничивайте количество попыток входа (по умолчанию 5 в минуту) и отслеживайте ошибки `Too many login attempts`.
- Не коммитьте `.env`; используйте безопасное хранение секретов по окружениям.
- Планируйте подключение проверки утечек паролей и MFA (ещё не реализовано).

## Common Flows (Copy & Run) / Типовые сценарии (копируйте и запускайте)

### Flow 1: Bootstrap root manually / Сценарий 1: Bootstrap root вручную
**EN:**
1. Run `python scripts/manage.py init-db` to create tables.
2. Insert a root account once (example script below) and record the password securely.
3. Use the management CLI to verify and rotate credentials as needed.

**RU:**
1. Выполните `python scripts/manage.py init-db`, чтобы создать таблицы.
2. Однократно добавьте root-аккаунт (пример скрипта ниже) и сохраните пароль в надёжном месте.
3. Используйте CLI для проверки и смены пароля при необходимости.

**Bootstrap script / Скрипт bootstrap:**
```bash
python - <<'PY'
from erp.backend.core.database import session_scope
from erp.backend.core.security import hash_password
from erp.backend.models.user import User, UserRole

password = "StrongRootPass!2025"
with session_scope() as session:
    if session.query(User).filter(User.username == "root").first():
        raise SystemExit("Root user already exists")
    user = User(
        username="root",
        email="root@example.com",
        password_hash=hash_password(password),
        role=UserRole.ROOT,
        must_change_password=True,
        is_active=True,
    )
    session.add(user)
print("Created root user with temporary password", password)
PY
```
After logging in, rotate the password using the CLI:
```cmd
# Windows (Conda)
conda activate erp-backend
set PYTHONPATH=%CD%
python scripts\manage.py users reset-password --actor root --username root --password "NewRoot!2025" --must-change
```
```bash
# Ubuntu (venv)
source .venv/bin/activate
export PYTHONPATH="$(pwd)"
python scripts/manage.py users reset-password --actor root --username root --password "NewRoot!2025" --must-change
```

### Flow 2: Login & call `/users/me` / Сценарий 2: Логин и вызов `/users/me`
**EN:** Authenticate, capture token, hit a protected endpoint.

**RU:** Аутентифицируйтесь, получите токен, вызовите защищённый эндпоинт.
```bash
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"qa_admin","password":"TempPass!2025"}' | tee login.json
ACCESS_TOKEN=$(jq -r '.access_token' login.json)
curl -s -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq
```

### Flow 3: Promote user to admin / Сценарий 3: Повышение пользователя до admin
**EN:** Use CLI (root) or HTTP `PUT /api/v1/users/{id}`.

**RU:** Используйте CLI (root) или HTTP `PUT /api/v1/users/{id}`.
```bash
# CLI variant / Вариант CLI
python scripts/manage.py users set-role --actor root --username qa_user --role admin
```
```bash
# HTTP variant / Вариант HTTP
USER_ID=42
curl -s -X PUT http://localhost:8000/api/v1/users/${USER_ID} \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' | jq
```

### Flow 4: Reset another user’s password / Сценарий 4: Сброс пароля другому пользователю
**EN:** Root issues a temporary password and enforces change at next login.

**RU:** Root задаёт временный пароль и принудительную смену при следующем входе.
```bash
USER_ID=42
curl -s -X POST http://localhost:8000/api/v1/users/${USER_ID}/reset-password \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"temporary_password":"TempReset!2025","must_change_password":true}' | jq
```

## Troubleshooting / Устранение неполадок
| Symptom / Симптом | Cause (EN) | Причина (RU) | Fix / Решение |
| --- | --- | --- | --- |
| 401/403 after login | Missing/expired token, `must_change_password` pending, or `VITE_API_BASE_URL` mismatch. | Отсутствует/просрочен токен, требуется смена пароля, либо `VITE_API_BASE_URL` неверен. | Refresh token via `/auth/refresh`, complete password change, align Vite env with backend URL. |
| Cannot create users | Database not migrated or root missing. | База не мигрирована или нет root. | Run `alembic upgrade head`, seed root via `.env`, retry. |
| Requests hitting wrong port | Backend running on `8000` while frontend calls another host. | Backend слушает `8000`, фронтенд обращается к другому адресу. | Update `.env`/Vite config to `http://localhost:8000/api/v1`. |
| JWT signature invalid | Different `SECRET_KEY` across instances. | Разные `SECRET_KEY` на инстансах. | Synchronize secrets, rotate tokens (logout users). |
| Rate limit errors | Too many failed logins from same IP. | Слишком много неудачных логинов с одного IP. | Wait for window to reset or raise limit responsibly. |

## Appendix / Приложение

### Command index / Сводная таблица команд
| Task / Задача | Windows (Conda) | Ubuntu (venv) |
| --- | --- | --- |
| Activate environment | `conda activate erp-backend` | `source .venv/bin/activate` |
| Set PYTHONPATH | `set PYTHONPATH=%CD%` | `export PYTHONPATH="$(pwd)"` |
| Run CLI | `python scripts\manage.py ...` | `python scripts/manage.py ...` |
| Start backend | `uvicorn erp.backend.app:app --host 0.0.0.0 --port 8000 --reload` | same command |
| Start frontend | `cd frontend && npm run dev` | same command |

### Postman collection outline / Шаблон коллекции Postman
**EN:**
1. Create environment variables `baseUrl = http://localhost:8000/api/v1` and `accessToken` (empty initially).
2. Requests: `POST {{baseUrl}}/auth/login`, `POST {{baseUrl}}/auth/refresh`, `GET {{baseUrl}}/users/me`, `GET {{baseUrl}}/users`, `POST {{baseUrl}}/users`, `PUT {{baseUrl}}/users/:id`, `POST {{baseUrl}}/users/:id/reset-password`.
3. Add a pre-request script to inject `Authorization` header when `accessToken` is set.

**RU:**
1. Создайте переменные окружения `baseUrl = http://localhost:8000/api/v1` и `accessToken` (пустая изначально).
2. Запросы: `POST {{baseUrl}}/auth/login`, `POST {{baseUrl}}/auth/refresh`, `GET {{baseUrl}}/users/me`, `GET {{baseUrl}}/users`, `POST {{baseUrl}}/users`, `PUT {{baseUrl}}/users/:id`, `POST {{baseUrl}}/users/:id/reset-password`.
3. Добавьте pre-request script для подстановки заголовка `Authorization`, если `accessToken` заполнен.

### FAQ / Вопросы и ответы
- **EN:** *Can admins delete users?* — No, only root can deactivate/delete users via API or CLI.  
  **RU:** *Могут ли админы удалять пользователей?* — Нет, только root может деактивировать/удалять через API или CLI.
- **EN:** *Where is the JWT secret stored?* — In `.env` as `SECRET_KEY`; never commit production values.  
  **RU:** *Где хранится секрет JWT?* — В `.env` под именем `SECRET_KEY`; не коммитьте боевые значения.
- **EN:** *Is self-registration available?* — Planned; use root-managed creation via `/api/v1/users` until `/auth/register` ships.  
  **RU:** *Доступна ли самостоятельная регистрация?* — В планах; пока используйте создание root через `/api/v1/users`.
- **EN:** *How to force logout everywhere?* — Root can reset password or call `/auth/logout`; backend deletes refresh tokens, frontend clears storage.  
  **RU:** *Как принудительно выйти из всех сессий?* — Root может сбросить пароль или выполнить `/auth/logout`; backend удаляет refresh-токены, фронтенд очищает хранилище.

