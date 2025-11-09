# ERP Backend

FastAPI-based backend for the ERP platform covering Warehouse, Maintenance, and Tooling modules.

## Prerequisites

- Python 3.10+
- PostgreSQL (production) or SQLite (development/tests)

## Local Development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn erp.backend.app:app --reload
```

The API will be available at `http://localhost:8000`. Interactive docs can be accessed at `/docs`.

## Database Migrations

Alembic is configured under `erp/backend/migrations`.

```bash
alembic upgrade head
```

## Running Tests

```bash
pytest erp/backend/tests
```

## Environment Variables

Configure using a `.env` file (see `erp/backend/config.py` for defaults):

- `DATABASE_URL`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_MINUTES`
