"""Minimal httpx-compatible client for test usage."""
from __future__ import annotations

import json
from io import BytesIO
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional, Tuple
from urllib.parse import urlencode, urlparse, urlunparse
from uuid import uuid4

from . import _client, _types

__all__ = [
    "BaseTransport",
    "ByteStream",
    "Client",
    "Headers",
    "Request",
    "Response",
    "URL",
    "_client",
    "_types",
]


class URL:
    """Very small URL helper mimicking httpx.URL."""

    def __init__(self, value: str):
        parsed = urlparse(value)
        scheme = parsed.scheme or "http"
        netloc = parsed.netloc or ""
        path = parsed.path or "/"
        self._value = urlunparse((scheme, netloc, path, "", parsed.query, ""))
        self.scheme = scheme
        self.netloc = netloc.encode("ascii", errors="ignore")
        self.path = path
        self.raw_path = path.encode("ascii", errors="ignore")
        self.query = parsed.query.encode("ascii", errors="ignore")
        self.fragment = parsed.fragment

    def __str__(self) -> str:
        return self._value


class Headers:
    """Simple header container preserving order."""

    def __init__(self, data: Optional[Mapping[str, str] | MutableMapping[str, str] | Iterable[Tuple[str, str]]] = None):
        self._items: List[Tuple[str, str]] = []
        if data:
            if isinstance(data, Mapping) or isinstance(data, MutableMapping):
                for key, value in data.items():
                    self.add(key, value)
            else:
                for key, value in data:
                    self.add(key, value)

    def add(self, key: str, value: str) -> None:
        self._items.append((str(key), str(value)))

    def get(self, key: str, default: Optional[str] = None) -> Optional[str]:
        key_lower = key.lower()
        for item_key, item_value in reversed(self._items):
            if item_key.lower() == key_lower:
                return item_value
        return default

    def update(self, other: Mapping[str, str]) -> None:
        for key, value in other.items():
            self.add(key, value)

    def multi_items(self) -> List[Tuple[str, str]]:
        return list(self._items)

    def copy(self) -> "Headers":
        return Headers(self._items)

    def __contains__(self, key: str) -> bool:
        return self.get(key) is not None


class Request:
    """Simplified HTTP request representation."""

    def __init__(
        self,
        method: str,
        url: str,
        *,
        headers: Optional[Headers] = None,
        content: Optional[bytes] = None,
    ) -> None:
        self.method = method.upper()
        self.url = URL(url)
        self.headers = headers or Headers()
        self._body = content or b""

    def read(self) -> bytes:
        return self._body


class ByteStream:
    """Minimal byte stream wrapper."""

    def __init__(self, data: bytes):
        self._data = data

    def read(self) -> bytes:
        return self._data


class Response:
    """Simplified HTTP response."""

    def __init__(
        self,
        status_code: int,
        *,
        headers: Iterable[Tuple[str, str]] | Mapping[str, str] | None = None,
        stream: ByteStream | None = None,
        request: Request | None = None,
    ) -> None:
        self.status_code = status_code
        self.request = request
        header_mapping = headers or []
        if isinstance(header_mapping, Mapping):
            self.headers = {k.lower(): v for k, v in header_mapping.items()}
        else:
            self.headers = {k.lower(): v for k, v in header_mapping}
        self._stream = stream or ByteStream(b"")
        self.template = None
        self.context = None

    @property
    def content(self) -> bytes:
        return self._stream.read()

    @property
    def text(self) -> str:
        return self.content.decode("utf-8")

    def json(self) -> Any:
        return json.loads(self.text or "null")


class BaseTransport:
    """Base transport to be subclassed by Starlette."""

    def handle_request(self, request: Request) -> Response:  # pragma: no cover - interface only
        raise NotImplementedError


