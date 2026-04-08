import ipaddress
import logging

from fastapi import HTTPException, Request

from app.config import get_settings

logger = logging.getLogger(__name__)


def _get_client_ip(request: Request) -> str:
    settings = get_settings()
    if settings.trust_proxy:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else ""


async def check_ip_whitelist(request: Request) -> None:
    settings = get_settings()
    whitelist = settings.admin_ip_whitelist.strip()
    if not whitelist:
        return  # No restriction configured

    client_ip = _get_client_ip(request)
    if not client_ip:
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        addr = ipaddress.ip_address(client_ip)
    except ValueError as exc:
        logger.warning("Could not parse client IP: %s", client_ip)
        raise HTTPException(status_code=403, detail="Forbidden") from exc

    for entry in whitelist.split(","):
        entry = entry.strip()
        if not entry:
            continue
        try:
            network = ipaddress.ip_network(entry, strict=False)
            if addr in network:
                return
        except ValueError:
            logger.warning("Invalid IP whitelist entry: %s", entry)
            continue

    logger.warning("Admin access denied for IP: %s", client_ip)
    raise HTTPException(status_code=403, detail="Forbidden")
