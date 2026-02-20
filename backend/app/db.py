from __future__ import annotations

import logging
import os
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from dotenv import load_dotenv

logger = logging.getLogger(__name__)
_BACKEND_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
_DOTENV_LOADED = False
_DB_TARGET_LOGGED = False


def ensure_backend_env_loaded() -> None:
    global _DOTENV_LOADED
    if _DOTENV_LOADED:
        return
    load_dotenv(dotenv_path=_BACKEND_ENV_PATH, override=False)
    _DOTENV_LOADED = True


def _to_int(value: str | None, default: int) -> int:
    if value is None:
        return default
    text = value.strip()
    if not text:
        return default
    try:
        return int(text)
    except ValueError:
        return default


def get_db_settings() -> dict[str, Any]:
    ensure_backend_env_loaded()
    return {
        "server": (os.getenv("DB_SERVER") or "").strip(),
        "port": _to_int(os.getenv("DB_PORT"), 1433),
        "name": (os.getenv("DB_NAME") or "AXData").strip() or "AXData",
        "user": (os.getenv("DB_USER") or "").strip(),
        "pass": os.getenv("DB_PASS") or "",
    }


def validate_db_server_for_startup() -> None:
    db = get_db_settings()
    server = str(db["server"]).strip().lower()
    if not server:
        raise RuntimeError("DB_SERVER is empty; set DB_SERVER in backend/.env")
    if server in {"127.0.0.1", "localhost", "::1"}:
        raise RuntimeError(
            "DB_SERVER is localhost; set DB_SERVER to the Windows Server IP in backend/.env"
        )


def log_db_connection_target_once() -> None:
    global _DB_TARGET_LOGGED
    if _DB_TARGET_LOGGED:
        return
    db = get_db_settings()
    logger.info(
        "DB: connecting to %s:%s / %s as %s",
        db["server"],
        db["port"],
        db["name"],
        db["user"] or "<empty>",
    )
    _DB_TARGET_LOGGED = True


def get_db_connection_error_payload() -> dict[str, Any]:
    db = get_db_settings()
    return {
        "error": "DB connection failed",
        "hint": "Check VPN/tunnel and backend/.env DB_SERVER/DB_PORT",
        "server": db["server"],
        "port": db["port"],
    }


ensure_backend_env_loaded()

try:
    import pymssql  # type: ignore
    _PYMSSQL_IMPORT_ERROR: Exception | None = None
except Exception as exc:  # pragma: no cover - environment-specific native loading
    pymssql = None  # type: ignore[assignment]
    _PYMSSQL_IMPORT_ERROR = exc
    logger.warning(
        "pymssql failed to import. Attendance endpoints will be unavailable until the driver is fixed: %s",
        exc,
    )


if pymssql is not None:
    DBOperationalError = pymssql.OperationalError
else:

    class DBOperationalError(RuntimeError):
        pass


@contextmanager
def get_cursor() -> Iterator[Any]:
    db = get_db_settings()
    if pymssql is None:
        raise DBOperationalError(
            "pymssql driver is unavailable. Install a compatible pymssql/FreeTDS build "
            "for this platform to enable AXData attendance queries."
        ) from _PYMSSQL_IMPORT_ERROR

    connection = pymssql.connect(
        server=db["server"],
        port=int(db["port"]),
        user=db["user"],
        password=db["pass"],
        database=db["name"],
        login_timeout=8,
        timeout=15,
        charset="UTF-8",
        as_dict=True,
    )
    try:
        cursor = connection.cursor()
        try:
            yield cursor
        finally:
            cursor.close()
    finally:
        connection.close()
