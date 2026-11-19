"""Password and PIN hashing with argon2."""

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

_ph = PasswordHasher()

# PINs triviaux refusés
TRIVIAL_PINS = {
    "0000", "1111", "2222", "3333", "4444",
    "5555", "6666", "7777", "8888", "9999",
    "1234", "4321", "0123", "3210", "1212",
    "2121", "1010", "0101", "6789", "9876",
}


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _ph.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def hash_pin(pin: str) -> str:
    return _ph.hash(pin)


def verify_pin(pin_hash: str, pin: str) -> bool:
    try:
        return _ph.verify(pin_hash, pin)
    except VerifyMismatchError:
        return False


def is_trivial_pin(pin: str) -> bool:
    return pin in TRIVIAL_PINS


def validate_admin_password(password: str) -> str | None:
    """Return error message or None if valid."""
    if len(password) < 12:
        return "Le mot de passe doit contenir au moins 12 caractères."
    return None
