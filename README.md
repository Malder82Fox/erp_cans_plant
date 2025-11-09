# ERP Platform

This repository contains a FastAPI backend for an ERP solution focused on Warehouse, Maintenance, and Tooling operations.

## Structure

```
erp/
  backend/
    app.py
    api/
    core/
    models/
    repositories/
    schemas/
    services/
    tests/
```

## Getting Started

1. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r erp/backend/requirements.txt
   ```
2. Launch the API server:
   ```bash
   uvicorn erp.backend.app:app --reload
   ```
3. Run tests:
   ```bash
   pytest erp/backend/tests
   ```

## Documentation

- API specification: `erp/backend/openapi.yaml`
- Backend details: `erp/backend/README.md`
