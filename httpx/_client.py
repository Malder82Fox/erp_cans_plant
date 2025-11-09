"""Minimal client defaults for httpx compatibility."""
from __future__ import annotations


class UseClientDefault:
    """Sentinel to mimic httpx default behavior."""


USE_CLIENT_DEFAULT = UseClientDefault()
