from __future__ import annotations

import base64
import hashlib
import secrets
from datetime import datetime, timezone

import bcrypt


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def hash_password(password: str) -> str:
    encoded = password.encode("utf-8")
    return bcrypt.hashpw(encoded, bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)


def _keystream(key: bytes, salt: bytes, length: int) -> bytes:
    output = bytearray()
    counter = 0
    while len(output) < length:
        chunk = hashlib.sha256(key + salt + counter.to_bytes(8, "big")).digest()
        output.extend(chunk)
        counter += 1
    return bytes(output[:length])


def encrypt_text(value: str, secret: str | None) -> str:
    if not value:
        return ""
    if not secret:
        return value

    plain = value.encode("utf-8")
    salt = secrets.token_bytes(16)
    key = hashlib.sha256(secret.encode("utf-8")).digest()
    stream = _keystream(key, salt, len(plain))
    cipher = bytes([p ^ s for p, s in zip(plain, stream)])
    payload = base64.urlsafe_b64encode(salt + cipher).decode("ascii")
    return f"enc${payload}"


def decrypt_text(value: str, secret: str | None) -> str:
    if not value:
        return ""
    if not value.startswith("enc$"):
        return value
    if not secret:
        return ""

    payload = value[4:]
    try:
        data = base64.urlsafe_b64decode(payload.encode("ascii"))
    except Exception:
        return ""

    if len(data) < 17:
        return ""

    salt = data[:16]
    cipher = data[16:]
    key = hashlib.sha256(secret.encode("utf-8")).digest()
    stream = _keystream(key, salt, len(cipher))
    plain = bytes([c ^ s for c, s in zip(cipher, stream)])
    try:
        return plain.decode("utf-8")
    except UnicodeDecodeError:
        return ""
