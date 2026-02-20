import time
from collections import defaultdict, deque
from threading import Lock
from typing import Deque, Dict

from fastapi import Request
from starlette.responses import JSONResponse, Response


class SlidingWindowLimiter:
    def __init__(self, window_seconds: int, max_requests: int) -> None:
        self.window_seconds = window_seconds
        self.max_requests = max_requests
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def allow(self, key: str) -> tuple[bool, int]:
        now = time.time()
        cutoff = now - self.window_seconds

        with self._lock:
            entries = self._hits[key]
            while entries and entries[0] < cutoff:
                entries.popleft()

            if len(entries) >= self.max_requests:
                retry_after = int(self.window_seconds - (now - entries[0])) + 1
                return False, max(retry_after, 1)

            entries.append(now)
            return True, 0


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def build_rate_limit_middleware(window_seconds: int, max_requests: int):
    limiter = SlidingWindowLimiter(window_seconds=window_seconds, max_requests=max_requests)

    async def rate_limit_middleware(request: Request, call_next) -> Response:
        if not request.url.path.startswith("/api"):
            return await call_next(request)

        allowed, retry_after = limiter.allow(_get_client_ip(request))
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded"},
                headers={"Retry-After": str(retry_after)},
            )

        return await call_next(request)

    return rate_limit_middleware
