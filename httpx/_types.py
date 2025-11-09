"""Minimal type hints for httpx compatibility in tests."""
from __future__ import annotations

from typing import Any, Iterable, Mapping, MutableMapping, Tuple

URLTypes = str
RequestContent = Any
RequestFiles = Any
QueryParamTypes = Any
HeaderTypes = Mapping[str, str] | MutableMapping[str, str] | Iterable[Tuple[str, str]]
CookieTypes = Any
AuthTypes = Any
TimeoutTypes = Any