class Client:
    """Minimal synchronous HTTPX-compatible client."""

    def __init__(
        self,
        *,
        app: Any = None,
        base_url: str = "http://testserver",
        headers: Optional[Mapping[str, str]] = None,
        transport: BaseTransport | None = None,
        follow_redirects: bool = True,
        cookies: Any = None,
    ) -> None:
        self.app = app
        self.base_url = base_url.rstrip("/")
        self._transport = transport or BaseTransport()
        self._default_headers = Headers(headers)
        self.follow_redirects = follow_redirects
        self.cookies = cookies

    def _merge_url(self, url: _types.URLTypes) -> str:
        if isinstance(url, str) and url.startswith(("http://", "https://")):
            full_url = url
        else:
            path = str(url)
            if not path.startswith("/"):
                path = f"/{path}"
            full_url = f"{self.base_url}{path}"
        return full_url

    def _prepare_body(
        self,
        *,
        content: _types.RequestContent | None = None,
        data: Dict[str, Any] | Iterable[Tuple[str, Any]] | None = None,
        json_payload: Any = None,
        files: _types.RequestFiles | None = None,
    ) -> Tuple[bytes, Dict[str, str]]:
        headers: Dict[str, str] = {}
        if files is not None:
            boundary = "----httpxboundary" + uuid4().hex
            body = BytesIO()

            def _write_field(name: str, value: str) -> None:
                body.write(f"--{boundary}\r\n".encode("utf-8"))
                disposition = f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
                body.write(disposition.encode("utf-8"))
                body.write(value.encode("utf-8"))
                body.write(b"\r\n")

            if data is not None:
                items = data.items() if isinstance(data, dict) else data
                for key, value in items:
                    _write_field(str(key), str(value))

            items = files.items() if isinstance(files, dict) else files
            for key, file_value in items:
                if isinstance(file_value, tuple):
                    filename, file_body, content_type = file_value
                else:  # pragma: no cover - compatibility path
                    filename, file_body, content_type = file_value
                if hasattr(file_body, "read"):
                    file_bytes = file_body.read()
                elif isinstance(file_body, bytes):
                    file_bytes = file_body
                else:
                    file_bytes = str(file_body).encode("utf-8")
                if isinstance(file_bytes, str):
                    file_bytes = file_bytes.encode("utf-8")
                body.write(f"--{boundary}\r\n".encode("utf-8"))
                disposition = (
                    f'Content-Disposition: form-data; name="{key}"; filename="{filename}"\r\n'
                )
                body.write(disposition.encode("utf-8"))
                content_type = content_type or "application/octet-stream"
                body.write(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
                body.write(file_bytes)
                body.write(b"\r\n")
            body.write(f"--{boundary}--\r\n".encode("utf-8"))
            headers["content-type"] = f"multipart/form-data; boundary={boundary}"
            return body.getvalue(), headers
        if content is not None:
            if isinstance(content, bytes):
                return content, headers
            if isinstance(content, str):
                return content.encode("utf-8"), headers
        if json_payload is not None:
            headers["content-type"] = "application/json"
            return json.dumps(json_payload).encode("utf-8"), headers
        if data is not None:
            if isinstance(data, dict):
                encoded = urlencode(data)
            else:
                encoded = urlencode(list(data))
            headers["content-type"] = "application/x-www-form-urlencoded"
            return encoded.encode("utf-8"), headers
        return b"", headers

    def request(
        self,
        method: str,
        url: _types.URLTypes,
        *,
        content: _types.RequestContent | None = None,
        data: Dict[str, Any] | Iterable[Tuple[str, Any]] | None = None,
        files: _types.RequestFiles | None = None,
        json: Any = None,
        params: _types.QueryParamTypes | None = None,
        headers: _types.HeaderTypes | None = None,
        cookies: _types.CookieTypes | None = None,
        auth: Any = _client.USE_CLIENT_DEFAULT,
        follow_redirects: bool | None = None,
        allow_redirects: bool | None = None,
        timeout: _types.TimeoutTypes | _client.UseClientDefault = _client.USE_CLIENT_DEFAULT,
        extensions: Dict[str, Any] | None = None,
    ) -> Response:
        del cookies, auth, allow_redirects, timeout, extensions  # unused in minimal client
        _ = follow_redirects  # to satisfy signature
        full_url = self._merge_url(url)
        body, body_headers = self._prepare_body(content=content, data=data, json_payload=json, files=files)
        merged_headers = self._default_headers.copy()
        for key, value in body_headers.items():
            merged_headers.add(key, value)
        if headers:
            if isinstance(headers, Mapping):
                for key, value in headers.items():
                    merged_headers.add(key, value)
            else:
                for key, value in headers:
                    merged_headers.add(key, value)
        if params:
            query_string = urlencode(params, doseq=True)
            connector = "&" if "?" in full_url else "?"
            full_url = f"{full_url}{connector}{query_string}"
        request = Request(method, full_url, headers=merged_headers, content=body)
        response = self._transport.handle_request(request)
        return response

    def get(self, url: _types.URLTypes, **kwargs: Any) -> Response:
        return self.request("GET", url, **kwargs)

    def post(self, url: _types.URLTypes, **kwargs: Any) -> Response:
        return self.request("POST", url, **kwargs)

    def put(self, url: _types.URLTypes, **kwargs: Any) -> Response:
        return self.request("PUT", url, **kwargs)

    def delete(self, url: _types.URLTypes, **kwargs: Any) -> Response:
        return self.request("DELETE", url, **kwargs)

    def options(self, url: _types.URLTypes, **kwargs: Any) -> Response:
        return self.request("OPTIONS", url, **kwargs)

    def head(self, url: _types.URLTypes, **kwargs: Any) -> Response:
        return self.request("HEAD", url, **kwargs)

    def close(self) -> None:  # pragma: no cover - nothing to close in stub
        return

    def __enter__(self) -> "Client":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()
